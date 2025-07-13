#!/usr/bin/env node
import * as cdk from "aws-cdk-lib";
import { PipelineStack } from "../lib/pipeline-stack";

const app = new cdk.App();

const environments = ["dev", "prod"];
const deployEnvironment = app.node.tryGetContext("env");
if (!deployEnvironment || !environments.includes(deployEnvironment)) {
  throw new Error(
    `Invalid environment specified: ${deployEnvironment}. Valid options are: ${environments.join(
      ", "
    )}`
  );
}

let env = app.node.tryGetContext(deployEnvironment);
const infrastructureRepoName = app.node.tryGetContext("infrastructureRepoName");
const repositoryOwner = app.node.tryGetContext("repositoryOwner");
env = {
  ...env,
  infrastructureRepoName,
  repositoryOwner,
  description: `Stack for ${deployEnvironment} environment. CI/CD pipeline for the ${infrastructureRepoName} repository owned by ${repositoryOwner}.`,
};
new PipelineStack(app, `${deployEnvironment}-CICD-PipeLine-Stack`, env);
