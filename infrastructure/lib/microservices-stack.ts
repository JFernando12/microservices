import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';

import * as ec2 from "aws-cdk-lib/aws-ec2";
import * as ecs from "aws-cdk-lib/aws-ecs";
import { QueueFargateService } from './ecs/queue-fargate-service';

export class MicroservicesStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const vpc = new ec2.Vpc(this, "MyVpc", {
      maxAzs: 3 // Default is all AZs in region
    });

    const cluster = new ecs.Cluster(this, "MyCluster", {
      vpc: vpc
    });

    const eventProcessorImage = ecs.ContainerImage.fromAsset('../services/event-processor-service');

    // Create domain1 service
    new QueueFargateService(this, "domain1", { cluster, containerImage: eventProcessorImage });

    // Create domain2 service
    new QueueFargateService(this, "domain2", { cluster, containerImage: eventProcessorImage });
  }
}
