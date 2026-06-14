// 纹理管理
// 处理纹理上传、缓存和生命周期管理

(function() {
  var textureManager = {};
  var texCache = new Map();
  var uploadQueue = [];
  var processing = false;
  var bridge = null;

  textureManager.setBridge = function(b) { bridge = b; };

  // 从 HTMLImageElement/Canvas 上传纹理
  textureManager.uploadFromSource = function(id, source) {
    var canvas = document.createElement('canvas');
    canvas.width = source.width || source.naturalWidth || 256;
    canvas.height = source.height || source.naturalHeight || 256;
    var ctx = canvas.getContext('2d');
    ctx.drawImage(source, 0, 0);
    var imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    texCache.set(id, { width: canvas.width, height: canvas.height, data: imageData.data });

    if (bridge) bridge.uploadTexture(id, canvas.width, canvas.height, imageData.data);
    return id;
  };

  // 从 PIXI Texture 上传
  textureManager.uploadFromPIXITexture = function(id, pixiTexture) {
    if (!pixiTexture) return;
    var base = pixiTexture.baseTexture || pixiTexture;
    var src = base.resource?.source || pixiTexture.source;
    if (src) return textureManager.uploadFromSource(id, src);

    // 后备：从 canvas 读取
    var width = base.width || 256;
    var height = base.height || 256;
    var canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    var ctx = canvas.getContext('2d');
    if (pixiTexture._canvas) ctx.drawImage(pixiTexture._canvas, 0, 0);
    var imageData = ctx.getImageData(0, 0, width, height);
    texCache.set(id, { width: width, height: height, data: imageData.data });
    if (bridge) bridge.uploadTexture(id, width, height, imageData.data);
  };

  // 释放纹理
  textureManager.release = function(id) {
    texCache.delete(id);
    if (bridge) bridge.removeTexture(id);
  };

  // 清空所有纹理
  textureManager.clear = function() {
    texCache.clear();
    if (bridge) bridge.clearTextures();
  };

  // 检查纹理是否存在
  textureManager.has = function(id) {
    return texCache.has(id);
  };

  window.__textureManager = textureManager;
})();
