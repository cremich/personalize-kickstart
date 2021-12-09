import { Construct } from "constructs";
import { RemovalPolicy, Tags, Stack, Duration } from "aws-cdk-lib";
import { aws_athena as athena } from "aws-cdk-lib";
import * as glueAlpha from "@aws-cdk/aws-glue-alpha";
import { aws_s3 as s3 } from "aws-cdk-lib";
import { aws_glue as glue } from "aws-cdk-lib";
import { aws_iam as iam } from "aws-cdk-lib";
import { aws_stepfunctions as sfn } from "aws-cdk-lib";
import { aws_logs as logs } from "aws-cdk-lib";
import athenaPreparationDefinition from "../statemachines/athena-preprocessing-workflow";

interface DatasetSources {
  items?: DatasetSource;
  users?: DatasetSource;
  interactions: DatasetSource;
}

interface DatasetSource {
  query: string;
  crawlerS3TargetPath: string;
}

export interface AthenaPreprocessingProps {
  workgroupName: string;
  databaseName: string;
  retainResults?: boolean;
  rawDataBucket: s3.Bucket;
  datasetSources: DatasetSources;
}

export class AthenaPreprocessing extends Construct {
  glueDatabase: glueAlpha.Database;
  items?: {
    crawler: glue.CfnCrawler;
    athenaQuery: athena.CfnNamedQuery;
  };
  users?: {
    crawler: glue.CfnCrawler;
    athenaQuery: athena.CfnNamedQuery;
  };
  interactions: {
    crawler: glue.CfnCrawler;
    athenaQuery: athena.CfnNamedQuery;
  };

  constructor(scope: Construct, id: string, props: AthenaPreprocessingProps) {
    super(scope, id);

    const queryResults = new s3.Bucket(this, "athena-results", {
      encryption: s3.BucketEncryption.S3_MANAGED,
      versioned: true,
      autoDeleteObjects: props.retainResults ? false : true,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      removalPolicy: props.retainResults ? RemovalPolicy.RETAIN : RemovalPolicy.DESTROY,
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

    this.glueDatabase = new glueAlpha.Database(this, "database", {
      databaseName: props.databaseName,
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

    if (props.datasetSources?.items) {
      const crawler = new glue.CfnCrawler(this, "items-crawler", {
        databaseName: this.glueDatabase.databaseName,
        role: glueRole.roleArn,
        targets: {
          s3Targets: [{ path: props.datasetSources.items.crawlerS3TargetPath }],
        },
      });

      const athenaQuery = new athena.CfnNamedQuery(this, "prepare-items", {
        queryString: props.datasetSources.items.query,
        database: this.glueDatabase.databaseName,
        name: "PrepareItems",
        workGroup: workgroup.name,
      });
      athenaQuery.addDependsOn(workgroup);

      this.items = {
        crawler,
        athenaQuery,
      };

      Tags.of(crawler).add("dataset", "items");
      Tags.of(athenaQuery).add("dataset", "items");
    }

    if (props.datasetSources?.users) {
      const crawler = new glue.CfnCrawler(this, "users-crawler", {
        databaseName: this.glueDatabase.databaseName,
        role: glueRole.roleArn,
        targets: {
          s3Targets: [{ path: props.datasetSources.users.crawlerS3TargetPath }],
        },
      });

      const athenaQuery = new athena.CfnNamedQuery(this, "prepare-users", {
        queryString: props.datasetSources.users.query,
        database: this.glueDatabase.databaseName,
        name: "PrepareUsers",
        workGroup: workgroup.name,
      });
      athenaQuery.addDependsOn(workgroup);

      this.users = {
        crawler,
        athenaQuery,
      };

      Tags.of(crawler).add("dataset", "users");
      Tags.of(athenaQuery).add("dataset", "users");
    }

    const crawler = new glue.CfnCrawler(this, "interactions-crawler", {
      databaseName: this.glueDatabase.databaseName,
      role: glueRole.roleArn,
      targets: {
        s3Targets: [{ path: props.datasetSources?.interactions.crawlerS3TargetPath }],
      },
    });

    const athenaQuery = new athena.CfnNamedQuery(this, "prepare-interactions", {
      queryString: props.datasetSources.interactions.query,
      database: this.glueDatabase.databaseName,
      name: "PrepareInteractions",
      workGroup: workgroup.name,
    });
    athenaQuery.addDependsOn(workgroup);

    this.interactions = {
      crawler,
      athenaQuery,
    };

    Tags.of(crawler).add("dataset", "interactions");
    Tags.of(athenaQuery).add("dataset", "interactions");

    const workgroupArn = Stack.of(this).formatArn({
      service: "athena",
      resource: "workgroup",
      resourceName: `${workgroup.name}`,
    });

    const glueDatabaseTableArn = Stack.of(this).formatArn({
      service: "glue",
      resource: "table",
      resourceName: `${this.glueDatabase.databaseName}/*`,
    });

    const logGroup = new logs.LogGroup(this, "state-machine-loggroup");

    /* To get detailed information about the required IAM policy statements, check
     * - https://docs.aws.amazon.com/athena/latest/ug/example-policies-workgroup.html#example3-user-access
     * - https://aws.amazon.com/de/premiumsupport/knowledge-center/access-denied-athena/
     * - https://docs.aws.amazon.com/athena/latest/ug/fine-grained-access-to-glue-resources.html
     */
    const statemachine = new sfn.StateMachine(this, "state-machine", {
      definition: new sfn.Pass(this, "temp-pass"),
      timeout: Duration.minutes(5),
      logs: {
        destination: logGroup,
        level: sfn.LogLevel.ERROR,
      },
      tracingEnabled: true,
      role: new iam.Role(this, "statemachine-role", {
        assumedBy: new iam.ServicePrincipal(`states.${Stack.of(this).region}.amazonaws.com`),
        inlinePolicies: {
          glueAccess: new iam.PolicyDocument({
            statements: [
              new iam.PolicyStatement({
                resources: this.getGlueCrawlerResourcesForIamPolicy(),
                actions: ["glue:GetCrawler", "glue:StartCrawler"],
              }),
              new iam.PolicyStatement({
                resources: [this.glueDatabase.catalogArn, this.glueDatabase.databaseArn, glueDatabaseTableArn],
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
  }

  private getGlueCrawlerResourcesForIamPolicy(): string[] {
    const resources: string[] = [];

    const interactionsCrawlerArn = Stack.of(this).formatArn({
      service: "glue",
      resource: "crawler",
      resourceName: `${this.interactions.crawler.ref}`,
    });
    resources.push(interactionsCrawlerArn);

    if (this.items) {
      const itemsCrawlerArn = Stack.of(this).formatArn({
        service: "glue",
        resource: "crawler",
        resourceName: `${this.items.crawler.ref}`,
      });
      resources.push(itemsCrawlerArn);
    }
    if (this.users) {
      const usersCrawlerArn = Stack.of(this).formatArn({
        service: "glue",
        resource: "crawler",
        resourceName: `${this.users.crawler.ref}`,
      });
      resources.push(usersCrawlerArn);
    }
    return resources;
  }
}
