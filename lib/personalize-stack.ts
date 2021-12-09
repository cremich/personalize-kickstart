import { Construct } from "constructs";
import { Stack, StackProps, Tags, Aspects } from "aws-cdk-lib";
import { LogGroupRetention } from "./aspects/log-group-retention";
import { CloudWatchAlarms } from "./aspects/cloudwatch-alarms";

// interface PersonalizeStackProps extends StackProps {}
export class PersonalizeStack extends Stack {
  constructor(scope: Construct, id: string, props: StackProps) {
    super(scope, id, props);

    Tags.of(this).add("application", "personalize");
    Aspects.of(this).add(new LogGroupRetention());
    Aspects.of(this).add(new CloudWatchAlarms());
  }
}
