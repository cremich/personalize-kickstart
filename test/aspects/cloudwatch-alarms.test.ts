import { Stack, Aspects, assertions } from "aws-cdk-lib";
import { aws_stepfunctions as sfn } from "aws-cdk-lib";
import { CloudWatchAlarms } from "../../lib/aspects/cloudwatch-alarms";

let stack: Stack;

describe("Log group retention aspect", () => {
  beforeEach(() => {
    stack = new Stack();
  });

  test("Alarms for statemachines are created", () => {
    new sfn.StateMachine(stack, "state-machine", {
      definition: new sfn.Pass(stack, "pass"),
    });
    Aspects.of(stack).add(new CloudWatchAlarms());

    const assert = assertions.Template.fromStack(stack);
    assert.hasResourceProperties("AWS::CloudWatch::Alarm", {
      Namespace: "AWS/States",
    });
  });
});
