'use strict';

/**
 * This sample demonstrates a simple skill built with the Amazon Alexa Skills Kit.
 * The Intent Schema, Custom Slots, and Sample Utterances for this skill, as well as
 * testing instructions are located at http://amzn.to/1LzFrj6
 *
 * For additional samples, visit the Alexa Skills Kit Getting Started guide at
 * http://amzn.to/1LGWsLG
 */

var https = require('https');

// --------------- Helpers that build all of the responses -----------------------

function buildSpeechletResponse(title, output, repromptText, shouldEndSession) {
    return {
        outputSpeech: {
            type: 'PlainText',
            text: output,
        },
        card: {
            type: 'Simple',
            title: `Luftqualität`,
            content: `${output}`,
        },
        reprompt: {
            outputSpeech: {
                type: 'PlainText',
                text: repromptText,
            },
        },
        shouldEndSession,
    };
}

function buildResponse(sessionAttributes, speechletResponse) {
    return {
        version: '1.0',
        sessionAttributes,
        response: speechletResponse,
    };
}


// --------------- Functions that control the skill's behavior -----------------------

function getWelcomeResponse(callback) {
    // If we wanted to initialize the session to have some attributes we could add those here.
    const sessionAttributes = {};
    const cardTitle = 'Welcome';
    const speechOutput = 'Willkommen bei dem Luftqualität Skill ' +
        'Für welche Stadt möchtest Du den Luftqualitätsindex wissen? Frage zum Beispiel: Wie ist die Luftqualität in Hamburg?';
    // If the user either does not reply to the welcome message or says something that is not
    // understood, they will be prompted again with this text.
    const repromptText = 'Für welche Stadt möchtest Du nun die Luftqualität wissen, sag schon';
    const shouldEndSession = false;

    callback(sessionAttributes,
        buildSpeechletResponse(cardTitle, speechOutput, repromptText, shouldEndSession));
}

function handleSessionEndRequest(callback) {
    const cardTitle = 'Session Ended';
    const speechOutput = 'Tschüss';
    // Setting this to true ends the session and exits the skill.
    const shouldEndSession = true;

    callback({}, buildSpeechletResponse(cardTitle, speechOutput, null, shouldEndSession));
}



function getairquality(intent, session, callback) {
    const repromptText = `Versuche zum Beispiel folgende Frage: Wie ist die Luftqualität in Hamburg`;
    const sessionAttributes = {};
    let shouldEndSession = false;
    if (intent.slots.city.value != null) 
    {
        var city = intent.slots.city.value;
        console.log("CITY", city);
        var cityapi = intent.slots.city.value.toLowerCase();
        cityapi = cityapi.replace(" ","");
        cityapi = cityapi.replace(" ","");
        cityapi = cityapi.replace(" ","");
        cityapi = cityapi.replace(" ","");
        cityapi = cityapi.replace(" ","");
        console.log("CITY2", cityapi);
        
        var speechOutput = `Entschuldigung, der Luftqualitätsindex für ${city} konnte nicht ermittelt werden. Versuche eine andere Stadt oder die englische Aussprache`;
        var quality = {};
        var aqi = {};
        let name = {};

        var httpCb = function(response) {
            var str = '';
            response.on('data',function(chunk){
                str +=chunk;
            });
            response.on('end',function(){
                console.log("STRING",str);
                var data = JSON.parse(str);
                if (data.status != 'error')
                {
                    console.log("DATA",data);
                    var aqi = data.data.aqi  
                    console.log("AQI",aqi);
                    name = data.data.city.name
                    console.log("STATION",name)
                    var quality = "gut";
                    if (aqi > 300) {quality="gefährlich, meide es draußen zu sein!"
                        } else if (aqi > 200) {quality="sehr ungesund";
                        } else if (aqi > 150) {quality="ungesund";
                        } else if (aqi > 100) {quality="ungesund für empfindliche Menschen";
                        } else if (aqi > 50) {quality="mittelmäßig";
                    }
                    console.log("QUALITY",quality)
                    
                    speechOutput = `Der Luftqualitätsindex in ${name} ist ${aqi}, das bedeutet ${quality}`;
                    shouldEndSession = true;
                }
            
            callback(sessionAttributes,
            buildSpeechletResponse(intent.name, speechOutput, repromptText, shouldEndSession));
            
        
            });
        };
    } 
    else 
        {
            speechOutput = "Hoppla! Da konnte ich nichts finden. Versuche es noch einmal! Zum Beispiel mit Wie ist die Luftqualität in Hamburg?"
            callback(sessionAttributes,
            buildSpeechletResponse(intent.name, speechOutput, repromptText, shouldEndSession)); 
        }
    
    

    var buildpath = `/feed/${cityapi}/?token={yourAPIKey}`; // http://aqicn.org/data-platform/token/
    console.log(buildpath);
    https.request({
        host: 'api.waqi.info',
        path: buildpath
    }, httpCb).end();

  

    // Setting repromptText to null signifies that we do not want to reprompt the user.
    // If the user does not respond or says something that is not understood, the session
    // will end.
 //    callback(sessionAttributes,
 //        buildSpeechletResponse(intent.name, speechOutput, repromptText, shouldEndSession));   
}


