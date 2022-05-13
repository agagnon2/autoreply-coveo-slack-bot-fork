const AWS = require('aws-sdk');
const { App, AwsLambdaReceiver } = require('@slack/bolt');
const request = require('request-promise');
require("dotenv").config()

console.log("before all")

// AWS constant
const params = {
    TableName: 'awsSlackCache',
    Key: { user: 'Auto reply coveo bot' },
};

// Initialize your custom receiver
const awsLambdaReceiver = new AwsLambdaReceiver({
    signingSecret: process.env.SLACK_SIGNING_SECRET,
});


// Slack message configuration 
const slackConfig = {
    TITLE_MAX_LENGTH: 100,
    EXCERP_MAX_LENGTH: 180
};

const setupListenner = async (app) => {
    // Listens to incoming messages that contain "?"
    app.message('?', async ({ message, say }) => {
        const results = formatCoveoResults(await getCoveoSearchResults(message, message.text))

        if (results && results != "") {
            await say({
                text: `Hi, I'm a bot :robot_face:. Here are the best results I found on the Coveo platform :\n\n${results.join('\n')}`,
                thread_ts: message.ts
            })
        };
    });
};

const formatCoveoResults = (searchResultResponse) => {
    const results = JSON.parse(searchResultResponse);
    return results.results.map((result) => {
        return `• *<${result.uri}|${truncate(result.title, slackConfig.TITLE_MAX_LENGTH)}>* :
            \n_${truncate(result.excerpt || "", slackConfig.EXCERP_MAX_LENGTH)}_`
    }) || null;
}

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
        "viewAllContent": true,
        "numberOfResults": numberOfResults,
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

(async () => {
    // Initialize the app with the proper tokens
    const app = new App({
        token: process.env.SLACK_BOT_TOKEN,
        receiver: awsLambdaReceiver,
    })

    // Wait for a question mark 
    await setupListenner(app);

    await app.start(process.env.PORT || 3000);
    console.log("⚡️ Bolt app is running!");
})().catch((e) => {
    console.log(e);
});

// Handle the Lambda function event
module.exports.handler = async (event, context, callback) => {
    const handler = await awsLambdaReceiver.start();
    return handler(event, context, callback);
}