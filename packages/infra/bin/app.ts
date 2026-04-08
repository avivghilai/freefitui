#!/usr/bin/env node
import * as cdk from "aws-cdk-lib";
import { FreeFitStack } from "../lib/freefit-stack.js";

const app = new cdk.App();

new FreeFitStack(app, "FreeFitStack", {
  env: {
    region: "il-central-1",
    account: process.env.CDK_DEFAULT_ACCOUNT,
  },
});
