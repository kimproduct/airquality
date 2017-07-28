'use strict';

/**
 * Skill created on the basis of amazon sample code by Kim Asmussen in 2017
 * E-Mail: kias@gmx.net
 * 
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

function removespace (str) {
while (str.includes(" ")) { str = str.replace(" ","") }
return str;
}

function getgooglecityname(api, intent, session, callback) {

// Use Google Maps API to normalize the City Information to post this again to the WAPI.info API
// Function has to built nicer using async features but works as is 

var repromptText = `Versuche zum Beispiel folgende Frage: Wie ist die Luftqualität in Hamburg`;
var sessionAttributes = {};
var shouldEndSession = false;
var city = intent.slots.city.value;
var speechOutput = `Entschuldigung, der Luftqualitätsindex für ${city} konnte nicht ermittelt werden. Versuche eine andere Stadt.`;
var httpgm = require("https");
var urlgm = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(api)}&key=[yourGoogleMapsAPIkey]`;
var cityGMAPI = {};
    var requestgm = https.get(urlgm, function (response) {
    var buffergm = "",
        datagm,
        citylat,
        citylng;

    response.on("data", function (chunk) {
        buffergm += chunk;
    });

    response.on("end", function (err) {

        datagm = JSON.parse(buffergm);
        console.log("DATA",datagm);
        console.log("GMSTATUS",datagm.status);
        if (datagm.status == 'OK') {
            cityGMAPI = removespace(datagm.results[0].address_components[0].long_name.toLowerCase());
            cityGMAPI = encodeURI (cityGMAPI,"utf-8");
            citylat = datagm.results[0].geometry.location.lat;
            citylng = datagm.results[0].geometry.location.lng;
            console.log("LAT",citylat);
            console.log("LNG",citylng);
            
            console.log("CITYGMAPI",cityGMAPI);
        }
        else 
            {
            speechOutput = "Hoppla! Da konnte ich nichts finden. Versuche es noch einmal! Zum Beispiel mit Wie ist die Luftqualität in Hamburg?"
            callback(sessionAttributes,
            buildSpeechletResponse(intent.name, speechOutput, repromptText, shouldEndSession));     
            }
// Use Google Map API results to ask the waqi.info API     
    var http = require("https");
// Option 1: Use City API
    var url = `https://api.waqi.info/feed/${cityGMAPI}/?token=[yourAPItoken]`;
// Option 2: Use Lat and Lng Info
//var url = `https://api.waqi.info/feed/geo:${citylat};${citylng}/?token=[yourAPItoken]`;

    var request = https.get(url, function (response) {
    var buffer = "",
        data;
    console.log ("URL",url)    
    response.on("data", function (chunk) {
        buffer += chunk;
    });

    response.on("end", function (err) {

        data = JSON.parse(buffer);
        console.log("DATA",data);
       
        if (data.status != 'error')
        {
            var aqi = data.data.aqi  
            console.log("AQI",aqi);
            var name = data.data.city.name
            console.log("STATION",name)
            var quality = getaqiquality(aqi);
            console.log("QUALITY",quality)
                if (aqi !="-") 
                {
                    speechOutput = `Der Luftqualitätsindex für ${city} von der Station ${name} beträgt ${aqi}, das bedeutet ${quality}`;
                    shouldEndSession = true;
                } 
                else 
                {
                    speechOutput = `Leider wurde der Luftqualitätsindex für ${city} von der Station ${api} nicht übermittelt`;
                    shouldEndSession = true;
                }
        
            console.log("CITYGMAPI2",cityGMAPI);
            callback(sessionAttributes,
            buildSpeechletResponse(intent.name, speechOutput, repromptText, shouldEndSession)); 
                
                }
        else {
            speechOutput = "Hoppla! Da konnte ich nichts finden. Versuche es noch einmal! Zum Beispiel mit Wie ist die Luftqualität in Hamburg?"
            callback(sessionAttributes,
            buildSpeechletResponse(intent.name, speechOutput, repromptText, shouldEndSession));     
        }
    });
    });
});
    
});
return cityGMAPI;
}

function getcityapi(city){
    var cityapi = removespace(city.toLowerCase());
        
        switch (cityapi) {
            case "köln":
                cityapi = "cologne";
                break;
            case "münchen":
                cityapi = "munich";
                break;          
            case "tokio":
                cityapi = "tokyo";
                break;
            case "rom":
                cityapi = "rome";
                break;
            case "peking":
                cityapi = "beijing";
                break;
            default:
                cityapi = cityapi;
        }
    return cityapi;
}

function getaqiquality(aqi) {
    var quality = "gut";
        if (aqi > 300) {quality="gefährlich, meide es draußen zu sein!"
            } else if (aqi > 200) {quality="sehr ungesund";
            } else if (aqi > 150) {quality="ungesund";
            } else if (aqi > 100) {quality="ungesund für empfindliche Menschen";
            } else if (aqi > 50) {quality="mittelmäßig";
        }
    return quality;
}


function getairquality(intent, session, callback) {
    const repromptText = `Versuche zum Beispiel folgende Frage: Wie ist die Luftqualität in Hamburg`;
    const sessionAttributes = {};
    let shouldEndSession = false;
    if (intent.slots.city.value != null) 
    {
        console.log("INTENT",intent);
        var city = intent.slots.city.value;
        console.log("CITY", city);
        var cityapi = getcityapi(city);
        console.log("CITYAPI", cityapi);
        // var speechOutput = `Entschuldigung, der Luftqualitätsindex für ${city} konnte nicht ermittelt werden. Versuche eine andere Stadt oder die englische Aussprache`;
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
                    var name = data.data.city.name
                    console.log("STATION",name)
                    var quality = getaqiquality(aqi);
                    console.log("QUALITY",quality)
                    if (aqi !="-") {
                        var speechOutput = `Der Luftqualitätsindex in ${city} für die Station ${name} beträgt ${aqi}, das bedeutet ${quality}`;
                        shouldEndSession = true;
                        callback(sessionAttributes,
                        buildSpeechletResponse(intent.name, speechOutput, repromptText, shouldEndSession));
                    } else {
                        var speechOutput = `Der Luftqualitätsindex für die Station ${name} in ${city} wurde nicht übermittelt`;
                        shouldEndSession = true;
                        callback(sessionAttributes,
                        buildSpeechletResponse(intent.name, speechOutput, repromptText, shouldEndSession));
                    }
                }
            else
                {
                    console.log("ELSE WIRD ERREICHT");
                    getgooglecityname (cityapi, intent, session, callback);
                }

        });
        };
        var buildpath = `/feed/${cityapi}/?token=[yourAPItoken]`;
            console.log(buildpath);
            https.request({
                host: 'api.waqi.info',
                path: buildpath
            }, httpCb).end();
        }
        else 
        {

            var speechOutput = "Hoppla! Da konnte ich nichts finden. Versuche es noch einmal! Zum Beispiel mit Wie ist die Luftqualität in Hamburg?"
            callback(sessionAttributes,
            buildSpeechletResponse(intent.name, speechOutput, repromptText, shouldEndSession)); 
        }
        

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
