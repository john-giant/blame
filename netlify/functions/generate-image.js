// netlify/functions/generate-image.js
const fetch = require('node-fetch');

exports.handler = async function(event, context) {
    // Retrieve the API key from Netlify environment variables
    // IMPORTANT: You will need a separate API key for Imagen, or ensure your Gemini API key
    // has access to Imagen. For simplicity, we'll use GEMINI_API_KEY, but ideally,
    // you'd have an IMAGEN_API_KEY if they are different.
    const IMAGEN_API_KEY = process.env.GEMINI_API_KEY; // Or process.env.IMAGEN_API_KEY if you set a separate one

    if (!IMAGEN_API_KEY) {
        return {
            statusCode: 500,
            body: JSON.stringify({ error: "Server configuration error: Imagen API key not found." })
        };
    }

    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }

    let requestBody;
    try {
        requestBody = JSON.parse(event.body);
    } catch (e) {
        return { statusCode: 400, body: 'Invalid JSON body' };
    }

    const blameText = requestBody.prompt;
    if (!blameText) {
        return { statusCode: 400, body: 'Missing prompt in request body.' };
    }

    // Construct a prompt for image generation based on the blame text
    const imagePrompt = `A humorous, absurd, and slightly surreal illustration depicting: "${blameText}". Focus on the disaster and Charles Hoskinson's comical involvement. Style: whimsical, cartoonish.`;

    try {
        const payload = { instances: { prompt: imagePrompt }, parameters: { "sampleCount": 1 } };
        const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/imagen-3.0-generate-002:predict?key=${IMAGEN_API_KEY}`;

        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        const result = await response.json();

        if (result.predictions && result.predictions.length > 0 && result.predictions[0].bytesBase64Encoded) {
            return {
                statusCode: 200,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    predictions: [{ bytesBase64Encoded: result.predictions[0].bytesBase64Encoded }]
                })
            };
        } else {
            console.error('Imagen API response structure unexpected:', result);
            return {
                statusCode: 500,
                body: JSON.stringify({ error: "Failed to generate image: Unexpected API response format." })
            };
        }
    } catch (error) {
        console.error('Error in Netlify Function (generate-image.js):', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: "Internal server error during image generation." })
        };
    }
};
