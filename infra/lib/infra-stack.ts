import * as cdk from "aws-cdk-lib";
import { Bucket } from "aws-cdk-lib/aws-s3";
import { Construct } from "constructs";

interface InfraStackProps extends cdk.StackProps {
  DEPLOY_ENVIRONMENT: string;
}
export class InfraStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: InfraStackProps) {
    super(scope, id, props);

    const { DEPLOY_ENVIRONMENT } = props;
    console.log(
      `${DEPLOY_ENVIRONMENT} - environment detected. Deploying S3 bucket.`
    );

    const infraBucket = new Bucket(
      this,
      `${DEPLOY_ENVIRONMENT}-bucket-for deploy-test`,
      {
        bucketName: `${DEPLOY_ENVIRONMENT}-bucket-for-deploy-test`,
        removalPolicy: cdk.RemovalPolicy.DESTROY,
      }
    );
  }
}
