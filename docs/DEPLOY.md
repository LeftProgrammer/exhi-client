# 部署指南

面向运维人员，把展示端落到生产 Windows 设备的全过程。

---

## 1. 硬件与 Windows 准备

### 1.1 系统设置（每台机器一次）

- **Windows 版本**：10/11 x64，建议专业版或 IoT 企业版
- **电源**：控制面板 → 电源选项 → 永不睡眠、永不关闭显示器
- **更新**：暂停 Windows 自动更新（设置 → Windows 更新 → 高级选项 → 暂停 5 周）
- **网络**：固定 IP；关闭网卡省电（设备管理器 → 网络适配器 → 属性 → 高级 → 关闭节能）
- **任务栏**：右键任务栏 → 任务栏设置 → 自动隐藏
- **通知**：关闭"获取来自应用和其他发送者的通知"

### 1.2 显示器命名（多屏环境强烈推荐）

Windows 设置 → 系统 → 显示器 → 标识 → 给每块屏命名（如 `wall` / `touch-1`）。
`displays.json` 的 `match.label` 即可对应。

### 1.3 关闭误触功能

- 关闭 Cortana、新闻和兴趣
- 关闭无障碍工具（取消粘滞键提示等）
- 关闭家长控制时间锁

---

## 2. 安装客户端

### 2.1 拷贝安装包

把 `智慧展厅客户端-1.0.0-x64.exe`（NSIS 安装包）拷到目标机器，双击安装。

或者用免安装版：把 `build/win-unpacked/` 整个目录拷过去，直接跑 `智慧展厅客户端.exe`。

### 2.2 创建 settings.json（可选）

位置：`%APPDATA%\exhi-client\settings.json`

```json
{
  "hubUrl": "wss://hub.your-domain.com/ws",
  "hubToken": "device-token-001",
  "hubSecret": "",
  "enableSign": false,
  "updateFeedUrl": "https://content.your-domain.com/runtime",
  "updateChannel": "stable",
  "autoCheckUpdate": true
}
```

不创建也能跑（进入 Standalone 模式）。

### 2.3 拷贝项目包

两种方式：

**A. 预置**：把项目包目录拷到 `%APPDATA%\exhi-client\packages\slot-a\`，然后建 `current.txt` 内容是 `slot-a`。

**B. 远程推送**：让中控发 `cmd.package.update {url}` 即可（首次启动会自动拉）。

---

## 3. Kiosk 模式（生产必备）

防止观众/讲解员误操作退出客户端、看到桌面。

### 方法 A：Windows 分配的访问（Assigned Access，Pro/Enterprise）

设置 → 帐户 → 家庭和其他用户 → 设置一台 Kiosk
- 创建一个本地账户 `exhi`
- 应用：选择"智慧展厅客户端"
- 重启后，登录 `exhi` 账户自动全屏启动客户端，按 Win+L 也无法切走

### 方法 B：Shell Launcher（Windows 10/11 IoT/Enterprise）

PowerShell（管理员）：
```powershell
$path = "${env:ProgramFiles}\智慧展厅客户端\智慧展厅客户端.exe"
$user = "exhi"
$config = @"
<?xml version="1.0" encoding="utf-8" ?>
<ShellLauncherConfiguration xmlns="http://schemas.microsoft.com/ShellLauncher/2018/Configuration">
  <Profiles>
    <Profile ID="{24A2342F-7849-4D2E-9D9D-5E8C9D3C9B81}">
      <Shell Shell="$path" />
    </Profile>
  </Profiles>
  <Configs>
    <Config>
      <Account Name="$user"/>
      <Profile ID="{24A2342F-7849-4D2E-9D9D-5E8C9D3C9B81}"/>
    </Config>
  </Configs>
</ShellLauncherConfiguration>
"@
# 应用配置（需要 Set-ShellLauncher cmdlet）
```

### 方法 C：直接放启动文件夹（最简单，但不防退出）

Win+R → `shell:startup` → 把客户端快捷方式拖进去。

---

## 4. 安装 Guardian（强烈建议）

主进程崩溃时自动拉起。

```powershell
# 管理员 PowerShell
cd "C:\Program Files\智慧展厅客户端\guardian"
.\install-task.ps1 -ClientExe "C:\Program Files\智慧展厅客户端\智慧展厅客户端.exe"

# 立刻启动
Start-ScheduledTask -TaskName ExhiClientGuardian
```

任务以 SYSTEM 账户运行，开机自启。

---

## 5. OTA 更新设置

### 5.1 准备发布服务器

任意 HTTP/HTTPS 静态服务器（nginx 最佳）。目录布局：

```
<root>/
  └─ runtime/
      ├─ stable/
      │   ├─ latest.yml
      │   ├─ 智慧展厅客户端-1.0.0-x64.exe
      │   └─ 智慧展厅客户端-1.0.0-x64.exe.blockmap
      └─ beta/
          └─ ...
```

### 5.2 发布新版本

```powershell
# 1. 打包
npm run dist

# 2. 推到频道目录
npm run release -- --channel=stable --out=release/

# 3. 把 release/stable/ 同步到生产服务器 nginx 目录
```

### 5.3 触发更新

中控发：
```bash
# 立即下载并安装
hub:send cmd.runtime.update --applyAt=now

# 后台下载，凌晨 4 点安装
hub:send cmd.runtime.update --applyAt=idle

# 取消挂起的安装
hub:send cmd.runtime.cancel
```

### 5.4 灰度

把少数几台设备的 `settings.json` 改成 `"updateChannel": "beta"`，剩下的留在 `"stable"`。发布时分别推到 `beta/` 和 `stable/` 目录。

---

## 6. 验收清单

部署完成后逐项确认：

- [ ] 开机后客户端 1 分钟内全屏启动
- [ ] 关掉任务栏不可见
- [ ] Alt+F4 / Win 等热键无法退出
- [ ] 拔网线测试：内容正常播放（Standalone 模式）
- [ ] 重新插网线：中控显示设备在线
- [ ] 强杀客户端进程：30 秒内 Guardian 重新拉起
- [ ] 凌晨 4 点：窗口自动 reload（看日志）
- [ ] 中控可发 `cmd.gotoScene` / `cmd.scenario.*` 控制
- [ ] 中控可看到 `evt.metrics` 实时指标
- [ ] 中控可调 `cmd.diag.screenshot` 拉取截图
- [ ] 隐藏热键（Ctrl+Shift+Alt+E ×3）可唤出诊断面板
- [ ] 切换项目包 `cmd.package.update --applyAt=idle` 凌晨自动切

---

## 7. 故障排查

### 客户端启动后黑屏

检查：
- `%APPDATA%\exhi-client\logs\main-*.log` 末尾错误
- `displays.json` 的 `defaultScene` 是否在 `scenes.json` 中存在
- 项目包内容（视频编码必须 H.264，不支持 H.265）

### 中控连不上

- `settings.json` 的 `hubUrl` 是否正确
- 防火墙 / 杀软是否拦截
- `wss://` 证书是否有效

### 远程更新失败

- 服务器 `latest.yml` 是否可访问（浏览器试 URL）
- 客户端日志的 `[updater]` 行
- 签名问题：electron-updater 默认要求 EXE 已签名，自签也行；公司 EXE 必须签名

### 视频不放

- 编码：必须 H.264 + AAC，**不支持 H.265**
- 文件路径中不要带特殊符号
- DevTools Console: `document.querySelector('video').error`

---

## 8. 联系方式

- 运维问题：内部工单
- 紧急故障：诊断面板可获取 device-id、日志
- 远程协助：可通过中控 `cmd.diag.screenshot` 拉取实时画面
