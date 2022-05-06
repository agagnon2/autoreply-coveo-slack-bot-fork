# Coveo auto-reply integration with Slack
This project describes how to integrate Coveo auto-answering capabilities in Slack.


## Components
* __Coveo platform__ - hosts the index and organization for your data, provides the search capabilities.
* __Coveo Impersonation__ - key for the authentication against the platform.
* __Slack Admin__ access to add a new Application.
* __AWS Lambda__ - runs your NodeJs code that will interact with the coveo platform without provisioning or managing infrastructure.
* __AWS DynamoDB__- stores the search token cache (the cache consists of: visitorId, searchToken and expiration date).
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

   Insert it only in the `.env` file (`COVEO_API_KEY`). Also put the `COVEO_ORG` in the `.env` file.

### Create DynamoDB table

 _More to come_
### Create a Slack app

1. As an admin in the Slack workspace, use _Create an App_
2. Create the app
3. Navigate to App's Home
4. In the `Show Tabs` section, enable `Home Tab`.
5. Disable the `Messages Tab`.
6. Navigate to `Basic Information`.
7. Navigate to `App Credentials`.
8. Show the `Signing Secret` and store it in the `.env` file as `SLACK_SIGNING_SECRET`.
9. Navigate to `OAuth & Permissions`.
10. Show the `Bot User OAuth Token` and store it in the `.env` file as `SLACK_BOT_TOKEN`.
11. Enable the following permissions at the `Scopes` section:
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

