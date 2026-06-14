// .bn (BetterNemo Project) 格式处理
// 容器：ZIP 归档
// 结构：
//   bcm.json          — BCM 作品数据
//   extensions.json   — 扩展元数据（可选）
//   material/         — 素材文件（图片、音频等）
//
// 加载时自动将 material/ 路径替换为 blob URL，
// 并将原始 blob 缓存于 bcm.__materials 供重新导出。

(function() {
  var _jszip = null;
  function getJSZip() {
    if (_jszip) return Promise.resolve(_jszip);
    return new Promise(function(resolve, reject) {
      if (window.JSZip) { _jszip = window.JSZip; resolve(_jszip); return; }
      var s = document.createElement('script');
      s.src = 'jszip.min.js';
      s.onload = function() { _jszip = window.JSZip; resolve(_jszip); };
      s.onerror = reject;
      document.head.appendChild(s);
    });
  }

  // 导入 .bn 文件 → { bcm, data }
  window.loadBNProject = async function(file) {
    var JSZip = await getJSZip();
    var zip = await JSZip.loadAsync(file);

    var bcmFile = zip.file('bcm.json');
    if (!bcmFile) throw new Error('无效 .bn 文件：缺少 bcm.json');
    var bcm = JSON.parse(await bcmFile.async('string'));

    var extFile = zip.file('extensions.json');
    if (extFile) {
      try { bcm.__extensions = JSON.parse(await extFile.async('string')); } catch(e) {}
    }

    // 提取 material/ 下的文件
    var materialBlobs = {};
    var pending = [];
    zip.forEach(function(path, entry) {
      if (entry.dir) return;
      var m = path.match(/^material\/(.+)/);
      if (!m) return;
      pending.push(entry.async('blob').then(function(blob) {
        materialBlobs[m[1]] = blob;
      }));
    });
    await Promise.all(pending);

    // 将 material/ 路径替换为 blob URL
    var patchMaterial = function(obj) {
      if (!obj || typeof obj !== 'object') return;
      Object.keys(obj).forEach(function(k) {
        var v = obj[k];
        if (typeof v === 'string') {
          var m = v.match(/^material\/(.+)/);
          if (m && materialBlobs[m[1]]) {
            obj[k] = URL.createObjectURL(materialBlobs[m[1]]);
          }
        } else if (typeof v === 'object') {
          patchMaterial(v);
        }
      });
    };
    patchMaterial(bcm);

    // 缓存原始 blob 供导出
    bcm.__materials = materialBlobs;

    var data = {
      avatar_url: '', bcm_version: bcm.app_version || '0.16.2',
      context_menu_with_set_block_visibility: false,
      enable_hide: false, is_login: false, is_pad: false,
      nickname: '', sidebar_width: 64,
      stage_position: {
        portrait: {
          fullscreen: { bottom: 0, height: 480, left: 0, ratio: 0, right: 0, top: 0, width: 360 },
          normal: { bottom: 0, height: 0, left: 0, ratio: 0, right: 0, top: 0, width: 0 }
        }
      },
      toolbox_mode: 'normal', translucent_block_visible: 'visible',
      user_id: '', user_level: -1, user_token: '', webview_height: 0, work_id: ''
    };

    return { bcm: bcm, data: data };
  };

  // 导出当前作品为 .bn 文件
  window.saveBNProject = async function(bcm, name) {
    if (!bcm) throw new Error('没有可导出的作品');
    var JSZip = await getJSZip();
    var zip = new JSZip();

    // 收集所有需要打包的资源 URL
    var urlSet = {};
    var collect = function(obj) {
      if (!obj || typeof obj !== 'object') return;
      Object.keys(obj).forEach(function(k) {
        var v = obj[k];
        if (typeof v === 'string' && (v.startsWith('blob:') || v.startsWith('data:') || v.startsWith('http')))
          urlSet[v] = true;
        else if (typeof v === 'object')
          collect(v);
      });
    };
    collect(bcm);

    var urls = Object.keys(urlSet);
    var urlToMat = {};
    var usedNames = {};

    function extOf(url) {
      var m = url.match(/\.(\w+)(?:[?#]|$)/);
      return m ? m[1].toLowerCase() : 'bin';
    }

    // 下载/转换资源并放入 material/
    for (var i = 0; i < urls.length; i++) {
      var url = urls[i];
      try {
        var resp = await fetch(url);
        var blob = await resp.blob();
        var ext = extOf(url);
        var name;
        // 优先使用 __materials 缓存中的原名
        if (bcm.__materials) {
          for (var origName in bcm.__materials) {
            if (bcm.__materials[origName] === blob) { name = origName; break; }
          }
        }
        if (!name) {
          var uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            var r = Math.random() * 16 | 0;
            return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
          });
          name = uuid + '.' + ext;
        }
        // 去重
        if (usedNames[name]) name = Date.now() + '-' + name;
        usedNames[name] = true;

        urlToMat[url] = 'material/' + name;
        zip.file('material/' + name, blob);
      } catch(e) {
        console.warn('无法导出资源:', url, e.message);
      }
    }

    // 在 BCM 副本中将 URL 替换为 material/ 路径
    var newBcm = JSON.parse(JSON.stringify(bcm));
    (function replaceUrls(obj) {
      if (!obj || typeof obj !== 'object') return;
      Object.keys(obj).forEach(function(k) {
        var v = obj[k];
        if (typeof v === 'string' && urlToMat[v]) {
          obj[k] = urlToMat[v];
        } else if (typeof v === 'object') {
          replaceUrls(v);
        }
      });
    })(newBcm);

    // 清理内部字段
    delete newBcm.__extensions;
    delete newBcm.__materials;

    zip.file('bcm.json', JSON.stringify(newBcm));

    if (bcm.__extensions) {
      zip.file('extensions.json', JSON.stringify(bcm.__extensions));
    }

    var blob = await zip.generateAsync({ type: 'blob' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = (name || 'project') + '.bn';
    a.click();
    URL.revokeObjectURL(url);
  };
})();
