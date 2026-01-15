Write-Host "STARTING NUCLEAR RESET of node_modules..."
if (Test-Path "node_modules") {
    Remove-Item -Recurse -Force "node_modules"
    Write-Host "node_modules deleted"
}
if (Test-Path "package-lock.json") {
    Remove-Item -Force "package-lock.json"
    Write-Host "package-lock.json deleted"
}

Write-Host "Installing dependencies..."
npm install

Write-Host "Install complete."
Write-Host "Attempting simple build..."
node build_simple.js
