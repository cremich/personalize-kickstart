import { Stack, assertions } from "aws-cdk-lib";
import { aws_ec2 as ec2 } from "aws-cdk-lib";
import { SageMakerNotebook } from "../../lib/constructs/sagemaker-notebook";

let stack: Stack;

describe("Sagemaker notebook construct", () => {
  beforeEach(() => {
    stack = new Stack();
  });

  test("One sagemaker notebook is provisioned", () => {
    new SageMakerNotebook(stack, "sagemaker-notebook", {
      instanceType: new ec2.InstanceType("ml.t2.medium"),
    });

    const assert = assertions.Template.fromStack(stack);
    assert.resourceCountIs("AWS::SageMaker::NotebookInstance", 1);
  });

  test("Notebook is tagged with component tag", () => {
    new SageMakerNotebook(stack, "sagemaker-notebook", {
      instanceType: new ec2.InstanceType("ml.t2.medium"),
    });

    const assert = assertions.Template.fromStack(stack);
    assert.hasResourceProperties("AWS::SageMaker::NotebookInstance", {
      Tags: assertions.Match.arrayWith([
        {
          Key: "component",
          Value: "sagemaker",
        },
      ]),
    });
  });

  test("InstanceType can be set", () => {
    new SageMakerNotebook(stack, "sagemaker-notebook", {
      instanceType: new ec2.InstanceType("ml.t2.medium"),
    });

    const assert = assertions.Template.fromStack(stack);
    assert.hasResourceProperties("AWS::SageMaker::NotebookInstance", {
      InstanceType: "ml.t2.medium",
    });
  });

  test("Notebook instance name can be set", () => {
    new SageMakerNotebook(stack, "sagemaker-notebook", {
      instanceType: new ec2.InstanceType("ml.t2.medium"),
      notebookInstanceName: "test-instance",
    });

    const assert = assertions.Template.fromStack(stack);
    assert.hasResourceProperties("AWS::SageMaker::NotebookInstance", {
      NotebookInstanceName: "test-instance",
    });
  });

  test("Volume size can be set", () => {
    new SageMakerNotebook(stack, "sagemaker-notebook", {
      instanceType: new ec2.InstanceType("ml.t2.medium"),
      volumeSizeInGb: 64,
    });

    const assert = assertions.Template.fromStack(stack);
    assert.hasResourceProperties("AWS::SageMaker::NotebookInstance", {
      VolumeSizeInGB: 64,
    });
  });

  test("Sagemaker execution role assumes role for sagemaker", () => {
    new SageMakerNotebook(stack, "sagemaker-notebook", {
      instanceType: new ec2.InstanceType("ml.t2.medium"),
    });

    const assert = assertions.Template.fromStack(stack);
    assert.hasResourceProperties("AWS::IAM::Role", {
      AssumeRolePolicyDocument: assertions.Match.objectEquals({
        Statement: [
          {
            Action: "sts:AssumeRole",
            Effect: "Allow",
            Principal: {
              Service: "sagemaker.amazonaws.com",
            },
          },
        ],
        Version: "2012-10-17",
      }),
    });
  });

  test("Sagemaker execution role managed policies matches least priviledge", () => {
    new SageMakerNotebook(stack, "sagemaker-notebook", {
      instanceType: new ec2.InstanceType("ml.t2.medium"),
    });

    const assert = assertions.Template.fromStack(stack);
    assert.hasResourceProperties("AWS::IAM::Role", {
      ManagedPolicyArns: assertions.Match.arrayEquals([
        {
          "Fn::Join": [
            "",
            [
              "arn:",
              {
                Ref: "AWS::Partition",
              },
              ":iam::aws:policy/AmazonSageMakerFullAccess",
            ],
          ],
        },
        "arn:aws:iam::aws:policy/service-role/AmazonPersonalizeFullAccess",
      ]),
    });
  });

  test("Sagemaker execution role policies matches least priviledge", () => {
    new SageMakerNotebook(stack, "sagemaker-notebook", {
      instanceType: new ec2.InstanceType("ml.t2.medium"),
    });

    const assert = assertions.Template.fromStack(stack);
    assert.hasResourceProperties("AWS::IAM::Role", {
      Policies: assertions.Match.arrayEquals([
        {
          PolicyDocument: {
            Statement: [
              {
                Action: "s3:ListBucket",
                Effect: "Allow",
                Resource: {
                  "Fn::GetAtt": ["sagemakernotebookdataanalysisD2523CC9", "Arn"],
                },
              },
              {
                Action: ["s3:GetObject", "s3:PutObject", "s3:DeleteObject"],
                Effect: "Allow",
                Resource: {
                  "Fn::Join": [
                    "",
                    [
                      {
                        "Fn::GetAtt": ["sagemakernotebookdataanalysisD2523CC9", "Arn"],
                      },
                      "/*",
                    ],
                  ],
                },
              },
            ],
            Version: "2012-10-17",
          },
          PolicyName: "s3Buckets",
        },
      ]),
    });
  });

  test("Data analysis bucket is created", () => {
    new SageMakerNotebook(stack, "sagemaker-notebook", {
      instanceType: new ec2.InstanceType("ml.t2.medium"),
      volumeSizeInGb: 64,
    });

    const assert = assertions.Template.fromStack(stack);
    assert.hasResourceProperties("AWS::S3::Bucket", {
      BucketEncryption: {
        ServerSideEncryptionConfiguration: [
          {
            ServerSideEncryptionByDefault: {
              SSEAlgorithm: "AES256",
            },
          },
        ],
      },
      PublicAccessBlockConfiguration: {
        BlockPublicAcls: true,
        BlockPublicPolicy: true,
        IgnorePublicAcls: true,
        RestrictPublicBuckets: true,
      },
      Tags: [
        {
          Key: "aws-cdk:auto-delete-objects",
          Value: "true",
        },
        {
          Key: "component",
          Value: "sagemaker",
        },
      ],
      VersioningConfiguration: {
        Status: "Enabled",
      },
    });
  });

  test("Data analysis bucket does not retain", () => {
    new SageMakerNotebook(stack, "sagemaker-notebook", {
      instanceType: new ec2.InstanceType("ml.t2.medium"),
      volumeSizeInGb: 64,
    });

    const assert = assertions.Template.fromStack(stack);
    assert.hasResource("AWS::S3::Bucket", {
      UpdateReplacePolicy: "Delete",
      DeletionPolicy: "Delete",
    });
  });
});
