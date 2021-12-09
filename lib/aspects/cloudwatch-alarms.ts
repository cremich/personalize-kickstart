import { IConstruct } from "constructs";
import { IAspect } from "aws-cdk-lib";
import { aws_stepfunctions as sfn } from "aws-cdk-lib";
import { StateMachineAlarms } from "../monitoring/constructs/statemachine-alarms";

export class CloudWatchAlarms implements IAspect {
  public visit(node: IConstruct): void {
    const constructId = node.node.id;
    if (node instanceof sfn.StateMachine) {
      new StateMachineAlarms(node, `alarms-${constructId}`, {
        stateMachine: node,
      });
    }
  }
}
