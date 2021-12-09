import { Stack, assertions } from "aws-cdk-lib";
import { aws_s3 as s3 } from "aws-cdk-lib";
import stateMachineDefinition from "../../../lib/data-preparation/statemachines/athena-preparation";
import { AthenaDataPreparationWithGlueCatalog } from "../../../lib/data-preparation/constructs/athena-data-preparation-catalog";

let stack: Stack;

describe("Athena data preparation with glue catalog construct", () => {
  beforeEach(() => {
    stack = new Stack();
  });

  test("Statemachine to orchestrate athena queries is creatd", () => {
    new AthenaDataPreparationWithGlueCatalog(stack, "data-preparation", {
      workgroupName: "test",
      databaseName: "test",
      rawDataBucket: new s3.Bucket(stack, "bucket"),
      prepareItemsQuery: "SELECT ITEMS",
      prepareInteractionsQuery: "SELECT INTERACTIONS",
      itemsCrawlerS3TargetPath: `s3://bucket/items/`,
      interactionsCrawlerS3TargetPath: `s3://bucket/interactions/`,
    });

    const assert = assertions.Template.fromStack(stack);
    assert.hasResourceProperties("AWS::StepFunctions::StateMachine", {
      DefinitionString: JSON.stringify(stateMachineDefinition),
      Tags: [
        {
          Key: "component",
          Value: "data-preparation",
        },
      ],
    });
  });

  test("Glue database is created", () => {
    new AthenaDataPreparationWithGlueCatalog(stack, "data-preparation", {
      workgroupName: "test",
      databaseName: "test",
      rawDataBucket: new s3.Bucket(stack, "bucket"),
      prepareItemsQuery: "SELECT ITEMS",
      prepareInteractionsQuery: "SELECT INTERACTIONS",
      itemsCrawlerS3TargetPath: `s3://bucket/items/`,
      interactionsCrawlerS3TargetPath: `s3://bucket/interactions/`,
    });

    const assert = assertions.Template.fromStack(stack);
    assert.hasResourceProperties("AWS::Glue::Database", {
      CatalogId: {
        Ref: "AWS::AccountId",
      },
      DatabaseInput: {
        Name: "test",
      },
    });
  });

  test("Glue crawler for items is created", () => {
    new AthenaDataPreparationWithGlueCatalog(stack, "data-preparation", {
      workgroupName: "test",
      databaseName: "test",
      rawDataBucket: new s3.Bucket(stack, "bucket"),
      prepareItemsQuery: "SELECT ITEMS",
      prepareInteractionsQuery: "SELECT INTERACTIONS",
      itemsCrawlerS3TargetPath: `s3://bucket/items/`,
      interactionsCrawlerS3TargetPath: `s3://bucket/interactions/`,
    });
    const assert = assertions.Template.fromStack(stack);
    assert.hasResourceProperties("AWS::Glue::Crawler", {
      Role: {
        "Fn::GetAtt": ["datapreparationgluerole59B0E6C6", "Arn"],
      },
      Targets: {
        S3Targets: [
          {
            Path: "s3://bucket/items/",
          },
        ],
      },
      DatabaseName: {
        Ref: "datapreparationdatabaseD6FDDF3F",
      },
      Tags: {
        component: "data-preparation",
        dataset: "items",
      },
    });
  });

  test("Glue crawler for interactions is created", () => {
    new AthenaDataPreparationWithGlueCatalog(stack, "data-preparation", {
      workgroupName: "test",
      databaseName: "test",
      rawDataBucket: new s3.Bucket(stack, "bucket"),
      prepareItemsQuery: "SELECT ITEMS",
      prepareInteractionsQuery: "SELECT INTERACTIONS",
      itemsCrawlerS3TargetPath: `s3://bucket/items/`,
      interactionsCrawlerS3TargetPath: `s3://bucket/interactions/`,
    });
    const assert = assertions.Template.fromStack(stack);
    assert.hasResourceProperties("AWS::Glue::Crawler", {
      Role: {
        "Fn::GetAtt": ["datapreparationgluerole59B0E6C6", "Arn"],
      },
      Targets: {
        S3Targets: [
          {
            Path: "s3://bucket/interactions/",
          },
        ],
      },
      DatabaseName: {
        Ref: "datapreparationdatabaseD6FDDF3F",
      },
      Tags: {
        component: "data-preparation",
        dataset: "interactions",
      },
    });
  });

  test("Glue crawler for users is created", () => {
    new AthenaDataPreparationWithGlueCatalog(stack, "data-preparation", {
      workgroupName: "test",
      databaseName: "test",
      rawDataBucket: new s3.Bucket(stack, "bucket"),
      prepareItemsQuery: "SELECT ITEMS",
      prepareInteractionsQuery: "SELECT INTERACTIONS",
      itemsCrawlerS3TargetPath: `s3://bucket/items/`,
      interactionsCrawlerS3TargetPath: `s3://bucket/interactions/`,
      usersCrawlerS3TargetPath: `s3://bucket/users/`,
    });
    const assert = assertions.Template.fromStack(stack);
    assert.hasResourceProperties("AWS::Glue::Crawler", {
      Role: {
        "Fn::GetAtt": ["datapreparationgluerole59B0E6C6", "Arn"],
      },
      Targets: {
        S3Targets: [
          {
            Path: "s3://bucket/users/",
          },
        ],
      },
      DatabaseName: {
        Ref: "datapreparationdatabaseD6FDDF3F",
      },
      Tags: {
        component: "data-preparation",
        dataset: "users",
      },
    });
  });

  test("Athena workgroup is enabled", () => {
    new AthenaDataPreparationWithGlueCatalog(stack, "data-preparation", {
      workgroupName: "test",
      databaseName: "test",
      rawDataBucket: new s3.Bucket(stack, "bucket"),
      prepareItemsQuery: "SELECT ITEMS",
      prepareInteractionsQuery: "SELECT INTERACTIONS",
      itemsCrawlerS3TargetPath: `s3://bucket/items/`,
      interactionsCrawlerS3TargetPath: `s3://bucket/interactions/`,
    });
    const assert = assertions.Template.fromStack(stack);
    assert.hasResourceProperties("AWS::Athena::WorkGroup", {
      Name: "test",
      Description: "Personalize kickstart data preparation",
      RecursiveDeleteOption: true,
      State: "ENABLED",
      Tags: [
        {
          Key: "component",
          Value: "data-preparation",
        },
      ],
      WorkGroupConfiguration: {
        PublishCloudWatchMetricsEnabled: true,
        RequesterPaysEnabled: false,
        ResultConfiguration: {
          EncryptionConfiguration: {
            EncryptionOption: "SSE_S3",
          },
          OutputLocation: {
            "Fn::Join": [
              "",
              [
                "s3://",
                {
                  Ref: "datapreparationathenaresults9D59C5B0",
                },
                "/",
              ],
            ],
          },
        },
      },
    });
  });

  test("Named query for interactions is created", () => {
    new AthenaDataPreparationWithGlueCatalog(stack, "data-preparation", {
      workgroupName: "test",
      databaseName: "test",
      rawDataBucket: new s3.Bucket(stack, "bucket"),
      prepareInteractionsQuery: "SELECT INTERACTIONS",
      interactionsCrawlerS3TargetPath: `s3://bucket/interactions/`,
    });
    const assert = assertions.Template.fromStack(stack);
    assert.hasResourceProperties("AWS::Athena::NamedQuery", {
      Database: {
        Ref: "datapreparationdatabaseD6FDDF3F",
      },
      QueryString: "SELECT INTERACTIONS",
      Name: "PrepareInteractions",
      WorkGroup: "test",
    });
  });

  test("Named query for users is created", () => {
    new AthenaDataPreparationWithGlueCatalog(stack, "data-preparation", {
      workgroupName: "test",
      databaseName: "test",
      rawDataBucket: new s3.Bucket(stack, "bucket"),
      prepareInteractionsQuery: "SELECT INTERACTIONS",
      prepareUsersQuery: "SELECT USERS",
      interactionsCrawlerS3TargetPath: `s3://bucket/interactions/`,
      usersCrawlerS3TargetPath: `s3://bucket/users/`,
    });
    const assert = assertions.Template.fromStack(stack);
    assert.hasResourceProperties("AWS::Athena::NamedQuery", {
      Database: {
        Ref: "datapreparationdatabaseD6FDDF3F",
      },
      QueryString: "SELECT USERS",
      Name: "PrepareUsers",
      WorkGroup: "test",
    });
  });

  test("Named query for items is created", () => {
    new AthenaDataPreparationWithGlueCatalog(stack, "data-preparation", {
      workgroupName: "test",
      databaseName: "test",
      rawDataBucket: new s3.Bucket(stack, "bucket"),
      prepareInteractionsQuery: "SELECT INTERACTIONS",
      prepareUsersQuery: "SELECT USERS",
      prepareItemsQuery: "SELECT ITEMS",
      interactionsCrawlerS3TargetPath: `s3://bucket/interactions/`,
      usersCrawlerS3TargetPath: `s3://bucket/users/`,
      itemsCrawlerS3TargetPath: `s3://bucket/items/`,
    });
    const assert = assertions.Template.fromStack(stack);
    assert.hasResourceProperties("AWS::Athena::NamedQuery", {
      Database: {
        Ref: "datapreparationdatabaseD6FDDF3F",
      },
      QueryString: "SELECT ITEMS",
      Name: "PrepareItems",
      WorkGroup: "test",
    });
  });
});
