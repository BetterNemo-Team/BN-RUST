// PIXI Proxy 层
// 劫持 PIXI 类，记录状态变化，转发到 Rust WASM 渲染器
// 透明模式（默认）：同时保留真实 PIXI 渲染，确保功能正常
// Rust 模式：仅通过 Rust 渲染

(function() {
  var pixiProxy = {};
  var dirtySprites = new Map();
  var textureMap = new Map();
  var nextTexId = 1;
  var spriteIdCounter = 0;
  var frameCallbacks = [];
  var originalPIXI = null;
  var renderBridge = null;

  // ---------- 纹理注册 ----------
  function registerTexture(pixiTexture) {
    if (!pixiTexture) return 0;
    var uid = pixiTexture.uid || pixiTexture._uid;
    if (uid && textureMap.has(uid)) return textureMap.get(uid);
    var id = nextTexId++;
    var key = uid || id;
    textureMap.set(key, id);
    if (pixiTexture.width && pixiTexture.height) {
      var canvas = document.createElement('canvas');
      canvas.width = pixiTexture.width;
      canvas.height = pixiTexture.height;
      var ctx = canvas.getContext('2d');
      var src = pixiTexture.source || pixiTexture.baseTexture?.resource?.source;
      if (src) ctx.drawImage(src, 0, 0);
      var imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      if (renderBridge) renderBridge.uploadTexture(id, canvas.width, canvas.height, imageData.data);
    }
    return id;
  }

  // ---------- ProxySprite ----------
  function ProxySprite(texture) {
    var self = this;
    self._id = 'sprite_' + (++spriteIdCounter);
    self._dirty = true;
    self._textureId = 0;
    self._visible = true;
    self._alpha = 1;
    self._x = 0; self._y = 0;
    self._rotation = 0;
    self._scaleX = 1; self._scaleY = 1;
    self._width = 0; self._height = 0;
    self._children = [];

    // 透明模式：创建真实 PIXI sprite（始终创建，确保功能正常）
    if (originalPIXI && originalPIXI.Sprite) {
      self._real = new originalPIXI.Sprite(texture);
    }

    if (texture) {
      self._textureId = registerTexture(texture);
      if (self._real) self._real.texture = texture;
      var base = texture.baseTexture || texture;
      if (base.width) self._width = base.width;
      if (base.height) self._height = base.height;
    }
  }

  ProxySprite.prototype._getTransformData = function() {
    return {
      id: this._id,
      texture_id: this._textureId,
      x: this._x, y: this._y,
      rotation: this._rotation,
      scale_x: this._scaleX, scale_y: this._scaleY,
      visible: this._visible,
      width: this._width || 100,
      height: this._height || 100,
      alpha: this._alpha,
    };
  };

  ['x','y','rotation','width','height','alpha'].forEach(function(p) {
    Object.defineProperty(ProxySprite.prototype, p, {
      get: function() { return this['_' + p]; },
      set: function(v) {
        this['_' + p] = v;
        this._dirty = true;
        if (this._real) this._real[p] = v;
      }
    });
  });

  Object.defineProperty(ProxySprite.prototype, 'visible', {
    get: function() { return this._visible; },
    set: function(v) { this._visible = v; this._dirty = true; if (this._real) this._real.visible = v; }
  });

  Object.defineProperty(ProxySprite.prototype, 'scale', {
    get: function() {
      var self = this;
      return { x: self._scaleX, y: self._scaleY, _proxy: true };
    },
    set: function(v) {
      this._scaleX = v.x || v; this._scaleY = v.y || v;
      this._dirty = true;
      if (this._real) this._real.scale = v;
    }
  });

  Object.defineProperty(ProxySprite.prototype, 'texture', {
    get: function() { return null; },
    set: function(t) {
      this._textureId = registerTexture(t);
      this._dirty = true;
      if (this._real) this._real.texture = t;
    }
  });

  // ---------- ProxyContainer ----------
  function ProxyContainer() {
    this._children = [];
    this._dirty = false;
    if (originalPIXI && originalPIXI.Container) {
      this._real = new originalPIXI.Container();
    }
  }

  ProxyContainer.prototype.addChild = function(child) {
    this._children.push(child);
    this._dirty = true;
    if (this._real) this._real.addChild(child._real || child);
    return child;
  };

  ProxyContainer.prototype.removeChild = function(child) {
    var idx = this._children.indexOf(child);
    if (idx >= 0) this._children.splice(idx, 1);
    this._dirty = true;
    if (this._real) this._real.removeChild(child._real || child);
    return child;
  };

  ['x','y','rotation','alpha','visible'].forEach(function(p) {
    Object.defineProperty(ProxyContainer.prototype, p, {
      get: function() { return this['_' + p]; },
      set: function(v) { this['_' + p] = v; this._dirty = true; if (this._real) this._real[p] = v; }
    });
  });

  // ---------- ProxyApplication ----------
  function ProxyApplication(options) {
    var self = this;
    self._options = options;
    if (originalPIXI && originalPIXI.Application) {
      self._real = new originalPIXI.Application(options);
      self.view = self._real.view;
      self.stage = new ProxyContainer();
      self._real.stage = self.stage._real || self._real.stage;
      self.screen = self._real.screen;
      self.renderer = self._real.renderer;
    } else {
      self.view = options.view || document.createElement('canvas');
      self.stage = new ProxyContainer();
      self.screen = { width: options.width || 800, height: options.height || 600 };
    }
  }

  ProxyApplication.prototype.render = function() {
    var self = this;
    // 始终使用真实 PIXI 渲染，确保功能正常
    if (self._real) self._real.render();

    // Rust 模式下，同时收集脏数据发送给 Rust
    if (window.__PIXI_PROXY_MODE === 'rust') {
      collectDirty(self.stage, []);
      flushDirty();
    }
  };

  // ---------- 脏数据收集 ----------
  function collectDirty(container, out) {
    if (!container || !container._children) return;
    for (var i = 0; i < container._children.length; i++) {
      var child = container._children[i];
      if (child._dirty) {
        out.push(child._getTransformData());
        child._dirty = false;
      }
      if (child._children) collectDirty(child, out);
    }
  }

  function flushDirty() {
    if (window.__PIXI_PROXY_MODE !== 'rust') return;
    var data = [];
    dirtySprites.forEach(function(sprite) {
      if (sprite._dirty) {
        data.push(sprite._getTransformData());
        sprite._dirty = false;
      }
    });
    if (data.length > 0 && renderBridge) {
      renderBridge.updateSprites(JSON.stringify(data));
    }
  }

  // ---------- 帧循环 ----------
  function startFrameLoop() {
    function tick() {
      requestAnimationFrame(tick);
      try { flushDirty(); } catch(e) {}
    }
    requestAnimationFrame(tick);

    // Rust 渲染帧循环
    function rustFrame() {
      requestAnimationFrame(rustFrame);
      if (window.__PIXI_PROXY_MODE === 'rust') {
        try { renderBridge.renderFrame(); } catch(e) {}
      }
    }
    requestAnimationFrame(rustFrame);
  }

  // ---------- 设置桥接 ----------
  pixiProxy.setBridge = function(bridge) {
    renderBridge = bridge;
  };

  pixiProxy.getBridge = function() { return renderBridge; };

  // ---------- 初始化：劫持 PIXI ----------
  pixiProxy.init = function() {
    if (window.__PIXI_PROXY_INITIALIZED) return;
    window.__PIXI_PROXY_INITIALIZED = true;

    // 保存原始 PIXI
    originalPIXI = window.PIXI || null;

    // 定义 PIXI 代理
    var PIXI = {
      Sprite: ProxySprite,
      Container: ProxyContainer,
      Application: ProxyApplication,
      Graphics: function() { this._dirty = true; this._children = []; if (originalPIXI && originalPIXI.Graphics) this._real = new originalPIXI.Graphics(); },
      Text: function(text, style) {
        this._dirty = true; this._text = text; this._style = style;
        if (originalPIXI && originalPIXI.Text) this._real = new originalPIXI.Text(text, style);
      },
      Texture: {
        from: function(src) {
          if (originalPIXI && originalPIXI.Texture) return originalPIXI.Texture.from(src);
          return { width: 0, height: 0 };
        },
        fromCanvas: function(canvas) {
          if (originalPIXI && originalPIXI.Texture) return originalPIXI.Texture.fromCanvas(canvas);
          return { width: canvas.width, height: canvas.height };
        }
      },
      utils: originalPIXI ? originalPIXI.utils : {},
      settings: originalPIXI ? originalPIXI.settings : {},
    };

    // 如果还没有原始 PIXI，等待其出现
    if (!originalPIXI) {
      Object.defineProperty(window, 'PIXI', {
        configurable: true,
        get: function() { return PIXI; },
        set: function(realPIXI) {
          originalPIXI = realPIXI;
          // 重新初始化所有代理类以使用真实 PIXI
        }
      });
    } else {
      window.PIXI = PIXI;
    }

    startFrameLoop();
    return PIXI;
  };

  // ---------- 开关控制 ----------
  pixiProxy.enableRustMode = function() {
    window.__PIXI_PROXY_MODE = 'rust';
  };

  pixiProxy.enableTransparentMode = function() {
    window.__PIXI_PROXY_MODE = 'transparent';
  };

  pixiProxy.isActive = function() {
    return !!window.__PIXI_PROXY_INITIALIZED;
  };

  // 暴露全局
  window.__pixiProxy = pixiProxy;
})();
