// netlify/functions/blame-charles.js
const fetch = require('node-fetch'); // You might need to install node-fetch if not already available

exports.handler = async function(event, context) {
    const GEMINI_API_KEY = process.env.GEMINI_API_KEY; // Access the environment variable

    if (!GEMINI_API_KEY) {
        return {
            statusCode: 500,
            body: JSON.stringify({ error: "API key not configured." })
        };
    }

    try {
        const prompt = "Generate a random, well-known historical disaster (e.g., the sinking of the Titanic, the Great Fire of London, the eruption of Mount Vesuvius, the Black Death, the collapse of the Roman Empire, the Hindenburg disaster, the Chernobyl disaster, the invention of Nickelback) and then write a humorous, absurd, and completely unfounded explanation of how Charles Hoskinson was secretly responsible for it. Make it sound like a conspiracy theory. Keep it concise, around 3-5 sentences.";
        const payload = {
            contents: [{ role: "user", parts: [{ text: prompt }] }]
        };
        const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`;

        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        const result = await response.json();

        return {
            statusCode: 200,
            body: JSON.stringify(result)
        };
    } catch (error) {
        console.error('Error in Netlify Function:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: "Failed to generate blame due to server error." })
        };
    }
};
