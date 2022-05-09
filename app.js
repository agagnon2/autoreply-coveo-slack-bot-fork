const AWS = require('aws-sdk')
const { App } = require('@slack/bolt');
require('dotenv').config('.env');

//AWS constant
var params = {
    TableName: process.env.TABLE_NAME,
    Key: { 'user': process.env.PARTITION_KEY_VALUE }
};

(async () => {
    // Getting the AWS table containing our app info
    const ddbDocClient = new AWS.DynamoDB.DocumentClient();
    AWS.config.update({ region: process.env.COVEO_AWS_REGION });

    const data = await ddbDocClient.get(params).promise();

    // Initialize the app with the proper tokens
    const app = new App({
        token: data.Item['SLACK_BOT_TOKEN'],
        signingSecret: data.Item['SLACK_SIGNING_SECRET'],
        socketMode: true,
        appToken: data.Item['SLACK_APP_TOKEN']
    });

    // Listens to incoming messages that contain "hello"
    app.message('?', async ({ message, say }) => {
        // say() sends a message to the channel where the event was triggered
        await say(`Hey there <@${message.user}>! You seem to be asking a question. Let me answer it the best I can! \nThe top 3 answer for your question *${message.text}*: \n
            1- Seriously ? Google that yio\n
            2- Really ? \n
            3- Hell nahhhh`);
    });

    // Start your app
    await app.start(process.env.PORT || 3000);
    console.log('⚡️ Bolt app is running!');

})().catch(e => {
    console.log(e)
});