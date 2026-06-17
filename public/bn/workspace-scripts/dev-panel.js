// ─── Dev Panel — 仅开发模式可用 ───
(function() {
  var isDev = location.hostname === 'localhost' || location.hostname === '127.0.0.1'
    || location.hostname === '0.0.0.0' || location.port === '3000'
    || location.protocol === 'tauri:';
  if (!isDev) return;

  var panel = document.createElement('div');
  panel.id = 'dev-panel';
  panel.innerHTML = '<style>' +
    '#dev-panel{position:fixed;bottom:0;right:0;width:380px;max-height:70vh;z-index:99999;' +
    'background:#0d1117;color:#c9d1d9;font-family:Consolas,Monaco,monospace;font-size:12px;' +
    'border-top-left-radius:8px;border-left:1px solid #30363d;box-shadow:-2px -2px 12px rgba(0,0,0,.5);' +
    'display:flex;flex-direction:column;transition:transform .2s}' +
    '#dev-panel.collapsed{transform:translateY(calc(100% - 32px))}' +
    '#dev-panel .dp-bar{display:flex;align-items:center;padding:4px 10px;background:#161b22;' +
    'border-bottom:1px solid #30363d;border-top-left-radius:8px;cursor:pointer;user-select:none}' +
    '#dev-panel .dp-bar span{flex:1;font-weight:bold;color:#58a6ff}' +
    '#dev-panel .dp-bar .dp-close{color:#8b949e;cursor:pointer;padding:0 4px}' +
    '#dev-panel .dp-body{flex:1;overflow-y:auto;padding:6px 8px}' +
    '#dev-panel .dp-section{margin-bottom:8px}' +
    '#dev-panel .dp-section h4{color:#58a6ff;margin:4px 0;font-size:11px;text-transform:uppercase}' +
    '#dev-panel .dp-row{display:flex;gap:4px;margin-bottom:4px;flex-wrap:wrap}' +
    '#dev-panel button{padding:4px 10px;border:1px solid #30363d;border-radius:4px;' +
    'background:#21262d;color:#c9d1d9;cursor:pointer;font-size:11px;font-family:inherit}' +
    '#dev-panel button:hover{background:#30363d;border-color:#58a6ff}' +
    '#dev-panel button.primary{background:#1f6feb;border-color:#1f6feb;color:#fff}' +
    '#dev-panel button.primary:hover{background:#388bfd}' +
    '#dev-panel button.danger{background:#da3633;border-color:#da3633;color:#fff}' +
    '#dev-panel button.danger:hover{background:#f85149}' +
    '#dev-panel textarea{width:100%;height:60px;background:#0d1117;color:#7ee787;border:1px solid #30363d;' +
    'border-radius:4px;padding:4px;font-family:inherit;font-size:11px;resize:vertical}' +
    '#dev-panel .dp-log{background:#0d1117;border:1px solid #30363d;border-radius:4px;' +
    'padding:4px;max-height:160px;overflow-y:auto;font-size:10px;line-height:1.4;color:#8b949e}' +
    '#dev-panel .dp-log .ok{color:#3fb950}' +
    '#dev-panel .dp-log .err{color:#f85149}' +
    '#dev-panel .dp-log .info{color:#58a6ff}' +
    '#dev-panel .dp-input{display:flex;gap:4px;margin-bottom:4px}' +
    '#dev-panel .dp-input input{flex:1;background:#0d1117;color:#c9d1d9;border:1px solid #30363d;' +
    'border-radius:4px;padding:3px 6px;font-family:inherit;font-size:11px}' +
    '</style>';

  var logLines = [];
  function dpLog(msg, cls) {
    var ts = new Date().toLocaleTimeString();
    logLines.push('<div class="' + (cls || '') + '">' + ts + ' ' + msg + '</div>');
    if (logLines.length > 100) logLines.shift();
    var el = panel.querySelector('.dp-log');
    if (el) { el.innerHTML = logLines.join(''); el.scrollTop = el.scrollHeight; }
  }

  function dpExec(code) {
    try {
      var result = eval(code);
      dpLog('→ ' + (typeof result === 'object' ? JSON.stringify(result, null, 0) : String(result)).substring(0, 200), 'info');
      return result;
    } catch (e) {
      dpLog('✗ ' + e.message, 'err');
    }
  }

  function dpRun(name) {
    if (!window.testImport) { dpLog('testImport 未就绪', 'err'); return; }
    dpLog('$ testImport.' + name + '()', 'info');
    testImport[name]();
  }

  var bodyHTML = '<div class="dp-bar"><span>⚡ Dev Panel</span><span class="dp-close" title="收起">▼</span></div>' +
    '<div class="dp-body">' +

    // Quick Actions
    '<div class="dp-section"><h4>Quick Actions</h4>' +
    '<div class="dp-row">' +
    '<button class="primary" onclick="dpRun(\'minimal\')">最小导入</button>' +
    '<button class="primary" onclick="dpRun(\'withBlocks\')">带积木导入</button>' +
    '<button onclick="dpRun(\'status\')">状态检查</button>' +
    '</div></div>' +

    // Eval
    '<div class="dp-section"><h4>Eval</h4>' +
    '<div class="dp-input"><input id="dp-eval-input" placeholder="输入 JS 表达式..." onkeydown="if(event.key===\'Enter\')dpEvalInput()"></div>' +
    '<div class="dp-row">' +
    '<button onclick="dpEvalInput()">执行</button>' +
    '<button onclick="dpExec(\'window.testImport.status()\')">testImport</button>' +
    '<button onclick="dpExec(\'Object.keys(Blockly.Blocks).length\')">积木数</button>' +
    '<button onclick="dpExec(\'Object.keys(window).filter(k=>k.startsWith(\'Hook\'))\')">Hooks</button>' +
    '</div></div>' +

    // Quick Eval Buttons
    '<div class="dp-section"><h4>Inspect</h4>' +
    '<div class="dp-row">' +
    '<button onclick="dpExec(\'Object.keys(window._dsaf)\')">_dsaf</button>' +
    '<button onclick="dpExec(\'window._dsf.postMessage.toString().substring(0,80)\')">postMsg</button>' +
    '<button onclick="dpExec(\'window._dsaf.postMessageAsyn.toString().substring(0,80)\')">postMsgAsyn</button>' +
    '<button onclick="dpExec(\'Object.keys(NemoStore.get_state().bcm)\')">bcmState</button>' +
    '</div>' +
    '<div class="dp-row">' +
    '<button onclick="dpExec(\'NemoStore.get_state().bcm.actors.actors_dict\')">actors</button>' +
    '<button onclick="dpExec(\'NemoStore.get_state().bcm.scenes.scenes_dict\')">scenes</button>' +
    '<button onclick="dpExec(\'NemoStore.get_state().bcm.stage_size\')">stage_size</button>' +
    '<button onclick="dpExec(\'Blockly.mainWorkspace.getAllBlocks(false).length\')">blocks</button>' +
    '</div></div>' +

    // File Import
    '<div class="dp-section"><h4>File Import</h4>' +
    '<div class="dp-row">' +
    '<button onclick="dpImportFile()">选择 BCM 文件</button>' +
    '<input type="file" id="dp-file-input" accept=".json,.bcm" style="display:none">' +
    '</div></div>' +

    // Custom Eval
    '<div class="dp-section"><h4>Custom Code</h4>' +
    '<textarea id="dp-code" placeholder="// 写 JS 代码，点击执行\nfor (var id in Blockly.Blocks) {\n  console.log(id);\n}"></textarea>' +
    '<div class="dp-row">' +
    '<button class="primary" onclick="dpExec(document.getElementById(\'dp-code\').value)">执行代码</button>' +
    '<button onclick="document.getElementById(\'dp-code\').value=\'\'">清空</button>' +
    '</div></div>' +

    // Log
    '<div class="dp-section"><h4>Log</h4>' +
    '<div class="dp-log"></div></div>' +

    '</div>';

  panel.innerHTML += bodyHTML;
  document.body.appendChild(panel);

  // Toggle
  panel.querySelector('.dp-bar').addEventListener('click', function(e) {
    if (e.target.classList.contains('dp-close')) return;
    panel.classList.toggle('collapsed');
    var close = panel.querySelector('.dp-close');
    close.textContent = panel.classList.contains('collapsed') ? '▲' : '▼';
  });
  panel.querySelector('.dp-close').addEventListener('click', function() {
    panel.classList.toggle('collapsed');
    this.textContent = panel.classList.contains('collapsed') ? '▲' : '▼';
  });

  // Global eval
  window.dpRun = dpRun;
  window.dpExec = dpExec;
  window.dpEvalInput = function() {
    var input = panel.querySelector('#dp-eval-input');
    if (input && input.value.trim()) {
      dpLog('$ ' + input.value, 'info');
      dpExec(input.value);
    }
  };

  // File import
  window.dpImportFile = function() {
    panel.querySelector('#dp-file-input').click();
  };
  panel.querySelector('#dp-file-input').addEventListener('change', function(e) {
    var file = e.target.files[0];
    if (!file) return;
    dpLog('加载文件: ' + file.name, 'info');
    var reader = new FileReader();
    reader.onload = function(ev) {
      try {
        var data = JSON.parse(ev.target.result);
        dpLog('JSON 解析成功, keys: ' + Object.keys(data).join(', '), 'ok');
        if (window.loadProjectJSON) {
          loadProjectJSON(data, false, function(r) {
            dpLog(r.ok ? '导入成功: ' + r.name : '导入失败: ' + r.error, r.ok ? 'ok' : 'err');
          });
        } else {
          dpLog('loadProjectJSON 未就绪', 'err');
        }
      } catch (err) {
        dpLog('JSON 解析失败: ' + err.message, 'err');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  });

  // Start collapsed
  panel.classList.add('collapsed');

  console.log('[DevPanel] 开发面板已加载 (右下角展开)');
})();
