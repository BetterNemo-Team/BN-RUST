(function() {
  var panel = document.getElementById('menuPanel');
  var panelContent = panel.querySelector('.menu-panel-content');
  var activeBtn = null;

  function closePanel() { panel.classList.remove('active'); activeBtn = null; }

  document.addEventListener('click', function(e) {
    if (!panel.contains(e.target) && !e.target.closest('.top-bar-nav-btn')) closePanel();
  });

  document.querySelectorAll('.top-bar-nav-btn').forEach(function(btn) {
    btn.addEventListener('click', function(e) {
      e.stopPropagation();
      if (activeBtn === btn && panel.classList.contains('active')) { closePanel(); return; }
      activeBtn = btn;
      var menu = btn.getAttribute('data-menu');
      renderMenu(menu);
      var rect = btn.getBoundingClientRect();
      panel.style.top = (rect.bottom + 4) + 'px';
      panel.style.left = Math.max(8, Math.min(rect.left, window.innerWidth - 320)) + 'px';
      panel.classList.add('active');
    });
  });

  function renderMenu(menu) {
    panelContent.innerHTML = '';
    var frag = document.createDocumentFragment();
    switch (menu) {
      case 'run': renderRunMenu(frag); break;
      case 'extensions': renderExtensionsMenu(frag); break;
      case 'editor': renderEditorMenu(frag); break;
      case 'runtime': renderRuntimeMenu(frag); break;
      case 'more': renderMoreMenu(frag); break;
    }
    panelContent.appendChild(frag);
  }

  function renderRunMenu(frag) {
    var item = createItem('启动运行', 'play', function() {
      closePanel();
      if (window.showStage) showStage();
      try {
        var mgr = get_run_mgr();
        if (mgr && typeof mgr.start === 'function') { mgr.start(); return; }
        if (mgr && typeof mgr.run === 'function') { mgr.run(); return; }
      } catch(e) {}
    });
    frag.appendChild(item);

    var item2 = createItem('停止', 'stop', function() {
      closePanel();
      if (window.hideStage) hideStage();
      try {
        var mgr = get_run_mgr();
        if (mgr && typeof mgr.stop === 'function') { mgr.stop(); return; }
      } catch(e) {}
    });
    frag.appendChild(item2);
  }

  function renderExtensionsMenu(frag) {
    var title = document.createElement('div');
    title.className = 'menu-panel-title';
    title.textContent = '内置扩展';
    frag.appendChild(title);

    var config = storage.get('extension_config') || {};
    EXTENSION_FILES.forEach(function(fileName) {
      var match = fileName.match(/\[([^\]]+)\]/);
      var name = match ? match[1] : fileName;
      var item = createToggleItem(name, config[fileName] !== false, function(checked) {
        config[fileName] = checked;
        storage.set('extension_config', config);
      });
      frag.appendChild(item);
    });
  }

  function renderThemeMenu() {
    var title = document.createElement('div');
    title.className = 'menu-panel-title';
    title.textContent = '选择主题';
    panelContent.appendChild(title);

    var hint = document.createElement('div');
    hint.className = 'menu-panel-hint';
    hint.textContent = '切换后需刷新页面';
    panelContent.appendChild(hint);

    var config = storage.get('theme_config') || {};
    THEME_FILES.forEach(function(name) {
      var meta = themeMetaData[name];
      var label = (meta && meta.name) ? meta.name : name;
      var isOn = config[name] === true;
      var item = createToggleItem(label, isOn, function(checked) {
        if (checked) {
          Object.keys(config).forEach(function(k) { config[k] = false; });
          config[name] = true;
          storage.set('theme_config', config);
          renderThemeMenu();
        }
      });
      panelContent.appendChild(item);
    });

    var applyBtn = document.createElement('button');
    applyBtn.className = 'menu-panel-btn';
    applyBtn.textContent = '应用主题并刷新';
    applyBtn.onclick = function() { location.reload(); };
    panelContent.appendChild(applyBtn);
  }

  function renderEditorMenu(frag) {
    var title = document.createElement('div');
    title.className = 'menu-panel-title';
    title.textContent = '编辑器设置';
    frag.appendChild(title);

    // 猫块
    frag.appendChild(createToggleItem('猫块', !!storage.get('cat'), function(checked) {
      storage.set('cat', checked);
      if (checked) { if (window.enableCatBlock) enableCatBlock(); }
      else { if (window.disableCatBlock) disableCatBlock(); }
    }));

    // 积木缺口
    frag.appendChild(createToggleItem('积木缺口', !!storage.get('notch'), function(checked) {
      storage.set('notch', checked);
    }));

    // 积木盒最大宽度
    var widthItem = document.createElement('div');
    widthItem.className = 'menu-panel-item-row';
    widthItem.innerHTML = '<span>积木盒最大宽度</span>';
    var widthInput = document.createElement('input');
    widthInput.type = 'number';
    widthInput.className = 'menu-panel-input';
    widthInput.value = storage.get('flyout_max_width') || 488;
    widthInput.addEventListener('change', function() {
      storage.set('flyout_max_width', Number(widthInput.value));
    });
    widthItem.appendChild(widthInput);
    frag.appendChild(widthItem);

    // 背景
    var bgTitle = document.createElement('div');
    bgTitle.className = 'menu-panel-title';
    bgTitle.textContent = '背景';
    frag.appendChild(bgTitle);

    var presetBg = 'https://gitee.com/SandMo/BetterNemo-Extensions/raw/master/images/background/bn_background.webp';
    var presetColor = '#221D4E';

    var bgItem = document.createElement('div');
    bgItem.className = 'menu-panel-item-row';
    bgItem.innerHTML = '<span>背景模式</span>';
    var bgSelect = document.createElement('select');
    bgSelect.className = 'menu-panel-select';
    var bgVal = storage.get('background') || 'preset1';
    [['BetterNemo', 'preset1'], ['自定义', 'custom']].forEach(function(o) {
      var opt = document.createElement('option');
      opt.value = o[1]; opt.textContent = o[0];
      if (o[1] === bgVal) opt.selected = true;
      bgSelect.appendChild(opt);
    });
    bgSelect.addEventListener('change', function() {
      storage.set('background', bgSelect.value);
      if (bgSelect.value === 'preset1') {
        storage.set('backgroundImage', presetBg);
        storage.set('backgroundColor', presetColor);
      }
    });
    bgItem.appendChild(bgSelect);
    frag.appendChild(bgItem);

    if (storage.get('background') === 'custom') {
      var uploadItem = document.createElement('div');
      uploadItem.className = 'menu-panel-item-row';
      uploadItem.innerHTML = '<span>上传图片</span>';
      var fileInput = document.createElement('input');
      fileInput.type = 'file';
      fileInput.accept = 'image/*';
      fileInput.className = 'menu-panel-input';
      fileInput.style.width = 'auto';
      fileInput.addEventListener('change', function() {
        var file = fileInput.files[0];
        if (!file) return;
        var reader = new FileReader();
        reader.onload = function(e) { storage.set('backgroundImage', e.target.result); };
        reader.readAsDataURL(file);
      });
      uploadItem.appendChild(fileInput);
      frag.appendChild(uploadItem);

      var imgItem = document.createElement('div');
      imgItem.className = 'menu-panel-item-row';
      imgItem.innerHTML = '<span>图片 URL</span>';
      var imgInput = document.createElement('input');
      imgInput.type = 'text';
      imgInput.className = 'menu-panel-input';
      imgInput.value = storage.get('backgroundImage') || presetBg;
      imgInput.addEventListener('change', function() { storage.set('backgroundImage', imgInput.value); });
      imgItem.appendChild(imgInput);
      frag.appendChild(imgItem);

      var colItem = document.createElement('div');
      colItem.className = 'menu-panel-item-row';
      colItem.innerHTML = '<span>颜色</span>';
      var colInput = document.createElement('input');
      colInput.type = 'text';
      colInput.className = 'menu-panel-input';
      colInput.value = storage.get('backgroundColor') || presetColor;
      colInput.addEventListener('change', function() { storage.set('backgroundColor', colInput.value); });
      colItem.appendChild(colInput);
      frag.appendChild(colItem);
    }

    // 链接
    var linkTitle = document.createElement('div');
    linkTitle.className = 'menu-panel-title';
    linkTitle.textContent = '链接';
    frag.appendChild(linkTitle);

    frag.appendChild(createItem('导出作品包 (.bn)', 'file-archive', function() {
      closePanel();
      try {
        var bcm = window.getCurrentBCM();
        if (!bcm) { alert('无法获取当前作品数据'); return; }
        if (window.saveBNProject) window.saveBNProject(bcm, bcm.project_name || '未命名作品');
        else alert('导出功能不可用');
      } catch(ex) {
        alert('导出失败：' + ex.message);
      }
    }));
  }

  function renderRuntimeMenu(frag) {
    var title = document.createElement('div');
    title.className = 'menu-panel-title';
    title.textContent = '运行时设置';
    frag.appendChild(title);

    // 舞台引擎切换
    var engineTitle = document.createElement('div');
    engineTitle.className = 'menu-panel-title';
    engineTitle.textContent = '舞台引擎';
    frag.appendChild(engineTitle);

    var currentEngine = storage.get('render_engine') || 'pixi';

    var engineDesc = document.createElement('div');
    engineDesc.className = 'menu-panel-hint';
    engineDesc.textContent = currentEngine === 'rust' ? '当前: Rust (WebGPU)' : '当前: PIXI.js (Canvas)';
    engineDesc.id = 'engineStatusHint';
    frag.appendChild(engineDesc);

    // PIXI.js 引擎选项
    var pixiItem = createItem('PIXI.js (Canvas)', 'image', function() {
      closePanel();
      if (currentEngine === 'pixi') return;
      storage.set('render_engine', 'pixi');
      if (window.__renderBridge) {
        window.__renderBridge.switchEngine('pixi');
      }
      window.dispatchEvent(new CustomEvent('bn-engine-changed', { detail: { engine: 'pixi' } }));
    });
    if (currentEngine === 'pixi') {
      pixiItem.style.background = 'rgba(76, 175, 80, 0.2)';
      pixiItem.style.borderLeft = '3px solid #4CAF50';
    }
    frag.appendChild(pixiItem);

    // Rust 引擎选项
    var rustItem = createItem('Rust (WebGPU)', 'microchip', function() {
      closePanel();
      if (currentEngine === 'rust') return;
      storage.set('render_engine', 'rust');
      if (window.__renderBridge) {
        window.__renderBridge.switchEngine('rust').then(function(ok) {
          if (!ok) {
            alert('Rust 引擎加载失败，请检查浏览器是否支持 WebGPU');
            storage.set('render_engine', 'pixi');
          }
        });
      }
      window.dispatchEvent(new CustomEvent('bn-engine-changed', { detail: { engine: 'rust' } }));
    });
    if (currentEngine === 'rust') {
      rustItem.style.background = 'rgba(76, 175, 80, 0.2)';
      rustItem.style.borderLeft = '3px solid #4CAF50';
    }
    frag.appendChild(rustItem);

    // WASM 状态
    var statusItem = document.createElement('div');
    statusItem.className = 'menu-panel-hint';
    statusItem.style.marginTop = '8px';
    if (window.__renderBridge && window.__renderBridge.isWasmReady()) {
      statusItem.textContent = 'Rust WASM: 已就绪';
      statusItem.style.color = '#4CAF50';
    } else if (window.__renderBridge && window.__renderBridge.isWasmLoading()) {
      statusItem.textContent = 'Rust WASM: 加载中...';
      statusItem.style.color = '#FFC107';
    } else {
      statusItem.textContent = 'Rust WASM: 未加载';
      statusItem.style.color = '#9E9E9E';
    }
    frag.appendChild(statusItem);

    var hint = document.createElement('div');
    hint.className = 'menu-panel-hint';
    hint.textContent = '切换引擎后下次运行生效';
    frag.appendChild(hint);
  }

  function renderMoreMenu(frag) {
    var title = document.createElement('div');
    title.className = 'menu-panel-title';
    title.textContent = '更多';
    frag.appendChild(title);

    // 角色外观编辑器
    frag.appendChild(createItem('角色外观', 'palette', function() {
      closePanel();
      openCostumeEditor();
    }));

    // Eruda（按需动态加载）
    frag.appendChild(createItem('Eruda 调试台', 'screwdriver-wrench', function() {
      closePanel();
      if (window.eruda && window.eruda._devTools) { eruda.destroy(); return; }
      if (window.eruda) { eruda.init(); return; }
      var s = document.createElement('script');
      s.src = 'eruda.js';
      s.onload = function() { eruda.init(); };
      document.head.appendChild(s);
    }));

    // 打开舞台
    frag.appendChild(createItem('打开舞台', 'tv', function() {
      closePanel();
      if (window.showStage) showStage();
    }));

    // 导入作品
    frag.appendChild(createItem('导入作品', 'folder-open', function() {
      closePanel();
      var input = document.getElementById('importFileInput');
      if (!input) {
        input = document.createElement('input');
        input.type = 'file';
        input.id = 'importFileInput';
        input.accept = '.bcm,.json,.bnlink,.bn';
        input.style.display = 'none';
        input.addEventListener('change', function(e) {
          var file = e.target.files[0];
          if (!file) return;
          input.value = '';
          if (window.loadProjectFile) {
            window.loadProjectFile(file, function(res) {
              if (res.error) alert('导入失败：' + res.error);
            });
          }
        });
        document.body.appendChild(input);
      }
      input.click();
    }));

    // 最近作品
    var recent = window.bnCache && window.bnCache.list();
    if (recent && recent.length) {
      var sep = document.createElement('div');
      sep.className = 'menu-panel-title';
      sep.textContent = '最近作品';
      frag.appendChild(sep);
      for (var i = 0; i < Math.min(recent.length, 5); i++) {
        (function(entry) {
          frag.appendChild(createItem(entry.name, 'history', function() {
            closePanel();
            if (entry.bcm && window.loadProjectJSON) {
              window.loadProjectJSON(entry.bcm, true, function(res) {
                if (res.error) alert('加载失败：' + res.error);
              });
            }
          }));
        })(recent[i]);
      }
      frag.appendChild(createItem('清除历史', 'trash-alt', function() {
        closePanel();
        if (window.bnCache) window.bnCache.clear();
      }));
    }

    // 刷新
    frag.appendChild(createItem('刷新 Webview', 'sync-alt', function() {
      closePanel();
      location.reload();
    }));
  }

  function createItem(label, icon, onClick) {
    var el = document.createElement('div');
    el.className = 'menu-panel-item';
    el.innerHTML = '<i class="fas fa-' + icon + '"></i><span>' + label + '</span>';
    el.onclick = onClick;
    return el;
  }

  function createToggleItem(label, checked, onChange) {
    var el = document.createElement('div');
    el.className = 'menu-panel-item';
    el.innerHTML = '<span>' + label + '</span>';

    var toggle = document.createElement('label');
    toggle.className = 'menu-panel-toggle';
    var cb = document.createElement('input');
    cb.type = 'checkbox';
    cb.checked = checked;
    cb.addEventListener('change', function(e) {
      e.stopPropagation();
      onChange(cb.checked);
    });
    var slider = document.createElement('span');
    slider.className = 'menu-panel-slider';
    toggle.appendChild(cb);
    toggle.appendChild(slider);
    el.appendChild(toggle);
    return el;
  }

  // 角色外观编辑器
  function openCostumeEditor() {
    var dialog = document.getElementById('settingsDialog');
    var content = dialog.querySelector('.settings-content');
    if (!dialog || !content) return;

    content.innerHTML = '';
    var header = document.createElement('div');
    header.className = 'settings-dialog-header';
    header.innerHTML = '<span>角色外观</span>';
    content.appendChild(header);

    var body = document.createElement('div');
    body.className = 'settings-body';

    // 获取当前 BCM 数据
    var bcm = window.getCurrentBCM && window.getCurrentBCM();
    if (!bcm || !bcm.theatre || !bcm.theatre.actors) {
      body.innerHTML = '<p style="color:#999">请先打开一个作品</p>';
      content.appendChild(body);
      dialog.open = true;
      return;
    }

    var actors = bcm.theatre.actors;
    var actorIds = Object.keys(actors);
    var styles = bcm.theatre.styles || {};

    // 角色选择
    var actorTitle = document.createElement('h3');
    actorTitle.className = 'settings-section-title';
    actorTitle.textContent = '选择角色';
    body.appendChild(actorTitle);

    var actorSelect = document.createElement('select');
    actorSelect.className = 'settings-select';
    actorSelect.style.width = '100%';
    actorIds.forEach(function(id) {
      var opt = document.createElement('option');
      opt.value = id;
      opt.textContent = actors[id].name || id.substring(0, 8);
      actorSelect.appendChild(opt);
    });
    body.appendChild(actorSelect);

    // 造型展示区
    var costumeTitle = document.createElement('h3');
    costumeTitle.className = 'settings-section-title';
    costumeTitle.textContent = '造型列表';
    body.appendChild(costumeTitle);

    var costumeGrid = document.createElement('div');
    costumeGrid.style.cssText = 'display:flex;flex-wrap:wrap;gap:8px;';
    body.appendChild(costumeGrid);

    function renderCostumes(actorId) {
      costumeGrid.innerHTML = '';
      var actor = actors[actorId];
      if (!actor || !actor.styles) return;

      actor.styles.forEach(function(styleId) {
        var style = styles[styleId];
        if (!style) return;

        var card = document.createElement('div');
        card.style.cssText = 'width:80px;text-align:center;cursor:pointer;border:2px solid transparent;border-radius:6px;padding:4px;transition:border-color 0.15s;';
        if (styleId === actor.current_style_id) {
          card.style.borderColor = '#4CAF50';
        }

        var img = document.createElement('img');
        img.style.cssText = 'width:60px;height:60px;object-fit:contain;border-radius:4px;background:#222;';
        if (style.url && style.url.startsWith('data:')) {
          img.src = style.url;
        } else if (style.path) {
          img.src = style.path;
        }
        card.appendChild(img);

        var label = document.createElement('div');
        label.style.cssText = 'font-size:11px;color:#999;margin-top:4px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;';
        label.textContent = style.name || styleId.substring(0, 8);
        card.appendChild(label);

        card.onclick = function() {
          actor.current_style_id = styleId;
          // 通知运行时更新
          try {
            var mgr = get_run_mgr();
            if (mgr) {
              window.postMsg('SCENE_SET_PROPERTY', JSON.stringify({
                property_name: 'current_style_id',
                scene_id: actor.scene_id,
                value: styleId
              }));
            }
          } catch(e) {}
          renderCostumes(actorId);
        };

        costumeGrid.appendChild(card);
      });
    }

    actorSelect.onchange = function() {
      renderCostumes(this.value);
    };
    renderCostumes(actorIds[0]);

    // 上传新造型
    var uploadTitle = document.createElement('h3');
    uploadTitle.className = 'settings-section-title';
    uploadTitle.textContent = '上传新造型';
    body.appendChild(uploadTitle);

    var uploadBtn = document.createElement('button');
    uploadBtn.className = 'settings-apply-btn';
    uploadBtn.textContent = '选择图片文件';
    uploadBtn.onclick = function() {
      var input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
      input.onchange = function() {
        var file = input.files[0];
        if (!file) return;
        var reader = new FileReader();
        reader.onload = function(e) {
          var dataUrl = e.target.result;
          var newStyleId = 'style_' + Date.now();
          var newStyle = {
            name: file.name.replace(/\.[^.]+$/, ''),
            url: dataUrl
          };
          styles[newStyleId] = newStyle;
          var actorId = actorSelect.value;
          if (actors[actorId]) {
            actors[actorId].styles.push(newStyleId);
          }
          renderCostumes(actorId);
        };
        reader.readAsDataURL(file);
      };
      input.click();
    };
    body.appendChild(uploadBtn);

    content.appendChild(body);
    dialog.open = true;
  }
})();
