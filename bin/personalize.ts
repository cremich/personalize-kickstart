#!/usr/bin/env node
import "source-map-support/register";
import { App } from "aws-cdk-lib";
import { aws_ec2 as ec2 } from "aws-cdk-lib";
import { PersonalizeStack } from "../lib/personalize-stack";
import { MovielensStack } from "../lib/movielens/stack";

const app = new App();

new PersonalizeStack(app, "personalize-prod", {});
new PersonalizeStack(app, "personalize-dev", {});

new MovielensStack(app, "personalize-movielens-dataanalysis-dev", {
  dataAnalysis: {
    notebookVolumeSizeInGb: 64,
    sagemakerInstanceType: new ec2.InstanceType("ml.t3.medium"),
  },
  dataPreprocessing: {
    retainData: false,
  },
});

new MovielensStack(app, "personalize-movielens-dev", {
  dataPreprocessing: {
    retainData: false,
  },
});

new MovielensStack(app, "personalize-movielens-prod", {
  dataPreprocessing: {
    retainData: true,
  },
});
