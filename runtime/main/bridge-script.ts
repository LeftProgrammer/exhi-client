/**
 * exhibitBridge：注入到展项 HTML（iframe）的浏览器侧脚本。
 *
 * 项目包里的 HTML 通过 <script src="exhi-pkg://pkg/__exhi__/bridge.js"></script> 引入。
 * 协议处理器（protocol.ts）拦截该路径并返回此文件内容。
 *
 * 实现机制：iframe ←postMessage→ 父 WebRenderer ←IPC→ 主进程。
 *
 * 公开 API（window.exhibitBridge）：
 *   dispatch(cmd)              → Promise<{ok, error?}>
 *   emit(name, payload)        → 单向上报
 *   on(name, cb)               → 订阅客户端事件，返回 unsubscribe
 *   getInfo()                  → 同步返回 BootInfo 摘要（先 await ready）
 *   resolveAsset(rel)          → 把相对路径解析为绝对 URL
 *   ready: Promise<void>       → 等待 bridge 与父就绪
 *
 * 允许 dispatch 的指令白名单与父端 WebRenderer 一致：
 *   cmd.gotoScene / cmd.play / cmd.pause / cmd.seek / cmd.volume / cmd.reload / cmd.macro
 */
export const BRIDGE_SCRIPT = `
(function () {
  if (window.exhibitBridge) return;

  var pending = new Map();
  var listeners = new Map();
  var info = null;
  var readyResolve;
  var readyPromise = new Promise(function (r) { readyResolve = r; });

  function postToParent(msg) {
    try { parent.postMessage(msg, '*'); } catch (e) { console.warn('[exhibitBridge] postMessage 失败', e); }
  }

  function randomId() {
    return Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 8);
  }

  window.addEventListener('message', function (e) {
    var data = e.data;
    if (!data || typeof data !== 'object' || data._exhi == null) return;
    switch (data._exhi) {
      case 'info':
        info = data.info;
        if (readyResolve) { readyResolve(); readyResolve = null; }
        break;
      case 'dispatch-result':
        var p = pending.get(data.id);
        if (p) { pending.delete(data.id); p.resolve(data); }
        break;
      case 'event':
        var cbs = listeners.get(data.name) || [];
        for (var i = 0; i < cbs.length; i++) {
          try { cbs[i](data.payload); } catch (err) { console.warn('[exhibitBridge] 订阅回调出错', err); }
        }
        break;
    }
  });

  // 启动：通知父端我已就绪，请下发 info
  postToParent({ _exhi: 'hello' });

  window.exhibitBridge = {
    ready: readyPromise,

    dispatch: function (cmd) {
      return new Promise(function (resolve) {
        var id = randomId();
        pending.set(id, { resolve: resolve });
        postToParent({ _exhi: 'dispatch', id: id, cmd: cmd });
        // 5s 超时兜底
        setTimeout(function () {
          if (pending.has(id)) {
            pending.delete(id);
            resolve({ ok: false, error: 'timeout' });
          }
        }, 5000);
      });
    },

    emit: function (name, payload) {
      postToParent({ _exhi: 'emit', name: name, payload: payload });
    },

    on: function (name, cb) {
      var arr = listeners.get(name) || [];
      arr.push(cb);
      listeners.set(name, arr);
      return function () {
        var current = listeners.get(name) || [];
        var idx = current.indexOf(cb);
        if (idx >= 0) {
          current.splice(idx, 1);
          listeners.set(name, current);
        }
      };
    },

    getInfo: function () { return info; },

    resolveAsset: function (rel) {
      try { return new URL(rel, location.href).toString(); }
      catch (e) { return rel; }
    }
  };
})();
`
