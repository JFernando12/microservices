import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as ecs from 'aws-cdk-lib/aws-ecs';
import * as ecs_patterns from 'aws-cdk-lib/aws-ecs-patterns';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as sqs from 'aws-cdk-lib/aws-sqs';
import * as events from 'aws-cdk-lib/aws-events';
import * as targets from 'aws-cdk-lib/aws-events-targets';

export class MyStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // VPC
    const vpc = new ec2.Vpc(this, 'MyVpc', { maxAzs: 3 });

    // ECS Cluster
    const cluster = new ecs.Cluster(this, 'MyCluster', { vpc: vpc });

    // SQS Queues
    const queueDomain1 = new sqs.Queue(this, 'EventQueueDomain1');
    const queueDomain2 = new sqs.Queue(this, 'EventQueueDomain2');

    // Event Queue Service (Fargate Task with Schedule)
    const eventQueueServiceTask = new ecs_patterns.QueueProcessingFargateService(this, 'EventQueueService', {
      cluster,
      memoryLimitMiB: 512,
      cpu: 256,
      image: ecs.ContainerImage.fromAsset('services/event-queue-service'),
      environment: {
        QUEUE_URL_DOMAIN1: queueDomain1.queueUrl,
        QUEUE_URL_DOMAIN2: queueDomain2.queueUrl,
      },
    });

    // Set up cron job (EventBridge rule)
    const rule = new events.Rule(this, 'ScheduleRule', {
      schedule: events.Schedule.rate(cdk.Duration.minutes(5)),
    });

    rule.addTarget(new targets.EcsTask({
      cluster,
      taskDefinition: eventQueueServiceTask.taskDefinition,
      subnetSelection: { subnetType: ec2.SubnetType.PUBLIC },
    }));

    // Event Processing Services (Fargate Task)
    const eventProcessingServiceTaskDomain1 = new ecs.FargateTaskDefinition(this, 'EventProcessingServiceTaskDomain1', {
      memoryLimitMiB: 1024,
      cpu: 512,
    });

    eventProcessingServiceTaskDomain1.addContainer('EventProcessorContainer', {
      image: ecs.ContainerImage.fromAsset('services/event-processor-service'),
      environment: {
        QUEUE_URL: queueDomain1.queueUrl,
        DOMAIN: 'domain1.com',
      },
    });

    const eventProcessingServiceTaskDomain2 = new ecs.FargateTaskDefinition(this, 'EventProcessingServiceTaskDomain2', {
      memoryLimitMiB: 1024,
      cpu: 512,
    });

    eventProcessingServiceTaskDomain2.addContainer('EventProcessorContainer', {
      image: ecs.ContainerImage.fromAsset('services/event-processor-service'),
      environment: {
        QUEUE_URL: queueDomain2.queueUrl,
        DOMAIN: 'domain2.com',
      },
    });

    // Fargate Service for Processing Services
    new ecs.FargateService(this, 'EventProcessingServiceDomain1', {
      cluster,
      taskDefinition: eventProcessingServiceTaskDomain1,
      desiredCount: 1,
    });

    new ecs.FargateService(this, 'EventProcessingServiceDomain2', {
      cluster,
      taskDefinition: eventProcessingServiceTaskDomain2,
      desiredCount: 1,
    });

    // Scaling Service (Lambda Function)
    const scalingService = new lambda.Function(this, 'ScalingService', {
      runtime: lambda.Runtime.NODEJS_14_X,
      handler: 'index.handler',
      code: lambda.Code.fromAsset('services/scaling-service'),
      environment: {
        CLUSTER_NAME: cluster.clusterName,
        SERVICE_NAME_DOMAIN1: 'EventProcessingServiceDomain1',
        SERVICE_NAME_DOMAIN2: 'EventProcessingServiceDomain2',
        QUEUE_URL_DOMAIN1: queueDomain1.queueUrl,
        QUEUE_URL_DOMAIN2: queueDomain2.queueUrl,
      },
    });

    // Grant necessary permissions
    queueDomain1.grantConsumeMessages(scalingService);
    queueDomain2.grantConsumeMessages(scalingService);
    cluster.grantConnect(scalingService);

    // Set up cron job for scaling (EventBridge rule)
    const scalingRule = new events.Rule(this, 'ScalingRule', {
      schedule: events.Schedule.rate(cdk.Duration.minutes(1)),
    });

    scalingRule.addTarget(new targets.LambdaFunction(scalingService));
  }
}
