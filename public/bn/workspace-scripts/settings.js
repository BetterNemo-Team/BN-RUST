(function() {
  // 背景变更后通知 extension-loader 即时更新
  function bgChanged() { window.dispatchEvent(new CustomEvent('bn-bg-changed')); }

  var dialog = document.getElementById('settingsDialog');
  var content = dialog ? dialog.querySelector('.settings-content') : null;
  if (!dialog || !content) return;

  window.openSettings = function() {
    renderPage('extensions');
    dialog.open = true;
  };

  function renderPage(page) {
    content.innerHTML = '';
    var header = document.createElement('div');
    header.className = 'settings-header';

    var tabs = document.createElement('div');
    tabs.className = 'settings-tabs';
    var pages = [
      { id: 'extensions', icon: 'puzzle-piece', label: '扩展' },
      { id: 'theme', icon: 'palette', label: '主题' },
      { id: 'editor', icon: 'laptop-code', label: '编辑器' },
    ];
    pages.forEach(function(p) {
      var btn = document.createElement('button');
      btn.className = 'settings-tab' + (p.id === page ? ' active' : '');
      btn.innerHTML = '<i class="fas fa-' + p.icon + '"></i><span>' + p.label + '</span>';
      btn.onclick = function() { renderPage(p.id); };
      tabs.appendChild(btn);
    });
    content.appendChild(tabs);

    var body = document.createElement('div');
    body.className = 'settings-body';

    switch (page) {
      case 'extensions': renderExtensions(body); break;
      case 'theme': renderTheme(body); break;
      case 'editor': renderEditor(body); break;
    }
    content.appendChild(body);
  }

  function createToggle(checked, onChange) {
    var label = document.createElement('label');
    label.className = 'settings-toggle';
    var cb = document.createElement('input');
    cb.type = 'checkbox';
    cb.checked = checked;
    cb.addEventListener('change', function() { onChange(cb.checked); });
    var span = document.createElement('span');
    span.className = 'settings-toggle-slider';
    label.appendChild(cb);
    label.appendChild(span);
    return label;
  }

  function renderExtensions(body) {
    var title = document.createElement('h3');
    title.className = 'settings-section-title';
    title.textContent = '内置扩展';
    body.appendChild(title);

    var config = storage.get('extension_config') || {};
    EXTENSION_FILES.forEach(function(fileName) {
      var item = document.createElement('div');
      item.className = 'settings-item';

      var label = document.createElement('span');
      var match = fileName.match(/\[([^\]]+)\]/);
      label.textContent = match ? match[1] : fileName;

      item.appendChild(label);
      item.appendChild(createToggle(config[fileName] !== false, function(checked) {
        config[fileName] = checked;
        storage.set('extension_config', config);
      }));
      body.appendChild(item);
    });
  }

  function renderTheme(body) {
    var title = document.createElement('h3');
    title.className = 'settings-section-title';
    title.textContent = '主题';
    body.appendChild(title);

    var config = storage.get('theme_config') || {};

    var item = document.createElement('div');
    item.className = 'settings-item';
    var label = document.createElement('span');
    label.textContent = '选择主题';
    var select = document.createElement('select');
    select.className = 'settings-select';

    var current = 'default';
    THEME_FILES.forEach(function(name) {
      if (config[name] === true) current = name;
      var opt = document.createElement('option');
      opt.value = name;
      var meta = themeMetaData[name];
      opt.textContent = (meta && meta.name) ? meta.name : name;
      if (name === current) opt.selected = true;
      select.appendChild(opt);
    });

    select.addEventListener('change', function() {
      Object.keys(config).forEach(function(k) { config[k] = false; });
      config[select.value] = true;
      storage.set('theme_config', config);
    });

    item.appendChild(label);
    item.appendChild(select);
    body.appendChild(item);

    var applyBtn = document.createElement('button');
    applyBtn.className = 'settings-apply-btn';
    applyBtn.textContent = '应用主题并刷新';
    applyBtn.onclick = function() { location.reload(); };
    body.appendChild(applyBtn);
  }

  function renderEditor(body) {
    var title = document.createElement('h3');
    title.className = 'settings-section-title';
    title.textContent = '编辑器设置';
    body.appendChild(title);

    // 猫块
    var catItem = document.createElement('div');
    catItem.className = 'settings-item';
    var catLabel = document.createElement('span');
    catLabel.textContent = '猫块';
    catItem.appendChild(catLabel);
    catItem.appendChild(createToggle(!!storage.get('cat'), function(checked) {
      storage.set('cat', checked);
      if (checked) { if (window.enableCatBlock) enableCatBlock(); }
      else { if (window.disableCatBlock) disableCatBlock(); }
    }));
    body.appendChild(catItem);

    // 积木缺口
    var notchItem = document.createElement('div');
    notchItem.className = 'settings-item';
    var notchLabel = document.createElement('span');
    notchLabel.textContent = '积木缺口';
    notchItem.appendChild(notchLabel);
    notchItem.appendChild(createToggle(!!storage.get('notch'), function(checked) {
      storage.set('notch', checked);
    }));
    body.appendChild(notchItem);

    // 积木盒最大宽度
    var widthItem = document.createElement('div');
    widthItem.className = 'settings-item';
    var widthLabel = document.createElement('span');
    widthLabel.textContent = '积木盒最大宽度';
    var widthInput = document.createElement('input');
    widthInput.type = 'number';
    widthInput.className = 'settings-input';
    widthInput.value = storage.get('flyout_max_width') || 488;
    widthInput.addEventListener('change', function() {
      storage.set('flyout_max_width', Number(widthInput.value));
    });
    widthItem.appendChild(widthLabel);
    widthItem.appendChild(widthInput);
    body.appendChild(widthItem);

    // 背景
    var bgTitle = document.createElement('h3');
    bgTitle.className = 'settings-section-title';
    bgTitle.textContent = '背景';
    body.appendChild(bgTitle);

    var presetBg = 'res/bn_background.webp';
    var presetColor = '#1a1a2e';

    var bgItem = document.createElement('div');
    bgItem.className = 'settings-item';
    var bgLabel = document.createElement('span');
    bgLabel.textContent = '背景模式';
    var bgSelect = document.createElement('select');
    bgSelect.className = 'settings-select';
    var bgVal = storage.get('background') || 'preset1';
    var bgOptions = [['BetterNemo', 'preset1'], ['自定义', 'custom']];
    bgOptions.forEach(function(o) {
      var opt = document.createElement('option');
      opt.value = o[1];
      opt.textContent = o[0];
      if (o[1] === bgVal) opt.selected = true;
      bgSelect.appendChild(opt);
    });
    bgSelect.addEventListener('change', function() {
      storage.set('background', bgSelect.value);
      if (bgSelect.value === 'preset1') {
        storage.set('backgroundImage', presetBg);
        storage.set('backgroundColor', presetColor);
      }
      bgChanged();
    });
    bgItem.appendChild(bgLabel);
    bgItem.appendChild(bgSelect);
    body.appendChild(bgItem);

    if (storage.get('background') === 'custom') {
      var bgUploadItem = document.createElement('div');
      bgUploadItem.className = 'settings-item';
      var bgUploadLabel = document.createElement('span');
      bgUploadLabel.textContent = '上传图片';
      var bgFileInput = document.createElement('input');
      bgFileInput.type = 'file';
      bgFileInput.accept = 'image/*';
      bgFileInput.addEventListener('change', function() {
        var file = bgFileInput.files[0];
        if (!file) return;
        var reader = new FileReader();
        reader.onload = function(e) { storage.set('backgroundImage', e.target.result); bgChanged(); };
        reader.readAsDataURL(file);
      });
      bgUploadItem.appendChild(bgUploadLabel);
      bgUploadItem.appendChild(bgFileInput);
      body.appendChild(bgUploadItem);

      var bgImgItem = document.createElement('div');
      bgImgItem.className = 'settings-item';
      var bgImgLabel = document.createElement('span');
      bgImgLabel.textContent = '背景图片 URL';
      var bgImgInput = document.createElement('input');
      bgImgInput.type = 'text';
      bgImgInput.className = 'settings-input';
      bgImgInput.value = storage.get('backgroundImage') || presetBg;
      bgImgInput.addEventListener('change', function() {
        storage.set('backgroundImage', bgImgInput.value);
        bgChanged();
      });
      bgImgItem.appendChild(bgImgLabel);
      bgImgItem.appendChild(bgImgInput);
      body.appendChild(bgImgItem);

      var bgColorItem = document.createElement('div');
      bgColorItem.className = 'settings-item';
      var bgColorLabel = document.createElement('span');
      bgColorLabel.textContent = '背景颜色';
      var bgColorInput = document.createElement('input');
      bgColorInput.type = 'text';
      bgColorInput.className = 'settings-input';
      bgColorInput.value = storage.get('backgroundColor') || presetColor;
      bgColorInput.addEventListener('change', function() {
        storage.set('backgroundColor', bgColorInput.value);
        bgChanged();
      });
      bgColorItem.appendChild(bgColorLabel);
      bgColorItem.appendChild(bgColorInput);
      body.appendChild(bgColorItem);
    }
  }
})();
