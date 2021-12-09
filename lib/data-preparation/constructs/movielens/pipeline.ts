import { Construct } from "constructs";
import { RemovalPolicy, Tags, Stack } from "aws-cdk-lib";
import { aws_s3 as s3 } from "aws-cdk-lib";
import { AthenaDataPreparationWithGlueCatalog } from "../athena-data-preparation-catalog";
import selectDatasets from "../../athena-queries/movielens/select-datasets";

export interface DataPreparationPipelineProps {
  retainRawData?: boolean;
}

export class MovielensDataPreparationPipeline extends Construct {
  constructor(scope: Construct, id: string, props: DataPreparationPipelineProps) {
    super(scope, id);

    const rawDataBucket = new s3.Bucket(this, "raw-data", {
      encryption: s3.BucketEncryption.S3_MANAGED,
      versioned: true,
      autoDeleteObjects: props.retainRawData ? false : true,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      removalPolicy: props.retainRawData ? RemovalPolicy.RETAIN : RemovalPolicy.DESTROY,
    });

    new AthenaDataPreparationWithGlueCatalog(this, "athena-data-preparation", {
      workgroupName: `${Stack.of(this).stackName}-movielens`,
      databaseName: `${Stack.of(this).stackName}-movielens`,
      retainResults: props.retainRawData,
      rawDataBucket: rawDataBucket,
      prepareItemsQuery: selectDatasets.items,
      prepareInteractionsQuery: selectDatasets.interactions,
      itemsCrawlerS3TargetPath: `s3://${rawDataBucket.bucketName}/movies/`,
      interactionsCrawlerS3TargetPath: `s3://${rawDataBucket.bucketName}/ratings/`,
    });

    Tags.of(this).add("component", "data-preparation");
  }
}
