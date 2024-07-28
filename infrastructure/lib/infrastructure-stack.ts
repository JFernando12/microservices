import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as sqs from 'aws-cdk-lib/aws-sqs';

import * as ec2 from "aws-cdk-lib/aws-ec2";
import * as ecs from "aws-cdk-lib/aws-ecs";
import * as iam from 'aws-cdk-lib/aws-iam';

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

    const taskDefinition = new ecs.FargateTaskDefinition(
      this,
      'QueueProcessingTaskDef',
      {
        memoryLimitMiB: 512,
        cpu: 256,
      }
    );

    taskDefinition.addContainer('QueueProcessingContainer', {
      image: ecs.ContainerImage.fromAsset('../services/event-procesor-service'),
      environment: {
        QUEUE_URL_DOMAIN1: queueDomain1.queueUrl,
      },
      logging: ecs.LogDrivers.awsLogs({ streamPrefix: 'QueueProcessing' }),
    });

    taskDefinition.taskRole.addToPrincipalPolicy(new iam.PolicyStatement({
      actions: ['ecs:UpdateTaskProtection'],
      resources: ['*'], // You can scope this down to the specific resource if needed
    }));

    const fargateService = new ecs.FargateService(
      this,
      'QueueProcessingFargateService',
      {
        cluster: cluster,
        taskDefinition: taskDefinition,
        desiredCount: 0,
        assignPublicIp: true,
      }
    );

    queueDomain1.grantConsumeMessages(fargateService.taskDefinition.taskRole);

    // Define the auto-scaling policy
    const scaling = fargateService.autoScaleTaskCount({
      minCapacity: 0,
      maxCapacity: 2,
    });

    // Set the adjustment type
    scaling.scaleOnMetric('MetricScaling', {
      metric: queueDomain1.metricApproximateNumberOfMessagesVisible(),
      adjustmentType: cdk.aws_applicationautoscaling.AdjustmentType.EXACT_CAPACITY,
      scalingSteps: [
        { upper: 0, change: 0 },
        { lower: 1, upper: 10, change: 1 },
        { lower: 10, change: 2 },
      ],
    });
  }
}
