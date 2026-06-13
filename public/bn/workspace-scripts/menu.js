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
    switch (menu) {
      case 'run': renderRunMenu(); break;
      case 'extensions': renderExtensionsMenu(); break;
      case 'editor': renderEditorMenu(); break;
      case 'runtime': renderRuntimeMenu(); break;
      case 'more': renderMoreMenu(); break;
    }
  }

  function renderRunMenu() {
    var item = createItem('启动运行', 'play', function() {
      closePanel();
      if (window.showStage) showStage();
      try {
        var mgr = get_run_mgr();
        if (mgr && typeof mgr.start === 'function') { mgr.start(); return; }
        if (mgr && typeof mgr.run === 'function') { mgr.run(); return; }
      } catch(e) {}
    });
    panelContent.appendChild(item);

    var item2 = createItem('停止', 'stop', function() {
      closePanel();
      if (window.hideStage) hideStage();
      try {
        var mgr = get_run_mgr();
        if (mgr && typeof mgr.stop === 'function') { mgr.stop(); return; }
      } catch(e) {}
    });
    panelContent.appendChild(item2);
  }

  function renderExtensionsMenu() {
    var title = document.createElement('div');
    title.className = 'menu-panel-title';
    title.textContent = '内置扩展';
    panelContent.appendChild(title);

    var config = storage.get('extension_config') || {};
    EXTENSION_FILES.forEach(function(fileName) {
      var match = fileName.match(/\[([^\]]+)\]/);
      var name = match ? match[1] : fileName;
      var item = createToggleItem(name, config[fileName] !== false, function(checked) {
        config[fileName] = checked;
        storage.set('extension_config', config);
      });
      panelContent.appendChild(item);
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

  function renderEditorMenu() {
    var title = document.createElement('div');
    title.className = 'menu-panel-title';
    title.textContent = '编辑器设置';
    panelContent.appendChild(title);

    // 猫块
    panelContent.appendChild(createToggleItem('猫块', !!storage.get('cat'), function(checked) {
      storage.set('cat', checked);
      if (checked) { if (window.enableCatBlock) enableCatBlock(); }
      else { if (window.disableCatBlock) disableCatBlock(); }
    }));

    // 积木缺口
    panelContent.appendChild(createToggleItem('积木缺口', !!storage.get('notch'), function(checked) {
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
    panelContent.appendChild(widthItem);

    // 背景
    var bgTitle = document.createElement('div');
    bgTitle.className = 'menu-panel-title';
    bgTitle.textContent = '背景';
    panelContent.appendChild(bgTitle);

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
    panelContent.appendChild(bgItem);

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
      panelContent.appendChild(uploadItem);

      var imgItem = document.createElement('div');
      imgItem.className = 'menu-panel-item-row';
      imgItem.innerHTML = '<span>图片 URL</span>';
      var imgInput = document.createElement('input');
      imgInput.type = 'text';
      imgInput.className = 'menu-panel-input';
      imgInput.value = storage.get('backgroundImage') || presetBg;
      imgInput.addEventListener('change', function() { storage.set('backgroundImage', imgInput.value); });
      imgItem.appendChild(imgInput);
      panelContent.appendChild(imgItem);

      var colItem = document.createElement('div');
      colItem.className = 'menu-panel-item-row';
      colItem.innerHTML = '<span>颜色</span>';
      var colInput = document.createElement('input');
      colInput.type = 'text';
      colInput.className = 'menu-panel-input';
      colInput.value = storage.get('backgroundColor') || presetColor;
      colInput.addEventListener('change', function() { storage.set('backgroundColor', colInput.value); });
      colItem.appendChild(colInput);
      panelContent.appendChild(colItem);
    }
  }

  function renderRuntimeMenu() {
    var title = document.createElement('div');
    title.className = 'menu-panel-title';
    title.textContent = '运行时设置';
    panelContent.appendChild(title);

    var hint = document.createElement('div');
    hint.className = 'menu-panel-hint';
    hint.textContent = '此配置跟随 Webview 存储';
    panelContent.appendChild(hint);
  }

  function renderMoreMenu() {
    var title = document.createElement('div');
    title.className = 'menu-panel-title';
    title.textContent = '更多';
    panelContent.appendChild(title);

    // Eruda（按需动态加载）
    panelContent.appendChild(createItem('Eruda 调试台', 'screwdriver-wrench', function() {
      closePanel();
      if (window.eruda && window.eruda._devTools) { eruda.destroy(); return; }
      if (window.eruda) { eruda.init(); return; }
      var s = document.createElement('script');
      s.src = 'eruda.js';
      s.onload = function() { eruda.init(); };
      document.head.appendChild(s);
    }));

    // 打开舞台
    panelContent.appendChild(createItem('打开舞台', 'tv', function() {
      closePanel();
      if (window.showStage) showStage();
    }));

    // 刷新
    panelContent.appendChild(createItem('刷新 Webview', 'sync-alt', function() {
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
})();
