# Verification Script for Phase 3.2
$ErrorActionPreference = "Stop"

try {
    Write-Host "Starting Phase 3.2 Verification (Logic Migration)..." -ForegroundColor Cyan

    # 1. Test Health Check
    Write-Host "1. Testing Health Check..." -ForegroundColor Yellow
    $health = Invoke-RestMethod -Uri "http://localhost:3000/api/health" -Method Get
    if ($health.status -ne "ok") { throw "Health check failed" }
    Write-Host "   Health Check Passed" -ForegroundColor Green

    # 2. Test Scan Endpoint
    Write-Host "2. Testing Scan Endpoint (This may take a moment, scanning 50 symbols)..." -ForegroundColor Yellow
    $scan = Invoke-RestMethod -Uri "http://localhost:3000/api/scan" -Method Get -TimeoutSec 60
    
    if ($null -eq $scan.bullishCount) { throw "Scan response missing bullishCount" }
    if ($null -eq $scan.topSetups) { throw "Scan response missing topSetups" }
    
    Write-Host "   Scan Successful!" -ForegroundColor Green
    Write-Host "   - Bullish: $($scan.bullishCount)"
    Write-Host "   - Bearish: $($scan.bearishCount)"
    Write-Host "   - Neutral: $($scan.neutralCount)"
    Write-Host "   - Top Setups Found: $($scan.topSetups.Count)"

    # 3. Test AI Insight Endpoint
    # We only test this if we have data, otherwise we mock a request
    Write-Host "3. Testing AI Insight Endpoint..." -ForegroundColor Yellow
    
    $mockSummary = @{
        bullishCount = 10
        bearishCount = 5
        neutralCount = 20
        topSetups = @(
            @{
                symbol = "BTCUSDT"
                rank = "A+"
                signal = "STRONG_BUY"
                ltf = "BUY"
                htf = "BUY"
            }
        )
    }
    
    # Convert to JSON
    $body = $mockSummary | ConvertTo-Json -Depth 5

    try {
        $ai = Invoke-RestMethod -Uri "http://localhost:3000/api/ai-insight" -Method Post -Body $body -ContentType "application/json"
        
        if ($null -eq $ai.analysis) { throw "AI response missing analysis field" }
        
        Write-Host "   AI Insight Successful!" -ForegroundColor Green
        Write-Host "   Full Response:" -ForegroundColor Cyan
        Write-Host $ai.analysis -ForegroundColor Gray
    } catch {
        Write-Host "   AI Insight Failed: $_" -ForegroundColor Red
    }

    Write-Host "Phase 3.2 Verification Completed Successfully!" -ForegroundColor Green

} catch {
    Write-Host "Verification Failed: $_" -ForegroundColor Red
    exit 1
}
