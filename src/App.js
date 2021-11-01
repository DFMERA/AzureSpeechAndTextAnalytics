import React, { Component } from 'react';
import { Container } from 'reactstrap';
import { getTokenOrRefresh } from './token_util';
import './custom.css'
import { ResultReason } from 'microsoft-cognitiveservices-speech-sdk';
import { TextAnalyticsClient, AzureKeyCredential } from "@azure/ai-text-analytics";
//import enviroment variables
require('dotenv').config();

const speechsdk = require('microsoft-cognitiveservices-speech-sdk')
        
export default class App extends Component {
    constructor(props) {
        super(props);

        this.state = {
            displayText: 'INITIALIZED: ready to test speech...',
            displayText2: 'INITIALIZED: ready to analysis text...'
        }
    }
    
    /*async componentDidMount() {
        // check for valid speech key/region
        const tokenRes = await getTokenOrRefresh();
        if (tokenRes.authToken === null) {
            this.setState({
                displayText: 'FATAL_ERROR: ' + tokenRes.error
            });
        }
    }*/

    async sttFromMic() {
        //const tokenObj = await getTokenOrRefresh();
        //const speechConfig = speechsdk.SpeechConfig.fromAuthorizationToken(tokenObj.authToken, tokenObj.region);
        const speechKey = process.env.REACT_APP_SPEECH_KEY;
        const speechRegion = process.env.REACT_APP_SPEECH_REGION;
        const speechConfig = speechsdk.SpeechConfig.fromSubscription(speechKey,speechRegion);
        speechConfig.speechRecognitionLanguage = 'es-MX';
        
        const audioConfig = speechsdk.AudioConfig.fromDefaultMicrophoneInput();
        const recognizer = new speechsdk.SpeechRecognizer(speechConfig, audioConfig);

        this.setState({
            displayText: 'speak into your microphone...'
        });

        recognizer.recognizeOnceAsync(result => {
            let displayText;
            if (result.reason === ResultReason.RecognizedSpeech) {
                displayText = `RECOGNIZED: Text=${result.text}`
            } else {
                displayText = 'ERROR: Speech was cancelled or could not be recognized. Ensure your microphone is working properly.';
            }

            this.setState({
                displayText: displayText
            });
        });
    }

    async analysisText() {
        const endpoint = process.env.REACT_APP_TEXTANALYTICS_ENDPOINT;
        const apiKey = process.env.REACT_APP_TEXTANALYTICS_KEY;

        const documents = [
            this.state.displayText
        ];

        const client = new TextAnalyticsClient(endpoint, new AzureKeyCredential(apiKey));

        const results = await client.analyzeSentiment(documents);
        let resultText = "";
            
        for (let i = 0; i < results.length; i++) {
            const result = results[i];
            console.log(`- Document ${result.id}`);
            //resultText += `- Document ${result.id}`;
            if (!result.error) {
            console.log(`\tDocument text: ${documents[i]}`);
            //resultText += `\tDocument text: ${documents[i]}`;
            console.log(`\tOverall Sentiment: ${result.sentiment}`);
            resultText += `\tOverall Sentiment: ${result.sentiment}`;
            console.log("\tSentiment confidence scores: ", result.confidenceScores);
            console.log(`\t\tPositive: ${result.confidenceScores.positive.toFixed(2)} \tNegative: ${result.confidenceScores.negative.toFixed(2)} \tNeutral: ${result.confidenceScores.neutral.toFixed(2)}`);
            resultText += `\n\t- Positive: ${result.confidenceScores.positive.toFixed(2)} \tNegative: ${result.confidenceScores.negative.toFixed(2)} \tNeutral: ${result.confidenceScores.neutral.toFixed(2)}`;
            console.log("\tSentences");
            for (const { sentiment, confidenceScores, text } of result.sentences) {
                console.log(`\t- Sentence text: ${text}`);
                console.log(`\t  Sentence sentiment: ${sentiment}`);
                console.log("\t  Confidence scores:", confidenceScores);
            
            }
            } else {
            console.error(`  Error: ${result.error}`);
            }

            this.setState({
                displayText2: resultText
            });
        }
    }

    render() {
        return (
            <Container className="app-container">
                <h1 className="display-4 mb-3">Demo: Convertir texto a voz y análisis de sentimiento</h1>
                <div className="row main-container">
                    <div className="col-6">
                        <i className="fas fa-microphone fa-lg mr-2" onClick={() => this.sttFromMic()}></i>
                        Convert speech to text from your mic.

                    </div>
                    <div className="col-6 output-display rounded">
                        <code>{this.state.displayText}</code>
                    </div>
                </div>
                <div className="row main-container">
                    <div className="col-6">
                        <i className="fas fa-file-audio fa-lg mr-2" onClick={() => this.analysisText()}></i>
                        Sentiment Analysis.
                    </div>
                    <div className="col-6 output-display rounded">
                        <code>{this.state.displayText2}</code>
                    </div>
                </div>
            </Container>
        );
    }
}