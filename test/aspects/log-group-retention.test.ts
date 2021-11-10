import * as cdk from "@aws-cdk/core";
import * as logs from "@aws-cdk/aws-logs";
import { Template } from "@aws-cdk/assertions";
import { LogGroupRetention } from "../../lib/aspects/log-group-retention";

let stack: cdk.Stack;

describe("Log group retention aspect", () => {
  beforeEach(() => {
    stack = new cdk.Stack();
  });

  test("Retention for log groups are set", () => {
    new logs.LogGroup(stack, "log-group");
    cdk.Aspects.of(stack).add(new LogGroupRetention());

    const assert = Template.fromStack(stack);
    assert.hasResourceProperties("AWS::Logs::LogGroup", {
      RetentionInDays: 5,
    });
  });
});
