import * as cdk from "@aws-cdk/core";
import * as ec2 from "@aws-cdk/aws-ec2";
import { SageMakerNotebook } from "./constructs/sagemaker-notebook";

interface PersonalizeStackProps extends cdk.StackProps {
  readonly notebookInstanceName?: string;
  readonly notebookVolumeSizeInGb?: number;
  readonly provisionSagemakerNotebook: boolean;
  readonly sagemakerInstanceType?: string;
}

export class PersonalizeStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: PersonalizeStackProps) {
    super(scope, id, props);

    if (props?.provisionSagemakerNotebook) {
      new SageMakerNotebook(this, "sagemaker-notebook", {
        instanceType: new ec2.InstanceType(props.sagemakerInstanceType ?? "ml.t3.medium"),
        notebookInstanceName: props.notebookInstanceName,
        volumeSizeInGb: props.notebookVolumeSizeInGb,
      });
    }

    cdk.Tags.of(this).add("application", "personalize");
  }
}
