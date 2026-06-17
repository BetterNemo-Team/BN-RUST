// 示例 V2 扩展 — 展示 .bnex 压缩包格式
(async (Extension) => {
  const { blink, events, storage, ui, utils, Block, Toolbox } = Extension.API;

  await new Promise(r => {
    const check = () => {
      if (typeof Blockly !== 'undefined' && Blockly.mainWorkspace) r();
      else setTimeout(check, 100);
    };
    check();
  });

  utils.log('ExampleV2', '扩展已加载');

  // --- 积木注册 ---
  blink.registerBlock({
    type: 'example_hello',
    message0: '打招呼 %1',
    args0: [{ type: 'input_value', name: 'NAME', check: 'String' }],
    previousStatement: null,
    nextStatement: null,
    colour: 230,
    tooltip: '输出一段文字',
  });

  blink.registerBlock({
    type: 'example_log',
    message0: '日志输出 %1',
    args0: [{ type: 'input_value', name: 'TEXT' }],
    previousStatement: null,
    nextStatement: null,
    colour: 160,
  });

  // --- 解释器注册 ---
  blink.registerInterpreter('example_hello', (args) => {
    const text = args.NAME || '你好';
    console.log(`[ExampleV2] ${text}`);
  });

  blink.registerInterpreter('example_log', (args) => {
    console.log('[ExampleV2 Log]', args.TEXT);
  });

  // --- 积木盒注册 ---
  const toolboxXML = [
    Toolbox.title('示例扩展'),
    Toolbox.block('example_hello'),
    Toolbox.block('example_log'),
    Toolbox.sep(),
    Toolbox.flyout_bottom(),
  ];

  const iconSVG = `<symbol id="icon-example" viewBox="-33 -33 90 90">
    <circle cx="12" cy="12" r="10" fill="#4CAF50" />
    <text x="12" y="16" text-anchor="middle" fill="white" font-size="12">E</text>
  </symbol>`;
  BN.regIcon(iconSVG);
  BN.addToolbox('example-toolbox', 'icon-example', '#4CAF50', toolboxXML);

  // --- 事件监听 ---
  events.on('extension:activated', (data) => {
    utils.log('ExampleV2', `扩展 ${data.id} 已激活`);
  });

  // --- 沙箱存储 ---
  const count = (storage.get('launchCount') || 0) + 1;
  storage.set('launchCount', count);
  ui.showNotification(`示例扩展已启动 ${count} 次`);

})(Extension);
