import * as cdk from "@aws-cdk/core";
import * as sfn from "@aws-cdk/aws-stepfunctions";
import * as cw from "@aws-cdk/aws-cloudwatch";

export interface StateMachineAlarmsProps {
  stateMachine: sfn.StateMachine;
}

export class StateMachineAlarms extends cdk.Construct {
  constructor(scope: cdk.Construct, id: string, props: StateMachineAlarmsProps) {
    super(scope, id);
    props.stateMachine
      .metricFailed()
      .with({
        statistic: "sum",
        period: cdk.Duration.minutes(5),
      })
      .createAlarm(props.stateMachine, "failed-executions", {
        threshold: 1,
        evaluationPeriods: 1,
        comparisonOperator: cw.ComparisonOperator.GREATER_THAN_OR_EQUAL_TO_THRESHOLD,
        alarmDescription: `Failed executions of state-machine ${props.stateMachine.stateMachineName}`,
      });
  }
}
