// Webpack 模块扫描器
// 在 bundle 加载后扫描模块缓存，找到 PIXI 并替换为代理

(function() {
  var scanner = {};

  scanner.findAndWrapPIXI = function() {
    if (window.__PIXI_SCANNED) return;
    window.__PIXI_SCANNED = true;

    // 遍历 webpack 模块缓存
    var webpackModules = null;

    // webpack 4.x: __webpack_require__.c
    if (window.__webpack_require__ && window.__webpack_require__.c) {
      webpackModules = window.__webpack_require__.c;
    }

    // webpack 5.x: __webpack_modules__
    if (!webpackModules && window.__webpack_modules__) {
      webpackModules = window.__webpack_modules__;
    }

    if (!webpackModules) {
      // 尝试从 bundle 内部找到模块系统
      try {
        var keys = Object.keys(window);
        for (var i = 0; i < keys.length; i++) {
          var k = keys[i];
          if (k.startsWith('webpack') && window[k] && typeof window[k] === 'object') {
            var obj = window[k];
            // webpackJsonp: { push: ..., c: {...} }
            if (obj.c && typeof obj.c === 'object') {
              webpackModules = obj.c;
              break;
            }
          }
        }
      } catch(e) {}
    }

    if (!webpackModules) {
      console.warn('[PIXI Scanner] webpack 模块系统未找到');
      return;
    }

    // 扫描每个模块的 exports 查找 PIXI
    var moduleIds = Object.keys(webpackModules);
    for (var i = 0; i < moduleIds.length; i++) {
      try {
        var mod = webpackModules[moduleIds[i]];
        var exports = mod.exports || mod;
        if (!exports || typeof exports !== 'object') continue;

        // 检查是否包含 Sprite/Container/Application
        if (exports.Sprite && exports.Container && exports.Application) {
          console.log('[PIXI Scanner] 找到 PIXI 模块:', moduleIds[i]);
          scanner.wrapPIXI(exports, moduleIds[i]);
          return;
        }

        // 检查 exports.default
        if (exports.default && exports.default.Sprite) {
          console.log('[PIXI Scanner] 找到 PIXI 模块 (default):', moduleIds[i]);
          scanner.wrapPIXI(exports.default, moduleIds[i]);
          return;
        }
      } catch(e) {}
    }

    console.warn('[PIXI Scanner] PIXI 模块未在 webpack 中找到');
  };

  scanner.wrapPIXI = function(pixiModule, moduleId) {
    if (pixiModule.__bnProxy) return;

    var bridge = window.__renderBridge;
    var sprites = [];
    var containers = [];

    // 存储原始构造函数
    var OrigSprite = pixiModule.Sprite;
    var OrigContainer = pixiModule.Container;
    var OrigApplication = pixiModule.Application;

    // 代理 Sprite
    pixiModule.Sprite = function() {
      var instance = new OrigSprite(arguments[0]);
      var id = 'sprite_' + (sprites.length);
      instance.__bnId = id;
      instance.__bnDirty = true;
      sprites.push(instance);

      // Proxy 属性变化
      ['x','y','rotation','width','height','alpha','visible'].forEach(function(p) {
        var origDesc = Object.getOwnPropertyDescriptor(OrigSprite.prototype, p);
        if (origDesc) {
          var origGet = origDesc.get;
          var origSet = origDesc.set;
          Object.defineProperty(instance, p, {
            get: function() { return origGet.call(this); },
            set: function(v) {
              origSet.call(this, v);
              this.__bnDirty = true;
            },
            configurable: true,
          });
        }
      });

      return instance;
    };
    pixiModule.Sprite.prototype = OrigSprite.prototype;
    pixiModule.Sprite.__bnProxy = true;

    // 对于透明模式，也包装 Container
    pixiModule.Container = function() {
      var instance = new OrigContainer();
      instance.__bnId = 'container_' + (containers.length);
      containers.push(instance);
      return instance;
    };
    pixiModule.Container.prototype = OrigContainer.prototype;
    pixiModule.Container.__bnProxy = true;

    // 帧收集器
    function collectDirty() {
      var data = [];
      for (var i = 0; i < sprites.length; i++) {
        var s = sprites[i];
        if (s.__bnDirty && s.transform) {
          data.push({
            id: s.__bnId,
            texture_id: s.texture ? (s.texture.uid || 0) % 10000 : 0,
            x: s.transform.position ? s.transform.position.x : s.x,
            y: s.transform.position ? s.transform.position.y : s.y,
            rotation: s.rotation || 0,
            scale_x: s.scale ? s.scale.x : 1,
            scale_y: s.scale ? s.scale.y : 1,
            visible: s.visible !== false,
            width: s.width || (s.texture ? s.texture.width : 100),
            height: s.height || (s.texture ? s.texture.height : 100),
            alpha: s.alpha || 1,
          });
          s.__bnDirty = false;
        }
      }
      if (data.length > 0 && bridge && bridge.isWasmReady()) {
        bridge.updateSprites(JSON.stringify(data));
      }
    }

    // 每帧收集
    if (!window.__bnFrameLoop) {
      window.__bnFrameLoop = true;
      (function loop() {
        requestAnimationFrame(loop);
        collectDirty();
      })();
    }

    console.log('[PIXI Scanner] PIXI 代理已激活,', sprites.length, 'sprites');
  };

  // 自动扫描（在 bundle 加载后）
  scanner.autoScan = function() {
    var attempts = 0;
    function tryScan() {
      if (attempts++ > 20) return;
      if (window.__renderBridge && window.__renderBridge.isWasmReady()) {
        scanner.findAndWrapPIXI();
      } else if (window.PIXI && window.PIXI.Sprite) {
        var proxy = window.__pixiProxy;
        if (proxy) { proxy.init(); return; }
      } else {
        // 继续等待
        setTimeout(tryScan, 1000);
      }
    }
    setTimeout(tryScan, 2000);
  };

  window.__pixiScanner = scanner;
})();
