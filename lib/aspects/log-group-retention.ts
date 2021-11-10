import * as cdk from "@aws-cdk/core";
import * as logs from "@aws-cdk/aws-logs";

export class LogGroupRetention implements cdk.IAspect {
  public visit(node: cdk.IConstruct): void {
    if (node instanceof logs.CfnLogGroup) {
      node.retentionInDays = logs.RetentionDays.FIVE_DAYS;
    }
  }
}
