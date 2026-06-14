param(
    [ValidateSet("smoke", "ai", "full")]
    [string]$Suite = "smoke",

    [ValidateSet("auto", "maven", "docker")]
    [string]$Runtime = "auto",

    [string]$OutputDir
)

$ErrorActionPreference = "Stop"
$PSNativeCommandUseErrorActionPreference = $false

$repoRoot = (Resolve-Path (Join-Path $PSScriptRoot "..\..\..")).Path
$serverRoot = Join-Path $repoRoot "server"
$timestamp = Get-Date -Format "yyyyMMdd-HHmmss"

if ([string]::IsNullOrWhiteSpace($OutputDir)) {
    $OutputDir = Join-Path $env:TEMP "sidepick-harness\backend\$Suite-$timestamp"
}

New-Item -ItemType Directory -Force -Path $OutputDir | Out-Null
$logPath = Join-Path $OutputDir "harness.log"
$reportPath = Join-Path $OutputDir "report.json"

$suiteMap = @{
    smoke = @(
        "HealthControllerTest"
        "AuthApiIntegrationTest"
        "AdminLatencyMetricsApiIntegrationTest"
        "CategoryApiIntegrationTest"
        "ExperienceApiIntegrationTest"
    )
    ai = @(
        "AgentAApiIntegrationTest"
        "ExperienceAiIntegrationTest"
        "AnalysisApiIntegrationTest"
        "StatsApiIntegrationTest"
        "ChatbotApiIntegrationTest"
        "ChatbotGuardrailPersistenceIntegrationTest"
    )
}

$tests = switch ($Suite) {
    "smoke" { $suiteMap.smoke }
    "ai" { $suiteMap.ai }
    "full" { $suiteMap.smoke + $suiteMap.ai }
}

$testSelector = ($tests -join ",")

function Format-CommandArg {
    param([string]$Value)

    if ($null -eq $Value) {
        return '""'
    }

    if ($Value -match '[\s"]') {
        return '"' + ($Value -replace '"', '\"') + '"'
    }

    return $Value
}

function Invoke-HarnessCommand {
    param(
        [string[]]$CommandArgs,
        [string]$LogPath
    )

    $commandLine = ($CommandArgs | ForEach-Object { Format-CommandArg $_ }) -join " "
    cmd.exe /c "$commandLine 2>&1" | Tee-Object -FilePath $LogPath -Append | Out-Null
    return [int]$LASTEXITCODE
}

function Resolve-HarnessRuntime {
    param([string]$RequestedRuntime)

    if ($RequestedRuntime -eq "maven") {
        if (-not (Get-Command mvn -ErrorAction SilentlyContinue)) {
            throw "Runtime 'maven' requested but 'mvn' is not available in PATH."
        }
        return "maven"
    }

    if ($RequestedRuntime -eq "docker") {
        return "docker"
    }

    if (Get-Command mvn -ErrorAction SilentlyContinue) {
        return "maven"
    }

    return "docker"
}

$resolvedRuntime = Resolve-HarnessRuntime -RequestedRuntime $Runtime
$startedAt = Get-Date

"[$($startedAt.ToString("s"))] backend harness start suite=$Suite runtime=$resolvedRuntime tests=$testSelector" |
    Tee-Object -FilePath $logPath

Push-Location $serverRoot
try {
    if ($resolvedRuntime -eq "maven") {
        $exitCode = Invoke-HarnessCommand -CommandArgs @(
            "mvn"
            "-Dtest=$testSelector"
            "test"
        ) -LogPath $logPath
    }
    else {
        $exitCode = Invoke-HarnessCommand -CommandArgs @(
            "docker"
            "run"
            "--rm"
            "-v"
            "${repoRoot}:/workspace"
            "-w"
            "/workspace/server"
            "maven:3.9.9-eclipse-temurin-17"
            "mvn"
            "-Dtest=$testSelector"
            "test"
        ) -LogPath $logPath
    }
}
finally {
    Pop-Location
}

$finishedAt = Get-Date
$status = if ($exitCode -eq 0) { "passed" } else { "failed" }

$report = [ordered]@{
    suite = $Suite
    runtime = $resolvedRuntime
    status = $status
    exitCode = $exitCode
    startedAt = $startedAt.ToString("o")
    finishedAt = $finishedAt.ToString("o")
    durationSeconds = [math]::Round(($finishedAt - $startedAt).TotalSeconds, 2)
    tests = $tests
    testSelector = $testSelector
    logPath = $logPath
}

$report | ConvertTo-Json -Depth 4 | Set-Content -Path $reportPath -Encoding UTF8

Write-Host "Harness status: $status"
Write-Host "Log: $logPath"
Write-Host "Report: $reportPath"

exit $exitCode
