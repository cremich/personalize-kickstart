import { Construct } from "constructs";
import { RemovalPolicy, Tags, NestedStack, CfnOutput, NestedStackProps } from "aws-cdk-lib";
import { aws_s3 as s3 } from "aws-cdk-lib";
import { AthenaPreprocessing } from "../../data-preprocessing/constructs/athena-preprocessing";
import selectDatasets from "./athena-queries/select-datasets";

export interface DataPreparationPipelineProps extends NestedStackProps {
  retainData?: boolean;
  athenaWorkgroupName: string;
  glueDatabaseName: string;
}

export class MovielensDataPreprocessingStack extends NestedStack {
  constructor(scope: Construct, id: string, props: DataPreparationPipelineProps) {
    super(scope, id);

    const rawDataBucket = new s3.Bucket(this, "raw-data", {
      encryption: s3.BucketEncryption.S3_MANAGED,
      versioned: true,
      autoDeleteObjects: props.retainData ? false : true,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      removalPolicy: props.retainData ? RemovalPolicy.RETAIN : RemovalPolicy.DESTROY,
    });

    const athenaPreprocessing = new AthenaPreprocessing(this, "athena-data-preparation", {
      workgroupName: props.athenaWorkgroupName,
      databaseName: props.glueDatabaseName,
      retainResults: props.retainData,
      rawDataBucket: rawDataBucket,
      datasetSources: {
        items: {
          query: selectDatasets.items,
          crawlerS3TargetPath: `s3://${rawDataBucket.bucketName}/movies/`,
        },
        interactions: {
          query: selectDatasets.items,
          crawlerS3TargetPath: `s3://${rawDataBucket.bucketName}/ratings/`,
        },
      },
    });

    new CfnOutput(this, "glue-database-name", {
      value: athenaPreprocessing.glueDatabase.databaseName,
      description: "The name of the glue database for athena based data preprocessing",
    });

    if (athenaPreprocessing.items) {
      new CfnOutput(this, "items-crawler-name", {
        value: athenaPreprocessing.items.crawler.ref,
        description: "The name of the items crawler for athena based data preprocessing",
      });
      new CfnOutput(this, "prepare-items-athena-query-id", {
        value: athenaPreprocessing.items.athenaQuery.ref,
        description: "The id of the query to preprocess items data",
      });
    }

    new CfnOutput(this, "interactions-crawler-name", {
      value: athenaPreprocessing.interactions.crawler.ref,
      description: "The name of the interactions crawler for athena based data preprocessing",
    });

    new CfnOutput(this, "prepare-interactions-athena-query-id", {
      value: athenaPreprocessing.interactions.athenaQuery.ref,
      description: "The id of the query to preprocess interactions data",
    });

    Tags.of(this).add("component", "data-preprocessing");
  }
}
