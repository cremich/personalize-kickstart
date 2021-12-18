import { assertions, Stack } from "aws-cdk-lib";
import { MovielensDataPreprocessingStack } from "../../../lib/movielens/data-preprocessing/stack";

let stack: Stack;

describe("Movielens data preprocessing stack", () => {
  beforeEach(() => {
    stack = new Stack();
  });

  test("Raw data bucket is created", () => {
    const nestedStack = new MovielensDataPreprocessingStack(stack, "movielens-data-preparation", {
      athenaWorkgroupName: "test",
      glueDatabaseName: "test",
    });

    const assert = assertions.Template.fromStack(nestedStack);
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
          Value: "data-preprocessing",
        },
      ],
      VersioningConfiguration: {
        Status: "Enabled",
      },
    });
  });

  test("Raw data bucket is deleted by default", () => {
    const nestedStack = new MovielensDataPreprocessingStack(stack, "movielens-data-preparation", {
      athenaWorkgroupName: "test",
      glueDatabaseName: "test",
    });
    const assert = assertions.Template.fromStack(nestedStack);
    assert.hasResource("AWS::S3::Bucket", {
      UpdateReplacePolicy: "Delete",
      DeletionPolicy: "Delete",
    });
  });

  test("Raw data bucket is set to retain if requested", () => {
    const nestedStack = new MovielensDataPreprocessingStack(stack, "movielens-data-preparation", {
      retainData: true,
      athenaWorkgroupName: "test",
      glueDatabaseName: "test",
    });

    const assert = assertions.Template.fromStack(nestedStack);
    assert.hasResource("AWS::S3::Bucket", {
      UpdateReplacePolicy: "Retain",
      DeletionPolicy: "Retain",
    });
  });
});
