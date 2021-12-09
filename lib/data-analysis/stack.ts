import { Construct } from "constructs";
import { NestedStack, NestedStackProps, Tags, CfnOutput } from "aws-cdk-lib";
import { aws_ec2 as ec2 } from "aws-cdk-lib";
import { SageMakerNotebook } from "./constructs/sagemaker-notebook";

interface DataAnalysisStackProps extends NestedStackProps {
  readonly notebookVolumeSizeInGb: number;
  readonly sagemakerInstanceType: ec2.InstanceType;
}

export class DataAnalysisStack extends NestedStack {
  constructor(scope: Construct, id: string, props: DataAnalysisStackProps) {
    super(scope, id, props);

    const sagemakerNotebook = new SageMakerNotebook(this, "sagemaker-notebook", {
      instanceType: props.sagemakerInstanceType,
      volumeSizeInGb: props.notebookVolumeSizeInGb,
    });

    new CfnOutput(this, "data-analysis-bucket-name", {
      value: sagemakerNotebook.bucket.bucketName,
      description: "Data analysis bucket name",
    });

    new CfnOutput(this, "sagemaker-notebook-instance-name", {
      value: sagemakerNotebook.sagemakerNotebookInstance.notebookInstanceName
        ? sagemakerNotebook.sagemakerNotebookInstance.notebookInstanceName
        : "",
      description: "Sagemaker notebook instance name",
    });

    Tags.of(this).add("component", "data-analysis");
  }
}
