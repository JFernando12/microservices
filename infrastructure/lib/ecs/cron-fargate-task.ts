import * as ecs from 'aws-cdk-lib/aws-ecs';
import * as ecsPatterns from 'aws-cdk-lib/aws-ecs-patterns';
import * as appscaling from 'aws-cdk-lib/aws-applicationautoscaling';
import { Construct } from "constructs";

interface CronFargateServiceProps {
  cluster: ecs.Cluster;
  containerImage: ecs.ContainerImage;

  /**
   * Whether the rule is enabled.
   */
  enabled: boolean;

  /**
   * The scheduling expression.
   * @example rate(1 minute)
   */
  expression: string;

  /**
   * The number of CPU units used by the task.
   * @default 256
   */
  cpu?: number;

  /**
   * The amount (in MiB) of memory used by the task.
   * @default 512
   */
  memoryLimitMiB?: number;
}

export class CronFargateTask extends Construct {
  constructor(scope: Construct, id: string, props: CronFargateServiceProps) {
    super(scope, id);

    const { cluster, containerImage, enabled, expression, cpu, memoryLimitMiB } = props;

    new ecsPatterns.ScheduledFargateTask(this, id, {
      cluster,
      enabled,
      scheduledFargateTaskImageOptions: {
        image: containerImage,
        cpu: cpu || 256,
        memoryLimitMiB: memoryLimitMiB || 512,
        environment: {
          DOMAIN: id
        }
      },
      schedule: appscaling.Schedule.expression(expression)
    });
  }
}