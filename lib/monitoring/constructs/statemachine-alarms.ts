import { Construct } from "constructs";
import { Duration } from "aws-cdk-lib";
import { aws_stepfunctions as sfn } from "aws-cdk-lib";
import { aws_cloudwatch as cw } from "aws-cdk-lib";

export interface StateMachineAlarmsProps {
  stateMachine: sfn.StateMachine;
}

export class StateMachineAlarms extends Construct {
  constructor(scope: Construct, id: string, props: StateMachineAlarmsProps) {
    super(scope, id);
    props.stateMachine
      .metricFailed()
      .with({
        statistic: "sum",
        period: Duration.minutes(5),
      })
      .createAlarm(props.stateMachine, "failed-executions", {
        threshold: 1,
        evaluationPeriods: 1,
        comparisonOperator: cw.ComparisonOperator.GREATER_THAN_OR_EQUAL_TO_THRESHOLD,
        alarmDescription: `Failed executions of state-machine ${props.stateMachine.stateMachineName}`,
      });
  }
}
