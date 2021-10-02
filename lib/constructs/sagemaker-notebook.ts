import * as cdk from "@aws-cdk/core";
import * as ec2 from "@aws-cdk/aws-ec2";
import * as iam from "@aws-cdk/aws-iam";
import * as s3 from "@aws-cdk/aws-s3";
import * as sagemaker from "@aws-cdk/aws-sagemaker";

export interface SageMakerNotebookProps {
  readonly notebookInstanceName?: string;
  readonly volumeSizeInGb?: number;
  readonly instanceType: ec2.InstanceType;
}

export class SageMakerNotebook extends cdk.Construct {
  public sagemakerNotebookInstance: sagemaker.CfnNotebookInstance;

  constructor(scope: cdk.Construct, id: string, props: SageMakerNotebookProps) {
    super(scope, id);

    const bucket = new s3.Bucket(this, "data-analysis", {
      encryption: s3.BucketEncryption.S3_MANAGED,
      autoDeleteObjects: true,
      versioned: true,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    const sagemakerExecutionRole = new iam.Role(this, "sagemaker-execution-role", {
      assumedBy: new iam.ServicePrincipal("sagemaker.amazonaws.com"),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName("AmazonSageMakerFullAccess"),
        iam.ManagedPolicy.fromManagedPolicyArn(
          this,
          "personalize-full-access",
          "arn:aws:iam::aws:policy/service-role/AmazonPersonalizeFullAccess"
        ),
      ],
      inlinePolicies: {
        s3Buckets: new iam.PolicyDocument({
          statements: [
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              resources: [bucket.bucketArn],
              actions: ["s3:ListBucket"],
            }),
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              resources: [`${bucket.bucketArn}/*`],
              actions: ["s3:GetObject", "s3:PutObject", "s3:DeleteObject"],
            }),
          ],
        }),
      },
    });

    this.sagemakerNotebookInstance = new sagemaker.CfnNotebookInstance(this, "notebook-instance", {
      instanceType: props.instanceType.toString(),
      roleArn: sagemakerExecutionRole.roleArn,
      notebookInstanceName: props.notebookInstanceName,
      volumeSizeInGb: props.volumeSizeInGb,
    });

    cdk.Tags.of(this).add("component", "sagemaker");
  }
}
