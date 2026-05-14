/**
 * 安全模式兜底页 HTML（data URL 形式，零外部依赖，绝不再触发崩溃）。
 *
 * 设计目标：
 * - 不依赖任何文件、协议、网络、字体
 * - 不解码视频/复杂 CSS，避免再次诱发渲染崩溃
 * - 暗色调，与展厅整体风格不冲突
 * - 显眼但不刺眼：一个 logo + 一行小字提示运维
 */

const HTML = `<!doctype html>
<html lang="zh-CN">
<head>
<meta charset="utf-8" />
<title>exhi-client safe mode</title>
<style>
  html, body {
    margin: 0; padding: 0; width: 100%; height: 100%;
    background: #0a0e1a; color: #6b7a99;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    overflow: hidden; cursor: none;
    user-select: none; -webkit-user-select: none;
  }
  .stage {
    position: absolute; inset: 0;
    display: flex; align-items: center; justify-content: center;
    flex-direction: column;
  }
  .dot {
    width: 12px; height: 12px; border-radius: 50%;
    background: #4a5a8a; opacity: 0.6;
    animation: pulse 2.4s infinite ease-in-out;
  }
  .hint {
    margin-top: 24px; font-size: 14px; letter-spacing: 0.15em;
    opacity: 0.5;
  }
  @keyframes pulse {
    0%, 100% { opacity: 0.3; transform: scale(0.9); }
    50% { opacity: 0.9; transform: scale(1.1); }
  }
</style>
</head>
<body>
  <div class="stage">
    <div class="dot"></div>
    <div class="hint">SYSTEM RECOVERING</div>
  </div>
</body>
</html>`

/** 返回安全模式 data URL */
export function getSafeModeDataUrl(): string {
  return 'data:text/html;charset=utf-8,' + encodeURIComponent(HTML)
}
