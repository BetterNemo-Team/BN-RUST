window.BetterNemoVersion = BetterNemoVersion
console.log(
  "\n%c  Welcome to ❤ BetterNemo - " +
  BetterNemoVersion +
  " ❤ for Nemo o(*￣▽￣*)ブ  %c \n\n",
  "border-radius: 5px; padding: 2px; font-weight: bold;" +
  "background-color: #20A5C4; font-size: 16px; color: white;",
  ""
);
function hook(id, name, getThis = false) {
  var ready = false;
  var map = new Map();
  var proxy = {
    configurable: true,
    get: function () {
      return map.get(this);
    },
    set: function (value) {
      map.set(this, value);
      if (!getThis) window[name] = value;
      else window[name] = this;
      ready = true;
      return void 0;
    },
  };
  Object.defineProperty(Object.prototype, id, proxy);
}
hook("./src/webview/runtime/index.ts", "HookRuntime");
hook("./src/common/redux/index.ts", "HookRedux");
hook("./node_modules/@crc/stage/build/core/actors/brush.js", "HookBrush");
hook("./node_modules/@crc/stage/build/core/utils/index.js", "HookUtils");
hook("./node_modules/@crc/blink/dist/core/di/index.js", "HookDi");
hook("./node_modules/@crc/stage/build/core/scenes/scene.js", "HookScene");
hook("./src/i18n/zh_CN.ts", "HookMsgZhCN");
hook("./src/webview/bridge/index.ts", "HookBridge");
hook("./src/webview/bridge/messages.ts", "HookBridgeMsg");
hook("./node_modules/@crc/heart/build/opti/compiler.js", "HookOptiCompiler");
hook("./node_modules/@crc/stage/build/core/physics/actor_body.js", "HookActorBody");
hook("./node_modules/dsbridge/index.js", "HookDsbridge");
hook("./node_modules/@crc/blink/dist/core/singletons/theme.js", "HookTheme");


// --------------- Player检测 & 加载动画 ---------------
const PLAYER = (new URLSearchParams(window.location.search)).get('player');
if (PLAYER)
  (async function () {
    while (!document['body']) await new Promise(resolve => setTimeout(resolve, 100));
    document.body.insertAdjacentHTML("afterbegin", `<div class="loader-mask"><div class="loader">${'<div class="text"><span>Better Nemo</span></div>'.repeat(9)}<div class="line"></div></div></div>`);
  })();
function hideLoader() {
  if (!document.querySelector(".loader-mask")) return;
  document.querySelector(".loader-mask").style.display = "none";
}
function setLoaderInfo(info, id = 1) {
  if (!document.querySelector(".loader")) return;
  if (!document.querySelector(`.loader > .info.info-${id}`))
    document.querySelector(".loader").insertAdjacentHTML("beforeend",
      `<div class="info info-${id}" style="top:calc(50% + ${20 + id * 20}px)"><span>${info}</span></div>`);
  document.querySelector(`.loader > .info.info-${id}`).innerHTML = `<span>${info}</span>`;
}

// --------------- 环境检测 ---------------
function isPhoneTestEnv() {
  if (PLAYER) return false;
  return !navigator.userAgent.includes('__TEST_ENV__') && BetterNemoVersion === "999999.99";
}
function isPCTestEnv() {
  return navigator.userAgent.includes('__TEST_ENV__') && BetterNemoVersion === "999999.99";
}
function isCloudflareEnv() {
  return window.location.hostname == 'bn-p.pages.dev';
}
// --------------- Webview调试服务器 ---------------
let debugServer = { send: () => { } };
if (isPhoneTestEnv()) {
  debugServer = new WebSocket("ws://192.168.1.11:1234");
  function reconnect() {
    console.log('重连');
    debugServer = new WebSocket("ws://192.168.1.11:1234");
    debugServer.onclose = reconnect;
  };
  debugServer.onclose = reconnect;
}
// --------------- 工具函数 ---------------
function extensionMgrLog(...msg) {
  console.log(
    `%c BetterNemo %c %c 扩展管理 %c ${msg.join(' ')}`,
    'border-radius:5px;padding:2px;font-weight:bold;background: #20A5C4;color:white;', '',
    'border-radius:5px;padding:2px;font-weight:bold;background: #20A5C4;color:white;', ''
  );
}
function extensionMgrError(...msg) {
  console.log(
    `%c BetterNemo %c %c 扩展管理 %c ${msg.join(' ')}`,
    'border-radius:5px;padding:2px;font-weight:bold;background: #ff0000;color:white;', '',
    'border-radius:5px;padding:2px;font-weight:bold;background: #ff0000;color:white;', ''
  );
}
function get_run_mgr() {
  if (!window['HookRuntime']) return;
  return HookRuntime.exports.get_webview_runtime().heart.runtime_manager.run_mgr;
}
function loadScript(src) {
  // if (isCloudflareEnv())
  //     src = `https://gitee.com/oldsquaw/better-nemo/raw/main/${src}`;
  if (isPhoneTestEnv())
    src = `http://192.168.1.11:8080/${src}`;
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = src;
    script.onload = resolve;
    script.onerror = reject;
    document.head.appendChild(script);
  });
}
function loadStyle(src) {
  // if (isCloudflareEnv())
  //     src = `https://gitee.com/oldsquaw/better-nemo/raw/main/${src}`;
  if (isPhoneTestEnv())
    src = `http://192.168.1.11:8080/${src}`;
  return new Promise((resolve, reject) => {
    const style = document.createElement('link');
    style.rel = 'stylesheet';
    style.type = 'text/css';
    style.classList.add('bn-theme');
    style.href = src;
    style.onload = resolve;
    style.onerror = reject;
    document.head.appendChild(style);
  });
}
loadStyle('style.css');
  // --------------- 电脑端测试编辑器时隐藏舞台 ---------------
  function showStage() {
    document.body.classList.add('running');
  }
  function hideStage() {
    document.body.classList.remove('running');
  }
  window.showStage = showStage;
  window.hideStage = hideStage;
