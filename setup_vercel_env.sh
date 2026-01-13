echo "Configuring Vercel Environment Variables..."

# Mistral API Key
echo "Adding VITE_MISTRAL_API_KEY..."
echo "jqvq3FN8Svltb0OMkz1E7IcStQb0Yton" | vercel env add VITE_MISTRAL_API_KEY production preview development

# Firebase Config
echo "Adding VITE_FIREBASE_API_KEY..."
echo "AIzaSyDrz9Pos5o1C92ASRLrDI_4BUXVoPgy954" | vercel env add VITE_FIREBASE_API_KEY production preview development

echo "Adding VITE_FIREBASE_AUTH_DOMAIN..."
echo "meucontador-367cf.firebaseapp.com" | vercel env add VITE_FIREBASE_AUTH_DOMAIN production preview development

echo "Adding VITE_FIREBASE_PROJECT_ID..."
echo "meucontador-367cf" | vercel env add VITE_FIREBASE_PROJECT_ID production preview development

echo "Adding VITE_FIREBASE_STORAGE_BUCKET..."
echo "meucontador-367cf.firebasestorage.app" | vercel env add VITE_FIREBASE_STORAGE_BUCKET production preview development

echo "Adding VITE_FIREBASE_MESSAGING_SENDER_ID..."
echo "272225011400" | vercel env add VITE_FIREBASE_MESSAGING_SENDER_ID production preview development

echo "Adding VITE_FIREBASE_APP_ID..."
echo "1:272225011400:web:a0c29d26397d6d1f1087fd" | vercel env add VITE_FIREBASE_APP_ID production preview development

echo "Adding VITE_FIREBASE_MEASUREMENT_ID..."
echo "G-GVGPDWP7KY" | vercel env add VITE_FIREBASE_MEASUREMENT_ID production preview development

echo "Done! Run 'vercel --prod' to redeploy with new variables."
