Write-Host "Configuring Vercel Environment Variables..."

# Function to add env var to all targets
function Add-VercelEnv {
    param (
        [string]$Key,
        [string]$Value
    )
    Write-Host "Adding $Key..."
    $targets = "production", "preview", "development"
    foreach ($target in $targets) {
        Write-Host "  -> $target"
        # Pipe the value to the command. 
        # Note: 'vercel env add' asks for value, then allows selecting targets if not specified.
        # Specifying target as argument avoids menu selector.
        $cmd = "input"
        $process = Start-Process -FilePath "cmd" -ArgumentList "/c echo $Value | npx vercel env add $Key $target" -NoNewWindow -PassThru -Wait
    }
}

# Mistral API Key
Add-VercelEnv -Key "VITE_MISTRAL_API_KEY" -Value "jqvq3FN8Svltb0OMkz1E7IcStQb0Yton"

# AI Gateway Key
Add-VercelEnv -Key "AI_GATEWAY_API_KEY" -Value "vck_46vuuMxippHAOOFKSWoPRDSdViF5VuUFY00OsBUIDBVvLwjw373YblSh"

# Firebase Config
Add-VercelEnv -Key "VITE_FIREBASE_API_KEY" -Value "AIzaSyDrz9Pos5o1C92ASRLrDI_4BUXVoPgy954"
Add-VercelEnv -Key "VITE_FIREBASE_AUTH_DOMAIN" -Value "meucontador-367cf.firebaseapp.com"
Add-VercelEnv -Key "VITE_FIREBASE_PROJECT_ID" -Value "meucontador-367cf"
Add-VercelEnv -Key "VITE_FIREBASE_STORAGE_BUCKET" -Value "meucontador-367cf.firebasestorage.app"
Add-VercelEnv -Key "VITE_FIREBASE_MESSAGING_SENDER_ID" -Value "272225011400"
Add-VercelEnv -Key "VITE_FIREBASE_APP_ID" -Value "1:272225011400:web:a0c29d26397d6d1f1087fd"
Add-VercelEnv -Key "VITE_FIREBASE_MEASUREMENT_ID" -Value "G-GVGPDWP7KY"

Write-Host "Configuration Done! Executing Deploy..."
npx vercel --prod