// --------------- 扩展、主题数据初始化 ---------------
let extensionMetaData = {};
window.extensionMetaData = extensionMetaData;
let themeMetaData = {};
// --------------- 加载页面 ---------------
(async () => {
  console.log('[Stage:ext-loader] 开始加载页面, stageOnly=' + !!window.__STAGE_ONLY__);
  setLoaderInfo('获取扩展列表...');
  await loadScript('extensions/_CONFIG.js');
  extensionMgrLog('扩展列表:', EXTENSION_FILES.join(', '));
  setLoaderInfo('获取主题列表...');
  await loadScript('theme/_CONFIG.js');
  extensionMgrLog('主题列表:', THEME_FILES.join(', '));
  setLoaderInfo('初始化存储...');
  await loadScript('workspace-scripts/storage.js');
  // 预启用经典主题（必须在 utils.js 之前）
  try {
    let cfg = storage.get('theme_config') || {};
    if (cfg['classic'] === undefined) cfg['classic'] = true;
    if (cfg['default'] === undefined) cfg['default'] = false;
    storage.set('theme_config', cfg);
  } catch(e) {}
  await loadScript('workspace-scripts/utils.js');
  setLoaderInfo('加载核心脚本...');
  console.log('[Stage:ext-loader] 加载 workspace.bundle...');
  // workspace.bundle 在首帧渲染后加载，减少首帧阻塞
  requestAnimationFrame(function() {
    requestAnimationFrame(function() {
      if (isCloudflareEnv())
        loadScript('https://db0l8fnn8oqtof.database.nocode.cn/storage/v1/object/public/wenjian/anonymous/177220279682_q1jamqn6clr.js');
      else loadScript('workspace.bundle.106e91c62fadbbb3c3b7.js').then(function() {
        console.log('[Stage:ext-loader] workspace.bundle 加载完成');
        // workspace.bundle 加载后，dsbridge 注册了新的处理器
        // 重新绑定 window.postMsg/postMsgAsyn 指向最新的处理器
        // 原版由 native 端做 JSON.parse，桌面端需要手动解析
        if (window._dsf && typeof window._dsf.postMessage === 'function') {
          var origSync = window._dsf.postMessage;
          window.postMsg = function(type, data) {
            if (typeof data === 'string') {
              try { data = JSON.parse(data); } catch(e) {}
            }
            return origSync(type, data);
          };
          console.log('[Stage:ext-loader] window.postMsg 已重新绑定');
        }
        if (window._dsaf && typeof window._dsaf.postMessageAsyn === 'function') {
          var origAsync = window._dsaf.postMessageAsyn;
          window.postMsgAsyn = function(type, data, callback) {
            if (typeof data === 'string') {
              try { data = JSON.parse(data); } catch(e) {}
            }
            return origAsync(type, data, callback);
          };
          console.log('[Stage:ext-loader] window.postMsgAsyn 已重新绑定');
        }
      }).catch(function(e) {
        console.error('[Stage:ext-loader] workspace.bundle 加载失败:', e);
      });
    });
  });
  setLoaderInfo('加载扩展脚本...');
  var stageOnly = !!window.__STAGE_ONLY__;
  console.log('[Stage:ext-loader] 加载扩展脚本, stageOnly=' + stageOnly);
  await Promise.all([
    loadScript('workspace-scripts/blocks.js'),
    loadScript('workspace-scripts/prototype-inject.js'),
    stageOnly ? Promise.resolve() : loadScript('workspace-scripts/toolbox.js'),
    loadScript('workspace-scripts/domain-functions.js'),
    loadScript('workspace-scripts/cat-block.js'),
    stageOnly ? Promise.resolve() : loadScript('workspace-scripts/menu.js'),
    stageOnly ? Promise.resolve() : loadScript('workspace-scripts/settings.js'),
    loadScript('workspace-scripts/bn-format.js'),
    stageOnly ? Promise.resolve() : loadScript('workspace-scripts/dev-panel.js'),
    loadScript('render-bridge/pixi-proxy.js'),
    loadScript('render-bridge/data-serializer.js'),
    loadScript('render-bridge/texture-manager.js'),
    loadScript('render-bridge/pixi-scanner.js'),
    loadScript('render-bridge/index.js'),
  ]);
  console.log('[Stage:ext-loader] 所有脚本加载完成');

  if (!stageOnly) {
  // 设置关闭按钮
  setTimeout(() => {
    document.getElementById('settingsCloseBtn')?.addEventListener('click', () => {
      document.getElementById('settingsDialog').open = false;
    });
  }, 0);
  // 设置按钮
  setTimeout(() => {
    var settingsBtn = document.getElementById('settingsBtn');
    if (settingsBtn) {
      settingsBtn.onclick = function() {
        if (window.openSettings) openSettings();
      };
    }
  }, 1000);
  }


  // 舞台弹出窗口
  var stageWin = null;
  var stageBC = null;
  function setupStageBC() {
    if (stageBC) return;
    stageBC = new BroadcastChannel('bn-stage');
    stageBC.onmessage = function(e) {
      if (e.data === 'closed') { stageWin = null; return; }
      if (e.data === 'ready') {
        if (stageBC) { try { stageBC.postMessage('stop'); } catch(e) {} }
        return;
      }
    };
  }
  function openStageWindow() {
    if (stageWin && !stageWin.closed) { stageWin.focus(); return; }
    setupStageBC();
    var stageUrl = 'stage.html';
    // 尝试 Tauri API
    try {
      if (window.__TAURI__ && window.__TAURI__.window) {
        var WebviewWindow = window.__TAURI__.window.WebviewWindow;
        stageWin = new WebviewWindow('stage', {
          url: stageUrl,
          width: 480, height: 640,
          title: 'BetterNemo - 舞台',
          center: true, resizable: true,
        });
        stageWin.once('tauri://error', function() { stageWin = null; });
        return;
      }
    } catch(e) {}
    // 降级：window.open（当前页面在 bn/ 目录下，直接用 stage.html）
    try {
      stageWin = window.open(stageUrl, 'bn-stage-win', 'width=480,height=640,resizable=1');
    } catch(e) {}
  }
  window.showStage = function() { openStageWindow(); };
  window.hideStage = function() {
    if (stageWin && !stageWin.closed) {
      try { stageWin.close(); } catch(e) {}
    }
    stageWin = null;
  };
  if (!stageOnly) {
  // 缓存的元素引用
  var cached = {};
  // 设置顶栏偏移（CSS !important 为主，此处仅首次检测）
  (function() {
    var topH = 40;
    var DEFAULT_BG = 'res/bn_background.webp';
    var DEFAULT_CLR = '#1a1a2e';
    // 修复旧缓存：替换 gitee 远程地址为本地路径
    var oldBg = storage.get('backgroundImage');
    if (oldBg && oldBg.indexOf('gitee.com') !== -1) {
      storage.set('backgroundImage', DEFAULT_BG);
    }
    // 确保首次加载时默认值写入 storage
    if (!storage.get('backgroundImage')) storage.set('backgroundImage', DEFAULT_BG);
    if (!storage.get('backgroundColor')) storage.set('backgroundColor', DEFAULT_CLR);
    function apply() {
      var inj = cached.inj;
      if (!inj) return;
      inj.style.top = topH + 'px';
      inj.style.height = 'calc(100% - ' + topH + 'px)';
      if (cached.tb) cached.tb.style.top = '0';
      if (cached.svg) cached.svg.style.top = '0';
      if (cached.flyout) cached.flyout.style.top = '5px';
    }
    // 背景更新
    function applyBg() {
      var inj = cached.inj;
      if (!inj) return;
      var bgImg = storage.get('backgroundImage');
      var bgClr = storage.get('backgroundColor');
      inj.style.setProperty('background-image', 'url("' + (bgImg || DEFAULT_BG) + '")', 'important');
      inj.style.setProperty('background-size', 'cover', 'important');
      inj.style.setProperty('background-position', 'center', 'important');
      inj.style.setProperty('background-repeat', 'no-repeat', 'important');
      inj.style.setProperty('background-color', bgClr || DEFAULT_CLR, 'important');
    }
    // MutationObserver 仅检测 injectionDiv 出现（找到后立即断开）
    var obs = new MutationObserver(function(muts) {
      for (var i = 0; i < muts.length; i++) {
        var added = muts[i].addedNodes;
        for (var j = 0; j < added.length; j++) {
          var n = added[j];
          if (n.nodeType !== 1) continue;
          var el = n.matches && n.matches('.injectionDiv') ? n : n.querySelector('.injectionDiv');
          if (el) {
            cached.inj = el;
            cached.tb = document.querySelector('.blocklyToolboxDiv');
            cached.svg = document.querySelector('.blocklySvg');
            cached.flyout = document.querySelector('.blocklyFlyout');
            apply();
            applyBg();
            obs.disconnect();
            return;
          }
        }
      }
    });
    var root = document.body || document.documentElement;
    if (root) obs.observe(root, { childList: true, subtree: true });
    // 监听背景变更事件（由 settings.js 触发）
    window.addEventListener('bn-bg-changed', applyBg);
    // 兜底：若 10s 后 injectionDiv 仍未出现，恢复 interval 轮询
    var fallbackTimer = setTimeout(function() {
      if (cached.inj) return;
      var iv = setInterval(function() {
        var el = document.querySelector('.injectionDiv');
        if (el) {
          cached.inj = el;
          cached.tb = document.querySelector('.blocklyToolboxDiv');
          cached.svg = document.querySelector('.blocklySvg');
          cached.flyout = document.querySelector('.blocklyFlyout');
          apply();
          applyBg();
          clearInterval(iv);
        }
      }, 500);
    }, 10000);
  })();

  // 键盘快捷键
  document.addEventListener('keydown', function(e) {
    // F5 / Ctrl+Enter → 打开舞台窗口（由舞台窗口自动运行）
    if (e.key === 'F5' || (e.ctrlKey && e.key === 'Enter')) {
      e.preventDefault();
      if (window.showStage) showStage();
      return;
    }
    // Escape → 关闭下拉菜单 / 舞台
    if (e.key === 'Escape') {
      var panel = document.getElementById('menuPanel');
      if (panel && panel.classList.contains('active')) {
        panel.classList.remove('active');
        e.preventDefault(); return;
      }
      if (stageWin) {
        if (window.hideStage) hideStage();
        e.preventDefault(); return;
      }
      return;
    }
    // Ctrl+Shift+S → 设置
    if (e.ctrlKey && e.shiftKey && e.key === 'S') {
      e.preventDefault();
      var btn = document.getElementById('settingsBtn');
      if (btn) btn.click();
      return;
    }
  });
  setLoaderInfo('资源加载完成！');
  // --------------- 拖放导入作品 ---------------
  (function() {
    var dragEnterCount = 0;
    var overlay;
    function showOverlay() {
      if (!overlay) {
        overlay = document.createElement('div');
        overlay.className = 'bn-drop-overlay';
      }
      if (!overlay.parentNode) document.body.appendChild(overlay);
      overlay.style.display = 'flex';
    }
    function hideOverlay() {
      if (overlay) overlay.style.display = 'none';
    }
    document.addEventListener('dragenter', function(e) {
      e.preventDefault();
      dragEnterCount++;
      showOverlay();
    });
    document.addEventListener('dragover', function(e) {
      e.preventDefault();
    });
    document.addEventListener('dragleave', function(e) {
      e.preventDefault();
      dragEnterCount--;
      if (dragEnterCount <= 0) { dragEnterCount = 0; hideOverlay(); }
    });
    document.addEventListener('drop', function(e) {
      e.preventDefault();
      dragEnterCount = 0;
      hideOverlay();
      var files = e.dataTransfer.files;
      if (!files || files.length === 0) return;
      var file = files[0];
      if (!file.name.match(/\.(bcm|json|bnlink|bn)$/i)) {
        alert('请拖入 .bcm/.json/.bnlink/.bn 格式的作品文件');
        return;
      }
      if (window.loadProjectFile) {
        window.loadProjectFile(file, function(res) {
          if (res.error) alert('导入失败：' + res.error);
        });
      }
    });
  })();
  } // end if (!stageOnly)
  /**
  window.parent.postMessage({
    "__bn_bridge__": true,
    "direction": "webview->host",
    "api": "_dsbridge.call",
    "args": [
      "postMessageSyn",
      "{\"data\":\"{\\\"type\\\":\\\"SHOW_TOAST\\\",\\\"payload\\\":{\\\"text\\\":\\\"网络异常，无法获取当前云变量的值111\\\"}}\"}"
    ],
    "method": "postMessageSyn",
    "arg": {
      "data": "{\"type\":\"SHOW_TOAST\",\"payload\":{\"text\":\"网络异常，无法获取当前云变量的值111\"}}"
    },
    "callbackId": null
   }, '*');
   */
})();
function getBrowserVersion() { return parseInt((new UAParser()).getResult().browser.version); }

