import * as cdk from "@aws-cdk/core";
import * as s3 from "@aws-cdk/aws-s3";
import { AthenaDataPreparationWithGlueCatalog } from "../athena-data-preparation-catalog";
import selectDatasets from "../../athena-queries/movielens/select-datasets";

export interface DataPreparationPipelineProps {
  retainRawData?: boolean;
}

export class MovielensDataPreparationPipeline extends cdk.Construct {
  constructor(scope: cdk.Construct, id: string, props: DataPreparationPipelineProps) {
    super(scope, id);

    const rawDataBucket = new s3.Bucket(this, "raw-data", {
      encryption: s3.BucketEncryption.S3_MANAGED,
      versioned: true,
      autoDeleteObjects: props.retainRawData ? false : true,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      removalPolicy: props.retainRawData ? cdk.RemovalPolicy.RETAIN : cdk.RemovalPolicy.DESTROY,
    });

    new AthenaDataPreparationWithGlueCatalog(this, "athena-data-preparation", {
      workgroupName: `${cdk.Stack.of(this).stackName}-movielens`,
      databaseName: `${cdk.Stack.of(this).stackName}-movielens`,
      retainResults: props.retainRawData,
      rawDataBucket: rawDataBucket,
      prepareItemsQuery: selectDatasets.items,
      prepareInteractionsQuery: selectDatasets.interactions,
      itemsCrawlerS3TargetPath: `s3://${rawDataBucket.bucketName}/movies/`,
      interactionsCrawlerS3TargetPath: `s3://${rawDataBucket.bucketName}/ratings/`,
    });

    cdk.Tags.of(this).add("component", "data-preparation");
  }
}
