Write-Host "Testing AI Insight Endpoint with Ollama Configuration..." -ForegroundColor Cyan

$baseUrl = "http://localhost:3000/api"

# Mock Market Summary Data
$body = @{
    bullishCount = 15
    bearishCount = 5
    neutralCount = 10
    topSetups = @(
        @{ symbol = "BTCUSDT"; rank = "A+"; signal = "STRONG_BUY" },
        @{ symbol = "ETHUSDT"; rank = "A"; signal = "BUY" },
        @{ symbol = "SOLUSDT"; rank = "A+"; signal = "STRONG_BUY" }
    )
} | ConvertTo-Json -Depth 5

try {
    Write-Host "Sending request to $baseUrl/ai-insight..." -ForegroundColor Gray
    $response = Invoke-RestMethod -Uri "$baseUrl/ai-insight" -Method Post -Body $body -ContentType "application/json" -TimeoutSec 60
    
    if ($response.analysis) {
        Write-Host "[SUCCESS] AI Analysis received:" -ForegroundColor Green
        Write-Host "---------------------------------------------------" -ForegroundColor Gray
        Write-Host $response.analysis -ForegroundColor White
        Write-Host "---------------------------------------------------" -ForegroundColor Gray
    } else {
        Write-Host "[FAIL] Response received but 'analysis' field is missing or empty." -ForegroundColor Red
        Write-Host $response -ForegroundColor Red
    }
} catch {
    Write-Host "[FAIL] Request failed." -ForegroundColor Red
    Write-Host "Error: $_" -ForegroundColor Red
    if ($_.Exception.Response) {
        $stream = $_.Exception.Response.GetResponseStream()
        $reader = New-Object System.IO.StreamReader($stream)
        $details = $reader.ReadToEnd()
        Write-Host "Details: $details" -ForegroundColor Red
    }
}
