import { exec } from 'node:child_process'
import { promisify } from 'node:util'
import { app } from 'electron'
import { logger } from './logger'

const pExec = promisify(exec)

/**
 * 主进程系统级 action 执行。
 *
 * 通过 PowerShell 调 .NET COM 接口 IAudioEndpointVolume 控制 Windows 主音量。
 * 用 -EncodedCommand 传 base64 避免 shell 引号灾难。
 */

export interface SystemActionResult {
  ok: boolean
  error?: string
  data?: Record<string, unknown>
}

/** 用 PowerShell 跑一段脚本（避开引号转义噩梦） */
async function runPwsh(script: string): Promise<{ stdout: string; stderr: string }> {
  // PowerShell 的 -EncodedCommand 需要 UTF-16LE Base64
  const encoded = Buffer.from(script, 'utf16le').toString('base64')
  return pExec(`powershell -NoProfile -ExecutionPolicy Bypass -EncodedCommand ${encoded}`, {
    windowsHide: true,
    timeout: 8000
  })
}

const VOL_CSHARP = `
$Csharp = @"
using System.Runtime.InteropServices;
[Guid("5CDF2C82-841E-4546-9722-0CF74078229A"), InterfaceType(ComInterfaceType.InterfaceIsIUnknown)]
interface IAudioEndpointVolume {
  int f(); int g(); int h(); int i();
  int SetMasterVolumeLevelScalar(float fLevel, System.Guid pguidEventContext);
  int j();
  int GetMasterVolumeLevelScalar(out float pfLevel);
  int k(); int l(); int m(); int n();
  int SetMute([MarshalAs(UnmanagedType.Bool)] bool bMute, System.Guid pguidEventContext);
  int GetMute(out bool pbMute);
}
[Guid("D666063F-1587-4E43-81F1-B948E807363F"), InterfaceType(ComInterfaceType.InterfaceIsIUnknown)]
interface IMMDevice { int Activate(ref System.Guid id, int clsCtx, int activationParams, [MarshalAs(UnmanagedType.IUnknown)] out object aIface); }
[Guid("A95664D2-9614-4F35-A746-DE8DB63617E6"), InterfaceType(ComInterfaceType.InterfaceIsIUnknown)]
interface IMMDeviceEnumerator { int f(); int GetDefaultAudioEndpoint(int dataFlow, int role, out IMMDevice endpoint); }
[ComImport, Guid("BCDE0395-E52F-467C-8E3D-C4579291692E")] class MMDeviceEnumeratorComObject { }
public class Audio {
  static IAudioEndpointVolume Vol() {
    var e = new MMDeviceEnumeratorComObject() as IMMDeviceEnumerator;
    IMMDevice dev = null; e.GetDefaultAudioEndpoint(0, 1, out dev);
    var IID = typeof(IAudioEndpointVolume).GUID; object o; dev.Activate(ref IID, 23, 0, out o);
    return o as IAudioEndpointVolume;
  }
  public static void SetVolume(float lvl) { Vol().SetMasterVolumeLevelScalar(lvl, System.Guid.Empty); }
  public static float GetVolume() { float lvl; Vol().GetMasterVolumeLevelScalar(out lvl); return lvl; }
}
"@
Add-Type -TypeDefinition $Csharp
`.trim()

export async function setSystemVolume(value: number): Promise<SystemActionResult> {
  const v = Math.max(0, Math.min(1, value))
  const script = `${VOL_CSHARP}\n[Audio]::SetVolume(${v.toFixed(4)})`
  try {
    await runPwsh(script)
    return { ok: true, data: { value: v } }
  } catch (e) {
    const msg = (e as Error).message
    logger.warn('setSystemVolume PowerShell 失败:', msg)
    return { ok: false, error: msg.split('\n')[0] }
  }
}

export async function getSystemVolume(): Promise<number | null> {
  const script = `${VOL_CSHARP}\n[Audio]::GetVolume()`
  try {
    const { stdout } = await runPwsh(script)
    const v = parseFloat(stdout.trim())
    return Number.isFinite(v) ? v : null
  } catch (e) {
    logger.warn('getSystemVolume 失败:', (e as Error).message)
    return null
  }
}

/** 重启 Windows 系统（默认 10 秒缓冲） */
export async function rebootSystem(delaySec = 10): Promise<SystemActionResult> {
  try {
    await pExec(`shutdown /r /t ${delaySec} /c "exhi-client requested reboot"`, {
      windowsHide: true
    })
    return { ok: true, data: { delaySec } }
  } catch (e) {
    return { ok: false, error: (e as Error).message.split('\n')[0] }
  }
}

/** 关机 */
export async function shutdownSystem(delaySec = 10): Promise<SystemActionResult> {
  try {
    await pExec(`shutdown /s /t ${delaySec} /c "exhi-client requested shutdown"`, {
      windowsHide: true
    })
    return { ok: true, data: { delaySec } }
  } catch (e) {
    return { ok: false, error: (e as Error).message.split('\n')[0] }
  }
}

/** 取消 reboot/shutdown 倒计时 */
export async function abortShutdown(): Promise<SystemActionResult> {
  try {
    await pExec('shutdown /a', { windowsHide: true })
    return { ok: true }
  } catch (e) {
    return { ok: false, error: (e as Error).message.split('\n')[0] }
  }
}

/** 重启客户端自身 */
export function restartApp(): SystemActionResult {
  logger.info('restartApp: 即将重启客户端')
  setTimeout(() => {
    app.relaunch()
    app.exit(0)
  }, 200)
  return { ok: true }
}

// ============ 路由表 ============

export interface SystemActionInvoke {
  action: string
  params: Record<string, unknown>
}

export async function runSystemAction(invoke: SystemActionInvoke): Promise<SystemActionResult> {
  const { action, params } = invoke
  switch (action) {
    case 'system.setVolume':
      return setSystemVolume(Number(params.value ?? 1))
    case 'system.reboot':
      return rebootSystem(Number(params.delaySec ?? 10))
    case 'system.shutdown':
      return shutdownSystem(Number(params.delaySec ?? 10))
    case 'system.abortShutdown':
      return abortShutdown()
    case 'system.restartApp':
      return restartApp()
    default:
      return { ok: false, error: `unknown system action: ${action}` }
  }
}
