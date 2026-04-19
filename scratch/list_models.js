const { GoogleGenerativeAI } = require("@google/generative-ai");
require('dotenv').config({ path: '../backend/.env' });

async function run() {
    const apiKey = process.env.GEMINI_API_KEY;
    const genAI = new GoogleGenerativeAI(apiKey);
    
    try {
        console.log("Listing available models...");
        // O SDK v1 do Gemini as vezes nao tem listModels direto de forma facil, 
        // mas podemos tentar via fetch ou ver se o SDK exporta.
        // Na versao mais nova do SDK (@google/generative-ai):
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
        const data = await response.json();
        console.log(JSON.stringify(data, null, 2));
    } catch (error) {
        console.error("Error listing models:", error.message);
    }
}

run();
