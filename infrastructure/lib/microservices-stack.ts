import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';

import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as ecs from 'aws-cdk-lib/aws-ecs';
import { QueueFargateService } from './ecs/queue-fargate-service';
import { CronFargateTask } from './ecs/cron-fargate-task';

export class MicroservicesStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const vpc = new ec2.Vpc(this, 'MyVpc', {
      maxAzs: 1, // Default is all AZs in region
    });

    const cluster = new ecs.Cluster(this, 'MyCluster', {
      vpc: vpc,
    });

    const eventProcessorImage = ecs.ContainerImage.fromAsset(
      '../patterns/event-processor-fargate'
    );

    const cronJobImage = ecs.ContainerImage.fromAsset(
      '../services/cron-job-services'
    )

    // Create domain1 queue service
    new QueueFargateService(this, 'domain1', {
      cluster,
      containerImage: eventProcessorImage,
    });

    // // Create domain2 queue service
    // new QueueFargateService(this, 'domain2', {
    //   cluster,
    //   containerImage: eventProcessorImage,
    // });

    // // Create domain3 cron service
    // new CronFargateTask(this, 'domain3', {
    //   cluster,
    //   containerImage: cronJobImage,
    //   expression: 'rate(1 minute)',
    //   enabled: false,
    // });

    // // Create domain4 cron service
    // new CronFargateTask(this, 'domain4', {
    //   cluster,
    //   containerImage: cronJobImage,
    //   expression: 'rate(5 minutes)',
    //   enabled: false,
    // });
  }
}
