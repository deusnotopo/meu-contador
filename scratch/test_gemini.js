const { GoogleGenerativeAI } = require("@google/generative-ai");
require('dotenv').config({ path: '../backend/.env' });

const apiKey = process.env.GEMINI_API_KEY;
console.log("Testing with API Key ends with:", apiKey.slice(-4));

// Vamos testar varios nomes de modelo comuns
const modelsToTest = ["gemini-1.5-flash", "gemini-pro", "gemini-1.0-pro"];

async function run() {
    if (!apiKey) {
        console.error("API Key not found in .env");
        return;
    }

    const genAI = new GoogleGenerativeAI(apiKey);

    for (const modelName of modelsToTest) {
        console.log(`\n--- Testing Model: ${modelName} ---`);
        try {
            const model = genAI.getGenerativeModel({ model: modelName });
            const result = await model.generateContent("Diga: 'Teste OK'");
            const response = await result.response;
            console.log(`Success! Response: ${response.text()}`);
            return; // Se um funcionar, paramos
        } catch (error) {
            console.error(`Error with ${modelName}:`, error.message);
        }
    }
}

run();
