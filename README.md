# Coveo auto-reply integration with Slack (currently WIP)
This project describes how to integrate Coveo auto-answering capabilities in Slack.


## Components
* __Coveo platform__ - hosts the index and organization for your data, provides search capabilities.
* __Coveo Impersonation__ - key for the authentication against the platform (currently only fetching public documents based on the query pipeline).
* __Slack Admin__ access to add a new Application.
* __AWS Lambda__ - runs your NodeJs code that will interact with the Coveo platform without provisioning or managing infrastructure.
* __AWS Parameter Store__- stores the search token cache (the app token needs consist of: The Coveo APi Key,  Slack App token, Slack Bot token and the Slack Signing Secret).
* __AWS API Gateway__, - points to the above AWS Lambda function.

## How it works

In Slack, in a channel where the bot will have been previously added, users asking a question will receive an answer based on the top Coveo Search answers. The trigger in this project is a question mark, but that can be changed easily changed.

Slack will send the new message event to the AWS Lambda code, which will only trigger and respond if there is a question mark in the text field, and if so, will send a query to Coveo based on the keywords in the said text. The top 3 results are returned to Slack.


## Instructions

### Create Impersonation key in Coveo platform

1. [Read more on Impersonation](https://docs.coveo.com/en/1707/manage-an-organization/privilege-reference#search-impersonate-domain)
2. [Create a Key](https://docs.coveo.com/en/82). Make sure you add `Search - Impersonation`, `Analytics - Data, Push` and `Analytics - Impersonate`.

   **_Keep that key private!!!_**

   Insert it only in the AWS Parameter Store  

#### Create the Parameter Store Folder for your App 
  * Navigate to the Parameter Store landing page, and click on `Create parameter`
  ![image](https://user-images.githubusercontent.com/73175206/169589442-634442dc-bcf2-4297-a1bb-6aea7ac0a8a1.png)
  * Create a new name path for your application.For this example, we used the following path `/rd/coveo-autoreply-bot` with the parameter name `COVEO_API_KEY`. Make sure to give a unique path to your app related tokens as we will need to give restricted acces to those token later on in the configuration. Also make sure to select the `SecureString` type for the parameter. 

![image](https://user-images.githubusercontent.com/73175206/169590874-82349425-21d3-4ed1-9b98-aee689e983dc.png)
  * Submit by clicking on `Create parameter`

### Create a Slack app

1. As an admin in the Slack workspace, use _Create an App_
2. Create the app
3. Navigate to App's Home
4. In the `Show Tabs` section, enable `Home Tab`.
5. Disable the `Messages Tab`.
6. Navigate to `Basic Information`.
7. Navigate to `App Credentials`.
8. Show the `Signing Secret` and store it in your Parameter Store with the same prefix path as before. For this example, we used `SLACK_SIGNING_SECRET` as the parameter name.
9.  Navigate to `App-Level Tokens`.
10. Click on `Generate Token and Scopes` 
11. Add both `connections:write` and `authorization:read` scopes to your token. Give it a name and Generate it
12. When done, it should display the token. Copy it and store it in your Parameter Store. For this example, we used `SLACK_APP_TOKEN` as the parameter name.
13. Navigate to `OAuth & Permissions`.
14. Copy the `Bot User OAuth Token` under the `OAuth Tokens for Your Workspace` section and store it in your Parameter Store. For this example, we used `SLACK_BOT_TOKEN` as the attribute name.
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

