Write-Host "Booting AERO Microservices + Dashboard in Background..." -ForegroundColor Green

# Use the script's own directory so relative paths always resolve correctly
$root = $PSScriptRoot
if (-not $root) { $root = Split-Path -Parent $MyInvocation.MyCommand.Path }

$services = @(
    @{ Name="Auth"; Dir="backend\auth-service"; Cmd="node.exe"; Args="server.js" },
    @{ Name="Track"; Dir="backend\tracking-service"; Cmd="node.exe"; Args="server.js" },
    @{ Name="Real"; Dir="backend\realtime-service"; Cmd="node.exe"; Args="server.js" },
    @{ Name="Gate"; Dir="backend\api-gateway"; Cmd="node.exe"; Args="server.js" },
    @{ Name="Dash"; Dir="frontend"; Cmd="cmd.exe"; Args="/c npm run dev" }
)

foreach ($s in $services) {
    Write-Host "Starting $($s.Name)..." -ForegroundColor Yellow
    $workingDir = "$root\$($s.Dir)"
    
    # Using Start-Process to ensure the processes stay alive after this session ends
    Start-Process -FilePath $s.Cmd -ArgumentList $s.Args -WorkingDirectory $workingDir -NoNewWindow
}

Write-Host ""
Write-Host "All services started in background!" -ForegroundColor Cyan
Write-Host ""
Write-Host "Access Links:" -ForegroundColor Green
Write-Host "  - Dashboard:        http://localhost:3000" -ForegroundColor White
Write-Host "  - API Gateway:     http://localhost:5010" -ForegroundColor White
Write-Host "  - Auth Service:    http://localhost:5001" -ForegroundColor Gray
Write-Host "  - Tracking:         http://localhost:5002" -ForegroundColor Gray
Write-Host ""
Write-Host "Use 'Get-Process -Name node, cmd' to verify they are running." -ForegroundColor Yellow
Write-Host ""
