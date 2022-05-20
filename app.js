const AWS = require('aws-sdk');
const { App } = require('@slack/bolt');
require('dotenv').config('.env');
const request = require('request-promise');

// AWS constant
const smValuePrefix = '/rd/coveo-autoreply-bot/'
const ssmClient = new AWS.SSM({
    region: process.env.COVEO_AWS_REGION
});

// Slack message configuration 
const slackConfig = {
    TITLE_MAX_LENGTH: 100,
    EXCERP_MAX_LENGTH: 180
};

const setupListenner = async (app) => {
    // Listens to incoming messages that contain '?'
    app.message('?', async ({ message, say }) => {
        const COVEO_API_KEY = await getSsmParam('COVEO_API_KEY')
        const results = formatCoveoResults(await getCoveoSearchResults(message, message.text, COVEO_API_KEY))

        if (results && results != '') {
            await say({
                text: `Hi, I'm a bot :robot_face:. Here are the best results I found on the Coveo platform :\n\n${results.join('\n')}`,
                thread_ts: message.ts
            })
        } else {
            await ack({
                'response_action': 'errors',
                errors: {
                    'search_sentence': 'Sorry, this isn’t a valid question'
                }
            });
        }
    });
};

const formatCoveoResults = (searchResultResponse) => {
    const results = JSON.parse(searchResultResponse);
    return results.results.map((result) => {
        return `• *<${result.uri}|${truncate(result.title, slackConfig.TITLE_MAX_LENGTH)}>* :
            \n_${truncate(result.excerpt || '', slackConfig.EXCERP_MAX_LENGTH)}_`
    }) || null;
}

const truncate = (str, num) => {
    if (str.length <= num) {
        return str
    }
    return str.slice(0, num) + '...'
}

const getCoveoSearchResults = (message, query, COVEO_API_KEY, numberOfResults = 3) => {
    const endPoint = `${process.env.COVEO_ENDPOINT}/rest/search/v2/?organizationId=${process.env.COVEO_ORG}`;
    let searchBody = {
        'q': query,
        'fieldsToInclude': [
            'clickableuri',
            'title',
            'date',
            'excerpt',
        ],
        'fieldsToExclude': [
            'documenttype',
            'size'
        ],
        'debug': false,
        'viewAllContent': true,
        'numberOfResults': numberOfResults,
        'pipeline': process.env.COVEO_PIPELINE || 'default',
        'context': {
            'userName': message.user,
        },
        'facets': []
    };
    return request({
        'method': 'POST',
        'url': endPoint,
        headers: {
            'accept': 'application/json',
            'Authorization': 'Bearer ' + COVEO_API_KEY,
            'Content-Type': 'application/json'
        },
        'body': JSON.stringify(searchBody)
    },
        (err, httpResponse, body) => {
            if (err) {
                console.log('ERROR: ', err);
                throw new Error(`getCoveoResults failed: '${err}'`);
            }
        })
};

const getSsmParam = async (name) => {
    return (await ssmClient.getParameter({
        Name: smValuePrefix + name,
        WithDecryption: true,
    }).promise()).Parameter.Value
}

(async () => {
    // Get the tokens from the param store
    const SLACK_BOT_TOKEN = await getSsmParam('SLACK_BOT_TOKEN')
    const SLACK_SIGNING_SECRET = await getSsmParam('SLACK_SIGNING_SECRET')
    const SLACK_APP_TOKEN = await getSsmParam('SLACK_APP_TOKEN')

    // Initialize the app with the proper tokens
    const app = new App({
        token: SLACK_BOT_TOKEN,
        signingSecret: SLACK_SIGNING_SECRET,
        socketMode: true,
        appToken: SLACK_APP_TOKEN,
    })

    // Wait for a question mark 
    await setupListenner(app);

    await app.start(process.env.PORT || 3000);
    console.log('⚡️ Bolt app is running!');
})().catch((e) => {
    console.log(e);
});
