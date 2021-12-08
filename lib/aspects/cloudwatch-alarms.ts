import * as cdk from "@aws-cdk/core";
import * as sfn from "@aws-cdk/aws-stepfunctions";
import { StateMachineAlarms } from "../monitoring/constructs/statemachine-alarms";

export class CloudWatchAlarms implements cdk.IAspect {
  public visit(node: cdk.IConstruct): void {
    const constructId = node.node.id;
    if (node instanceof sfn.StateMachine) {
      new StateMachineAlarms(node, `alarms-${constructId}`, {
        stateMachine: node,
      });
    }
  }
}
