Write-Host "Configuring Vercel Environment Variables..."

# Mistral API Key
Write-Host "Adding MISTRAL_API_KEY..."
echo "jqvq3FN8Svltb0OMkz1E7IcStQb0Yton" | npx vercel env add MISTRAL_API_KEY production

# Firebase Config
Write-Host "Adding VITE_FIREBASE_API_KEY..."
echo "AIzaSyDrz9Pos5o1C92ASRLrDI_4BUXVoPgy954" | npx vercel env add VITE_FIREBASE_API_KEY production

Write-Host "Adding VITE_FIREBASE_AUTH_DOMAIN..."
echo "meucontador-367cf.firebaseapp.com" | npx vercel env add VITE_FIREBASE_AUTH_DOMAIN production

Write-Host "Adding VITE_FIREBASE_PROJECT_ID..."
echo "meucontador-367cf" | npx vercel env add VITE_FIREBASE_PROJECT_ID production

Write-Host "Adding VITE_FIREBASE_STORAGE_BUCKET..."
echo "meucontador-367cf.firebasestorage.app" | npx vercel env add VITE_FIREBASE_STORAGE_BUCKET production

Write-Host "Adding VITE_FIREBASE_MESSAGING_SENDER_ID..."
echo "272225011400" | npx vercel env add VITE_FIREBASE_MESSAGING_SENDER_ID production

Write-Host "Adding VITE_FIREBASE_APP_ID..."
echo "1:272225011400:web:a0c29d26397d6d1f1087fd" | npx vercel env add VITE_FIREBASE_APP_ID production

Write-Host "Adding VITE_FIREBASE_MEASUREMENT_ID..."
echo "G-GVGPDWP7KY" | npx vercel env add VITE_FIREBASE_MEASUREMENT_ID production

Write-Host "Done! Run 'vercel --prod' to redeploy with new variables."
