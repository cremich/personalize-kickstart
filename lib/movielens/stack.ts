import { Construct } from "constructs";
import { Stack, StackProps, Tags, Aspects } from "aws-cdk-lib";
import { aws_ec2 as ec2 } from "aws-cdk-lib";
import { LogGroupRetention } from "../aspects/log-group-retention";
import { CloudWatchAlarms } from "../aspects/cloudwatch-alarms";
import { DataAnalysisStack } from "../data-analysis/stack";
import { MovielensDataPreprocessingStack } from "./data-preprocessing/stack";

interface MovielensStackProps extends StackProps {
  readonly dataAnalysis?: {
    readonly notebookVolumeSizeInGb: number;
    readonly sagemakerInstanceType: ec2.InstanceType;
  };
  readonly dataPreprocessing: {
    readonly retainData: boolean;
    readonly athenaWorkgroupName: string;
    readonly glueDatabaseName: string;
    readonly loadTestData?: boolean;
  };
}
export class MovielensStack extends Stack {
  constructor(scope: Construct, id: string, props: MovielensStackProps) {
    super(scope, id, props);

    if (props?.dataAnalysis) {
      new DataAnalysisStack(this, "data-analysis", {
        sagemakerInstanceType: props.dataAnalysis.sagemakerInstanceType,
        notebookVolumeSizeInGb: props.dataAnalysis.notebookVolumeSizeInGb,
      });
    }

    new MovielensDataPreprocessingStack(this, "preprocessing", {
      retainData: props.dataPreprocessing.retainData,
      athenaWorkgroupName: props.dataPreprocessing.athenaWorkgroupName,
      glueDatabaseName: props.dataPreprocessing.glueDatabaseName,
      loadTestData: props.dataPreprocessing.loadTestData,
    });

    Tags.of(this).add("application", "personalize");
    Tags.of(this).add("client", "movielens");
    Aspects.of(this).add(new LogGroupRetention());
    Aspects.of(this).add(new CloudWatchAlarms());
  }
}
