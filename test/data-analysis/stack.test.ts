import { assertions, Stack } from "aws-cdk-lib";
import { aws_ec2 as ec2 } from "aws-cdk-lib";
import { DataAnalysisStack } from "../../lib/data-analysis/stack";

let stack: Stack;

describe("Data analysis stack", () => {
  beforeEach(() => {
    stack = new Stack();
  });

  test("Notebook is tagged with component tag", () => {
    const nestedStack = new DataAnalysisStack(stack, "data-analysis", {
      notebookVolumeSizeInGb: 64,
      sagemakerInstanceType: new ec2.InstanceType("ml.t3.medium"),
    });

    const assert = assertions.Template.fromStack(nestedStack);
    assert.hasResourceProperties("AWS::SageMaker::NotebookInstance", {
      Tags: assertions.Match.arrayWith([
        {
          Key: "component",
          Value: "data-analysis",
        },
      ]),
    });
  });
});
