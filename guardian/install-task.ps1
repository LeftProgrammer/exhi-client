# install-task.ps1
# 把 Guardian 注册为 Windows 任务计划，开机自启 + 失败自动重试。
#
# 用法（需管理员）：
#   .\install-task.ps1 -ClientExe "C:\Program Files\智慧展厅客户端\智慧展厅客户端.exe"
#
# 卸载：
#   Unregister-ScheduledTask -TaskName ExhiClientGuardian -Confirm:$false

[CmdletBinding()]
param(
  [Parameter(Mandatory=$true)]
  [string]$ClientExe,

  [string]$TaskName = 'ExhiClientGuardian',
  [int]$StaleMs = 30000,
  [int]$CheckMs = 10000
)

$ErrorActionPreference = 'Stop'

$nodeExe = (Get-Command node -ErrorAction SilentlyContinue)?.Source
if (-not $nodeExe) {
  Write-Error "未找到 node.exe，请先安装 Node.js 或修改脚本指向打包后的 guardian.exe"
  exit 1
}

$guardianScript = Join-Path $PSScriptRoot 'guardian.mjs'
if (-not (Test-Path $guardianScript)) {
  Write-Error "guardian.mjs 不存在: $guardianScript"
  exit 1
}

if (-not (Test-Path $ClientExe)) {
  Write-Error "ClientExe 不存在: $ClientExe"
  exit 1
}

Write-Host "安装 Guardian 任务"
Write-Host "  TaskName    : $TaskName"
Write-Host "  Node        : $nodeExe"
Write-Host "  Guardian    : $guardianScript"
Write-Host "  Client EXE  : $ClientExe"

$action = New-ScheduledTaskAction `
  -Execute $nodeExe `
  -Argument "`"$guardianScript`"" `
  -WorkingDirectory (Split-Path $guardianScript)

$trigger = New-ScheduledTaskTrigger -AtStartup

$envVars = @{
  EXHI_CLIENT_EXE = $ClientExe
  EXHI_STALE_MS   = "$StaleMs"
  EXHI_CHECK_MS   = "$CheckMs"
}

# 任务计划本身没有环境变量字段，写到 -Argument 里更简单
$argLine = "`"$guardianScript`""
$action = New-ScheduledTaskAction `
  -Execute $nodeExe `
  -Argument $argLine `
  -WorkingDirectory (Split-Path $guardianScript)

# 用包装 cmd 注入环境变量
$cmdExe = Join-Path $env:SystemRoot 'System32\cmd.exe'
$wrappedArg = "/c set EXHI_CLIENT_EXE=$ClientExe&& set EXHI_STALE_MS=$StaleMs&& set EXHI_CHECK_MS=$CheckMs&& `"$nodeExe`" `"$guardianScript`""
$action = New-ScheduledTaskAction -Execute $cmdExe -Argument $wrappedArg

$principal = New-ScheduledTaskPrincipal -UserId 'SYSTEM' -RunLevel Highest

$settings = New-ScheduledTaskSettingsSet `
  -AllowStartIfOnBatteries `
  -DontStopIfGoingOnBatteries `
  -StartWhenAvailable `
  -RestartCount 99 `
  -RestartInterval (New-TimeSpan -Minutes 1)

if (Get-ScheduledTask -TaskName $TaskName -ErrorAction SilentlyContinue) {
  Write-Host "任务已存在，先注销"
  Unregister-ScheduledTask -TaskName $TaskName -Confirm:$false
}

Register-ScheduledTask `
  -TaskName $TaskName `
  -Action $action `
  -Trigger $trigger `
  -Principal $principal `
  -Settings $settings `
  -Description 'exhi-client Guardian: 监控并自动重启展厅客户端' | Out-Null

Write-Host "任务已安装。立刻启动：" -ForegroundColor Green
Write-Host "  Start-ScheduledTask -TaskName $TaskName"
Write-Host "查看状态：" -ForegroundColor Green
Write-Host "  Get-ScheduledTask -TaskName $TaskName | Get-ScheduledTaskInfo"