// --------------- Events -----------------------

/**
 * Called when the session starts.
 */
function onSessionStarted(sessionStartedRequest, session) {
    console.log(`onSessionStarted requestId=${sessionStartedRequest.requestId}, sessionId=${session.sessionId}`);
}

/**
 * Called when the user launches the skill without specifying what they want.
 */
function onLaunch(launchRequest, session, callback) {
    console.log(`onLaunch requestId=${launchRequest.requestId}, sessionId=${session.sessionId}`);

    // Dispatch to your skill's launch.
    getWelcomeResponse(callback);
}

/**
 * Called when the user specifies an intent for this skill.
 */
function onIntent(intentRequest, session, callback) {
    console.log(`onIntent requestId=${intentRequest.requestId}, sessionId=${session.sessionId}`);

    const intent = intentRequest.intent;
    const intentName = intentRequest.intent.name;

    // Dispatch to your skill's intent handlers
    if (intentName === 'airquality') {
        getairquality(intent, session, callback);
    }  else if (intentName === 'AMAZON.HelpIntent') {
        getWelcomeResponse(callback);
    } else if (intentName === 'AMAZON.StopIntent' || intentName === 'AMAZON.CancelIntent') {
        handleSessionEndRequest(callback);
    } else {
        throw new Error('Invalid intent');
    }
}

/**
 * Called when the user ends the session.
 * Is not called when the skill returns shouldEndSession=true.
 */
function onSessionEnded(sessionEndedRequest, session) {
    console.log(`onSessionEnded requestId=${sessionEndedRequest.requestId}, sessionId=${session.sessionId}`);
    // Add cleanup logic here
}


// --------------- Main handler -----------------------

// Route the incoming request based on type (LaunchRequest, IntentRequest,
// etc.) The JSON body of the request is provided in the event parameter.
exports.handler = (event, context, callback) => {
    try {
        console.log(`event.session.application.applicationId=${event.session.application.applicationId}`);

        /**
         * Uncomment this if statement and populate with your skill's application ID to
         * prevent someone else from configuring a skill that sends requests to this function.
         */
        /*
        if (event.session.application.applicationId !== 'amzn1.echo-sdk-ams.app.[unique-value-here]') {
             callback('Invalid Application ID');
        }
        */

        if (event.session.new) {
            onSessionStarted({ requestId: event.request.requestId }, event.session);
        }

        if (event.request.type === 'LaunchRequest') {
            onLaunch(event.request,
                event.session,
                (sessionAttributes, speechletResponse) => {
                    callback(null, buildResponse(sessionAttributes, speechletResponse));
                });
        } else if (event.request.type === 'IntentRequest') {
            onIntent(event.request,
                event.session,
                (sessionAttributes, speechletResponse) => {
                    callback(null, buildResponse(sessionAttributes, speechletResponse));
                });
        } else if (event.request.type === 'SessionEndedRequest') {
            onSessionEnded(event.request, event.session);
            callback();
        }
    } catch (err) {
        callback(err);
    }
};
