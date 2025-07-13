import * as cdk from "aws-cdk-lib";
import {
  BuildSpec,
  LinuxBuildImage,
  PipelineProject,
} from "aws-cdk-lib/aws-codebuild";
import { Artifact, Pipeline } from "aws-cdk-lib/aws-codepipeline";
import {
  CodeBuildAction,
  GitHubSourceAction,
} from "aws-cdk-lib/aws-codepipeline-actions";
import {
  CompositePrincipal,
  PolicyDocument,
  PolicyStatement,
  Role,
  ServicePrincipal,
} from "aws-cdk-lib/aws-iam";
import { Bucket } from "aws-cdk-lib/aws-s3";
import { Construct } from "constructs";

interface PipelineStackProps extends cdk.StackProps {
  envName: string;
  infrastructureRepoName: string;
  repositoryOwner: string;
  description: string;
}

export class PipelineStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: PipelineStackProps) {
    super(scope, id, props);

    console.log(`Creating pipeline stack for environment: ${props}`);
    const { envName, infrastructureRepoName, repositoryOwner, description } =
      props;

    const githubToken = cdk.SecretValue.secretsManager("github-token");

    const infrastructureDeployRole = new Role(
      this,
      "InfrastructureDeployRole",
      {
        assumedBy: new CompositePrincipal(
          new ServicePrincipal("codebuild.amazonaws.com"),
          new ServicePrincipal("codepipeline.amazonaws.com")
        ),
        inlinePolicies: {
          CdkDeployPermissions: new PolicyDocument({
            statements: [
              new PolicyStatement({
                actions: ["sts:AssumeRole"],
                resources: ["arn:aws:iam::*:role/cdk-*"],
              }),
            ],
          }),
        },
      }
    );

    const artifactBucket = new Bucket(this, "ArtifactBucket", {
      bucketName: `${infrastructureRepoName}-${envName}-codepipeline-artifacts-buckets`,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
    });

    const infraSourceOutput = new Artifact("InfrastructureSourceOutput");

    const infraBuildPorject = new PipelineProject(
      this,
      "InfrastructureProject",
      {
        role: infrastructureDeployRole,
        environment: {
          buildImage: LinuxBuildImage.AMAZON_LINUX_2_5,
        },
        environmentVariables: {
          DEPLOY_ENVIRONMENT: {
            value: envName,
          },
        },
        buildSpec: BuildSpec.fromObject({
          version: "0.2",
          phases: {
            install: {
              "runtime-versions": {
                nodejs: "20.x",
              },
              commands: ["npm install -g aws-cdk", "cd infra", "npm install"],
            },
            build: {
              commands: [`cdk deploy --context env=${envName}`],
            },
          },
        }),
      }
    );

    const pipeline = new Pipeline(this, "CI-CD-Pipeline", {
      pipelineName: `${envName}-ci-cd-pipeline`,
      role: infrastructureDeployRole,
      artifactBucket,
    });

    pipeline.addStage({
      stageName: "Source",
      actions: [
        new GitHubSourceAction({
          owner: repositoryOwner,
          repo: infrastructureRepoName,
          branch: "master",
          actionName: "InfrastructureSource",
          output: infraSourceOutput,
          oauthToken: githubToken,
        }),
      ],
    });

    pipeline.addStage({
      stageName: "Deploy",
      actions: [
        new CodeBuildAction({
          actionName: "InfrastructureDeploy",
          project: infraBuildPorject,
          input: infraSourceOutput,
          role: infrastructureDeployRole,
        }),
      ],
    });
  }
}
