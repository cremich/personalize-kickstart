export default {
  Comment: "An athena based data preparation workflow to prepare items, interactions and users data",
  StartAt: "Process raw data for items, interactions and users",
  States: {
    "Process raw data for items, interactions and users": {
      Type: "Parallel",
      Branches: [
        {
          StartAt: "Prepare items?",
          States: {
            "Prepare items?": {
              Type: "Choice",
              Choices: [
                {
                  Variable: "$.itemsPreparationQuery",
                  IsPresent: true,
                  Next: "Bypass items crawler?",
                },
              ],
              Default: "Items data prepared or skipped",
            },
            "Bypass items crawler?": {
              Type: "Choice",
              Choices: [
                {
                  And: [
                    {
                      Variable: "$.bypassCrawler",
                      IsPresent: true,
                    },
                    {
                      Variable: "$.bypassCrawler",
                      BooleanEquals: true,
                    },
                  ],
                  Next: "Get query to prepare items",
                },
              ],
              Default: "Crawl items",
            },
            "Crawl items": {
              Type: "Task",
              Parameters: {
                "Name.$": "$.itemsCrawlerName",
              },
              Resource: "arn:aws:states:::aws-sdk:glue:startCrawler",
              Next: "Wait for items crawler to finish",
            },
            "Wait for items crawler to finish": {
              Type: "Wait",
              Seconds: 10,
              Next: "Get items crawler state",
            },
            "Get items crawler state": {
              Type: "Task",
              Parameters: {
                "Name.$": "$$.Execution.Input.itemsCrawlerName",
              },
              Resource: "arn:aws:states:::aws-sdk:glue:getCrawler",
              Next: "Is items crawler finished?",
            },
            "Is items crawler finished?": {
              Type: "Choice",
              Choices: [
                {
                  Variable: "$.Crawler.State",
                  StringEquals: "READY",
                  Next: "Get query to prepare items",
                },
              ],
              Default: "Wait for items crawler to finish",
            },
            "Get query to prepare items": {
              Type: "Task",
              Next: "Prepare items",
              Parameters: {
                "NamedQueryId.$": "$$.Execution.Input.itemsPreparationQuery",
              },
              Resource: "arn:aws:states:::aws-sdk:athena:getNamedQuery",
            },
            "Prepare items": {
              Type: "Task",
              Resource: "arn:aws:states:::athena:startQueryExecution",
              Parameters: {
                "QueryString.$": "$.NamedQuery.QueryString",
                QueryExecutionContext: {
                  "Database.$": "$.NamedQuery.Database",
                },
                "WorkGroup.$": "$.NamedQuery.WorkGroup",
              },
              Next: "Wait for items query to finish",
            },
            "Wait for items query to finish": {
              Type: "Wait",
              Seconds: 15,
              Next: "Get items query execution status",
            },
            "Get items query execution status": {
              Type: "Task",
              Resource: "arn:aws:states:::athena:getQueryExecution",
              Parameters: {
                "QueryExecutionId.$": "$.QueryExecutionId",
              },
              Next: "Is items query finished?",
            },
            "Is items query finished?": {
              Type: "Choice",
              Choices: [
                {
                  Variable: "$.QueryExecution.Status.State",
                  StringEquals: "SUCCEEDED",
                  Next: "Items data prepared or skipped",
                },
                {
                  Or: [
                    {
                      Variable: "$.QueryExecution.Status.State",
                      StringEquals: "FAILED",
                    },
                    {
                      Variable: "$.QueryExecution.Status.State",
                      StringEquals: "CANCELLED",
                    },
                  ],
                  Next: "Preparation of items data failed",
                },
              ],
              Default: "Wait for items query to finish",
            },
            "Items data prepared or skipped": {
              Type: "Succeed",
            },
            "Preparation of items data failed": {
              Type: "Fail",
            },
          },
        },
        {
          StartAt: "Prepare interactions?",
          States: {
            "Prepare interactions?": {
              Type: "Choice",
              Choices: [
                {
                  Variable: "$.interactionsPreparationQuery",
                  IsPresent: true,
                  Next: "Bypass interactions crawler",
                },
              ],
              Default: "Preparation of interactions data failed",
            },
            "Bypass interactions crawler": {
              Type: "Choice",
              Choices: [
                {
                  And: [
                    {
                      Variable: "$.bypassCrawler",
                      IsPresent: true,
                    },
                    {
                      Variable: "$.bypassCrawler",
                      BooleanEquals: true,
                    },
                  ],
                  Next: "Get query to prepare interactions",
                },
              ],
              Default: "Crawl interactions",
            },
            "Crawl interactions": {
              Type: "Task",
              Parameters: {
                "Name.$": "$.interactionsCrawlerName",
              },
              Resource: "arn:aws:states:::aws-sdk:glue:startCrawler",
              Next: "Wait for interactions crawler to finish",
            },
            "Wait for interactions crawler to finish": {
              Type: "Wait",
              Seconds: 10,
              Next: "Get interactions crawler state",
            },
            "Get interactions crawler state": {
              Type: "Task",
              Parameters: {
                "Name.$": "$$.Execution.Input.interactionsCrawlerName",
              },
              Resource: "arn:aws:states:::aws-sdk:glue:getCrawler",
              Next: "Is interactions crawler finished?",
            },
            "Is interactions crawler finished?": {
              Type: "Choice",
              Choices: [
                {
                  Variable: "$.Crawler.State",
                  StringEquals: "READY",
                  Next: "Get query to prepare interactions",
                },
              ],
              Default: "Wait for interactions crawler to finish",
            },
            "Get query to prepare interactions": {
              Type: "Task",
              Next: "Prepare interactions",
              Parameters: {
                "NamedQueryId.$": "$$.Execution.Input.interactionsPreparationQuery",
              },
              Resource: "arn:aws:states:::aws-sdk:athena:getNamedQuery",
            },
            "Prepare interactions": {
              Type: "Task",
              Resource: "arn:aws:states:::athena:startQueryExecution",
              Parameters: {
                "QueryString.$": "$.NamedQuery.QueryString",
                QueryExecutionContext: {
                  "Database.$": "$.NamedQuery.Database",
                },
                "WorkGroup.$": "$.NamedQuery.WorkGroup",
              },
              Next: "Wait for interactions preparation query to finish",
            },
            "Wait for interactions preparation query to finish": {
              Type: "Wait",
              Seconds: 15,
              Next: "Get interactions query execution status",
            },
            "Get interactions query execution status": {
              Type: "Task",
              Resource: "arn:aws:states:::athena:getQueryExecution",
              Parameters: {
                "QueryExecutionId.$": "$.QueryExecutionId",
              },
              Next: "Is interactions query finished?",
            },
            "Is interactions query finished?": {
              Type: "Choice",
              Choices: [
                {
                  Variable: "$.QueryExecution.Status.State",
                  StringEquals: "SUCCEEDED",
                  Next: "Interactions data prepared or skipped",
                },
                {
                  Or: [
                    {
                      Variable: "$.QueryExecution.Status.State",
                      StringEquals: "FAILED",
                    },
                    {
                      Variable: "$.QueryExecution.Status.State",
                      StringEquals: "CANCELLED",
                    },
                  ],
                  Next: "Preparation of interactions data failed",
                },
              ],
              Default: "Wait for interactions preparation query to finish",
            },
            "Interactions data prepared or skipped": {
              Type: "Succeed",
            },
            "Preparation of interactions data failed": {
              Type: "Fail",
            },
          },
        },
        {
          StartAt: "Prepare users?",
          States: {
            "Prepare users?": {
              Type: "Choice",
              Choices: [
                {
                  Variable: "$.usersPreparationQuery",
                  IsPresent: true,
                  Next: "Bypass users crawler",
                },
              ],
              Default: "Users data prepared",
            },
            "Users data prepared": {
              Type: "Succeed",
            },
            "Bypass users crawler": {
              Type: "Choice",
              Choices: [
                {
                  And: [
                    {
                      Variable: "$.bypassCrawler",
                      IsPresent: true,
                    },
                    {
                      Variable: "$.bypassCrawler",
                      BooleanEquals: true,
                    },
                  ],
                  Next: "Get query to prepare users",
                },
              ],
              Default: "Crawl users",
            },
            "Crawl users": {
              Type: "Task",
              Parameters: {
                "Name.$": "$.usersCrawlerName",
              },
              Resource: "arn:aws:states:::aws-sdk:glue:startCrawler",
              Next: "Wait for users crawler to finish",
            },
            "Wait for users crawler to finish": {
              Type: "Wait",
              Seconds: 10,
              Next: "Get users crawler state",
            },
            "Get users crawler state": {
              Type: "Task",
              Parameters: {
                "Name.$": "$$.Execution.Input.usersCrawlerName",
              },
              Resource: "arn:aws:states:::aws-sdk:glue:getCrawler",
              Next: "Is users crawler finished?",
            },
            "Is users crawler finished?": {
              Type: "Choice",
              Choices: [
                {
                  Variable: "$.Crawler.State",
                  StringEquals: "READY",
                  Next: "Get query to prepare users",
                },
              ],
              Default: "Wait for users crawler to finish",
            },
            "Get query to prepare users": {
              Type: "Task",
              Next: "Prepare users",
              Parameters: {
                "NamedQueryId.$": "$$.Execution.Input.usersPreparationQuery",
              },
              Resource: "arn:aws:states:::aws-sdk:athena:getNamedQuery",
            },
            "Prepare users": {
              Type: "Task",
              Resource: "arn:aws:states:::athena:startQueryExecution",
              Parameters: {
                "QueryString.$": "$.NamedQuery.QueryString",
                QueryExecutionContext: {
                  "Database.$": "$.NamedQuery.Database",
                },
                "WorkGroup.$": "$.NamedQuery.WorkGroup",
              },
              Next: "Wait for users preparation query to finish",
            },
            "Wait for users preparation query to finish": {
              Type: "Wait",
              Seconds: 15,
              Next: "Get users query execution status",
            },
            "Get users query execution status": {
              Type: "Task",
              Resource: "arn:aws:states:::athena:getQueryExecution",
              Parameters: {
                "QueryExecutionId.$": "$.QueryExecutionId",
              },
              Next: "Is users preparation query finished?",
            },
            "Is users preparation query finished?": {
              Type: "Choice",
              Choices: [
                {
                  Variable: "$.QueryExecution.Status.State",
                  StringEquals: "SUCCEEDED",
                  Next: "Users data prepared",
                },
                {
                  Or: [
                    {
                      Variable: "$.QueryExecution.Status.State",
                      StringEquals: "FAILED",
                    },
                    {
                      Variable: "$.QueryExecution.Status.State",
                      StringEquals: "CANCELLED",
                    },
                  ],
                  Next: "Preparation of users data failed",
                },
              ],
              Default: "Wait for users preparation query to finish",
            },
            "Preparation of users data failed": {
              Type: "Fail",
            },
          },
        },
      ],
      End: true,
    },
  },
};
