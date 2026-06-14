// BetterNemo Rust 渲染器 - 桥接层入口
// 整合 PIXI Proxy、数据序列化、纹理管理、Rust WASM

(function() {
  var bridge = {};
  var currentMode = storage.get('render_engine') || 'pixi'; // 'pixi' | 'rust'

  // ---------- Rust WASM 渲染器接口 ----------
  var wasmAvailable = false;
  var wasmLoading = false;

  bridge.init = async function(options) {
    options = options || {};
    var mode = options.mode || currentMode;

    console.log('[BN RenderBridge] 初始化，模式:', mode);

    // 1. 如果是 Rust 模式，加载 WASM
    if (mode === 'rust') {
      await bridge.ensureWasm();
    }

    // 2. 设置桥接引用
    if (window.__textureManager) window.__textureManager.setBridge(bridge);
    if (window.__pixiProxy) window.__pixiProxy.setBridge(bridge);

    // 3. 初始化 PIXI Proxy
    if (window.__pixiProxy) {
      if (mode === 'rust' && wasmAvailable) window.__pixiProxy.enableRustMode();
      else window.__pixiProxy.enableTransparentMode();
      window.__pixiProxy.init();
    }

    currentMode = mode;
    window.__renderEngineMode = mode;

    // 4. 挂载到全局
    window.__renderBridge = bridge;
    console.log('[BN RenderBridge] 就绪，当前引擎:', mode);
  };

  // ---------- WASM 加载 ----------
  bridge.ensureWasm = async function() {
    if (wasmAvailable) return;
    if (wasmLoading) return;
    wasmLoading = true;
    try {
      await bridge.loadWasm();
      wasmAvailable = true;
      console.log('[BN RenderBridge] WASM 渲染器已加载');
    } catch(e) {
      console.warn('[BN RenderBridge] WASM 加载失败:', e.message);
      wasmAvailable = false;
    } finally {
      wasmLoading = false;
    }
  };

  bridge.loadWasm = async function() {
    if (window.__bnRenderer) return;
    try {
      var wasm = await import('/wasm/bn_renderer.js');
      window.__bnRenderer = wasm;
      // 等待 canvas 出现后初始化
      var canvas = await bridge.waitForCanvas();
      if (canvas) {
        await wasm.init_renderer(canvas);
        // 设置初始尺寸
        var w = canvas.width || canvas.clientWidth || 480;
        var h = canvas.height || canvas.clientHeight || 360;
        wasm.resize(w, h);
      }
    } catch(e) {
      throw new Error('WASM 加载失败: ' + e.message);
    }
  };

  bridge.waitForCanvas = function(timeout) {
    timeout = timeout || 10000;
    return new Promise(function(resolve) {
      var start = Date.now();
      var check = function() {
        var c = document.getElementById('theatre') || document.querySelector('#theatre_container canvas') || document.querySelector('canvas');
        if (c && c.getContext) { resolve(c); return; }
        if (Date.now() - start > timeout) { resolve(null); return; }
        requestAnimationFrame(check);
      };
      check();
    });
  };

  // ---------- 引擎切换 ----------
  bridge.switchEngine = async function(engine) {
    if (engine === currentMode) return true;

    console.log('[BN RenderBridge] 切换引擎:', currentMode, '->', engine);

    if (engine === 'rust') {
      await bridge.ensureWasm();
      if (!wasmAvailable) {
        console.warn('[BN RenderBridge] Rust 引擎不可用，无法切换');
        return false;
      }
    }

    currentMode = engine;
    window.__renderEngineMode = engine;
    storage.set('render_engine', engine);

    // 更新 PIXI Proxy 模式
    if (window.__pixiProxy) {
      if (engine === 'rust' && wasmAvailable) {
        window.__pixiProxy.enableRustMode();
      } else {
        window.__pixiProxy.enableTransparentMode();
      }
    }

    console.log('[BN RenderBridge] 引擎已切换到:', engine);
    return true;
  };

  bridge.getEngine = function() {
    return currentMode;
  };

  // ---------- Rust 渲染器方法（WASM 可用时） ----------
  bridge.updateSprites = function(json) {
    if (currentMode !== 'rust') return;
    if (window.__bnRenderer && window.__bnRenderer.update_sprites) {
      try { window.__bnRenderer.update_sprites(json); } catch(e) {}
    }
  };

  bridge.renderFrame = function() {
    if (currentMode !== 'rust') return;
    if (window.__bnRenderer && window.__bnRenderer.render_frame) {
      try { window.__bnRenderer.render_frame(); } catch(e) {}
    }
  };

  bridge.uploadTexture = function(id, width, height, pixels) {
    if (currentMode !== 'rust') return;
    if (window.__bnRenderer && window.__bnRenderer.upload_texture) {
      try {
        var bytes = new Uint8Array(pixels.buffer || pixels);
        window.__bnRenderer.upload_texture(id, width, height, bytes);
      } catch(e) {}
    }
  };

  bridge.removeTexture = function(id) {
    if (window.__bnRenderer && window.__bnRenderer.remove_texture) {
      try { window.__bnRenderer.remove_texture(id); } catch(e) {}
    }
  };

  bridge.clearTextures = function() {
    if (window.__bnRenderer && window.__bnRenderer.clear_textures) {
      try { window.__bnRenderer.clear_textures(); } catch(e) {}
    }
  };

  // ---------- 调整大小 ----------
  bridge.resize = function(width, height) {
    if (window.__bnRenderer && window.__bnRenderer.resize) {
      try { window.__bnRenderer.resize(width, height); } catch(e) {}
    }
  };

  // ---------- 状态查询 ----------
  bridge.isWasmReady = function() { return wasmAvailable; };
  bridge.isWasmLoading = function() { return wasmLoading; };
  bridge.getMode = function() { return currentMode; };

  // ---------- 自动初始化 ----------
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() { bridge.init(); });
  } else {
    setTimeout(function() { bridge.init(); }, 3000);
  }

  window.__renderBridge = bridge;
})();
