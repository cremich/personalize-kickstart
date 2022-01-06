# 7. Component strategy

Date: 2022-01-06

## Status

Accepted

## Context

The Amazon Personalize Kickstart application is composed around several components. It will serve as a reference implementation to learn the concepts and integration aspects of Amazon Personalize. It can also be used to build a recommendation engine upon best practices and production-ready components based on the AWS CDK.

## Decision

The general component strategy will differntiate between domain-/use-case-specific components and recommendation-engine components. This allows to compose deployable units with a high degree of flexibility. Like for example:

- a personalize-prod stack including all required core domains like inference, training and monitoring
- multiple domain specific dev stacks including data-analysis and data-preprocessing components
- multiple domain specific prod stacks including only data-preprocessing

Components align with the folder structure within the `lib` folder. Domain specific components are all summarized within a single folder named by the domain or use-case (like for example `lib/movielens`).
