# 6. Use nested stack to organize the application

Date: 2022-01-06

## Status

Accepted

## Context

Stacks are the unit of deployment: everything in a stack is deployed together. So when building your application's higher-level logical units from multiple AWS resources, represent each logical unit as a Construct, not as a Stack. Use stacks only to describe how your constructs should be composed and connected for your various deployment scenarios.

If one of your logical units is a Web site, for example, the constructs that make it up (Amazon S3 bucket, API Gateway, Lambda functions, Amazon RDS tables, etc.) should be composed into a single high-level construct, and then that construct should be instantiated in one or more stacks for deployment.

By using constructs for building and stacks for deploying, you improve reuse potential of your infrastructure and give yourself more flexibility in how it is deployed.

Because AWS CDK stacks are implemented through AWS CloudFormation stacks, they have the same limitations as in AWS CloudFormation.

## Decision

We will organize components around nested stacks to mitigate the risk of hitting the AWS CloudFormation limit of maximum number of resources per stack.

## Consequences

What becomes easier or more difficult to do and any risks introduced by the change that will need to be mitigated.
