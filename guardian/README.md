# exhi-client Guardian

独立守护进程，监控主客户端心跳文件并在异常时重启客户端 EXE。

## 工作原理

```
主客户端                                Guardian
  │ 每 5 秒写 heartbeat.txt              │ 每 10 秒检查 mtime
  │ pid + ts + runtime info              │
  ▼                                      ▼
  %APPDATA%/exhi-client/heartbeat.txt    判断：mtime > 30s ago?
                                          │
                                          ├─ 是 → spawn(client.exe)
                                          └─ 否 → 跳过
```

主客户端正常退出时会**删除** heartbeat.txt，Guardian 见文件不存在也会拉起，**这是对首次开机/手动关闭后的恢复机制**。

## 开发期测试

不需要安装 Windows 任务，直接命令行跑：

```powershell
# 用打包后的 EXE 路径
$env:EXHI_CLIENT_EXE = "E:\path\to\智慧展厅客户端.exe"
node guardian/guardian.mjs
```

测试方法：
1. 启动 Guardian
2. 启动客户端
3. 用任务管理器强杀客户端进程
4. 30 秒内应看到 Guardian 输出"重启客户端: 心跳过期 ..."
5. 客户端被自动拉起

## 生产部署

需要管理员权限的 PowerShell：

```powershell
cd guardian
.\install-task.ps1 -ClientExe "C:\Program Files\智慧展厅客户端\智慧展厅客户端.exe"

# 立即启动
Start-ScheduledTask -TaskName ExhiClientGuardian
```

任务以 SYSTEM 账户运行，开机自启，崩溃 1 分钟后自动重启。

### 卸载

```powershell
Unregister-ScheduledTask -TaskName ExhiClientGuardian -Confirm:$false
```

## 参数

| 环境变量 | 默认 | 说明 |
|---|---|---|
| `EXHI_CLIENT_EXE` | （必填） | 客户端 EXE 绝对路径 |
| `EXHI_USERDATA` | `%APPDATA%/exhi-client` | userData 目录 |
| `EXHI_STALE_MS` | `30000` | 心跳超时阈值（毫秒） |
| `EXHI_CHECK_MS` | `10000` | 巡检间隔（毫秒） |

## 日志

- 重启记录：`%APPDATA%/exhi-client/guardian-restarts.log`
- Guardian 自身日志：stdout（任务计划场景下被丢弃；自己跑会显示）

## 后续可选演进

- 用 [nssm](https://nssm.cc/) 或 `sc.exe` 包装为真正的 Windows Service
- 用 Node SEA 把 guardian.mjs 编译成单 EXE，部署不再依赖 node.exe
