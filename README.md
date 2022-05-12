# Coveo auto-reply integration with Slack (currently WIP)
This project describes how to integrate Coveo auto-answering capabilities in Slack.


## Components
* __Coveo platform__ - hosts the index and organization for your data, provides search capabilities.
* __Coveo Impersonation__ - key for the authentication against the platform.
* __Slack Admin__ access to add a new Application.
* __AWS Lambda__ - runs your NodeJs code that will interact with the Coveo platform without provisioning or managing infrastructure.
* __AWS DynamoDB__- stores the search token cache (the cache consists of: Slack app token, slack bot token and slack signing secret).
* __AWS API Gateway__, - points to the above AWS Lambda function.



## How it works

In Slack, in a channel where the bot will have been previously added, users asking a question will receive an answer based on the top Coveo Search answers.
Slack will send the message to the AWS Lambda code, which will confirm it's a question, and if so, will send a query to Coveo based on the keywords in the intent.
The top results are returned to Slack.


## Instructions

### Create Impersonation key in Coveo platform

1. [Read more on Impersonation](https://docs.coveo.com/en/1707/manage-an-organization/privilege-reference#search-impersonate-domain)
2. [Create a Key](https://docs.coveo.com/en/82). Make sure you add `Search - Impersonation`, `Analytics - Data, Push` and `Analytics - Impersonate`.

   **_Keep that key private!!!_**

   Insert it only in the `.env` file (`COVEO_API_KEY`). Also, put the `COVEO_ORG` in the `.env` file.

### Create DynamoDB table
  * Insert the region you are using AWS in the `.env` file (`COVEO_AWS_REGION`).
  * Insert the Table Name you created in the `.env` file (`TABLE_NAME`). 
  * Insert the Partition key value you created in the `.env` file (`PARTITION_KEY_VALUE`). 
 _More to come_
### Create a Slack app

1. As an admin in the Slack workspace, use _Create an App_
2. Create the app
3. Navigate to App's Home
4. In the `Show Tabs` section, enable `Home Tab`.
5. Disable the `Messages Tab`.
6. Navigate to `Basic Information`.
7. Navigate to `App Credentials`.
8. Show the `Signing Secret` and store it in your DynamoDB table. For this example, we used `SLACK_SIGNING_SECRET` as the attribute name.
9.  Navigate to `App-Level Tokens`.
10. Click on `Generate Token and Scopes` 
11. Add both `connections:write` and `authorization:read` scopes to your token. Give it a name and Generate it
12. When done, it should display the token. Copy it and store it in your DynamoDB table. For this example, we used `SLACK_APP_TOKEN` as the attribute name.
13. Navigate to `OAuth & Permissions`.
14. Copy the `Bot User OAuth Token` under the `OAuth Tokens for Your Workspace` section and store them in your DynamoDB table. For this example, we used `SLACK_BOT_TOKEN` as the attribute name.
15. Enable the following permissions in the `Scopes`` section:
- Channels:history
- Commands
- Groups:history
- Im:history
- Mpim:history
- Users:profile.read
- Users:read
- Users:read.email


## References

- [Coveo Search API](https://developers.coveo.com/display/CloudPlatform/Search+API)
- [Slack Integration how-to](https://docs.api.ai/docs/slack-integration)
- [Slack + Webhook Integration Example from API.ai](https://docs.api.ai/docs/slack-webhook-integration-guideline)
### Other Useful documentation links:

- https://github.com/coveo/Coveo-Coveo-Slack-Integration 
- https://slack.dev/bolt-js/concepts#creating-modals
- https://api.slack.com/reference/block-kit/block-elements#external_select
- https://app.slack.com/block-kit-builder
- https://api.slack.com/surfaces/tabs/using
- https://api.slack.com/interactivity/handling#responses
- https://stackoverflow.com/questions/50981370/can-hubot-slack-bot-store-sessions
- https://github.com/slackapi/bolt-js/issues/365
- https://slack.dev/bolt-js/deployments/aws-lambda

## Authors

- Alexandre Gagnon (https://github.com/agagnon2)

