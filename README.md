# Coveo auto-reply integration with Slack
This project describes how to integrate Coveo auto-answering capabilities in Slack.


## Components
* __Coveo platform__ - hosts the index and organization for your data, and provides search capabilities.
* __Coveo Impersonation__ - key for the authentication against the platform (currently only fetching public documents based on the query pipeline).
* __Slack Admin__ access to add a new Application.
* __AWS Lambda__ - runs your NodeJs code that will interact with the Coveo platform without provisioning or managing infrastructure.
* __AWS Parameter Store__- stores the search token cache (the app token needs consist of: The Coveo API Key,  Slack App token, Slack Bot token and the Slack Signing Secret).
* __AWS API Gateway__, - points to the above AWS Lambda function.

## How it works

In Slack, in a channel where the bot will have been previously added, users asking a question will receive an answer based on the top Coveo Search answers. The trigger in this project is a question mark, but that can be easily changed.

Slack will send the new message event to the AWS Lambda code, which will only trigger and respond if there is a question mark in the text field, and if so, will send a query to Coveo based on the keywords in the said text. The top 3 results will then be returned to Slack.


## Instructions

### Create your .env file 
For the publically available variables needed for our application to work, we will add a `.env` file at the root of our repo. You can copy the env.example content and fill the right side of the variables with the AWS region (default in North America would be `us-east-1` but make sure to confirm this in your AWS console) and the Coveo-related properties. The Coveo pipeline is optional and will use `default` if empty.



### Create an Impersonation key in the Coveo platform

Before creating our API key, let's set up our AWS parameter store to store it. 
   
