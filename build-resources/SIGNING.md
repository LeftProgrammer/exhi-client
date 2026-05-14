# 代码签名说明

未签名的 EXE 在 Windows SmartScreen 下会被拦截（"未知发布者"警告 / 直接拒绝执行），
并且 electron-updater 默认会校验签名——**未签名包 OTA 升级会失败**。
生产部署前必须完成签名。

## 1. 获取证书

商用代码签名证书供应商（任选）：
- DigiCert（贵但稳，国内能用）
- GlobalSign
- Sectigo（前 Comodo）
- 国内：上海岸基、天威诚信

类型选：
- **OV 证书**（Organization Validation）—— 800~2000 元/年，初次会有"未知发布者"
  警告，需要建立信誉，建议 EV
- **EV 证书**（Extended Validation）—— 3000~8000 元/年，立即获得 Windows SmartScreen
  信任，**展厅项目强烈建议 EV**

证书会以 `.pfx`（含私钥）或硬件 USB Token（EV 通常是 Token）形式交付。

## 2. 配置 electron-builder

### 方案 A：.pfx 文件（OV 证书）

在仓库根目录创建 `.env.local`（不要 commit）：

```bash
CSC_LINK=file://D:/secure/exhi-cert.pfx
CSC_KEY_PASSWORD=你的密码
```

electron-builder 会自动识别 `CSC_LINK` / `CSC_KEY_PASSWORD`。

或在 `electron-builder.yml` 显式配：

```yaml
win:
  certificateFile: D:\secure\exhi-cert.pfx
  certificatePassword: ${env.CSC_KEY_PASSWORD}
```

### 方案 B：USB Token（EV 证书）

EV 证书私钥不出 Token，必须在签名时插入 USB。Windows 上用 `signtool` 配 token 驱动：

```yaml
win:
  signtoolOptions:
    sign: ./tools/sign-with-token.ps1
    signingHashAlgorithms:
      - sha256
    timeStampServer: http://timestamp.digicert.com
```

`tools/sign-with-token.ps1` 自己实现（不同 token 厂商驱动语法不同）：

```powershell
param([string]$file)
& "$env:ProgramFiles\Windows Kits\10\bin\10.0.22621.0\x64\signtool.exe" `
  sign /n "Your Org Name" /tr http://timestamp.digicert.com /td sha256 /fd sha256 /v $file
```

## 3. 验证签名

打包后用 PowerShell：

```powershell
Get-AuthenticodeSignature "build\智慧展厅客户端-1.0.0-x64.exe"
```

期望输出 `Status : Valid`、`SignerCertificate` 有内容。

```powershell
signtool verify /pa /v "build\智慧展厅客户端-1.0.0-x64.exe"
```

## 4. CI 签名（可选）

GitHub Actions / 内部 CI 签名可参考 [electron-builder code signing 文档](https://www.electron.build/code-signing)，
把 PFX base64 加密后存仓库 secret，CI 运行时 decode 到临时文件。
EV 证书一般不上 CI，因为 USB Token 物理依赖。

## 5. 未签名的应急路径

测试期间想跳过签名（仅 dev / 内部测试）：

```bash
# 打包时跳过签名步骤
set CSC_IDENTITY_AUTO_DISCOVERY=false
npm run dist
```

但这样的包：
- Windows 装机时弹"未知发布者"
- OTA 升级会被 electron-updater 拒签（除非 publishOptions.requireUpdateSignature=false，
  但这样就失去了 OTA 防篡改的意义）

**正式部署前必须签名。这一步通常在交付前 1-2 周启动，证书购买流程会卡时间。**
