#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from '@aws-cdk/core';
import { CdkServerlessFuntimesStack } from '../lib/cdk-serverless-funtimes-stack';

const app = new cdk.App();
new CdkServerlessFuntimesStack(app, 'CdkServerlessFuntimesStack');
