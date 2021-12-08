import * as cdk from "@aws-cdk/core";
import * as sfn from "@aws-cdk/aws-stepfunctions";
import { Template } from "@aws-cdk/assertions";
import { CloudWatchAlarms } from "../../lib/aspects/cloudwatch-alarms";

let stack: cdk.Stack;

describe("Log group retention aspect", () => {
  beforeEach(() => {
    stack = new cdk.Stack();
  });

  test("Alarms for statemachines are created", () => {
    new sfn.StateMachine(stack, "state-machine", {
      definition: new sfn.Pass(stack, "pass"),
    });
    cdk.Aspects.of(stack).add(new CloudWatchAlarms());

    const assert = Template.fromStack(stack);
    assert.hasResourceProperties("AWS::CloudWatch::Alarm", {
      ComparisonOperator: "GreaterThanOrEqualToThreshold",
      EvaluationPeriods: 1,
      MetricName: "ExecutionsFailed",
      Namespace: "AWS/States",
      Period: 300,
      Statistic: "Sum",
      Threshold: 1,
    });
  });
});
