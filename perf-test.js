// BetterNemo 舞台性能测试脚本
// 在编辑器控制台(F12)中粘贴执行，或在舞台窗口控制台执行

(function() {
  console.log('=== BetterNemo 性能测试 ===');

  var NUM_SPRITES = 50;
  var TEST_DURATION = 10000; // 10秒

  // 等待运行时就绪
  function waitForRuntime(cb) {
    try {
      var mgr = get_run_mgr();
      if (mgr && typeof mgr.start === 'function') {
        cb(mgr);
        return;
      }
    } catch(e) {}
    setTimeout(function() { waitForRuntime(cb); }, 500);
  }

  waitForRuntime(function(mgr) {
    console.log('[PerfTest] 运行时就绪，开始创建', NUM_SPRITES, '个精灵...');

    // 获取当前场景
    var runtime = mgr.heart.runtime;
    var scene = runtime.scenes.get_scene('scene_1');
    if (!scene) {
      console.error('[PerfTest] 未找到 scene_1，请先打开一个作品');
      return;
    }

    var colors = ['#ff4444','#44ff44','#4444ff','#ffff44','#ff44ff','#44ffff','#ff8844','#88ff44'];
    var created = [];

    for (var i = 0; i < NUM_SPRITES; i++) {
      try {
        // 创建画笔演员
        var actor = runtime.create_actor({
          name: 'test_sprite_' + i,
          scene_id: 'scene_1',
        });

        if (actor) {
          // 设置位置
          actor.x = Math.random() * 440 - 220;
          actor.y = Math.random() * 320 - 160;
          actor.size = 20 + Math.random() * 30;
          actor.direction = Math.random() * 360;

          created.push({
            actor: actor,
            speedX: (Math.random() - 0.5) * 8,
            speedY: (Math.random() - 0.5) * 8,
          });
        }
      } catch(e) {
        console.warn('[PerfTest] 精灵', i, '创建失败:', e.message);
      }
    }

    console.log('[PerfTest] 成功创建', created.length, '个精灵，开始运动测试...');

    // FPS 计算
    var frameCount = 0;
    var lastTime = performance.now();
    var fpsHistory = [];

    function updateFPS() {
      frameCount++;
      var now = performance.now();
      if (now - lastTime >= 1000) {
        var fps = Math.round(frameCount * 1000 / (now - lastTime));
        fpsHistory.push(fps);
        console.log('[PerfTest] FPS:', fps, '| 精灵数:', created.length);
        frameCount = 0;
        lastTime = now;
      }
    }

    // 运动循环
    var startTime = Date.now();
    var animId;

    function animate() {
      if (Date.now() - startTime > TEST_DURATION) {
        cancelAnimationFrame(animId);
        printReport();
        return;
      }

      for (var i = 0; i < created.length; i++) {
        var s = created[i];
        var a = s.actor;
        a.x += s.speedX;
        a.y += s.speedY;

        // 边界反弹
        if (a.x > 220 || a.x < -220) s.speedX *= -1;
        if (a.y > 160 || a.y < -160) s.speedY *= -1;

        // 随机旋转
        a.direction += (Math.random() - 0.5) * 5;
      }

      updateFPS();
      animId = requestAnimationFrame(animate);
    }

    animId = requestAnimationFrame(animate);

    function printReport() {
      console.log('');
      console.log('=== 性能测试报告 ===');
      console.log('精灵数量:', created.length);
      console.log('测试时长:', TEST_DURATION / 1000, '秒');
      console.log('FPS 历史:', fpsHistory.join(', '));

      var avg = fpsHistory.reduce(function(a, b) { return a + b; }, 0) / fpsHistory.length;
      var min = Math.min.apply(null, fpsHistory);
      var max = Math.max.apply(null, fpsHistory);

      console.log('平均 FPS:', Math.round(avg));
      console.log('最低 FPS:', min);
      console.log('最高 FPS:', max);

      if (avg >= 55) console.log('评级: ★★★★★ 优秀');
      else if (avg >= 40) console.log('评级: ★★★★ 良好');
      else if (avg >= 25) console.log('评级: ★★★ 一般');
      else console.log('评级: ★★ 较差');

      console.log('渲染引擎:', window.__renderEngineMode || 'pixi');
      console.log('WebGPU 可用:', !!navigator.gpu);
      console.log('=== 测试结束 ===');
    }
  });
})();
