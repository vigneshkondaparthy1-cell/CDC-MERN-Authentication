$ErrorActionPreference = 'Stop'
$projectRoot = $PSScriptRoot
$localDir = Join-Path $projectRoot '.local'
New-Item -ItemType Directory -Force (Join-Path $localDir 'data'),(Join-Path $localDir 'logs') | Out-Null
function Test-LocalPort([int]$Port) {
    $client = [Net.Sockets.TcpClient]::new()
    try { $client.Connect('127.0.0.1', $Port); return $true } catch { return $false } finally { $client.Dispose() }
}
function Wait-LocalPort([int]$Port) {
    for($attempt=0; $attempt -lt 60; $attempt++) {
        if(Test-LocalPort $Port) { return }
        Start-Sleep -Milliseconds 500
    }
    throw "Port $Port did not start. Check .local/logs."
}
$nodePath = (Get-Command node.exe).Source
if(-not (Test-LocalPort 27017)) {
    $mongoPath = Join-Path $localDir 'mongodb-bin\mongod.exe'
    if(-not (Test-Path $mongoPath)) { throw "Missing local MongoDB executable: $mongoPath" }
    $dataPath = Join-Path $localDir 'data'
    $logPath = Join-Path $localDir 'logs\mongodb.log'
    Start-Process -FilePath $mongoPath -ArgumentList @('--dbpath',('"'+$dataPath+'"'),'--bind_ip','127.0.0.1','--port','27017','--logpath',('"'+$logPath+'"'),'--logappend') -WindowStyle Hidden | Out-Null
    Wait-LocalPort 27017
}
Push-Location (Join-Path $projectRoot 'server')
try {
    & $nodePath setup-local.cjs
    if($LASTEXITCODE -ne 0) { throw 'Configuration failed.' }
    & $nodePath src/scripts/seedAdmin.js
    if($LASTEXITCODE -ne 0) { throw 'Admin seeding failed.' }
    if(-not (Test-LocalPort 5000)) {
        Start-Process -FilePath $nodePath -ArgumentList 'src/server.js' -WorkingDirectory (Get-Location).Path -WindowStyle Hidden -RedirectStandardOutput (Join-Path $localDir 'logs\server.log') -RedirectStandardError (Join-Path $localDir 'logs\server-error.log') | Out-Null
        Wait-LocalPort 5000
    }
} finally { Pop-Location }
if(-not (Test-LocalPort 5173)) {
    Start-Process -FilePath $nodePath -ArgumentList @('node_modules/vite/bin/vite.js','--host','127.0.0.1','--port','5173','--strictPort') -WorkingDirectory (Join-Path $projectRoot 'client') -WindowStyle Hidden -RedirectStandardOutput (Join-Path $localDir 'logs\client.log') -RedirectStandardError (Join-Path $localDir 'logs\client-error.log') | Out-Null
    Wait-LocalPort 5173
}
Write-Output 'CDC Portal running at http://localhost:5173'
Write-Output "Admin login details: $localDir\LOGIN.txt"
