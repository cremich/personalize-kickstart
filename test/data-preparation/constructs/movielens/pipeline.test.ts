import * as cdk from "@aws-cdk/core";
import { Template } from "@aws-cdk/assertions";
import { MovielensDataPreparationPipeline } from "../../../../lib/data-preparation/constructs/movielens/pipeline";

let stack: cdk.Stack;

describe("Data preparation pipeline construct", () => {
  beforeEach(() => {
    stack = new cdk.Stack();
  });

  test("Raw data bucket is created", () => {
    new MovielensDataPreparationPipeline(stack, "data-preparation", {});

    const assert = Template.fromStack(stack);
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
          Value: "data-preparation",
        },
      ],
      VersioningConfiguration: {
        Status: "Enabled",
      },
    });
  });

  test("Raw data bucket is deleted by default", () => {
    new MovielensDataPreparationPipeline(stack, "data-preparation", {});
    const assert = Template.fromStack(stack);
    assert.hasResource("AWS::S3::Bucket", {
      UpdateReplacePolicy: "Delete",
      DeletionPolicy: "Delete",
    });
  });

  test("Raw data bucket is set to retain if requested", () => {
    new MovielensDataPreparationPipeline(stack, "data-preparation", {
      retainRawData: true,
    });

    const assert = Template.fromStack(stack);
    assert.hasResource("AWS::S3::Bucket", {
      UpdateReplacePolicy: "Retain",
      DeletionPolicy: "Retain",
    });
  });
});
