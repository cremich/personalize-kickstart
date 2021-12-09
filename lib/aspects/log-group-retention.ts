import { IConstruct } from "constructs";
import { IAspect } from "aws-cdk-lib";
import { aws_logs as logs } from "aws-cdk-lib";

export class LogGroupRetention implements IAspect {
  public visit(node: IConstruct): void {
    if (node instanceof logs.CfnLogGroup) {
      node.retentionInDays = logs.RetentionDays.FIVE_DAYS;
    }
  }
}
