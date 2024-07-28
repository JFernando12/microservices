import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';

import * as iam from 'aws-cdk-lib/aws-iam';
import * as sqs from 'aws-cdk-lib/aws-sqs';
import * as ecs from 'aws-cdk-lib/aws-ecs';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';

interface QueueFargateServiceProps {
  cluster: ecs.Cluster;
  containerImage: cdk.aws_ecs.ContainerImage;

  /**
   * The desired count of runnig tasks.
   * @default 0
   */
  desiredCount?: number;

  /**
   * The minimum number of tasks to run.
   * @default 0
   */
  minCapacity?: number;

  /**
   * The maximum number of tasks to run.
   * @default 2
   */
  maxCapacity?: number;

  /**
   * The scaling steps for the auto-scaling policy.
   * @default
   *   [{ upper: 0, change: 0 },
   *   { lower: 1, upper: 10, change: 1 },
   *   { lower: 10, change: 2 }]
   */
  scalingSteps?: cdk.aws_applicationautoscaling.ScalingInterval[];

  /**
   * Grace period after scaling activity.
   * @default cdk.Duration.seconds(0)
   */
  cooldown?: cdk.Duration;
}

export class QueueFargateService extends Construct {
  constructor(scope: Construct, id: string, props: QueueFargateServiceProps) {
    super(scope, id);

    const {
      cluster,
      containerImage,
      desiredCount,
      minCapacity,
      maxCapacity,
      scalingSteps,
      cooldown,
    } = props;

    const queueId = `${id}-queueId`;
    const queueName = `${id}-queue.fifo`;
    const taskDefinitionId = `${id}-taskDefinition`;
    const containerId = `${id}-container`;
    const fargateServiceId = `${id}-fargateService`;
    const metricScalingId = `${id}-metricScaling`;

    // SQS Queues
    const queue = new sqs.Queue(this, queueId, {
      contentBasedDeduplication: true,
      fifo: true,
      queueName: queueName,
      visibilityTimeout: cdk.Duration.seconds(300),
      retentionPeriod: cdk.Duration.days(14),
      receiveMessageWaitTime: cdk.Duration.seconds(20),
    });

    // ECS Fargate Task Definition
    const taskDefinition = new ecs.FargateTaskDefinition(
      this,
      taskDefinitionId,
      {
        memoryLimitMiB: 512,
        cpu: 256,
      }
    );

    // Add a container to the task definition
    taskDefinition.addContainer(containerId, {
      image: containerImage,
      environment: {
        QUEUE_URL: queue.queueUrl,
        DOMAIN: id,
      },
      logging: ecs.LogDrivers.awsLogs({ streamPrefix: taskDefinitionId }),
    });

    taskDefinition.taskRole.addToPrincipalPolicy(
      new iam.PolicyStatement({
        actions: ['ecs:UpdateTaskProtection'],
        resources: ['*'], // You can scope this down to the specific resource if needed
      })
    );

    const fargateService = new ecs.FargateService(this, fargateServiceId, {
      cluster: cluster,
      taskDefinition: taskDefinition,
      desiredCount: desiredCount || 0,
      assignPublicIp: false,
    });

    // Grant the task role permissions to consume messages from the queue
    queue.grantConsumeMessages(fargateService.taskDefinition.taskRole);

    // Define the auto-scaling policy
    const scaling = fargateService.autoScaleTaskCount({
      minCapacity: minCapacity || 0,
      maxCapacity: maxCapacity || 2,
    });

    // Set the adjustment type
    scaling.scaleOnMetric(metricScalingId, {
      metric: queue.metricApproximateNumberOfMessagesVisible({ period: cdk.Duration.minutes(1) }),
      adjustmentType: cdk.aws_applicationautoscaling.AdjustmentType.EXACT_CAPACITY,
      scalingSteps: scalingSteps || [
        { upper: 0, change: 0 },
        { lower: 1, upper: 10, change: 1 },
        { lower: 10, change: 2 },
      ],
      cooldown: cooldown || cdk.Duration.seconds(0),
    });
  }
}