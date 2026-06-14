// 数据序列化层
// 将 PIXI Proxy 收集的脏数据序列化为 WASM 可接收格式

(function() {
  var serializer = {};

  // 精灵数据序列化
  serializer.serializeSprites = function(spriteDataArray) {
    return JSON.stringify(spriteDataArray);
  };

  // 纹理上传数据序列化
  serializer.serializeTexture = function(id, width, height, pixels) {
    return {
      id: id,
      width: width,
      height: height,
      pixels: pixels,
    };
  };

  // 将精灵数据按纹理 ID 分组（批处理优化）
  serializer.groupByTexture = function(spriteDataArray) {
    var groups = {};
    for (var i = 0; i < spriteDataArray.length; i++) {
      var s = spriteDataArray[i];
      var tid = s.texture_id || 0;
      if (!groups[tid]) groups[tid] = [];
      groups[tid].push(s);
    }
    return groups;
  };

  // 转换坐标：从 PIXI 坐标系（左上角原点）到 WebGPU 坐标系
  serializer.transformBounds = function(sprite, viewWidth, viewHeight) {
    return {
      x: (sprite.x / viewWidth) * 2 - 1,
      y: 1 - (sprite.y / viewHeight) * 2,
      width: (sprite.width * sprite.scale_x) / viewWidth * 2,
      height: (sprite.height * sprite.scale_y) / viewHeight * 2,
    };
  };

  window.__dataSerializer = serializer;
})();
