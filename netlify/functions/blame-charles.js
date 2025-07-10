// netlify/functions/blame-charles.js
const fetch = require('node-fetch'); // Ensure node-fetch is installed in netlify/functions/package.json

exports.handler = async function(event, context) {
    console.log('Function blame-charles invoked.'); // Log at the very beginning

    const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

    if (!GEMINI_API_KEY) {
        console.error('API key not configured in environment variables.');
        return {
            statusCode: 500,
            body: JSON.stringify({ error: "Server configuration error: Gemini API key not found." })
        };
    }

    if (event.httpMethod !== 'POST') {
        console.warn(`Method Not Allowed: ${event.httpMethod}`);
        return { statusCode: 405, body: 'Method Not Allowed' };
    }

    console.log('Attempting to generate blame...');
    try {
        // UPDATED PROMPT: Expanded examples to encourage a wider variety of disasters
        const prompt = "Generate a random, well-known historical disaster (e.g., the sinking of the Titanic, the eruption of Mount Vesuvius, the Black Death, the collapse of the Roman Empire, the Hindenburg disaster, the Chernobyl disaster, the invention of Nickelback, the San Francisco earthquake, the eruption of Krakatoa, the Dust Bowl, the Great Smog of London, the Lisbon earthquake of 1755, the Tunguska event, the destruction of Pompeii, the Salem Witch Trials) and then write a humorous, absurd, and completely unfounded explanation of how Charles Hoskinson was secretly responsible for it. Keep it concise, around 1-3 sentences.";
        const payload = {
            contents: [{ role: "user", parts: [{ text: prompt }] }]
        };
        const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`;

        // Add a timeout for the fetch request
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 8000); // 8-second timeout

        console.log('Sending request to Gemini API...');
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
            signal: controller.signal // Apply the timeout signal
        });
        clearTimeout(timeoutId); // Clear timeout if fetch completes in time

        console.log(`Received response from Gemini API with status: ${response.status}`);
        const result = await response.json();
        console.log('Gemini API response body:', JSON.stringify(result, null, 2)); // Log the full response for debugging

        // Check for specific error messages from Gemini API
        if (!response.ok) {
            console.error(`Gemini API returned an error: ${response.status} ${response.statusText}`, result);
            return {
                statusCode: response.status,
                body: JSON.stringify({ error: result.error ? result.error.message : "Gemini API error occurred." })
            };
        }

        if (result.candidates && result.candidates.length > 0 &&
            result.candidates[0].content && result.candidates[0].content.parts &&
            result.candidates[0].content.parts.length > 0) {
            const text = result.candidates[0].content.parts[0].text;
            console.log('Successfully generated blame text.');
            return {
                statusCode: 200,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ candidates: [{ content: { parts: [{ text: text }] } }] }) // Return structured response
            };
        } else {
            console.error('Gemini API response structure unexpected or content missing:', result);
            return {
                statusCode: 500,
                body: JSON.stringify({ error: "Failed to generate blame: Unexpected AI response format." })
            };
        }
    } catch (error) {
        if (error.name === 'AbortError') {
            console.error('Gemini API request timed out:', error);
            return {
                statusCode: 504, // Gateway Timeout
                body: JSON.stringify({ error: "Gemini API request timed out. Please try again." })
            };
        }
        console.error('Error in Netlify Function (blame-charles.js):', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: "Internal server error during AI generation." })
        };
    }
};
