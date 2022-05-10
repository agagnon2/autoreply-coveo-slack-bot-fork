const AWS = require('aws-sdk');
const { App } = require('@slack/bolt');
require('dotenv').config('.env');

// AWS constant
const params = {
    TableName: process.env.TABLE_NAME,
    Key: { user: process.env.PARTITION_KEY_VALUE },
};

(async () => {
    // Getting the AWS table containing our app info
    const ddbDocClient = new AWS.DynamoDB.DocumentClient();
    AWS.config.update({ region: process.env.COVEO_AWS_REGION });

    const data = await ddbDocClient.get(params).promise();

    // Initialize the app with the proper tokens
    const app = new App({
        token: data.Item.SLACK_BOT_TOKEN,
        signingSecret: data.Item.SLACK_SIGNING_SECRET,
        socketMode: true,
        appToken: data.Item.SLACK_APP_TOKEN,
    });

    await setupListenner(app);

    await app.start(process.env.PORT || 3000);
    console.log("⚡️ Bolt app is running!");
})().catch((e) => {
    console.log(e);
});

const setupHeadless = () => {

}

const setupListenner = async (app) => {
    // Listens to incoming messages that contain "hello"
    app.message('?', async ({ message, say }) => {
        // say() sends a message to the channel where the event was triggered
        await say(`Hey there <@${message.user}>! You seem to be asking a question. Let me answer it the best I can! \nThe top 3 answer for your question *${message.text}*: \n
            1- Sometimes I’ll start a sentence and I don’t even know where it’s going. I just hope I find it along the way.\n
            2- To the guy who invented zero, thanks for nothing.\n
            3- What kind of concert only costs 45 cents? A 50 Cent concert featuring Nickelback.`);
    });

    // Start your app
};