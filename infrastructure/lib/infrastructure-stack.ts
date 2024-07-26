import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as sqs from 'aws-cdk-lib/aws-sqs';

import * as ec2 from "aws-cdk-lib/aws-ec2";
import * as ecs from "aws-cdk-lib/aws-ecs";
import * as ecr from "aws-cdk-lib/aws-ecr";
import * as ecs_patterns from "aws-cdk-lib/aws-ecs-patterns";
import * as app_autoscaling from "aws-cdk-lib/aws-applicationautoscaling";
import { ApplicationScalingAction } from 'aws-cdk-lib/aws-cloudwatch-actions';

export class InfrastructureStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // The code that defines your stack goes here

    const vpc = new ec2.Vpc(this, "MyVpc", {
      maxAzs: 3 // Default is all AZs in region
    });

    const cluster = new ecs.Cluster(this, "MyCluster", {
      vpc: vpc
    });

    // SQS Queues
    const queueDomain1 = new sqs.Queue(this, 'EventQueueDomain1',
      {
        contentBasedDeduplication: true,
        fifo: true,
        queueName: 'event-queue-domain.fifo',
        visibilityTimeout: cdk.Duration.seconds(300),
        retentionPeriod: cdk.Duration.days(14),
        receiveMessageWaitTime: cdk.Duration.seconds(20),
      }
    );

    const fargate_service1 = new ecs_patterns.QueueProcessingFargateService(this, 'EventQueueService', {
      cluster,
      queue: queueDomain1,
      memoryLimitMiB: 512,
      cpu: 256,
      image: ecs.ContainerImage.fromAsset('../services/event-procesor-service'),
      environment: {
        QUEUE_URL_DOMAIN1: queueDomain1.queueUrl,
      },
      minScalingCapacity: 0,
      maxScalingCapacity: 3,
      scalingSteps: [
        { change: 0, upper: 0 },
        { lower: 1, change: 1 },
      ],
    });

    const fargate_service_cpu_metric = fargate_service1.service.metricCpuUtilization(
      {
        period: cdk.Duration.minutes(3),
        statistic: 'Average'
      }
    );

    const scale_in_init = fargate_service_cpu_metric.createAlarm(this, 'ScaleInAlarm',
      {
        alarmDescription: 'Scale in if CPU utilization is less than 10%',
        alarmName: 'ScaleInAlarm',
        evaluationPeriods: 1,
        threshold: 0.01,
        actionsEnabled: true,
        datapointsToAlarm: 1,
      }
    );

    const scaling_target = app_autoscaling.ScalableTarget.fromScalableTargetId(
      this, 
      'ScalableTarget',
      `service/${fargate_service1.cluster.clusterName}/${fargate_service1.service.serviceName}|ecs:service:DesiredCount|ecs`
    );

    const scaling_action = new app_autoscaling.StepScalingAction(
      this,
      'scaleToZero',
      {
        scalingTarget: scaling_target,
        adjustmentType: app_autoscaling.AdjustmentType.EXACT_CAPACITY,
      }
    );

    scale_in_init.addAlarmAction(new ApplicationScalingAction(scaling_action));
  }
}
