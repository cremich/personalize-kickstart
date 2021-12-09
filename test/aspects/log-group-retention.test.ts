import { Stack, Aspects, assertions } from "aws-cdk-lib";
import { aws_logs as logs } from "aws-cdk-lib";
import { LogGroupRetention } from "../../lib/aspects/log-group-retention";

let stack: Stack;

describe("Log group retention aspect", () => {
  beforeEach(() => {
    stack = new Stack();
  });

  test("Retention for log groups are set", () => {
    new logs.LogGroup(stack, "log-group");
    Aspects.of(stack).add(new LogGroupRetention());

    const assert = assertions.Template.fromStack(stack);
    assert.hasResourceProperties("AWS::Logs::LogGroup", {
      RetentionInDays: 5,
    });
  });
});
