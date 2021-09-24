#!/usr/bin/env node
import "source-map-support/register";
import * as cdk from "@aws-cdk/core";
import { PersonalizeStack } from "../lib/personalize-stack";

const app = new cdk.App();
const sandbox = app.node.tryGetContext("sandbox") || "sandbox";

//SANDBOX stage
new PersonalizeStack(app, `personalize-${sandbox}`, {
  provisionSagemakerNotebook: true,
  notebookInstanceName: `personalize-${sandbox}`,
  notebookVolumeSizeInGb: 64,
});

//DEV stage
new PersonalizeStack(app, "personalize-dev", {
  provisionSagemakerNotebook: false,
});
