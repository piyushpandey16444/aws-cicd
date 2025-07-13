#!/usr/bin/env node
import * as cdk from "aws-cdk-lib";
import { InfraStack } from "../lib/infra-stack";

const app = new cdk.App();
if (!process.env.DEPLOY_ENVIRONMENT) {
  throw new Error("DEPLOY_ENVIRONMENT environment variable is not set.");
}
const { DEPLOY_ENVIRONMENT } = process.env;
new InfraStack(app, `${process.env.DEPLOY_ENVIRONMENT}-InfraStack`, {
  DEPLOY_ENVIRONMENT,
  description: "Some Desc",
});
