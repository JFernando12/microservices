#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { MicroservicesStack } from '../lib/microservices-stack';

const app = new cdk.App();
new MicroservicesStack(app, 'MicroservicesStack', {
  env: { account: '947403101409', region: 'us-east-1' },
});