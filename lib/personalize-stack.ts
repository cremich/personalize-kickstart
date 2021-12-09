import { Construct } from "constructs";
import { Stack, StackProps, Tags, Aspects } from "aws-cdk-lib";
import { aws_ec2 as ec2 } from "aws-cdk-lib";
import { SageMakerNotebook } from "./constructs/sagemaker-notebook";
import { MovielensDataPreparationPipeline } from "./data-preparation/constructs/movielens/pipeline";
import { LogGroupRetention } from "./aspects/log-group-retention";
import { CloudWatchAlarms } from "./aspects/cloudwatch-alarms";

interface PersonalizeStackProps extends StackProps {
  readonly notebookInstanceName?: string;
  readonly notebookVolumeSizeInGb?: number;
  readonly provisionSagemakerNotebook: boolean;
  readonly sagemakerInstanceType?: string;
  readonly retainRawDataBucket?: boolean;
}

export class PersonalizeStack extends Stack {
  constructor(scope: Construct, id: string, props?: PersonalizeStackProps) {
    super(scope, id, props);

    if (props?.provisionSagemakerNotebook) {
      new SageMakerNotebook(this, "sagemaker-notebook", {
        instanceType: new ec2.InstanceType(props.sagemakerInstanceType ?? "ml.t3.medium"),
        notebookInstanceName: props.notebookInstanceName,
        volumeSizeInGb: props.notebookVolumeSizeInGb,
      });
    }

    new MovielensDataPreparationPipeline(this, "movielens-data-prep", {
      retainRawData: props?.retainRawDataBucket,
    });

    Tags.of(this).add("application", "personalize");
    Aspects.of(this).add(new LogGroupRetention());
    Aspects.of(this).add(new CloudWatchAlarms());
  }
}