#### Create an AWS Parameter Store Folder for your App 
1. Navigate to the Parameter Store landing page, and click on `Create parameter`.
  ![image](https://user-images.githubusercontent.com/73175206/169589442-634442dc-bcf2-4297-a1bb-6aea7ac0a8a1.png)
2. Create a new name path for your application. For this example, we used the following path `/rd/coveo-autoreply-bot` with the parameter name `COVEO_API_KEY`. Make sure to give a unique path to your app-related tokens so we can give our Lambda restricted access to it later in the configuration. Also, make sure to select the `SecureString` type for the parameter. 
 
 We don't have a value to store yet so we will generate an API Key.
  
  #### Now that we are ready to create our secure parameter, let's create our Coveo API KEY :
  
1. In another tab, navigate to your Coveo platform and [create a Key](https://docs.coveo.com/en/1718/manage-an-organization/manage-api-keys#add-an-api-key). Make sure you add `Search - Impersonation`, `Analytics - Data, Push` and `Analytics - Impersonate`. 
[_More on the impersonate Privilege and its danger_](https://docs.coveo.com/en/1707/manage-an-organization/privilege-reference#search-impersonate-domain)
3. When done, click on `Add key` and copy the generated key.
4. Browse back to your parameter store and add the API Key in the `COVEO_API_KEY` parameter value. Submit by clicking on `Create parameter`
   **_Keep that key private!!!_**

![image](https://user-images.githubusercontent.com/73175206/169590874-82349425-21d3-4ed1-9b98-aee689e983dc.png)


### Create a Slack app

As an admin in the Slack workspace, navigate to https://api.slack.com/ and click on  _Create an App_. 2 choices will be given to you: `From scratch` or `From an app manifest`. Select `From an app manifest`.

#### From an app manifest
1. Select the workspace where the app should be created and click `Next`. 
2. Copy the `manifestExample.yml` file into the manifest configuration. If you want a custom name, make sure to change the `display_information -> name:` and the `bot_user -> display_name:`. Click on `Next`.
3. Review the OAuth scopes, features and settings and click on `Create`.
4. You App is now created. The Events request URL under the `Event Subscription` will not work at this time but it's normal, we will need to set up AWS to generate a proper request URL in the next section.

#### Store the confidential tokens in your parameter store, with the `SecureString` type 
1. Navigate to `Basic Information`.
2. Navigate to `App-Level Tokens`.
3. Click on `Generate Token and Scopes`. 
4. Add both `connections:write` and `authorization:read` scopes to your token. Give it a name and Generate it. Copy the token starting with `xapp` and store it in your Parameter Store with the same prefix path as before. For this example, we used `SLACK_APP_TOKEN` as the parameter name.
5. Navigate to `App Credentials`.
6. Show the `Signing Secret` and store it in your Parameter Store with the same prefix path as before. For this example, we used `SLACK_SIGNING_SECRET` as the parameter. name.
7.  Navigate to `OAuth & Permissions`.
8.  Copy the `Bot User OAuth Token` under the `OAuth Tokens for Your Workspace` section and store it in your Parameter Store. For this example, we used `SLACK_BOT_TOKEN` as the attribute name.


### Create a Lambda Application automatically with Serverless
The `serverless.yaml` file, in conjunction with the `handler.js` and `lambdaApp.js` are the ones that will be used by your AWS Lambda when deployed. For development ease, we will let serverless create an App using a CloudFormation template. The template will include :
* An s3 bucket to store and versioned your deployed App
* A Lambda function 
* A Gateway Rest API to access the Lambda 
* A Log Group to monitor your App

_If you want to change the service name of your app(defaulted at autorepply-coveo-slack-bot), you can do it on the first line of the yaml file._

![image](https://user-images.githubusercontent.com/73175206/169595350-25b0fd07-0a97-4f5e-8d62-117f3fb695cc.png)

To deploy your app (which will use the `lambdaApp.js` file) simply run `npm run dev`

Warning: At first, your lambda will not have access to your parameter store so you will need to give it permission (In progress)

#### Add a policy to the lambda function to gain access to your parameters
1. Open the AWS Lambda console and click on your function's name.
2. Click on the `Configuration` tab and then click `Permissions`.
3. Click on the Execution role name.

![image](https://user-images.githubusercontent.com/73175206/170342304-3cd0f4dc-b8c4-4c57-b0f9-89371d902d56.png)

4. In the permission policies section, click on `Add permissions` and then click `Create inline policy`.

![image](https://user-images.githubusercontent.com/73175206/170343460-21fd0a8b-7f13-40a1-abb2-93fbcd536189.png)

5. With the Visual Editor, select `System Manager` as the Service,  `GetParameter` as the Action and the path to your application parameter folder followed by `/*` for the resources. The review policy should look like this : 

![image](https://user-images.githubusercontent.com/73175206/170346497-7d74c42f-9687-4c3c-9cd7-029977c80d4d.png)

4. Click on `Create policy` when completed

#### Copy your Gateway API endpoint in the Slack App 
Now that your app is deployed to AWS, you will need to update the Slack App URLs.
1. Get your API Gateway endpoint URL. To do so, you can find it:
- In your terminal after having deployed your serverless app or in the AWS console. When found, copy it.

![image](https://user-images.githubusercontent.com/73175206/170576029-977484d5-4bfb-4ec6-8706-92255e97db8f.png)

- In the AWS console by browsing to the Lambda landing page and clicking on the `Functions` side menu and then click on your function name. You should see the API Gateway in the trigger section of your function overview. By clicking on it, you should see the trigger appear with an API endpoint listed. Copy it.

![image](https://user-images.githubusercontent.com/73175206/170577519-5adbc20b-48da-433b-975c-3e5194041f20.png)

2. Go back to your Slack App setup and navigate to the Events request URL under the `Event Subscription`. Paste the gateway URL. it should mark as `Verified`.

![image](https://user-images.githubusercontent.com/73175206/170577720-23969988-b32f-4aa1-b2f0-da949de172d6.png)

### Install your slack app to your Workspace
1. Go to your Slack App setup and navigate to the `Basic Information`.
2. Click on `Install to Workplace`. 
3. Confirm the information and the destination Workplace and click on `Allow`.

![image](https://user-images.githubusercontent.com/73175206/170743450-ee740107-9d4d-436d-8364-e03df5093e6a.png)

### Local debugging
1. To activate local debugging, you need to enable the Socket Mode in the application menu (found at https://api.slack.com/apps/$YOUR_APP_ID), in the `Socket Mode` menu under `Settings`.  This will redirect your app events over a WebSockets connection.
![image](https://user-images.githubusercontent.com/73175206/170737886-744fe41c-c4b4-46a2-b3ed-267ef781e81b.png)

3. In your terminal, run `npm run dev`, which will run the `app.js` code, which is setup to work with the SocketMode and hot-reload your code.
4. You can now change your bot behaviour with a live result. 
5. When you are satisfied with your `app.js` code, update your `lambdaApp.js` code so it's working the same way. Make sure to follow the next section to make sure it will be deployed properly.


### Updating the lambdaApp code from the app.js code
When you are satisfied with your `app.js` changes, you will need to move those changes to the `lambdaApp.js` so the lambda uses it. There is some difference between the `app.js` file and the `lambdaApp.js` that requires to stay untouched :
1. The `lambdaApp.js` code header **needs** to import the AwsLambdaReceiver module to be triggered.

![image](https://user-images.githubusercontent.com/73175206/169601370-bbc6862c-a9e5-4ca8-8ec5-6919a7da065d.png)

3. The `lambdaApp.js` code footer **needs** to have the AwsLambdaReceiver in the app creation statement. Also, since it does not use the socket mode, it only needs the SLACK_BOT_TOKEN versus the `app.js` which needs the `SLACK_SIGNING_SECRET`, the `SLACK_APP_TOKEN` and the socketMode set to true. Lastly, the `module.exports.handler`is required for the lambda to work, so make sure to keep it.

![image](https://user-images.githubusercontent.com/73175206/169601380-058ff28b-86a2-439e-b6a9-c88304cbfd18.png)

## References

- [Coveo Search API](https://developers.coveo.com/display/CloudPlatform/Search+API)
- [Deploying to AWS Lambda - Slack doc](https://slack.dev/bolt-js/deployments/aws-lambda)
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

