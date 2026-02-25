$baseUrl = "http://localhost:3000/api/agent"
$apiKey = "it-monitor-secret-key-2024" # Matching config.json for initial test

function Test-Endpoint {
    param($path, $body, $label)
    Write-Host "`nTest Case: $label" -ForegroundColor Cyan
    try {
        $headers = @{
            "Content-Type" = "application/json"
            "x-api-key" = $apiKey
        }
        $response = Invoke-RestMethod -Uri "$baseUrl$path" -Method Post -Body ($body | ConvertTo-Json -Depth 10) -Headers $headers -ErrorAction Stop
        Write-Host "Success: " -NoNewline; $response | ConvertTo-Json
    } catch {
        Write-Host "Error (Expected if invalid): " -ForegroundColor Yellow -NoNewline
        $_.ErrorDetails.Message | Write-Host
    }
}

# --- 1. Test Report API ---

# Valid Report
$validReport = @{
    hostname = "TEST-PC-01"
    ip_address = "192.168.1.100"
    cpu_usage = 45.5
    ram_total = 16384
    ram_used = 8192
    ram_usage = 50.0
    disk_total = 512000
    disk_used = 256000
    disk_usage = 50.0
}
Test-Endpoint "/report" $validReport "Valid Agent Report"

# Invalid Report (Missing Required Fields)
$invalidReport = @{
    hostname = "TEST-PC-01"
    # cpu_usage missing
}
Test-Endpoint "/report" $invalidReport "Invalid Agent Report (Missing cpu_usage)"

# --- 2. Test Message API ---

# Valid Message
$validMessage = @{
    hostname = "TEST-PC-01"
    message = "Hello from Test Agent"
    ip_address = "192.168.1.100"
}
Test-Endpoint "/message" $validMessage "Valid Agent Message"

# Invalid Message (Invalid Field Type)
$invalidMessage = @{
    hostname = "TEST-PC-01"
    message = 12345 # Should be string
}
Test-Endpoint "/message" $invalidMessage "Invalid Agent Message (Bad data type)"
