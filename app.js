const AWS = require('aws-sdk');
const { App } = require('@slack/bolt');
require('dotenv').config('.env');
const request = require('request-promise');

// AWS constant
const params = {
    TableName: process.env.TABLE_NAME,
    Key: { user: process.env.PARTITION_KEY_VALUE },
};

// Slack message configuration 
const slackConfig = {
    TITLE_MAX_LENGTH: 100,
    EXCERP_MAX_LENGTH: 180
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

const setupListenner = async (app) => {
    // Listens to incoming messages that contain "?"
    app.message('?', async ({ message, say }) => {
        const results = JSON.parse(await getCoveoSearchResults(message, message.text)).results.map((result) => {
            return `• *<${result.uri}|${truncate(result.title, slackConfig.TITLE_MAX_LENGTH)}>* :
            \n_${truncate(result.excerpt || "", slackConfig.EXCERP_MAX_LENGTH)}_`
        });

        await say({
            text: `Hi, I'm a bot :robot_face:. Here are the best results I found on the Coveo platform :\n\n${results.join('\n')}`,
            thread_ts: message.ts
        })
    });//
};
const truncate = (str, num) => {
    if (str.length <= num) {
        return str
    }
    return str.slice(0, num) + '...'
}

const getCoveoSearchResults = (message, query, numberOfResults = 3) => {
    const endPoint = `${process.env.COVEO_ENDPOINT}/rest/search/v2/?organizationId=${process.env.COVEO_ORG}`;
    let searchBody = {
        "q": query,
        "fieldsToInclude": [
            "clickableuri",
            "title",
            "date",
            "excerpt",
        ],
        "fieldsToExclude": [
            "documenttype",
            "size"
        ],
        "debug": false,
        "numberOfResults": numberOfResults,
        "pipeline": process.env.COVEO_PIPELINE,
        "context": {
            "userName": message.user,
        },
        "facets": []
    };
    return request({
        "method": "POST",
        "url": endPoint,
        headers: {
            'accept': 'application/json',
            'Authorization': 'Bearer ' + process.env.COVEO_API_KEY,
            'Content-Type': 'application/json'
        },
        "body": JSON.stringify(searchBody)
    },
        (err, httpResponse, body) => {
            if (err) {
                console.log('ERROR: ', err);
                throw new Error(`getCoveoResults failed: "${err}"`);
            }
            console.log('getCoveoResults response code: ', httpResponse.statusCode);
        })
};