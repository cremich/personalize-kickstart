import * as cdk from "@aws-cdk/core";
import * as athena from "@aws-cdk/aws-athena";
import * as glue from "@aws-cdk/aws-glue";
import * as s3 from "@aws-cdk/aws-s3";
import * as iam from "@aws-cdk/aws-iam";
import * as sfn from "@aws-cdk/aws-stepfunctions";
import * as logs from "@aws-cdk/aws-logs";
import athenaPreparationDefinition from "../statemachines/athena-preparation";

export interface AthenaDataPreparationProps {
  workgroupName: string;
  databaseName: string;
  retainResults?: boolean;
  rawDataBucket: s3.Bucket;
  prepareItemsQuery?: string;
  prepareUsersQuery?: string;
  prepareInteractionsQuery: string;
  itemsCrawlerS3TargetPath?: string;
  usersCrawlerS3TargetPath?: string;
  interactionsCrawlerS3TargetPath: string;
}

export class AthenaDataPreparationWithGlueCatalog extends cdk.Construct {
  private itemsCrawler?: glue.CfnCrawler;
  private usersCrawler?: glue.CfnCrawler;
  private interactionsCrawler: glue.CfnCrawler;

  constructor(scope: cdk.Construct, id: string, props: AthenaDataPreparationProps) {
    super(scope, id);

    const queryResults = new s3.Bucket(this, "athena-results", {
      encryption: s3.BucketEncryption.S3_MANAGED,
      versioned: true,
      autoDeleteObjects: props.retainResults ? false : true,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      removalPolicy: props.retainResults ? cdk.RemovalPolicy.RETAIN : cdk.RemovalPolicy.DESTROY,
    });

    const glueRole = new iam.Role(this, "glue-role", {
      assumedBy: new iam.ServicePrincipal("glue.amazonaws.com"),
      managedPolicies: [iam.ManagedPolicy.fromAwsManagedPolicyName("service-role/AWSGlueServiceRole")],
      inlinePolicies: {
        rawDataBucketAccess: new iam.PolicyDocument({
          statements: [
            new iam.PolicyStatement({
              resources: [props.rawDataBucket.bucketArn],
              actions: ["s3:ListBucket"],
            }),
            new iam.PolicyStatement({
              resources: [`${props.rawDataBucket.bucketArn}/*`],
              actions: ["s3:GetObject", "s3:PutObject", "s3:DeleteObject"],
            }),
          ],
        }),
      },
    });

    const glueDatabase = new glue.Database(this, "database", {
      databaseName: props.databaseName,
    });

    if (props.itemsCrawlerS3TargetPath) {
      this.itemsCrawler = new glue.CfnCrawler(this, "items-crawler", {
        databaseName: glueDatabase.databaseName,
        role: glueRole.roleArn,
        targets: {
          s3Targets: [{ path: props.itemsCrawlerS3TargetPath }],
        },
      });

      cdk.Tags.of(this.itemsCrawler).add("dataset", "items");

      new cdk.CfnOutput(this, "items-crawler-name", {
        value: this.itemsCrawler.ref,
        description: "The name of the items crawler for athena based data preparation",
      });
    }

    if (props.usersCrawlerS3TargetPath) {
      this.usersCrawler = new glue.CfnCrawler(this, "users-crawler", {
        databaseName: glueDatabase.databaseName,
        role: glueRole.roleArn,
        targets: {
          s3Targets: [{ path: props.usersCrawlerS3TargetPath }],
        },
      });
      cdk.Tags.of(this.usersCrawler).add("dataset", "users");

      new cdk.CfnOutput(this, "users-crawler-name", {
        value: this.usersCrawler.ref,
        description: "The name of the users crawler for athena based data preparation",
      });
    }

    this.interactionsCrawler = new glue.CfnCrawler(this, "interactions-crawler", {
      databaseName: glueDatabase.databaseName,
      role: glueRole.roleArn,
      targets: {
        s3Targets: [{ path: props.interactionsCrawlerS3TargetPath }],
      },
    });
    cdk.Tags.of(this.interactionsCrawler).add("dataset", "interactions");

    new cdk.CfnOutput(this, "interactions-crawler-name", {
      value: this.interactionsCrawler.ref,
      description: "The name of the interactions crawler for athena based data preparation",
    });

    new cdk.CfnOutput(this, "glue-database-name", {
      value: glueDatabase.databaseName,
      description: "The name of the glue database for athena based data preparation",
    });

    const workgroup = new athena.CfnWorkGroup(this, "workgroup", {
      name: props.workgroupName,
      description: "Personalize kickstart data preparation",
      state: "ENABLED",
      recursiveDeleteOption: true,
      workGroupConfiguration: {
        publishCloudWatchMetricsEnabled: true,
        requesterPaysEnabled: false,
        resultConfiguration: {
          encryptionConfiguration: {
            encryptionOption: "SSE_S3",
          },
          outputLocation: `s3://${queryResults.bucketName}/`,
        },
      },
    });

    if (props.prepareItemsQuery) {
      const prepareItemsQuery = new athena.CfnNamedQuery(this, "prepare-items", {
        queryString: props.prepareItemsQuery,
        database: glueDatabase.databaseName,
        name: "PrepareItems",
        workGroup: workgroup.name,
      });
      prepareItemsQuery.addDependsOn(workgroup);
      new cdk.CfnOutput(this, "prepare-items-athena-query-id", {
        value: prepareItemsQuery.ref,
        description: "The id of the query to prepare items data",
        exportName: "prepare-items-athena-query-id",
      });
    }

    if (props.prepareUsersQuery) {
      const prepareUsersQuery = new athena.CfnNamedQuery(this, "prepare-users", {
        queryString: props.prepareUsersQuery,
        database: glueDatabase.databaseName,
        name: "PrepareUsers",
        workGroup: workgroup.name,
      });
      prepareUsersQuery.addDependsOn(workgroup);

      new cdk.CfnOutput(this, "prepare-users-athena-query-id", {
        value: prepareUsersQuery.ref,
        description: "The id of the query to prepare users data",
        exportName: "prepare-users-athena-query-id",
      });
    }

    const prepareInteractionsQuery = new athena.CfnNamedQuery(this, "prepare-interactions", {
      queryString: props.prepareInteractionsQuery,
      database: glueDatabase.databaseName,
      name: "PrepareInteractions",
      workGroup: workgroup.name,
    });
    prepareInteractionsQuery.addDependsOn(workgroup);

    new cdk.CfnOutput(this, "prepare-interactions-athena-query-id", {
      value: prepareInteractionsQuery.ref,
      description: "The id of the query to prepare interactions data",
      exportName: "prepare-interactions-athena-query-id",
    });

    const workgroupArn = cdk.Stack.of(this).formatArn({
      service: "athena",
      resource: "workgroup",
      sep: "/",
      resourceName: `${workgroup.name}`,
    });

    const glueDatabaseTableArn = cdk.Stack.of(this).formatArn({
      service: "glue",
      resource: "table",
      sep: "/",
      resourceName: `${glueDatabase.databaseName}/*`,
    });

    const logGroup = new logs.LogGroup(this, "state-machine-loggroup", {
      // retention: this.node.tryGetContext("@aws-cdk/aws-logs:defaultRetentionInDays"),
    });

    /* To get detailed information about the required IAM policy statements, check
     * - https://docs.aws.amazon.com/athena/latest/ug/example-policies-workgroup.html#example3-user-access
     * - https://aws.amazon.com/de/premiumsupport/knowledge-center/access-denied-athena/
     * - https://docs.aws.amazon.com/athena/latest/ug/fine-grained-access-to-glue-resources.html
     */
    const statemachine = new sfn.StateMachine(this, "state-machine", {
      definition: new sfn.Pass(this, "temp-pass"),
      timeout: cdk.Duration.minutes(5),
      logs: {
        destination: logGroup,
        level: sfn.LogLevel.ERROR,
      },
      tracingEnabled: true,
      role: new iam.Role(this, "statemachine-role", {
        assumedBy: new iam.ServicePrincipal(`states.${cdk.Stack.of(this).region}.amazonaws.com`),
        inlinePolicies: {
          glueAccess: new iam.PolicyDocument({
            statements: [
              new iam.PolicyStatement({
                resources: this.getGlueCrawlerResourcesForIamPolicy(),
                actions: ["glue:GetCrawler", "glue:StartCrawler"],
              }),
              new iam.PolicyStatement({
                resources: [glueDatabase.catalogArn, glueDatabase.databaseArn, glueDatabaseTableArn],
                actions: ["glue:GetDatabase", "glue:GetTable", "glue:GetPartitions"],
              }),
            ],
          }),
          athenaWorkgroupAccess: new iam.PolicyDocument({
            statements: [
              new iam.PolicyStatement({
                resources: [workgroupArn],
                actions: ["athena:GetNamedQuery", "athena:StartQueryExecution", "athena:GetQueryExecution"],
              }),
            ],
          }),
          s3RawDataAccess: new iam.PolicyDocument({
            statements: [
              new iam.PolicyStatement({
                resources: [props.rawDataBucket.bucketArn, `${props.rawDataBucket.bucketArn}/*`],
                actions: [
                  "s3:GetBucketLocation",
                  "s3:GetObject",
                  "s3:ListBucket",
                  "s3:ListBucketMultipartUploads",
                  "s3:AbortMultipartUpload",
                  "s3:PutObject",
                  "s3:ListMultipartUploadParts",
                ],
              }),
            ],
          }),
          s3QueryResultAccess: new iam.PolicyDocument({
            statements: [
              new iam.PolicyStatement({
                resources: [queryResults.bucketArn, `${queryResults.bucketArn}/*`],
                actions: [
                  "s3:GetBucketLocation",
                  "s3:GetObject",
                  "s3:ListBucket",
                  "s3:ListBucketMultipartUploads",
                  "s3:AbortMultipartUpload",
                  "s3:PutObject",
                  "s3:ListMultipartUploadParts",
                ],
              }),
            ],
          }),
        },
      }),
    });

    const cfnStatemachine = statemachine.node.defaultChild as sfn.CfnStateMachine;
    cfnStatemachine.definitionString = JSON.stringify(athenaPreparationDefinition);

    cdk.Tags.of(this).add("component", "data-preparation");
  }

  private getGlueCrawlerResourcesForIamPolicy(): string[] {
    const resources: string[] = [];

    const interactionsCrawlerArn = cdk.Stack.of(this).formatArn({
      service: "glue",
      resource: "crawler",
      sep: "/",
      resourceName: `${this.interactionsCrawler.ref}`,
    });
    resources.push(interactionsCrawlerArn);

    if (this.itemsCrawler) {
      const itemsCrawlerArn = cdk.Stack.of(this).formatArn({
        service: "glue",
        resource: "crawler",
        sep: "/",
        resourceName: `${this.itemsCrawler.ref}`,
      });
      resources.push(itemsCrawlerArn);
    }
    if (this.usersCrawler) {
      const usersCrawlerArn = cdk.Stack.of(this).formatArn({
        service: "glue",
        resource: "crawler",
        sep: "/",
        resourceName: `${this.usersCrawler.ref}`,
      });
      resources.push(usersCrawlerArn);
    }
    return resources;
  }
}
