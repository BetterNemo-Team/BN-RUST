window['blockObjects'] = [];
window['rootBlockChecks'] = [];
/**
 * 异步获取Blockly
 * @returns Blockly
 */
const isBlocklyLoaded = async () => {
  while (!window['Blockly']) {
    await new Promise((resolve) => requestAnimationFrame(resolve));
  }
  return Blockly;
};
/**
 * 异步获取Workspace
 * @returns WorkspaceSvg
 */
const isBlocklyMainworkspaceLoaded = async () => {
  await isBlocklyLoaded();
  while (!Blockly.mainWorkspace) {
    await new Promise((resolve) => requestAnimationFrame(resolve));
  }
  return Blockly.mainWorkspace;
};
/**
 * 异步获取Toolbox
 * @returns Toolbox
 */
const isToolboxLoaded = async () => {
  while (!Blockly.mainWorkspace.get_toolbox()) {
    await new Promise((resolve) => requestAnimationFrame(resolve));
  }
  return Blockly.mainWorkspace.get_toolbox();
};
const isElementLoaded = async (element) => {
  while (!document.querySelector(element)) {
    await new Promise((resolve) => requestAnimationFrame(resolve));
  }
  return document.querySelector(element);
};
/**
 * 异步获取RunMgr
 * @returns RunMgr
 */
const isRunmgrHooked = async () => {
  while (!get_run_mgr()) {
    await new Promise((resolve) => requestAnimationFrame(resolve));
  }
  return get_run_mgr();
};
/**
 * 异步获取某个模块
 * @param {string} name 在hook部分中定义的模块别名
 * @returns Module
 */
const waitHook = async (name) => {
  while (!window['Hook' + name]) {
    await new Promise((resolve) => requestAnimationFrame(resolve));
  }
  return window['Hook' + name].exports;
};
/**
 * 异步获取某个全局对象
 * @param {string} name 全局对象名
 * @returns any
 */
const waitGetGlobal = async (name) => {
  while (!window[name]) {
    await new Promise((resolve) => requestAnimationFrame(resolve));
  }
  return window[name];
};
/**
 * 追加新的积木盒
 * @param {string} name
 * @param {string} icon 图标symbol的id
 * @param {string} color 颜色
 * @param {string[]} blocks 积木XML文本列表
 * @param {boolean} selectedColor 选中时颜色，默认为白
 */
function regToolbox(name, icon, color, blocks, selectedColor = 'white') {
  function addStyle(style) {
    const styleElement = document.getElementById('toolbox-style');
    if (!styleElement) {
      const styleElement = document.createElement('style');
      styleElement.id = 'toolbox-style';
      styleElement.textContent = style;
      document.head.appendChild(styleElement);
    } else styleElement.textContent += style;
  };
  const toolboxObject = {
    color,
    name: 'toolbox-' + name,
    icon: { font_id: icon },
    blocks: blocks.flat(1).map(block => str2xml(block)),
  };
  setTimeout(() => {
    const toolbox = Blockly.mainWorkspace.get_toolbox();
    toolbox.add(toolbox.new_node(toolboxObject));
    addStyle(`#toolbox-${name}.blocklyTreeSelected>div>svg { fill: ${selectedColor};}#toolbox-${name}{box-shadow: 4px 0px 0px ${color}}`);
  }, 1000);
}
const str2xml = function (str) {
  const parser = new DOMParser();
  const doc = parser.parseFromString(str, "text/xml");
  return doc.firstChild;
};
/**
 * 注册新的解释器
 * @param {string} name 积木ID
 * @param {function} func 解释器
 * @param {string} error_msg 出错提示
 */
async function regDomainFunction(name, func, error_msg = '') {
  const registry = get_run_mgr().registry;
  registry.domain_function[name] = func;
  registry.domain_function_list.push(func);
  registry.domain_function_index[name] = registry.domain_function_types.push(name) - 1;
  const i18n = (await waitHook('MsgZhCN')).ZH_CN;
  if (error_msg)
    i18n['domain_function_error/' + name] = error_msg;
}
/**
 * 重写解释器
 * @param {string} name 积木ID
 * @param {function} func 解释器
 */
function rewriteDomainFunction(name, func) {
  const registry = get_run_mgr().registry;
  registry.domain_function[name] = func;
  const index = registry.domain_function_index[name];
  registry.domain_function_list[index] = func;
}
/**
 * 注册一个事件
 * @param {object} action_type 事件对象
 */
function regAction(action_type) {
  const registry = get_run_mgr().registry;
  var r = {
    namespace: "",
    id: action_type.id,
  };
  if (action_type.statefulness !== void 0) {
    r.statefulness = action_type.statefulness;
  }
  registry.register_action_type(r);
  action_type.responder_blocks.forEach(function (r) {
    registry.register({
      namespace: "",
      id: r.id,
      respond: {
        to_action: {
          namespace: "",
          id: action_type.id,
        },
        type: r.type,
        async: r.async,
        priority: r.priority,
        entity_specific: action_type.entity_specific,
        trigger_function: r.trigger_function,
        filter_arg_names: r.filter_arg_names,
      },
    });
  });
  return;
}
window['customEvents'] = [];
/**
 * 注册一个简单事件
 * @param {string} eventBlockId 事件积木ID
 */
function regSimpleEvent(eventBlockId) {
  regAction({
    id: eventBlockId,
    entity_specific: false,
    responder_blocks: [{
      id: eventBlockId,
      type: "action",
      async: false,
    }],
  });
  regDomainFunction(eventBlockId, () => { });
  // window['customEvents'].push(eventBlockId);
}
function checkRootBlock({ blockType = '', rootBlockTypes = [] }) {
  Blockly.mainWorkspace.get_all_blocks()
    .filter(block => block.type == blockType)
    .forEach(block => {
      if (block.get_colour() != Blockly.theme.disabled_color.fill)
        block._color = block.get_colour();
      if (block.get_root_block())
        if (rootBlockTypes.includes(block.get_root_block().type))
          if (block._color) {
            block.set_colour(block._color);
            return;
          }
      block.set_colour(Blockly.theme.disabled_color.fill);
    });
}
/**
 * 获取事件参数
 * @param {args.utils} utils
 * @returns {object} 事件参数对象
 */
function getEventParams(utils) {
  const action_parameters =
    utils.runtime_manager.interpreters[
      Object.keys(utils.runtime_manager.interpreters)[0]
    ].action_parameters;
  if (action_parameters) {
    return action_parameters;
  }
  return undefined;
}
async function defineEventParam(blockId, text, colorId) {
  const Di = await waitHook('Di');
  Blockly.define_block_with_object('__' + blockId, {
    init: function () {
      const __IS_PC__ = false;
      var thisBlock = this,
        LabelSerializable = Blockly.di_container.get(Di.BINDING.FieldLabelSerializable),
        CreateEvent = Blockly.di_container.get(Di.BINDING.CreateEvent),
        label = LabelSerializable({ text: text });
      label.on_mouse_down = function (e) {
        e.preventDefault();
      };
      this.append_dummy_input().append_field(label, "TEXT");
      this.set_output(true);
      this.set_inputs_inline(true);
      this.set_colour(Blockly.theme.block_color[colorId].fill, Blockly.theme.block_color[colorId].border);
      this.on_mouse_down = function (n) {
        var i = Blockly.events.get_group();
        if (Blockly.events.set_group(i || !0),
          __IS_PC__ && 0 !== n.button)
          return n.preventDefault(),
            void n.stopPropagation();
        var a = thisBlock.workspace.get_gesture(n);
        if (a) {
          var o = a.handle_move.bind(a)
            , s = a.handle_up.bind(a)
            , c = 0
            , u = !1
            , l = !0;
          a.handle_move = function (i) {
            if (u)
              o(i);
            else if (c < 10)
              c++;
            else if (a.is_dragging_block = !0,
              l || __IS_PC__) {
              var s = function () {
                Blockly.events.disable();
                const newBlock = thisBlock.workspace.new_block(blockId),
                  thisBlockPos = thisBlock.get_relative_to_surface_xy();
                return newBlock.move_by(thisBlockPos),
                  newBlock.init_svg(),
                  newBlock.render(),
                  Blockly.events.enable(),
                  Blockly.events.is_enabled() && Blockly.events.fire(CreateEvent({
                    block: newBlock,
                    source: "other"
                  })),
                  newBlock;
              }();
              s.select(),
                a.handle_block_start(n, s),
                a.target_block = s,
                u = !0;
            } else
              a.cancel();
          }
            ,
            a.handle_up = function (t) {
              s(t),
                Blockly.events.set_group(i),
                l = !0;
            };
        }
      };
    }
  });
}

function regBlocks(blocks) {
  blockObjects = (blockObjects.concat(blocks));
  blocks.forEach((block) => {
    // 对于事件参数的特殊处理
    if (block.EventParam) {
      rootBlockChecks.push({
        blockType: block.type,
        rootBlockTypes: [block.EventParam.eventBlockId],
      });
      defineEventParam(block.type, block.text, block.EventParam.colorId);
      block = {
        type: block.type,
        message0: block.text,
        args0: [],
        colour: `%{BKY_${block.EventParam.colorId}}`,
        output: "String",
      };
    }
    // 防止有人漏写了
    if (!block.args0) block.args0 = [];
    // 注册积木
    Blockly.Blocks[block.type] = {
      init: function () {
        this.jsonInit(block);
      },
    };
  });
}
/**
 * 触发一个简单的事件
 * @param {string} name 事件名称
 * @param {object} params 参数(可选)
 */
function emitSimpleEvent(name, params = {}) {
  (async function () {
    const Runtime = await waitHook('Runtime');
    Runtime.get_webview_runtime().send_action({
      id: name,
      namespace: "",
      parameters: params,
    });
  })();
}

const BetterNemo = {
  log: (moduleName, ...msgs) => {
    if (moduleName) {
      console.log(
        `%c BetterNemo %c %c ${moduleName} %c ${msgs.join(' ')}`,
        'border-radius:5px;padding:2px;font-weight:bold;background: #20A5C4;color:white;', '',
        'border-radius:5px;padding:2px;font-weight:bold;background: #20A5C4;color:white;', ''
      );
    } else {
      console.log(`%c BetterNemo %c ${msgs.join(' ')}`, 'border-radius:5px;padding:2px;font-weight:bold;background: #20A5C4;color:white;', '');
    }
  },
  error: (moduleName, ...msgs) => {
    if (moduleName) {
      console.log(`%c BetterNemo %c %c ${moduleName} %c ${msgs.join(' ')}`, 'border-radius:5px;padding:2px;font-weight:bold;background: #ff0000;color:white;', '', 'border-radius:5px;padding:2px;font-weight:bold;background: #ff0000;color:white;', '');
    } else {
      console.log(`%c BetterNemo %c ${msgs.join(' ')}`, 'border-radius:5px;padding:2px;font-weight:bold;background: #ff0000;color:white;', '');
    }
  },
  hook: hook,
  getHook: waitHook,
  Block: {
    methodBlock: {
      previousStatement: true,
      nextStatement: true,
      inputsInline: true,
    },
    eventBlock: {
      nextStatement: true,
      inputsInline: true,
    }
  },
  Toolbox: {
    title: (text) =>
      `<label text="${text}" type="normal" gap="24" web-class="flyout-toolbox-title" vertical_padding="0"></label>`,
    error: (text) =>
      `<label text="${text}" type="normal" gap="24" web-class="flyout-toolbox-error" vertical_padding="0"></label>`,
    line: (text, height = 25) =>
      `<label type="flyout_line" height="${height}" text="${text}"/>`,
    flyout_bottom: (width = 130, height = 16) =>
      `<label type="flyout_bottom" align="center" width="${width}" height="${height}"></label>`,
    sep: (gap = 50) => `<sep gap="${gap}"></sep>`,
    numValue: (name, value) =>
      `<value name="${name}"><shadow type="math_number"><field name="NUM">${value}</field></shadow></value>`,
    textValue: (name, value) =>
      `<value name="${name}"><shadow type="text"><field name="TEXT">${value}</field></shadow></value>`,
    optionValue: (name, value) => `<field name="${name}">${value}</field>`,
    block: (type, ...values) => {
      const blockJSON = window['blockObjects'].find((block) => block.type === type);
      if (blockJSON) {
        if (!blockJSON.args0) return [BetterNemo.Toolbox.error(type + "缺少args0属性"), `<block type="${type}">${values.join("")}</block>`];
        for (let i = 1; i <= blockJSON.args0.length; i++)
          if (!blockJSON.message0.includes(`%${i}`)) {
            const msg = `${type}的message0缺少%${i}`;
            console.error(msg);
            return BetterNemo.Toolbox.error(msg);
          }
        blockJSON.args0.forEach((arg) => {
          if (arg.value !== undefined) {
            switch (arg.type) {
              case "input_value":
                if (!Array.isArray(arg.check))
                  arg.check = [arg.check];
                if (arg.check[0] === "Number" && arg.check.length === 1)
                  values.push(BetterNemo.Toolbox.numValue(arg.name, arg.value));
                else if (arg.check.includes("String"))
                  values.push(BetterNemo.Toolbox.textValue(arg.name, arg.value));
                else console.error("未知参数", arg.check);
                break;
              case "field_dropdown":
                values.push(BetterNemo.Toolbox.optionValue(arg.name, arg.value));
                break;
              // default: console.warn("未知类型参数", arg.type, blockJSON, arg);
            }
          } // else console.warn("无默认值", blockJSON, arg);
        });
        return `<block type="${type}">${values.join("")}</block>`;
      } else if (Blockly.Blocks[type]) {
        return `<block type="${type}">${values.join("")}</block>`;
      } else {
        return BetterNemo.Toolbox.error("错误：未能找到" + type + "的定义");
      }
    },
    eventBlock: (type, ...params) => [
      BetterNemo.Toolbox.sep(15),
      `<block type="${type}">${params.map(([name, type]) => `<value name="${name}"><block type="__${type}"></block></value>`)}</block>`,
    ],
    /** @deprecated */
    simpleEventBlock: (...args) => BetterNemo.Toolbox.eventBlock(...args),
    button: (key, text, callback, className = '') => {
      Blockly.mainWorkspace.register_button_callback(key, callback);
      return `<button text="${text}" callbackkey="${key}" type="normal"${className ? ` web-class="${className}"` : ''}></button>`;
    }
  },
  regColor: (colorID, fill, border, layer = '') => {
    if (layer) Blockly.theme.block_color[colorID] = { fill, border, layer };
    else Blockly.theme.block_color[colorID] = { fill, border };
  },
  defineBlocks: regBlocks,
  /** @deprecated */
  regBlocks,
  /** @deprecated */
  regSimpleEvent,
  regEvent: regSimpleEvent,
  /** @deprecated */
  regMethod: regDomainFunction,
  regDomainFunction,
  addIcon: (svg) => document.querySelector("#__SVG_SPRITE_NODE__").insertAdjacentHTML("beforeend", svg),
  /** @deprecated */
  regIcon: (svg) => BetterNemo.addIcon(svg),
  waitBlocklyLoaded: isBlocklyLoaded,
  waitBlockLoaded: async () => {
    while (window['blockObjects'] == [])
      await new Promise((resolve) => requestAnimationFrame(resolve));
    return;
  },
  waitHook,
  waitRunmgrLoaded: isRunmgrHooked,
  emitSimpleEvent,
  getEventParams,
  updateBrush: (actor) => {
    actor.parent_scene.should_update_brush();
  },
  getCtx: async () => {
    await isBlocklyLoaded();
    return Blockly.utils.canvas_context;
  },
  CAPI: {
    getToken: () => {
      if (window.WEBVIEW_DATA)
        if (window.WEBVIEW_DATA.user_token)
          returnwindow.WEBVIEW_DATA.user_token;
      return '';
    },
    getWorkId: () => {
      if (window.WEBVIEW_DATA)
        if (window.WEBVIEW_DATA.work_id)
          return parseInt(window.WEBVIEW_DATA.work_id);
      return -1;
    }
  }
};
const extensionToolboxs = [];
function reloadExtension() {
  if (!document.querySelector("#toolbox-bn")) return;
  const codemaoToolboxs = [
    "events", "control", "actions", "appearance", "sound", "pen", "sensing", "operators", "variables", "lists",
    "cloud_var", "procedures", "advanced", "microbit", "extensions", "toolbox-network", "toolbox-websocket", "toolbox-bn"
  ];
  Blockly.mainWorkspace.get_toolbox().children_.forEach(node => {
    if (!codemaoToolboxs.includes(node.name_)) {
      node.dispose();
    }
  });
  const toolboxBn = document.querySelector("#toolbox-bn");
  if (toolboxBn) {
    let nextElement = toolboxBn.parentElement.nextElementSibling;
    while (nextElement) {
      if (nextElement.querySelector && nextElement.querySelector("#microbit")) {
        nextElement = nextElement.nextElementSibling;
        continue;
      }
      const treeRoot = document.querySelector("#workspace > div > div > div.blocklyTreeRoot");
      if (treeRoot && treeRoot.lastChild) {
        console.log("remove", treeRoot.lastChild);
        treeRoot.lastChild.remove();
      }
      nextElement = toolboxBn.parentElement.nextElementSibling;
    }
  }
  const config = storage.get('extension_config');
  extensionToolboxs.forEach(([fileName, toolboxArgs]) => {
    if (config[fileName]) regToolbox(...toolboxArgs);
  });
}
(async () => {
  if (!storage.get('extension_config')) storage.set('extension_config', {});
  const config = storage.get('extension_config');
  window['Extension'] = {
    metaData: {},
    API: BetterNemo
  };
  function createExtensionAPI(extensionMetaData) {
    const api = Object.create(BetterNemo);
    api.addToolbox = function (...args) {
      extensionToolboxs.push([extensionMetaData.fileName, args]);
      return args;
    };
    api.loadScript = async function (extension, url) {
      try {
        await loadScript('extensions/' + extensionMetaData.fileName + '/' + extension);
      } catch {
        if (!url) return;
        await loadScript(url);
      }
    };
    return api;
  }
  let cnt = 0;
  for (const fileName of EXTENSION_FILES) {
    cnt++;
    setLoaderInfo(`加载扩展 (${cnt}/${EXTENSION_FILES.length})`, 2);
    if (config[fileName] == undefined) {
      config[fileName] = true;
      storage.set('extension_config', config);
    }
    const extMetaData = {
      fileName,
      name: "未命名",
      version: "",
      description: "",
      author: "未知",
      docs: "",
      url: ''
    };
    Object.defineProperty(Extension, 'metaData', {
      get() { return extMetaData; },
      set(newValue) { Object.assign(extMetaData, newValue); },
      configurable: true
    });
    const extensionAPI = createExtensionAPI(extMetaData);
    Extension.API = extensionAPI;
    await loadScript('extensions/' + fileName + '/index.js');
    extensionMetaData[fileName] = { ...extMetaData };
    BetterNemo.log('扩展管理', '扩展', fileName, '加载完成');
  }
  setLoaderInfo('扩展加载完成！', 2);
  await isElementLoaded('#toolbox-bn');
  setTimeout(() => {
    reloadExtension();
    BetterNemo.log('扩展管理', '已重新加载扩展积木盒');
  }, 500);
})();
async function reloadTheme() {
  document.querySelectorAll('.bn-theme').forEach(el => el.remove());
  THEME_FILES.forEach(async fileName => {
    const config = storage.get('theme_config');
    await loadScript('theme/' + fileName + '/on_disable.js');
    if (config[fileName]) {
      BetterNemo.log('主题管理', '主题', fileName, '已启用');
      await loadStyle('theme/' + fileName + '/style.css');
      await loadScript('theme/' + fileName + '/on_enable.js');
    };
  });
}
(async () => {
  window['Theme'] = { metaData: {} };
  let cnt = 0;
  THEME_FILES.forEach(async fileName => {
    cnt++;
    setLoaderInfo(`加载主题 (${cnt}/${EXTENSION_FILES.length})`, 3);
    if (!storage.get('theme_config')) storage.set('theme_config', {});
    const config = storage.get('theme_config');
    if (config[fileName] == undefined) {
      if (fileName == 'default') {
        config[fileName] = true;
      } else {
        config[fileName] = false;
      };
      storage.set('theme_config', config);
    }
    Theme.metaData = {
      name: "未命名",
      version: "",
      description: "",
      author: "未知",
      docs: ""
    };
    await loadScript('theme/' + fileName + '/on_disable.js');
    themeMetaData[fileName] = Theme.metaData;
    BetterNemo.log('主题管理', '主题', fileName, '加载完成');
    if (config[fileName]) {
      BetterNemo.log('主题管理', '主题', fileName, '已启用');
      await loadStyle('theme/' + fileName + '/style.css');
    };
  });
  setLoaderInfo('主题加载完成！', 3);
})();
/**
 * 打开预定义的 mdui 全屏对话框，等待用户输入
 * @returns {Promise<string|null>} 确认返回字符串，取消/关闭返回 null
 */
async function showFullscreenTextInput(value = '') {
  const dialog = document.getElementById('fullscreenTextDialog');
  const textField = document.getElementById('dialogTextField');
  const cancelBtn = document.getElementById('dialogCancelBtn');
  const confirmBtn = document.getElementById('dialogConfirmBtn');
  textField.value = value;
  // 使用 AbortController 管理一次性监听器，避免冲突
  const controller = new AbortController();
  const { signal } = controller;

  return new Promise((resolve) => {
    // 确认按钮
    confirmBtn.addEventListener('click', () => {
      const value = textField.value;
      cleanup();
      resolve(value);
    }, { signal });
    // 取消按钮
    cancelBtn.addEventListener('click', () => {
      cleanup();
      resolve(null);
    }, { signal });
    // 打开对话框
    dialog.open = true;
    // 清理函数：关闭对话框并终止所有监听
    const cleanup = () => {
      dialog.open = false;
      controller.abort(); // 移除所有通过 signal 添加的监听器
    };
  });
}
function showMsg(msg) {
  const snackbar = document.querySelector("mdui-snackbar");
  snackbar.textContent = msg;
  snackbar.open = true;
}
async function showExtensionShop(disabled = [], callback) {
  const dialog = document.querySelector(".extension-shop");
  const cards = document.querySelector(".extension-shop-cards");
  const closeButton = dialog.querySelector(".extension-shop-close-btn");
  const okButton = dialog.querySelector(".extension-shop-ok-btn");
  const nav = dialog.querySelector("mdui-navigation-rail");
  const allCards = [
    // official
    { id: 'microbit', title: 'micro:bit', content: 'micro:bit是一款小型可编程计算机，包含丰富的功能', page: 'official' }
  ];
  function getName(filename) {
    const match = filename.match(/\[([^\]]+)\]/);
    return match ? match[1] : '';
  }
  function setLoading(type) { document.querySelector('.extension-shop-loading').style.display = type ? 'block' : 'none'; }
  function createCard(cardData, disable = false) {
    const card = document.createElement('mdui-card');
    card.classList.add('extension-shop-card-' + cardData.id);
    card.setAttribute('data-page', cardData.page); // 添加页面标识
    card.setAttribute('clickable', '');
    if (disable) card.setAttribute('disabled', '');
    else card.setAttribute('onclick', 'this.childNodes[3].click()');
    card.style.width = '24vw';
    card.style.height = '24vh';
    card.style.padding = '15px';
    card.style.margin = '8px';
    card.innerHTML = `<h3 style="margin:5px 0">${cardData.title}</h3><p style="font-size:12px">${cardData.content}</p>
        <mdui-checkbox style="position:absolute;bottom:5px;right:5px" onclick="this.click()" ${disable ? 'disabled checked' : ''}
        ${cardData.checked ? 'checked' : ''}></mdui-checkbox>`;
    return card;
  }
  function getCard(id) {
    return document.querySelector('.extension-shop-card-' + id);
  }
  function initializeCards() {
    cards.innerHTML = '';
    allCards.forEach(cardData => {
      const card = createCard(cardData, disabled.includes(cardData.id));
      cards.appendChild(card);
    });
  }
  function showPageCards(page) {
    const allCards = document.querySelectorAll('[class^="extension-shop-card-"]');
    allCards.forEach(card => {
      card.style.display = 'none';
    });
    const pageCards = document.querySelectorAll(`[data-page="${page}"]`);
    pageCards.forEach(card => {
      card.style.display = '';
    });
  }
  setLoading(false);
  const config = storage.get('extension_config');
  EXTENSION_FILES.forEach(fileName => {
    let menuName = fileName;
    if (getName(fileName)) menuName = getName(fileName);
    if (fileName.includes(''))
      if (extensionMetaData[fileName]) {
        const metaData = extensionMetaData[fileName];
        allCards.push({
          checked: config[fileName], fileName, id: ((t) => {
            '[],.+'.split('').forEach(c => t = t.replaceAll(c, ''));
            return t;
          })(fileName),
          title: menuName, content: '作者：' + metaData.author + '<br>' + metaData.description, page: 'custom'
        });
      }
  });
  // 使用 AbortController 管理一次性监听器，避免冲突
  const controller = new AbortController();
  const { signal } = controller;

  return new Promise((resolve) => {
    nav.addEventListener("change", () => showPageCards(nav.value), { signal });
    closeButton.addEventListener("click", () => {
      cleanup();
      resolve(null);
    }, { signal });
    okButton.addEventListener("click", () => {
      const data = [];
      allCards.forEach(({ id }) => {
        const card = getCard(id);
        if (card && !card.disabled && card.childNodes[3].checked) {
          data.push(id);
        }
      });
      const config = storage.get('extension_config');
      allCards.filter(({ page }) => page === 'custom').forEach(({ id, fileName }) => {
        const card = getCard(id);
        if (card && !card.disabled) config[fileName] = card.childNodes[3].checked;
      });
      storage.set('extension_config', config);
      cleanup();
      if (data.includes('microbit')) callback('["microbit"]');
      reloadExtension();
      resolve(null);
    }, { signal });

    // 初始化并打开对话框
    initializeCards();
    showPageCards('custom');
    dialog.open = true;

    // 清理函数：关闭对话框并终止所有监听
    const cleanup = () => {
      dialog.open = false;
      controller.abort(); // 移除所有通过 signal 添加的监听器
    };
  });
}
// --------------- 劫持Web向Native发送的数据 ---------------
(async () => {
  if (isPCTestEnv()) window['_dsbridge'] = { call: (...args) => { console.log(...args); } };
  setLoaderInfo('等待dsbridge初始化...', 4);
  const dsbridge = await waitHook('Dsbridge');
  const call = dsbridge.call;
  dsbridge.call = (...args) => {
    if (experimentalConfig.webview_debug) {
      console.log('[Webview -> Nemo] args:', ...args);
      debugServer.send(JSON.stringify({
        type: 'w2n',
        data: [...args]
      }));
    }
    if (args.length === 1)
      if (args[0] === '_dsb.dsinit')
        if (PLAYER) {
          if (!IS_BN_APP) document.querySelector("#floatBall").style.display = "none";
          if (IS_BN_APP) {
            let config = storage.get('theme_config');
            Object.keys(config).forEach(key => {
              config[key] = key == 'vanilla';
            });
            storage.set('theme_config', config);
            reloadTheme();
          }
          const unloggedData = {
            avatar_url: "", bcm_version: "", context_menu_with_set_block_visibility: false,
            enable_hide: false, is_login: false, is_pad: false, nickname: "", sidebar_width: 64,
            stage_position: {
              portrait: {
                fullscreen: { bottom: 0, height: 0, left: 0, ratio: 0, right: 0, top: 0, width: 0, },
                normal: { bottom: 0, height: 0, left: 0, ratio: 0, right: 0, top: 0, width: 0, }
              },
              landscape: {
                fullscreen: { bottom: 0, height: 0, left: 0, ratio: 0, right: 0, top: 0, width: 0, },
                normal: { bottom: 0, height: 0, left: 0, ratio: 0, right: 0, top: 0, width: 0, }
              }
            },
            toolbox_mode: "normal", translucent_block_visible: "visible",
            user_id: "", user_level: -1, user_token: "", webview_height: 0, work_id: ""
          };
          async function loadWork(data, bcm) {
            window['PLAYER_DATA'] = { data, bcm };
            document.title = bcm.project_name;
            if (bcm.styles)
              if (bcm.styles.styles_dict)
                Object.keys(bcm.styles.styles_dict).forEach(key => {
                  const s = bcm.styles.styles_dict[key];
                  if (s.path) s.path = s.path.replace('file:///android_asset/webview/', 'https://static.codemao.cn/nemo/22/');
                  if (s.url) {
                    s.url = s.url.replace('\u003d\u003d', '==');
                    if (!s.path) s.path = s.url;
                    if (s.path.startsWith('file') && s.url.startsWith('http'))
                      s.path = s.url;
                  } else if (s.path)
                    if (s.path.startsWith('/data') && s.texture) {
                      s.path = 'https://static.codemao.cn/nemo/22/' + s.texture;
                    }
                });
            // 等待扩展加载完成
            setLoaderInfo('', 4);
            while (Object.keys(extensionMetaData).length !== EXTENSION_FILES.length)
              await new Promise((resolve) => requestAnimationFrame(resolve));
            setLoaderInfo('初始化数据...', 4);
            console.log('Player Data', data);
            postMsg('INIT_WEBVIEW_DATA', JSON.stringify(data));
            BetterNemo.log('Player', '初始化数据成功');
            console.log('Player BCM', bcm);
            setLoaderInfo('加载作品...', 4);
            await postMsgAsyn('LOAD_BCM', JSON.stringify(bcm));
            BetterNemo.log('Player', '作品已加载');
            setLoaderInfo('显示舞台...', 4);
            postMsg('SET_THEATRE_VISIBLE', 'true');
            BetterNemo.log('Player', '已显示舞台');
            setLoaderInfo('运行...', 4);
            postMsg('SET_RUN_STATE', 'true');
            BetterNemo.log('Player', '运行状态：true');
            await postMsgAsyn('CHANGE_RUNTIME_VARIABLES');
            Object.entries(bcm.scenes.scenes_dict).forEach(([key, value]) => postMsg('SCENE_SET_PROPERTY',
              JSON.stringify({ property_name: "current_style_id", scene_id: key, value: value.current_style_id })));
            postMsg('THEATRE_FULL_SCREEN', '{"visible":true}');
            hideLoader();
          }
          let webviewData = { ...unloggedData };
          const { scrollHeight, scrollWidth } = document.documentElement;
          setLoaderInfo('获取作品数据...', 4);
          if (PLAYER.startsWith('https://') || PLAYER.startsWith('http://'))
            fetch(PLAYER)
              .then(response => response.json())
              .then(data => loadWork(webviewData, data));
          else if (!isNaN(parseInt(PLAYER)))
            fetch(`https://api.codemao.cn/creation-tools/v1/works/${parseInt(PLAYER)}/source/public`)
              .then(response => response.json())
              .then(data => {
                if (data['error_code'])
                  document.write(`<h1>Error ${data['error_code']}: ${data['error_message']}</h1>`);
                const workId = data['work_id'];
                webviewData['work_id'] = String(workId);
                webviewData['bcm_version'] = data['bcm_version'];
                if (workId && data['work_urls'].length > 0)
                  fetch(data['work_urls'][0])
                    .then(response => response.json())
                    .then(data => {
                      const { width, height } = data['stage_size'] || { height: 900, width: 562 };
                      const a1 = height / width;
                      const a2 = scrollHeight / scrollWidth;
                      if (height > width)
                        // 竖屏作品
                        if (a1 > a2) {
                          webviewData.stage_position.portrait.fullscreen.height = scrollHeight;
                          webviewData.stage_position.portrait.fullscreen.width = scrollHeight * (width / height);
                        } else {
                          webviewData.stage_position.portrait.fullscreen.width = scrollWidth;
                          webviewData.stage_position.portrait.fullscreen.height = scrollWidth * (height / width);
                        }
                      else
                        // 横屏作品
                        if (a1 > a2) {
                          webviewData.stage_position.landscape.fullscreen.height = scrollHeight;
                          webviewData.stage_position.landscape.fullscreen.width = scrollHeight * (width / height);
                        } else {
                          webviewData.stage_position.landscape.fullscreen.width = scrollWidth;
                          webviewData.stage_position.landscape.fullscreen.height = scrollWidth * (height / width);
                        }
                      loadWork(webviewData, data);
                    });
                else document.write(`<h1>Error: 无法获取作品数据</h1>`);
              });
        }
    if (args.length === 3)
      try {
        const data = JSON.parse(args[1]);
        const payload = data.payload;
        if (data.type === 'EDIT_TEXT') {
          console.log('[原生劫持 - 文本编辑]', payload);
          if (getBrowserVersion() > 86) {
            (async () => {
              const text = await showFullscreenTextInput(payload.text);
              if (text !== null) args[2](text);
            })();
            return;
          }
          // else args[2](prompt('请输入文本'));
          else return call.apply(dsbridge, args);
        }
        if (data.type === 'SELECT_EXTENSIONS_CATEGORIES') {
          console.log('[原生劫持 - 扩展选择]', payload);
          if (getBrowserVersion() < 86) {
            alert("这个还没兼容，所以我只能帮你加一个microbit了");
            args[2]('["microbit"]');
          } else
            (async () => {
              const selected_categories = payload.selected_categories;
              await showExtensionShop(selected_categories, args[2]);
            })();
          return;
        }
      } catch (e) { console.error(e); }
    const result = call.apply(dsbridge, args);
    // if (experimentalConfig.webview_debug) {
    //     console.log('[Webview -> Nemo] args:', ...args, 'result:', result);
    //     debugServer.send(JSON.stringify({
    //         type: 'w2n',
    //         data: [...args],
    //         result
    //     }));
    // }
    return result;
  };
})();
// --------------- 劫持Native向Web发送的数据 ---------------
(async () => {
  await waitGetGlobal('_dsf');
  await waitGetGlobal('_dsaf');

  const postMessage = _dsf.postMessage;
  _dsf.postMessage = (...args) => {
    if (experimentalConfig.webview_debug) {
      console.log('[Nemo -> Webview]', ...args);
      debugServer.send(JSON.stringify({
        type: 'n2w',
        data: [...args]
      }));
    }
    if (args.length === 2)
      if (args[0] === 'INIT_WEBVIEW_DATA') {
        let data = JSON.parse(args[1]);
        window['WEBVIEW_DATA'] = data;
        // 启用教师端的积木隐藏功能
        data.context_menu_with_set_block_visibility = true;
        // 启用显示隐藏积木
        data.translucent_block_visible = 'translucent';
        // 给Nemo修改后的数据
        return postMessage.apply(_dsf, [
          'INIT_WEBVIEW_DATA',
          JSON.stringify(data)
        ]);
      }
    return postMessage.apply(_dsf, args);
  };
  window['postMsg'] = _dsf.postMessage;
  const postMessageAsyn = _dsaf.postMessageAsyn;
  _dsaf.postMessageAsyn = async (...args) => {
    if (experimentalConfig.webview_debug) {
      console.log('[Nemo -> Webview] [ASYNC]', ...args);
      debugServer.send(JSON.stringify({
        type: 'n2w async',
        data: [...args]
      }));
    }
    // 桌面端：直接路由 LOAD_BCM 到 React 应用
    if (args[0] === 'LOAD_BCM') {
      var bcmData = typeof args[1] === 'string' ? JSON.parse(args[1]) : args[1];
      console.log('[Desktop] LOAD_BCM 直接路由, actors:', Object.keys(bcmData.actors?.actors_dict || {}));
      function tryDispatch(attempt) {
        var redux = window.HookRedux;
        var store = redux && (redux.NemoStore || redux.default || redux);
        if (store && typeof store.dispatch === 'function') {
          store.dispatch({ type: 'LOAD_BCM', payload: bcmData });
          console.log('[Desktop] LOAD_BCM 已 dispatch 到 Redux store (attempt ' + attempt + ')');
        } else if (attempt < 10) {
          console.warn('[Desktop] Redux store 不可用, 重试 #' + (attempt + 1));
          setTimeout(function() { tryDispatch(attempt + 1); }, 500);
        } else {
          console.error('[Desktop] Redux store 始终不可用');
        }
      }
      tryDispatch(1);
      return;
    }
    return postMessageAsyn.apply(_dsaf, args);
  };
  window['postMsgAsyn'] = _dsaf.postMessageAsyn;
})();
function createBlock(id) {
  const b = Blockly.mainWorkspace.new_block(id);
  b.init_svg();
  b.render();
}
class BNGenerator {
  constructor(workspace, indent = '  ') {
    this.workspace = workspace;
    this.indent = indent;
    // 语句块生成器注册表
    this.statementGenerators = new Map();
    // 值块生成器注册表
    this.valueGenerators = new Map();
    // 注册默认生成器
    this.registerDefaultGenerators();
  }
  /**
   * 注册默认生成器
   */
  registerDefaultGenerators() {
    // 注册语句块生成器
    this.regStatement('on_running_group_activated', (block) => {
      if (block.get_next_block())
        return `bnbc.on_running_group_activated(() => {${this.nextBlocksToCode(block)}});`;
      return `bnbc.on_running_group_activated(() => {});`;
    });
    this.regStatement('controls_if', (block) => {
      let code = '';
      const cond = this.valueToCode(block, 'IF0');
      const doCode = this.statementToCode(block, 'DO0');
      code += `if (${cond}) {${doCode}}`;

      let ei = 1;
      while (block.get_input(`IF${ei}`)) {
        const elseifCond = this.valueToCode(block, `IF${ei}`);
        const elseifDo = this.statementToCode(block, `DO${ei}`);
        code += `else if (${elseifCond}) {${elseifDo}}`;
        ei++;
      }
      if (block.get_input('ELSE')) {
        const elseDo = this.statementToCode(block, 'ELSE');
        code += `else {${elseDo}}`;
      }
      return code;
    });
    // 注册值块生成器
    this.regValue('math_number', (block) => {
      return block.get_field_value('NUM') || '0';
    });
    this.regValue('math_arithmetic', (block) => {
      const op = block.get_field_value('OP');
      const left = this.valueToCode(block, 'A');
      const right = this.valueToCode(block, 'B');
      let expr;
      switch (op) {
        case 'ADD': expr = `${left} + ${right}`; break;
        case 'MINUS': expr = `${left} - ${right}`; break;
        case 'MULTIPLY': expr = `${left} * ${right}`; break;
        case 'DIVIDE': expr = `${left} / ${right}`; break;
        case 'POWER': return `Math.pow(${left}, ${right})`;
        default: expr = `${left} ? ${right}`;
      }
      return `(${expr})`;
    });
    this.regValue('math_single', (block) => {
      const op = block.get_field_value('OP');
      const arg = this.valueToCode(block, 'NUM');
      switch (op) {
        case 'ROOT': return `Math.sqrt(${arg})`;
        case 'ABS': return `Math.abs(${arg})`;
        case 'NEG': return `-${arg}`;
        case 'LN': return `Math.log(${arg})`;
        case 'LOG10': return `Math.log10(${arg})`;
        case 'EXP': return `Math.exp(${arg})`;
        case 'POW10': return `Math.pow(10, ${arg})`;
        default: return `Math.${op}(${arg})`;
      }
    });
    this.regValue('math_constant', (block) => {
      const c = block.get_field_value('CONSTANT');
      if (c === 'PI') return 'Math.PI';
      if (c === 'E') return 'Math.E';
      if (c === 'GOLDEN_RATIO') return '(1 + Math.sqrt(5)) / 2';
      return 'undefined';
    });
    this.regValue('logic_empty', () => 'false');
    this.regValue('logic_null', () => 'null');
    this.regValue('logic_compare', (block) => {
      const op = block.get_field_value('OP');
      const left = this.valueToCode(block, 'A');
      const right = this.valueToCode(block, 'B');
      const opMap = { EQ: '==', NEQ: '!=', LT: '<', LTE: '<=', GT: '>', GTE: '>=' };
      const jsOp = opMap[op] || '?';
      return `(${left} ${jsOp} ${right})`;
    });
    this.regValue('logic_operation', (block) => {
      const op = block.get_field_value('OP');
      const left = this.valueToCode(block, 'A');
      const right = this.valueToCode(block, 'B');
      const jsOp = op === 'AND' ? '&&' : '||';
      return `(${left} ${jsOp} ${right})`;
    });
    this.regValue('logic_negate', (block) => {
      const val = this.valueToCode(block, 'BOOL');
      return `(!${val})`;
    });
    this.regValue('logic_boolean', (block) => {
      return block.get_field_value('BOOL') === 'TRUE' ? 'true' : 'false';
    });
    this.regValue('text', (block) => {
      const text = block.get_field_value('TEXT');
      return JSON.stringify(text);
    });
    this.regValue('text_join', (block) => {
      let items = [];
      let i = 0;
      while (block.get_input(`ADD${i}`)) {
        items.push(this.valueToCode(block, `ADD${i}`));
        i++;
      }
      return items.length > 0 ? items.join(' + ') : '""';
    });
    this.regValue('text_length', (block) => {
      const v = this.valueToCode(block, 'VALUE');
      return `${v}.length`;
    });
    this.regValue('text_indexOf', (block) => {
      const haystack = this.valueToCode(block, 'VALUE');
      const needle = this.valueToCode(block, 'FIND');
      return `${haystack}.indexOf(${needle})`;
    });
    this.regValue('variables_get', (block) => {
      const varName = block.get_field_value('VAR');
      return varName || 'undefined_var';
    });
  }

  /**
   * 注册语句块生成器
   * @param {string} blockType - 积木类型
   * @param {Function} generator - 生成器函数，接收 block 参数，返回代码字符串
   */
  regStatement(blockType, generator) {
    this.statementGenerators.set(blockType, generator);
  }
  /**
   * 注册值块生成器
   * @param {string} blockType - 积木类型
   * @param {Function} generator - 生成器函数，接收 block 参数，返回代码字符串
   */
  regValue(blockType, generator) {
    this.valueGenerators.set(blockType, generator);
  }
  /**
   * 生成整个工作区的代码
   * @returns {string} JavaScript 代码
   */
  generate() {
    const topBlocks = this.workspace.get_top_blocks(true);
    return topBlocks.map(block => [
      "start_on_click",
      "self_on_tap",
      "on_phone_shake",
      "on_receive_sound",
      "on_phone_tilt",
      "on_swipe",
      "self_listen",
      "when",
      "on_running_group_activated",
      "start_as_a_mirror",
      "midi__on_play_section",
      "midi__on_play_note",
      "microbit_button_when",
      "microbit_pin_when",
      "microbit_logo_when"
    ].includes(block.type) ? this.blockToCode(block) : '').join('');
  }
  // ---------- 语句块处理 ----------
  blockToCode(block) {
    const type = block.type;
    // 查找注册的语句块生成器
    if (this.statementGenerators.has(type)) {
      return this.statementGenerators.get(type)(block);
    }
    // 如果没有找到，使用回退策略
    return this.expressionStatementFallback(block);
  }
  expressionStatementFallback(block) {
    const inputNames = ['VALUE', 'INPUT', 'A'];
    for (const name of inputNames) {
      if (block.get_input_target_block(name)) {
        return this.valueToCode(block, name) + ';';
      }
    }
    return `/* 未知语句块: ${block.type} */`;
  }
  // ---------- 值块处理（表达式） ----------
  valueToCode(block, inputName) {
    const target = block.get_input_target_block(inputName);
    if (!target) {
      return 'undefined';
    }
    return this.valueBlockToCode(target);
  }
  valueBlockToCode(block) {
    const type = block.type;
    // 查找注册的值块生成器
    if (this.valueGenerators.has(type)) {
      return this.valueGenerators.get(type)(block);
    }
    // 回退策略：尝试从字段获取值
    const fields = block.input_list?.[0]?.field_row || [];
    if (fields.length) {
      return JSON.stringify(fields[0].get_value?.() || '?');
    }
    return `/* 未知值块: ${type} */ undefined`;
  }
  statementToCode(block, inputName) {
    const input = block.get_input(inputName);
    if (!input || !input.connection) return '';
    const target = input.connection.targetBlock();
    if (!target) return '';
    let code = '';
    let current = target;
    while (current) {
      code += this.blockToCode(current);
      current = current.get_next_block();
    }
    return code;
  }
  nextBlocksToCode(block) {
    let code = '';
    while (block) {
      const nextBlock = block.get_next_block();
      if (nextBlock) {
        code += this.blockToCode(nextBlock);
      }
      block = nextBlock;
    }
    return code;
  }
}
// --------------- BNLink 格式 & 作品加载 ---------------
// BNLink v1: 轻量作品链接文件 (.bnlink)
// { v:1, n:"项目名", r:{ t:"data"|"data2"|"wid"|"url", ... } }
//   r.t="data"  → r.d: base64 编码的 BCM JSON
//   r.t="data2" → r.j: 直接嵌入的 BCM JSON（纯本地，无 base64 膨胀）
//   r.t="wid"   → r.id: 编程猫作品 ID
//   r.t="url"   → r.u: BCM 文件 URL
window.loadProjectFile = function(file, callback) {
  if (file.name.match(/\.bn$/i)) {
    // .bn 格式：zip 容器，需要 ArrayBuffer
    var reader = new FileReader();
    reader.onload = async function(e) {
      try {
        if (!window.loadBNProject) { showMsg('导入失败：.bn 加载器未就绪'); callback({ error: '.bn 加载器未就绪' }); return; }
        var result = await window.loadBNProject(e.target.result);
        if (!result || result.error) { showMsg('导入失败：' + (result ? result.error : '未知解析错误')); callback(result || { error: '未知解析错误' }); return; }
        loadProjectJSON(result.bcm, false, function(res) {
          if (res.ok) res.name = result.bcm.project_name;
          callback(res);
        });
      } catch(ex) {
        showMsg('导入失败：.bn 加载失败 - ' + ex.message);
        callback({ error: '.bn 加载失败: ' + ex.message });
      }
    };
    reader.readAsArrayBuffer(file);
  } else if (file.name.match(/\.bnlink$/i)) {
    var reader = new FileReader();
    reader.onload = function(e) {
      try {
        var link = JSON.parse(e.target.result);
        if (!link || link.v !== 1 || !link.r) throw new Error('无效的 BNLink 文件');
        resolveBNLink(link, callback);
      } catch(ex) {
        showMsg('导入失败：' + ex.message);
        callback({ error: ex.message });
      }
    };
    reader.readAsText(file);
  } else {
    var reader = new FileReader();
    reader.onload = function(e) {
      try {
        var json = JSON.parse(e.target.result);
        loadProjectJSON(json, false, callback);
      } catch(ex) {
        showMsg('导入失败：文件解析错误');
        callback({ error: ex.message });
      }
    };
    reader.readAsText(file);
  }
};
function resolveBNLink(link, callback) {
  if (link.r.t === 'data') {
    try {
      var json = JSON.parse(atob(link.r.d));
      loadProjectJSON(json, false, callback);
    } catch(ex) { callback({ error: 'BNLink 数据解码失败: ' + ex.message }); }
  } else if (link.r.t === 'data2') {
    loadProjectJSON(link.r.j, false, callback);
  } else if (link.r.t === 'url') {
    fetch(link.r.u).then(function(r) { return r.json(); }).then(function(json) {
      loadProjectJSON(json, false, callback);
    }).catch(function(err) { callback({ error: '获取 URL 失败: ' + err.message }); });
  } else if (link.r.t === 'wid') {
    fetch('https://api.codemao.cn/creation-tools/v1/works/' + link.r.id + '/source/public')
      .then(function(r) { return r.json(); })
      .then(function(info) {
        if (info.error_code) { callback({ error: info.error_message }); return; }
        return fetch(info.work_urls[0]).then(function(r) { return r.json(); });
      })
      .then(function(bcm) { loadProjectJSON(bcm, false, callback); })
      .catch(function(err) { callback({ error: '获取作品失败: ' + err.message }); });
  } else {
    callback({ error: '不支持的引用类型: ' + link.r.t });
  }
}
function convertCodeMaoBcm(json) {
  console.log('[Import] convertCodeMaoBcm: 原始 BCM keys:', Object.keys(json));
  console.log('[Import] theatre scenes:', Object.keys(json.theatre.scenes || {}));
  console.log('[Import] theatre actors:', Object.keys(json.theatre.actors || {}));
  var theatre = json.theatre;
  var actors = {};
  var scenes = {};
  var styles = {};
  // 转换 actors
  if (theatre.actors) {
    Object.keys(theatre.actors).forEach(function(id) {
      var a = theatre.actors[id];
      actors[id] = {
        id: id,
        name: a.name || '',
        scene_id: '',
        current_style_id: a.current_style_id || '',
        x: a.x || 0, y: a.y || 0,
        size: a.scale || 100,
        direction: a.rotation || 0,
        visible: a.visible !== false,
        layer_order: 0,
        variables: {},
        lists: {},
        blocksXML: a.blocksXML || ''
      };
    });
  }
  // 转换 scenes
  if (theatre.scenes) {
    Object.keys(theatre.scenes).forEach(function(id) {
      var s = theatre.scenes[id];
      scenes[id] = {
        name: s.name || '',
        current_style_id: s.current_style_id || '',
        styles: {},
        actors: s.actors || [],
        custom_events: [],
        variables: {},
        lists: {},
        blocksXML: s.blocksXML || ''
      };
      // 关联 actor 到 scene
      (s.actors || []).forEach(function(aid) {
        if (actors[aid]) actors[aid].scene_id = id;
      });
    });
  }
  // 转换 styles
  if (json.theatre.styles) {
    Object.keys(json.theatre.styles).forEach(function(id) {
      var st = json.theatre.styles[id];
      styles[id] = {
        name: st.name || '',
        path: st.path || st.url || '',
        width: st.width || 0,
        height: st.height || 0,
        background_color: st.background_color || ''
      };
    });
  }
  return {
    project_name: json.project_name || '未命名',
    app_version: json.application_version || '0.16.2',
    stage_size: { width: json.width || 480, height: json.height || 360 },
    actors: { actors_dict: actors },
    scenes: { scenes_dict: scenes },
    styles: { styles_dict: styles },
    variables: json.variables || {},
    lists: json.lists || {}
  };
}
function loadProjectJSON(json, fromCache, callback) {
  var bcm, data;
  console.log('[Import] loadProjectJSON 输入:', Object.keys(json), 'theatre:', !!json.theatre, 'actors:', !!json.actors, 'scenes:', !!json.scenes);
  // 编程猫 BCM 格式：actors/scenes/styles 在 theatre 下，积木在 blocksXML 字段
  if (json.theatre && json.theatre.scenes && !json.scenes) {
    console.log('[Import] 检测到编程猫 BCM 格式，执行转换');
    bcm = convertCodeMaoBcm(json);
    console.log('[Import] 转换后 bcm keys:', Object.keys(bcm), 'actors:', Object.keys(bcm.actors || {}));
    data = {
      avatar_url: '', bcm_version: json.application_version || '0.16.2',
      context_menu_with_set_block_visibility: false,
      enable_hide: false, is_login: false, is_pad: false,
      nickname: '', sidebar_width: 64,
      stage_position: {
        portrait: {
          fullscreen: { bottom: 0, height: json.height || 480, left: 0, ratio: 0, right: 0, top: 0, width: json.width || 360 },
          normal: { bottom: 0, height: 0, left: 0, ratio: 0, right: 0, top: 0, width: 0 }
        }
      },
      toolbox_mode: 'normal', translucent_block_visible: 'visible',
      user_id: '', user_level: -1, user_token: '', webview_height: 0, work_id: ''
    };
  } else if (json.actors && json.scenes) {
    bcm = json;
    data = {
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
  } else if (json.bcm) {
    bcm = json.bcm;
    data = json.data || {};
  } else {
    showMsg('导入失败：无法识别的作品文件格式');
    callback({ error: '无法识别的作品文件格式' });
    return;
  }
  // 显示导入加载遮罩
  var overlay = document.getElementById('bnLoadingOverlay');
  if (overlay) { overlay.classList.add('active'); }
  try { var mgr = get_run_mgr(); if (mgr && mgr.stop) mgr.stop(); } catch(ex) {}
  if (window.postMsg && window.postMsgAsyn) {
    console.log('[Import] 发送 INIT_WEBVIEW_DATA');
    window.postMsg('INIT_WEBVIEW_DATA', JSON.stringify(data));
    console.log('[Import] 发送 LOAD_BCM, bcm keys:', Object.keys(bcm), 'actors count:', Object.keys(bcm.actors || {}).length);
    console.log('[Import] LOAD_BCM JSON 长度:', JSON.stringify(bcm).length);
    window.postMsgAsyn('LOAD_BCM', JSON.stringify(bcm));
    // 加入最近作品缓存（仅在非回放时）
    if (!fromCache && window.bnCache) {
      window.bnCache.add({ name: bcm.project_name || '未命名', bcm: json });
    }
    callback({ ok: true, name: bcm.project_name });
    showMsg('导入成功：' + (bcm.project_name || '未命名作品'));
    // 延迟隐藏遮罩
    setTimeout(function() {
      if (overlay) { overlay.classList.remove('active'); }
    }, 600);
  } else {
    if (overlay) { overlay.classList.remove('active'); }
    showMsg('导入失败：作品加载器未就绪');
    callback({ error: '作品加载器未就绪' });
  }
}
window.loadProjectJSON = loadProjectJSON;
window.saveBNLink = function(name, ref) {
  return JSON.stringify({ v: 1, n: name, r: ref });
};
window.getCurrentBCM = function() {
  try {
    var redux = window.HookRedux;
    if (!redux) return null;
    var store = redux.NemoStore || redux.default || redux;
    if (typeof store.getState === 'function') return store.getState().bcm;
  } catch(e) {}
  return null;
};
// --------------- 最近作品缓存 ---------------
window.bnCache = {
  _key: 'bn_recent',
  _max: 10,
  list: function() {
    try { return JSON.parse(localStorage.getItem(window.bnCache._key)) || []; } catch(e) { return []; }
  },
  add: function(entry) {
    var list = window.bnCache.list();
    // 去重（同名+同数据指纹）
    var fingerprint = function(e) { return e.name + '|' + (typeof e.bcm === 'object' ? JSON.stringify(e.bcm).length : ''); };
    var fp = fingerprint(entry);
    list = list.filter(function(e) { return fingerprint(e) !== fp; });
    list.unshift({ name: entry.name, bcm: entry.bcm, time: Date.now() });
    if (list.length > window.bnCache._max) list.length = window.bnCache._max;
    try { localStorage.setItem(window.bnCache._key, JSON.stringify(list)); } catch(e) { /* storage full, ignore */ }
  },
  clear: function() {
    try { localStorage.removeItem(window.bnCache._key); } catch(e) {}
  }
};
loadScript("https://cdnjs.cloudflare.com/ajax/libs/js-beautify/1.15.4/beautify.min.js");
// 测试使用
BetterNemo._ = {
  code: () => console.log('BN Block2Code Test:\n', js_beautify(new BNGenerator(Blockly.mainWorkspace).generate()))
};
if (isPCTestEnv() && false)
  (async () => {
    async function sleep(ms) {
      return new Promise(resolve => setTimeout(resolve, ms));
    }
    await waitHook('Dsbridge');
    await sleep(100);
    // _dsf.postMessage('INIT_WEBVIEW_DATA', '{"avatar_url":"https://cdn-community.codemao.cn/47/community/d2ViXzEwMDFfMTIwNjgxMzlfMTIwNjgxMzlfMTY3MTM1MzQwMTE3MV8wN2ZhZGYyYQ.jpeg","bcm_version":"0.16.2","context_menu_with_set_block_visibility":false,"enable_hide":false,"is_login":true,"is_pad":false,"nickname":"Inventocode","sidebar_width":64,"stage_position":{"portrait":{"fullscreen":{"bottom":0,"height":591,"left":0,"ratio":0,"right":0,"top":0,"width":369},"normal":{"bottom":0,"height":369,"left":0,"ratio":0,"right":0,"top":0,"width":231}}},"toolbox_mode":"normal","translucent_block_visible":"visible","user_id":"12068139","user_level":1,"user_token":"Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJDb2RlbWFvIEF1dGgiLCJ1c2VyX3R5cGUiOiJzdHVkZW50IiwiZGV2aWNlX2lkIjoxNzAzOTYyMiwidXNlcl9pZCI6MTIwNjgxMzksImlzcyI6IkF1dGggU2VydmljZSIsInBpZCI6IlQ1cXg5X3cwIiwiZXhwIjo0MTAyNDQ0Nzk5LCJpYXQiOjE3Njk5NTI1NzMsImp0aSI6ImVjYjA4NjhhLTU3OTAtNDU5NC1hNTk2LWE4MmZhNDE5ZDMyZCJ9.bMd7QmpvQqodvIz8xHr12KSCCMAodpzqoZ8EOQFH50I","webview_height":0,"work_id":"303632890"}');
    await sleep(100);
    _dsaf.postMessageAsyn('LOAD_BCM', { "actors": { "actors_dict": { "2ae8f450-4a04-4f9f-bc47-6b4bbe37e14b": { "blocksXML": "\u003cblock type\u003d\"start_on_click\" id\u003d\"NIKsSRGZ7GxiAwtHIcPx\" visible\u003d\"visible\" inline\u003d\"true\" x\u003d\"80\" y\u003d\"70\"\u003e\u003cnext\u003e\u003cblock type\u003d\"self_ask\" id\u003d\"l0Yo8bQ5KgYWc7RacXM6\" visible\u003d\"visible\" inline\u003d\"true\"\u003e\u003cvalue name\u003d\"text\"\u003e\u003cshadow type\u003d\"text\" id\u003d\"9HipTU8KvDiHv6B9pXHc\" visible\u003d\"visible\"\u003e\u003cfield name\u003d\"TEXT\"\u003e你的名字？\u003c/field\u003e\u003c/shadow\u003e\u003c/value\u003e\u003cnext\u003e\u003cblock type\u003d\"bn_alert\" id\u003d\"CDZjEg76BUZ0KsW8PLra\" visible\u003d\"visible\" inline\u003d\"true\"\u003e\u003cvalue name\u003d\"param\"\u003e\u003cshadow type\u003d\"text\" id\u003d\"e9QH05R1l59p7A8QRkPM\" visible\u003d\"visible\"\u003e\u003cfield name\u003d\"TEXT\"\u003eWOW\u003c/field\u003e\u003c/shadow\u003e\u003cblock type\u003d\"get_answer\" id\u003d\"Snp59sNN11MksfhwJsMI\" visible\u003d\"visible\" inline\u003d\"true\"\u003e\u003c/block\u003e\u003c/value\u003e\u003cnext\u003e\u003cblock type\u003d\"repeat_forever\" id\u003d\"q6JvFn72KJxrZJXkKy7N\" visible\u003d\"visible\" inline\u003d\"true\"\u003e\u003cstatement name\u003d\"DO\"\u003e\u003cblock type\u003d\"self_go_forward\" id\u003d\"M0bwxl6rcKssTxudREo3\" visible\u003d\"visible\" inline\u003d\"true\"\u003e\u003cvalue name\u003d\"steps\"\u003e\u003cshadow type\u003d\"math_number\" id\u003d\"FxmDxgnb2VOL9eooveZ3\" visible\u003d\"visible\"\u003e\u003cfield constraints\u003d\"-Infinity,Infinity,0,\" name\u003d\"NUM\"\u003e10\u003c/field\u003e\u003c/shadow\u003e\u003c/value\u003e\u003cnext\u003e\u003cblock type\u003d\"self_bounce_off_edge\" id\u003d\"Oq6oHobFcZt8gIhLLKgW\" visible\u003d\"visible\" inline\u003d\"true\"\u003e\u003c/block\u003e\u003c/next\u003e\u003c/block\u003e\u003c/statement\u003e\u003cnext last_next_in_stack\u003d\"true\"\u003e\u003c/next\u003e\u003c/block\u003e\u003c/next\u003e\u003c/block\u003e\u003c/next\u003e\u003c/block\u003e\u003c/next\u003e\u003c/block\u003e\u003cblock type\u003d\"midi__set_program\" id\u003d\"aaibZS5OCA6UUOwNQisN\" visible\u003d\"visible\" inline\u003d\"true\" x\u003d\"171\" y\u003d\"200\"\u003e\u003cfield name\u003d\"program\"\u003eorgan_1\u003c/field\u003e\u003cvalue name\u003d\"audio\"\u003e\u003cshadow type\u003d\"midi_get\" id\u003d\"U75Zn4jxjqSpiYpH3STI\" visible\u003d\"visible\" inline\u003d\"true\"\u003e\u003cfield name\u003d\"audio\"\u003e34b4d570-bd24-4c57-b39c-7100e5ead832\u003c/field\u003e\u003c/shadow\u003e\u003c/value\u003e\u003cnext last_next_in_stack\u003d\"true\"\u003e\u003c/next\u003e\u003c/block\u003e\u003cblock type\u003d\"lists_append\" id\u003d\"nwH7lkbKX9Cw9c048TrV\" visible\u003d\"visible\" inline\u003d\"true\" x\u003d\"268\" y\u003d\"254\"\u003e\u003cvalue name\u003d\"VALUE\"\u003e\u003cshadow xmlns\u003d\"\" type\u003d\"math_number\" id\u003d\"TVIp6Dk6NxynKIuxCW2U\" visible\u003d\"visible\"\u003e\u003cfield constraints\u003d\"-Infinity,Infinity,0,\" allow_text\u003d\"true\" name\u003d\"NUM\"\u003e0\u003c/field\u003e\u003c/shadow\u003e\u003cblock type\u003d\"encrypt_md5_hash\" id\u003d\"b3JTbuXq2f4B0N5M6kdG\" visible\u003d\"visible\"\u003e\u003cvalue name\u003d\"TEXT\"\u003e\u003cshadow type\u003d\"text\" id\u003d\"c2ECWA4rnQ1paabuMOWM\" visible\u003d\"visible\"\u003e\u003cfield name\u003d\"TEXT\"\u003eWow wow\u003c/field\u003e\u003c/shadow\u003e\u003c/value\u003e\u003c/block\u003e\u003c/value\u003e\u003cvalue name\u003d\"VAR\"\u003e\u003cshadow type\u003d\"lists_get\" id\u003d\"YWUsjWoi8EAcUUtVuEwe\" visible\u003d\"visible\" inline\u003d\"true\"\u003e\u003cfield name\u003d\"VAR\"\u003eba7e16b8-de1e-430b-9d40-bfbd685515f0\u003c/field\u003e\u003c/shadow\u003e\u003c/value\u003e\u003cnext\u003e\u003cblock type\u003d\"lists_append\" id\u003d\"qZfNiVnsShN14sT3LNlQ\" visible\u003d\"visible\" inline\u003d\"true\"\u003e\u003cvalue name\u003d\"VALUE\"\u003e\u003cshadow xmlns\u003d\"\" type\u003d\"math_number\" id\u003d\"hT2jeWHmMTHVSOHzipap\" visible\u003d\"visible\"\u003e\u003cfield constraints\u003d\"-Infinity,Infinity,0,\" allow_text\u003d\"true\" name\u003d\"NUM\"\u003e0\u003c/field\u003e\u003c/shadow\u003e\u003cblock type\u003d\"encrypt_sha_hash\" id\u003d\"Re1xjdM2qHGf18nFvd05\" visible\u003d\"visible\"\u003e\u003cfield name\u003d\"TYPE\"\u003e1\u003c/field\u003e\u003cvalue name\u003d\"TEXT\"\u003e\u003cshadow type\u003d\"text\" id\u003d\"WR2KfQn4gDONHdSo0031\" visible\u003d\"visible\"\u003e\u003cfield name\u003d\"TEXT\"\u003e嘤嘤嘤嘤\u003c/field\u003e\u003c/shadow\u003e\u003c/value\u003e\u003c/block\u003e\u003c/value\u003e\u003cvalue name\u003d\"VAR\"\u003e\u003cshadow type\u003d\"lists_get\" id\u003d\"ZxTtogKCWKznwA8dc6OZ\" visible\u003d\"visible\" inline\u003d\"true\"\u003e\u003cfield name\u003d\"VAR\"\u003eba7e16b8-de1e-430b-9d40-bfbd685515f0\u003c/field\u003e\u003c/shadow\u003e\u003c/value\u003e\u003cnext\u003e\u003cblock type\u003d\"lists_append\" id\u003d\"vbhrK9yaFmMyJLUog5yn\" visible\u003d\"visible\" inline\u003d\"true\"\u003e\u003cvalue name\u003d\"VALUE\"\u003e\u003cshadow xmlns\u003d\"\" type\u003d\"math_number\" id\u003d\"SEn8CQup1etk0COvvPci\" visible\u003d\"visible\"\u003e\u003cfield constraints\u003d\"-Infinity,Infinity,0,\" allow_text\u003d\"true\" name\u003d\"NUM\"\u003e0\u003c/field\u003e\u003c/shadow\u003e\u003cblock type\u003d\"encrypt_sha_hash\" id\u003d\"01oVzrqSsRvhKyrnUFob\" visible\u003d\"visible\"\u003e\u003cfield name\u003d\"TYPE\"\u003e224\u003c/field\u003e\u003cvalue name\u003d\"TEXT\"\u003e\u003cshadow type\u003d\"text\" id\u003d\"GtwvaZU4hvKQSxTGAJQx\" visible\u003d\"visible\"\u003e\u003cfield name\u003d\"TEXT\"\u003e咕咕嘎嘎！\u003c/field\u003e\u003c/shadow\u003e\u003c/value\u003e\u003c/block\u003e\u003c/value\u003e\u003cvalue name\u003d\"VAR\"\u003e\u003cshadow type\u003d\"lists_get\" id\u003d\"c96ylbJkEgzj5uUIWVXs\" visible\u003d\"visible\" inline\u003d\"true\"\u003e\u003cfield name\u003d\"VAR\"\u003eba7e16b8-de1e-430b-9d40-bfbd685515f0\u003c/field\u003e\u003c/shadow\u003e\u003c/value\u003e\u003cnext\u003e\u003cblock type\u003d\"lists_append\" id\u003d\"GWKLaXX1jEsj9SVuCln8\" visible\u003d\"visible\" inline\u003d\"true\"\u003e\u003cvalue name\u003d\"VALUE\"\u003e\u003cshadow xmlns\u003d\"\" type\u003d\"math_number\" id\u003d\"SJZrJe0CziTVo40RxBGF\" visible\u003d\"visible\"\u003e\u003cfield constraints\u003d\"-Infinity,Infinity,0,\" allow_text\u003d\"true\" name\u003d\"NUM\"\u003e0\u003c/field\u003e\u003c/shadow\u003e\u003cblock type\u003d\"encrypt_sha_hash\" id\u003d\"f6vHpl0TFxtjnW79vJEB\" visible\u003d\"visible\"\u003e\u003cfield name\u003d\"TYPE\"\u003e256\u003c/field\u003e\u003cvalue name\u003d\"TEXT\"\u003e\u003cshadow type\u003d\"text\" id\u003d\"pXfXowTQws8OxWHYL3DY\" visible\u003d\"visible\"\u003e\u003cfield name\u003d\"TEXT\"\u003e呃啊\u003c/field\u003e\u003c/shadow\u003e\u003c/value\u003e\u003c/block\u003e\u003c/value\u003e\u003cvalue name\u003d\"VAR\"\u003e\u003cshadow type\u003d\"lists_get\" id\u003d\"HastH7NIWUHB1SKn8Q2h\" visible\u003d\"visible\" inline\u003d\"true\"\u003e\u003cfield name\u003d\"VAR\"\u003eba7e16b8-de1e-430b-9d40-bfbd685515f0\u003c/field\u003e\u003c/shadow\u003e\u003c/value\u003e\u003cnext\u003e\u003cblock type\u003d\"lists_append\" id\u003d\"v5mc2H9cS7X3SbtE0frl\" visible\u003d\"visible\" inline\u003d\"true\"\u003e\u003cvalue name\u003d\"VALUE\"\u003e\u003cshadow xmlns\u003d\"\" type\u003d\"math_number\" id\u003d\"wY8EwEkIILhSBTi9X4li\" visible\u003d\"visible\"\u003e\u003cfield constraints\u003d\"-Infinity,Infinity,0,\" allow_text\u003d\"true\" name\u003d\"NUM\"\u003e0\u003c/field\u003e\u003c/shadow\u003e\u003cblock type\u003d\"encrypt_sm3_hash\" id\u003d\"ZqmcwG00h6xXoVbAHYDJ\" visible\u003d\"visible\"\u003e\u003cvalue name\u003d\"TEXT\"\u003e\u003cshadow type\u003d\"text\" id\u003d\"MZbeWjqkpgY0ghjwyRkc\" visible\u003d\"visible\"\u003e\u003cfield name\u003d\"TEXT\"\u003esm？\u003c/field\u003e\u003c/shadow\u003e\u003c/value\u003e\u003c/block\u003e\u003c/value\u003e\u003cvalue name\u003d\"VAR\"\u003e\u003cshadow type\u003d\"lists_get\" id\u003d\"OEEqtiChsAVNkb4pt34M\" visible\u003d\"visible\" inline\u003d\"true\"\u003e\u003cfield name\u003d\"VAR\"\u003eba7e16b8-de1e-430b-9d40-bfbd685515f0\u003c/field\u003e\u003c/shadow\u003e\u003c/value\u003e\u003cnext\u003e\u003cblock type\u003d\"lists_append\" id\u003d\"rbieJA2aQDpfYXZy5KsD\" visible\u003d\"visible\" inline\u003d\"true\"\u003e\u003cvalue name\u003d\"VALUE\"\u003e\u003cshadow xmlns\u003d\"\" type\u003d\"math_number\" id\u003d\"HMBK4YOy6U86bSGqfNUI\" visible\u003d\"visible\"\u003e\u003cfield constraints\u003d\"-Infinity,Infinity,0,\" allow_text\u003d\"true\" name\u003d\"NUM\"\u003e0\u003c/field\u003e\u003c/shadow\u003e\u003cblock type\u003d\"encrypt_sha_hash\" id\u003d\"E91pGRLnLtJrifMFSQNI\" visible\u003d\"visible\"\u003e\u003cfield name\u003d\"TYPE\"\u003e512\u003c/field\u003e\u003cvalue name\u003d\"TEXT\"\u003e\u003cshadow type\u003d\"text\" id\u003d\"x3N1T5DYBDP2m71YZ4yK\" visible\u003d\"visible\"\u003e\u003cfield name\u003d\"TEXT\"\u003e肥肥鲨\u003c/field\u003e\u003c/shadow\u003e\u003c/value\u003e\u003c/block\u003e\u003c/value\u003e\u003cvalue name\u003d\"VAR\"\u003e\u003cshadow type\u003d\"lists_get\" id\u003d\"tvBAn9JKOaTa8ZRW42vZ\" visible\u003d\"visible\" inline\u003d\"true\"\u003e\u003cfield name\u003d\"VAR\"\u003eba7e16b8-de1e-430b-9d40-bfbd685515f0\u003c/field\u003e\u003c/shadow\u003e\u003c/value\u003e\u003cnext\u003e\u003cblock type\u003d\"lists_append\" id\u003d\"R7oWlkT3DhhLTtQl8X6O\" visible\u003d\"visible\" inline\u003d\"true\"\u003e\u003cvalue name\u003d\"VALUE\"\u003e\u003cshadow xmlns\u003d\"\" type\u003d\"math_number\" id\u003d\"7xOeRy1eJVceSAYiAb84\" visible\u003d\"visible\"\u003e\u003cfield constraints\u003d\"-Infinity,Infinity,0,\" allow_text\u003d\"true\" name\u003d\"NUM\"\u003e0\u003c/field\u003e\u003c/shadow\u003e\u003cblock type\u003d\"encrypt_sha_hash\" id\u003d\"fAon4tetiz6RJCDE4aUi\" visible\u003d\"visible\"\u003e\u003cfield name\u003d\"TYPE\"\u003e384\u003c/field\u003e\u003cvalue name\u003d\"TEXT\"\u003e\u003cshadow type\u003d\"text\" id\u003d\"tfxxEyqMfIKJtnjtgDll\" visible\u003d\"visible\"\u003e\u003cfield name\u003d\"TEXT\"\u003e沙漠\u003c/field\u003e\u003c/shadow\u003e\u003c/value\u003e\u003c/block\u003e\u003c/value\u003e\u003cvalue name\u003d\"VAR\"\u003e\u003cshadow type\u003d\"lists_get\" id\u003d\"GBAeymN4JqSQofhd71H3\" visible\u003d\"visible\" inline\u003d\"true\"\u003e\u003cfield name\u003d\"VAR\"\u003eba7e16b8-de1e-430b-9d40-bfbd685515f0\u003c/field\u003e\u003c/shadow\u003e\u003c/value\u003e\u003cnext\u003e\u003cblock type\u003d\"lists_append\" id\u003d\"3UkdtRDJ1bKHkPV8p2lu\" visible\u003d\"visible\" inline\u003d\"true\"\u003e\u003cvalue name\u003d\"VALUE\"\u003e\u003cshadow xmlns\u003d\"\" type\u003d\"math_number\" id\u003d\"4fjCogm7FIWmCW9wa1B9\" visible\u003d\"visible\"\u003e\u003cfield constraints\u003d\"-Infinity,Infinity,0,\" allow_text\u003d\"true\" name\u003d\"NUM\"\u003e0\u003c/field\u003e\u003c/shadow\u003e\u003cblock type\u003d\"encrypt_base64_encode\" id\u003d\"y6sGd4hvWpPcuxVymPHG\" visible\u003d\"visible\"\u003e\u003cvalue name\u003d\"TEXT\"\u003e\u003cshadow type\u003d\"text\" id\u003d\"lnk6NRQI5yYFGrsP0Cly\" visible\u003d\"visible\"\u003e\u003cfield name\u003d\"TEXT\"\u003e多邻国\u003c/field\u003e\u003c/shadow\u003e\u003c/value\u003e\u003c/block\u003e\u003c/value\u003e\u003cvalue name\u003d\"VAR\"\u003e\u003cshadow type\u003d\"lists_get\" id\u003d\"ja1vEEx9aikcUuoq8S0h\" visible\u003d\"visible\" inline\u003d\"true\"\u003e\u003cfield name\u003d\"VAR\"\u003eba7e16b8-de1e-430b-9d40-bfbd685515f0\u003c/field\u003e\u003c/shadow\u003e\u003c/value\u003e\u003cnext\u003e\u003cblock type\u003d\"lists_append\" id\u003d\"hBTSzqM1yHXYpWqdj59f\" visible\u003d\"visible\" inline\u003d\"true\"\u003e\u003cvalue name\u003d\"VALUE\"\u003e\u003cshadow xmlns\u003d\"\" type\u003d\"math_number\" id\u003d\"DIaxHQXSYo7WP9IWxIqF\" visible\u003d\"visible\"\u003e\u003cfield constraints\u003d\"-Infinity,Infinity,0,\" allow_text\u003d\"true\" name\u003d\"NUM\"\u003e0\u003c/field\u003e\u003c/shadow\u003e\u003cblock type\u003d\"encrypt_base32_encode\" id\u003d\"piseKSgFF0jBEHB6XpKW\" visible\u003d\"visible\"\u003e\u003cvalue name\u003d\"TEXT\"\u003e\u003cshadow type\u003d\"text\" id\u003d\"1rS4MsvYU9ZpjMsgx04w\" visible\u003d\"visible\"\u003e\u003cfield name\u003d\"TEXT\"\u003e淘宝\u003c/field\u003e\u003c/shadow\u003e\u003c/value\u003e\u003c/block\u003e\u003c/value\u003e\u003cvalue name\u003d\"VAR\"\u003e\u003cshadow type\u003d\"lists_get\" id\u003d\"AwDRhLiIayilDm97easj\" visible\u003d\"visible\" inline\u003d\"true\"\u003e\u003cfield name\u003d\"VAR\"\u003eba7e16b8-de1e-430b-9d40-bfbd685515f0\u003c/field\u003e\u003c/shadow\u003e\u003c/value\u003e\u003cnext\u003e\u003cblock type\u003d\"lists_append\" id\u003d\"a60r39gor9i81yuE9lYn\" visible\u003d\"visible\" inline\u003d\"true\"\u003e\u003cvalue name\u003d\"VALUE\"\u003e\u003cshadow xmlns\u003d\"\" type\u003d\"math_number\" id\u003d\"e172sWFqkqnUi8dMyMPs\" visible\u003d\"visible\"\u003e\u003cfield constraints\u003d\"-Infinity,Infinity,0,\" allow_text\u003d\"true\" name\u003d\"NUM\"\u003e0\u003c/field\u003e\u003c/shadow\u003e\u003cblock type\u003d\"encrypt_utf8_encode\" id\u003d\"MaxvHo7KkRZqGw1NpDst\" visible\u003d\"visible\"\u003e\u003cvalue name\u003d\"TEXT\"\u003e\u003cshadow type\u003d\"text\" id\u003d\"8loo5A5yOiNwfmv4zGSc\" visible\u003d\"visible\"\u003e\u003cfield name\u003d\"TEXT\"\u003ei love js\u003c/field\u003e\u003c/shadow\u003e\u003c/value\u003e\u003c/block\u003e\u003c/value\u003e\u003cvalue name\u003d\"VAR\"\u003e\u003cshadow type\u003d\"lists_get\" id\u003d\"Ef7b2Zxb7tyLoTZlZR5m\" visible\u003d\"visible\" inline\u003d\"true\"\u003e\u003cfield name\u003d\"VAR\"\u003eba7e16b8-de1e-430b-9d40-bfbd685515f0\u003c/field\u003e\u003c/shadow\u003e\u003c/value\u003e\u003cnext\u003e\u003cblock type\u003d\"lists_append\" id\u003d\"WsdbbxWyDaxkVeA75Rpk\" visible\u003d\"visible\" inline\u003d\"true\"\u003e\u003cvalue name\u003d\"VALUE\"\u003e\u003cshadow xmlns\u003d\"\" type\u003d\"math_number\" id\u003d\"M2gDcSJXpE57OKluYRri\" visible\u003d\"visible\"\u003e\u003cfield constraints\u003d\"-Infinity,Infinity,0,\" allow_text\u003d\"true\" name\u003d\"NUM\"\u003e0\u003c/field\u003e\u003c/shadow\u003e\u003cblock type\u003d\"encrypt_hex_encode\" id\u003d\"vQqZfUvGAli4TzMbS25w\" visible\u003d\"visible\"\u003e\u003cvalue name\u003d\"TEXT\"\u003e\u003cshadow type\u003d\"text\" id\u003d\"dQmdOpR8ec9ka2itRvjT\" visible\u003d\"visible\"\u003e\u003cfield name\u003d\"TEXT\"\u003e咕咕嘎嘎！！！\u003c/field\u003e\u003c/shadow\u003e\u003c/value\u003e\u003c/block\u003e\u003c/value\u003e\u003cvalue name\u003d\"VAR\"\u003e\u003cshadow type\u003d\"lists_get\" id\u003d\"M3PA3mG9qeWtS4M6yHYa\" visible\u003d\"visible\" inline\u003d\"true\"\u003e\u003cfield name\u003d\"VAR\"\u003eba7e16b8-de1e-430b-9d40-bfbd685515f0\u003c/field\u003e\u003c/shadow\u003e\u003c/value\u003e\u003cnext\u003e\u003cblock type\u003d\"lists_append\" id\u003d\"X7QRzinwNo0xlZZpJ4gh\" visible\u003d\"visible\" inline\u003d\"true\"\u003e\u003cvalue name\u003d\"VALUE\"\u003e\u003cshadow xmlns\u003d\"\" type\u003d\"math_number\" id\u003d\"VxT1e8880Qe0OvroQxf8\" visible\u003d\"visible\"\u003e\u003cfield constraints\u003d\"-Infinity,Infinity,0,\" allow_text\u003d\"true\" name\u003d\"NUM\"\u003e0\u003c/field\u003e\u003c/shadow\u003e\u003cblock type\u003d\"encrypt_random_key\" id\u003d\"HmP4jzeqe8Wsa085W57S\" visible\u003d\"visible\"\u003e\u003cvalue name\u003d\"LENGTH\"\u003e\u003cshadow type\u003d\"math_number\" id\u003d\"tbpL8EeRnvAfS4CZF55a\" visible\u003d\"visible\"\u003e\u003cfield constraints\u003d\"-Infinity,Infinity,0,\" name\u003d\"NUM\"\u003e16\u003c/field\u003e\u003c/shadow\u003e\u003c/value\u003e\u003c/block\u003e\u003c/value\u003e\u003cvalue name\u003d\"VAR\"\u003e\u003cshadow type\u003d\"lists_get\" id\u003d\"DpMVbY3MIDun5HuwpqRt\" visible\u003d\"visible\" inline\u003d\"true\"\u003e\u003cfield name\u003d\"VAR\"\u003eba7e16b8-de1e-430b-9d40-bfbd685515f0\u003c/field\u003e\u003c/shadow\u003e\u003c/value\u003e\u003cnext\u003e\u003cblock type\u003d\"lists_append\" id\u003d\"axzakv7iXkq0zZGwjEys\" visible\u003d\"visible\" inline\u003d\"true\"\u003e\u003cvalue name\u003d\"VALUE\"\u003e\u003cshadow xmlns\u003d\"\" type\u003d\"math_number\" id\u003d\"ldYb6WFLAogiEM0pcFDe\" visible\u003d\"visible\"\u003e\u003cfield constraints\u003d\"-Infinity,Infinity,0,\" allow_text\u003d\"true\" name\u003d\"NUM\"\u003e0\u003c/field\u003e\u003c/shadow\u003e\u003cblock type\u003d\"encrypt_generate_rsa_keypair\" id\u003d\"msLwoYkUl0vASYoakKUd\" visible\u003d\"visible\"\u003e\u003cfield name\u003d\"BITS\"\u003e1024\u003c/field\u003e\u003c/block\u003e\u003c/value\u003e\u003cvalue name\u003d\"VAR\"\u003e\u003cshadow type\u003d\"lists_get\" id\u003d\"s4cBzcytW5iX9lBwVH0R\" visible\u003d\"visible\" inline\u003d\"true\"\u003e\u003cfield name\u003d\"VAR\"\u003eba7e16b8-de1e-430b-9d40-bfbd685515f0\u003c/field\u003e\u003c/shadow\u003e\u003c/value\u003e\u003cnext\u003e\u003cblock type\u003d\"mathjax_render\" id\u003d\"bu9pUET0Xc6MvRtenU4W\" visible\u003d\"visible\" inline\u003d\"false\"\u003e\u003cfield name\u003d\"ALIGN\"\u003ecenter\u003c/field\u003e\u003cvalue name\u003d\"FORMULA\"\u003e\u003cshadow type\u003d\"text\" id\u003d\"ImbZ144wAsWXq8jCUhp8\" visible\u003d\"visible\"\u003e\u003cfield name\u003d\"TEXT\"\u003eBetterNemo 公式渲染\nE \u003d mc^2\u003c/field\u003e\u003c/shadow\u003e\u003c/value\u003e\u003cvalue name\u003d\"X\"\u003e\u003cshadow type\u003d\"math_number\" id\u003d\"PR8dPZakMcYlFvbCWxa9\" visible\u003d\"visible\"\u003e\u003cfield constraints\u003d\"-Infinity,Infinity,0,\" name\u003d\"NUM\"\u003e0\u003c/field\u003e\u003c/shadow\u003e\u003c/value\u003e\u003cvalue name\u003d\"Y\"\u003e\u003cshadow type\u003d\"math_number\" id\u003d\"at6GQab3mLfBtu5wOuuk\" visible\u003d\"visible\"\u003e\u003cfield constraints\u003d\"-Infinity,Infinity,0,\" name\u003d\"NUM\"\u003e0\u003c/field\u003e\u003c/shadow\u003e\u003c/value\u003e\u003cvalue name\u003d\"SIZE\"\u003e\u003cshadow type\u003d\"math_number\" id\u003d\"fCGTnqiJ4lOlRZ1snndi\" visible\u003d\"visible\"\u003e\u003cfield constraints\u003d\"-Infinity,Infinity,0,\" name\u003d\"NUM\"\u003e24\u003c/field\u003e\u003c/shadow\u003e\u003c/value\u003e\u003cvalue name\u003d\"COLOR\"\u003e\u003cshadow type\u003d\"text\" id\u003d\"z4CWQVfX5BEBP9DwyoL0\" visible\u003d\"visible\"\u003e\u003cfield name\u003d\"TEXT\"\u003e#000000\u003c/field\u003e\u003c/shadow\u003e\u003c/value\u003e\u003cnext\u003e\u003cblock type\u003d\"bn_create_video\" id\u003d\"VcdL5QCCVHaR1keECWTB\" visible\u003d\"visible\" inline\u003d\"true\"\u003e\u003cvalue name\u003d\"id\"\u003e\u003cshadow type\u003d\"text\" id\u003d\"4oAKR7F9pfcq5ShDnQpW\" visible\u003d\"visible\"\u003e\u003cfield name\u003d\"TEXT\"\u003eexample\u003c/field\u003e\u003c/shadow\u003e\u003c/value\u003e\u003cvalue name\u003d\"src\"\u003e\u003cshadow type\u003d\"text\" id\u003d\"uskt3khBjjfPyFd5nswJ\" visible\u003d\"visible\"\u003e\u003cfield name\u003d\"TEXT\"\u003ehttps://creation.bcmcdn.com/445/kitten/d2ViXzIwMDJfMTIxNzczMTdfMjkyMzgxNDY4XzE3NzA3OTgxOTk1MzVfMmJmOTBmMjU\u003d.mp4\u003c/field\u003e\u003c/shadow\u003e\u003c/value\u003e\u003cnext\u003e\u003cblock type\u003d\"self_dialog_wait\" id\u003d\"Rr004mbqStvyITOgC5aD\" visible\u003d\"visible\" inline\u003d\"true\"\u003e\u003cfield name\u003d\"type\"\u003esay\u003c/field\u003e\u003cvalue name\u003d\"text\"\u003e\u003cshadow type\u003d\"text\" id\u003d\"M6Shb5AlXMiSbjP1s7LD\" visible\u003d\"visible\"\u003e\u003cfield name\u003d\"TEXT\"\u003e点我看看\u003c/field\u003e\u003c/shadow\u003e\u003c/value\u003e\u003cnext last_next_in_stack\u003d\"true\"\u003e\u003c/next\u003e\u003c/block\u003e\u003c/next\u003e\u003c/block\u003e\u003c/next\u003e\u003c/block\u003e\u003c/next\u003e\u003c/block\u003e\u003c/next\u003e\u003c/block\u003e\u003c/next\u003e\u003c/block\u003e\u003c/next\u003e\u003c/block\u003e\u003c/next\u003e\u003c/block\u003e\u003c/next\u003e\u003c/block\u003e\u003c/next\u003e\u003c/block\u003e\u003c/next\u003e\u003c/block\u003e\u003c/next\u003e\u003c/block\u003e\u003c/next\u003e\u003c/block\u003e\u003c/next\u003e\u003c/block\u003e\u003c/next\u003e\u003c/block\u003e\u003c/next\u003e\u003c/block\u003e\u003cblock type\u003d\"self_on_tap\" id\u003d\"nMIi9XpWv3OheA9SoIIf\" visible\u003d\"visible\" inline\u003d\"true\" x\u003d\"75\" y\u003d\"1087\"\u003e\u003cfield name\u003d\"sprite\"\u003e__self\u003c/field\u003e\u003cfield name\u003d\"type\"\u003emouse_click\u003c/field\u003e\u003cnext\u003e\u003cblock type\u003d\"self_disappear\" id\u003d\"ojXNF1URDcnUNBxbg0CD\" visible\u003d\"visible\" inline\u003d\"true\"\u003e\u003cnext\u003e\u003cblock type\u003d\"bn_play_video\" id\u003d\"vN9suzxBpNzaZYnWtpKM\" visible\u003d\"visible\" inline\u003d\"true\"\u003e\u003cvalue name\u003d\"id\"\u003e\u003cshadow type\u003d\"text\" id\u003d\"xmQiMNC0LJ2XwMU7ScjQ\" visible\u003d\"visible\"\u003e\u003cfield name\u003d\"TEXT\"\u003eexample\u003c/field\u003e\u003c/shadow\u003e\u003c/value\u003e\u003cnext\u003e\u003cblock type\u003d\"bn_set_video_current_time\" id\u003d\"6MUDEdq9VakhhloChtlX\" visible\u003d\"visible\" inline\u003d\"true\"\u003e\u003cvalue name\u003d\"id\"\u003e\u003cshadow type\u003d\"text\" id\u003d\"PZi4iUsu6ygziwOgU5Xn\" visible\u003d\"visible\"\u003e\u003cfield name\u003d\"TEXT\"\u003eexample\u003c/field\u003e\u003c/shadow\u003e\u003c/value\u003e\u003cvalue name\u003d\"time\"\u003e\u003cshadow xmlns\u003d\"\" type\u003d\"math_number\" id\u003d\"i1FH3qjrxQrToNUER8FB\" visible\u003d\"visible\"\u003e\u003cfield constraints\u003d\"-Infinity,Infinity,0,\" name\u003d\"NUM\"\u003e10\u003c/field\u003e\u003c/shadow\u003e\u003cblock type\u003d\"math_arithmetic_common\" id\u003d\"P9mDFJzIs2keUGNYYrz5\" visible\u003d\"visible\" inline\u003d\"true\"\u003e\u003cfield name\u003d\"OP\"\u003eMINUS\u003c/field\u003e\u003cvalue name\u003d\"A\"\u003e\u003cshadow type\u003d\"math_number\" id\u003d\"KLLjOtzT1S9yfqvqn3gn\" visible\u003d\"visible\"\u003e\u003cfield constraints\u003d\"-Infinity,Infinity,0,\" name\u003d\"NUM\"\u003e1\u003c/field\u003e\u003c/shadow\u003e\u003c/value\u003e\u003cvalue name\u003d\"B\"\u003e\u003cshadow type\u003d\"math_number\" id\u003d\"RldD4oMrUbXxyccwpIw6\" visible\u003d\"visible\"\u003e\u003cfield constraints\u003d\"-Infinity,Infinity,0,\" name\u003d\"NUM\"\u003e1\u003c/field\u003e\u003c/shadow\u003e\u003c/value\u003e\u003c/block\u003e\u003c/value\u003e\u003cnext\u003e\u003cblock type\u003d\"repeat_forever\" id\u003d\"mWlaKY0awjQ9JhJ4Il5f\" visible\u003d\"visible\" inline\u003d\"true\"\u003e\u003cstatement name\u003d\"DO\"\u003e\u003cblock type\u003d\"bn_draw_video_stamp\" id\u003d\"GxQiwm5xO7rVugbi8j84\" visible\u003d\"visible\" inline\u003d\"true\"\u003e\u003cvalue name\u003d\"id\"\u003e\u003cshadow type\u003d\"text\" id\u003d\"wRvuCuKNR5Hp2VWBIQKy\" visible\u003d\"visible\"\u003e\u003cfield name\u003d\"TEXT\"\u003eexample\u003c/field\u003e\u003c/shadow\u003e\u003c/value\u003e\u003cvalue name\u003d\"x\"\u003e\u003cshadow type\u003d\"math_number\" id\u003d\"3wOZvE5LVUOl5AAT89Hc\" visible\u003d\"visible\"\u003e\u003cfield constraints\u003d\"-Infinity,Infinity,0,\" name\u003d\"NUM\"\u003e-200\u003c/field\u003e\u003c/shadow\u003e\u003c/value\u003e\u003cvalue name\u003d\"y\"\u003e\u003cshadow type\u003d\"math_number\" id\u003d\"pPTwTU3ln3EStJGJvoZ9\" visible\u003d\"visible\"\u003e\u003cfield constraints\u003d\"-Infinity,Infinity,0,\" name\u003d\"NUM\"\u003e200\u003c/field\u003e\u003c/shadow\u003e\u003c/value\u003e\u003cvalue name\u003d\"scale\"\u003e\u003cshadow type\u003d\"math_number\" id\u003d\"iBv0qlop7jSre8sjE260\" visible\u003d\"visible\"\u003e\u003cfield constraints\u003d\"-Infinity,Infinity,0,\" name\u003d\"NUM\"\u003e1\u003c/field\u003e\u003c/shadow\u003e\u003c/value\u003e\u003c/block\u003e\u003c/statement\u003e\u003cnext last_next_in_stack\u003d\"true\"\u003e\u003c/next\u003e\u003c/block\u003e\u003c/next\u003e\u003c/block\u003e\u003c/next\u003e\u003c/block\u003e\u003c/next\u003e\u003c/block\u003e\u003c/next\u003e\u003c/block\u003e", "current_style_id": "b1431003-6bc7-4565-b8c3-7ca51ff03be2", "hidden_in_edit": false, "id": "2ae8f450-4a04-4f9f-bc47-6b4bbe37e14b", "locked": false, "name": "编程猫跳跳", "rotation": 0.0, "scale": 100.0, "scene_id": "700824a5-44a8-4d03-a7e8-aa95d87e9b2a", "styles": ["b1431003-6bc7-4565-b8c3-7ca51ff03be2", "50f5fbe6-6478-4eb6-bfae-1a420d712824", "e0e58178-c6c4-4d26-a661-63ec7fe03b4d", "6bca28d3-ef04-47ff-91ee-7060977590e0", "88bf7a3c-69c0-4cbf-80f0-4cdf29eb96d9"], "visible": true, "x": -19.0, "y": 131.0 } }, "current_actor": "" }, "app_version": "2.3.0", "audios": { "sounds": { "34b4d570-bd24-4c57-b39c-7100e5ead832": { "ext": "mid", "id": "34b4d570-bd24-4c57-b39c-7100e5ead832", "name": "MIDI音乐1", "url": "https://creation.bcmcdn.com/490/YW5kXzIwMDJfMTIwNjgxMzlfMzAzNjQwMDY2XzE3NzY1MDc2OTY4NjVfRWR0eWVXZks\u003d.mid" } } }, "block_count": { "all_block_count": 46, "visible_block_count": 46 }, "broadcast": { "broadcast_dict": {} }, "procedures": { "procedure_dict": { "20380ad0-9689-448a-bd50-0e4f481fb783": { "blocksXML": "\u003cblock type\u003d\"procedures_2_defnoreturn\" id\u003d\"EbK4rOlj8bFYTMD1GUCC\" visible\u003d\"visible\" inline\u003d\"true\" deletable\u003d\"false\" x\u003d\"0\" y\u003d\"0\"\u003e\u003cfield name\u003d\"NAME\"\u003e函数1\u003c/field\u003e\u003cstatement name\u003d\"STACK\"\u003e\u003cblock type\u003d\"change_variable\" id\u003d\"eaDdBDi71hrCCoQiO2N2\" visible\u003d\"visible\" inline\u003d\"true\"\u003e\u003cfield name\u003d\"valname\"\u003ed7f67b4a-1710-4f90-9311-18016a4b471d\u003c/field\u003e\u003cfield name\u003d\"method\"\u003eincrease\u003c/field\u003e\u003cvalue name\u003d\"n\"\u003e\u003cshadow type\u003d\"math_number\" id\u003d\"L7rwvQGpbtHCuul5qjAy\" visible\u003d\"visible\"\u003e\u003cfield constraints\u003d\"-Infinity,Infinity,0,\" allow_text\u003d\"true\" name\u003d\"NUM\"\u003e1\u003c/field\u003e\u003c/shadow\u003e\u003c/value\u003e\u003cnext\u003e\u003cblock type\u003d\"controls_if\" id\u003d\"B03xRpUhDeIn4p0iDrSU\" visible\u003d\"visible\" inline\u003d\"true\"\u003e\u003cmutation else\u003d\"1\"\u003e\u003c/mutation\u003e\u003cvalue name\u003d\"IF0\"\u003e\u003cempty xmlns\u003d\"\" type\u003d\"logic_empty\" id\u003d\"tSDmkM7ztQTyj5LndZVA\" visible\u003d\"visible\" editable\u003d\"false\"/\u003e\u003cblock type\u003d\"logic_compare\" id\u003d\"he2K5cvG5XoV7E42Qx0P\" visible\u003d\"visible\" inline\u003d\"true\"\u003e\u003cfield name\u003d\"OP\"\u003eEQ\u003c/field\u003e\u003cvalue name\u003d\"A\"\u003e\u003cshadow xmlns\u003d\"\" type\u003d\"math_number\" id\u003d\"QUGU14OVcz4mmHvCDcyl\" visible\u003d\"visible\"\u003e\u003cfield constraints\u003d\"-Infinity,Infinity,0,\" allow_text\u003d\"true\" name\u003d\"NUM\"\u003e0\u003c/field\u003e\u003c/shadow\u003e\u003cblock type\u003d\"procedures_2_parameter\" id\u003d\"zp6U9PWAsNdJ6BeRMl9c\" visible\u003d\"visible\" inline\u003d\"true\"\u003e\u003cfield name\u003d\"param_name\"\u003ea\u003c/field\u003e\u003c/block\u003e\u003c/value\u003e\u003cvalue name\u003d\"B\"\u003e\u003cshadow type\u003d\"math_number\" id\u003d\"D1m2kWyqeLsKhmVCPKND\" visible\u003d\"visible\"\u003e\u003cfield constraints\u003d\"-Infinity,Infinity,0,\" allow_text\u003d\"true\" name\u003d\"NUM\"\u003e0\u003c/field\u003e\u003c/shadow\u003e\u003c/value\u003e\u003c/block\u003e\u003c/value\u003e\u003cstatement name\u003d\"DO0\"\u003e\u003cblock type\u003d\"procedures_2_return_value\" id\u003d\"I7WR1O2LNDakaX9LXFup\" visible\u003d\"visible\" inline\u003d\"true\"\u003e\u003cvalue name\u003d\"VALUE\"\u003e\u003cshadow type\u003d\"math_number\" id\u003d\"659XztBYeJdUZDJKBBNr\" visible\u003d\"visible\"\u003e\u003cfield constraints\u003d\"-Infinity,Infinity,0,\" allow_text\u003d\"true\" name\u003d\"NUM\"\u003e0\u003c/field\u003e\u003c/shadow\u003e\u003c/value\u003e\u003c/block\u003e\u003c/statement\u003e\u003cstatement name\u003d\"ELSE\"\u003e\u003cblock type\u003d\"procedures_2_return_value\" id\u003d\"VMofrRhECRpjOJF9rS1Q\" visible\u003d\"visible\" inline\u003d\"true\"\u003e\u003cvalue name\u003d\"VALUE\"\u003e\u003cshadow xmlns\u003d\"\" type\u003d\"math_number\" id\u003d\"JaZIwmNvWqyK7436cyz6\" visible\u003d\"visible\"\u003e\u003cfield constraints\u003d\"-Infinity,Infinity,0,\" allow_text\u003d\"true\" name\u003d\"NUM\"\u003e0\u003c/field\u003e\u003c/shadow\u003e\u003cblock type\u003d\"procedures_2_callreturn\" id\u003d\"ygZ64diNTkvFeNSdgK9f\" visible\u003d\"visible\" inline\u003d\"true\"\u003e\u003cmutation name\u003d\"函数1\"\u003e\u003cprocedures_2_parameter_shadow name\u003d\"a\"\u003e\u003c/procedures_2_parameter_shadow\u003e\u003c/mutation\u003e\u003cfield name\u003d\"NAME\"\u003e函数1\u003c/field\u003e\u003cvalue name\u003d\"ARG0\"\u003e\u003cshadow xmlns\u003d\"\" type\u003d\"math_number\" id\u003d\"fJpFuCciBQ1ls7ULBtxv\" visible\u003d\"visible\"\u003e\u003cfield constraints\u003d\"-Infinity,Infinity,0,\" allow_text\u003d\"true\" name\u003d\"TEXT\"\u003ea\u003c/field\u003e\u003c/shadow\u003e\u003cblock type\u003d\"math_arithmetic_common\" id\u003d\"A4soeNH5vRslqwQ0renJ\" visible\u003d\"visible\" inline\u003d\"true\"\u003e\u003cfield name\u003d\"OP\"\u003eMINUS\u003c/field\u003e\u003cvalue name\u003d\"A\"\u003e\u003cshadow xmlns\u003d\"\" type\u003d\"math_number\" id\u003d\"vuePkreGVudtupyVnVWU\" visible\u003d\"visible\"\u003e\u003cfield constraints\u003d\"-Infinity,Infinity,0,\" name\u003d\"NUM\"\u003e1\u003c/field\u003e\u003c/shadow\u003e\u003cblock type\u003d\"procedures_2_parameter\" id\u003d\"zTQe54eD1HbVvTnHA1CA\" visible\u003d\"visible\" inline\u003d\"true\"\u003e\u003cfield name\u003d\"param_name\"\u003ea\u003c/field\u003e\u003c/block\u003e\u003c/value\u003e\u003cvalue name\u003d\"B\"\u003e\u003cshadow type\u003d\"math_number\" id\u003d\"FDEuFQtJVhKycUbqKMEs\" visible\u003d\"visible\"\u003e\u003cfield constraints\u003d\"-Infinity,Infinity,0,\" name\u003d\"NUM\"\u003e1\u003c/field\u003e\u003c/shadow\u003e\u003c/value\u003e\u003c/block\u003e\u003c/value\u003e\u003c/block\u003e\u003c/value\u003e\u003c/block\u003e\u003c/statement\u003e\u003cnext last_next_in_stack\u003d\"true\"\u003e\u003c/next\u003e\u003c/block\u003e\u003c/next\u003e\u003c/block\u003e\u003c/statement\u003e\u003c/block\u003e", "id": "20380ad0-9689-448a-bd50-0e4f481fb783", "name": "函数1", "params": ["a"] } } }, "project_name": "新的作品", "scenes": { "current_scene": "700824a5-44a8-4d03-a7e8-aa95d87e9b2a", "scenes_dict": { "700824a5-44a8-4d03-a7e8-aa95d87e9b2a": { "actors": ["2ae8f450-4a04-4f9f-bc47-6b4bbe37e14b"], "blocksXML": "\u003cblock type\u003d\"start_on_click\" id\u003d\"z3vRQqsmtqP0c1Sslwwu\" visible\u003d\"visible\" inline\u003d\"true\" x\u003d\"124\" y\u003d\"61\"\u003e\u003cnext last_next_in_stack\u003d\"true\"\u003e\u003c/next\u003e\u003c/block\u003e\u003cblock type\u003d\"encrypt_sha_hash\" id\u003d\"DSCM1nQVhQyDu69wLm8G\" visible\u003d\"visible\" x\u003d\"98\" y\u003d\"151\"\u003e\u003cfield name\u003d\"TYPE\"\u003e1\u003c/field\u003e\u003cvalue name\u003d\"TEXT\"\u003e\u003cshadow type\u003d\"text\" id\u003d\"CeJYx07G3xpmVOlsWaIW\" visible\u003d\"visible\"\u003e\u003cfield name\u003d\"TEXT\"\u003e\u003c/field\u003e\u003c/shadow\u003e\u003c/value\u003e\u003c/block\u003e", "current_style_id": "623b814d-52e2-4971-8dca-7586d2a385c2", "id": "700824a5-44a8-4d03-a7e8-aa95d87e9b2a", "name": "背景", "styles": ["623b814d-52e2-4971-8dca-7586d2a385c2"], "visible": true } }, "scenes_order": ["700824a5-44a8-4d03-a7e8-aa95d87e9b2a"] }, "split_options": { "options_dict": { "_split_comma": { "id": "_split_comma", "name": "," }, "_split_space": { "id": "_split_space", "name": "空格" }, "_split_minus": { "id": "_split_minus", "name": "-" } } }, "stage_size": { "height": 900.0, "width": 562.0 }, "styles": { "styles_dict": { "623b814d-52e2-4971-8dca-7586d2a385c2": { "id": "623b814d-52e2-4971-8dca-7586d2a385c2", "name": "背景", "path": "file:///android_asset/webview/res/drawable/default_empty_background.png", "texture": "res/drawable/default_empty_background.png" }, "b1431003-6bc7-4565-b8c3-7ca51ff03be2": { "center_point": { "x": 0.0, "y": 0.0 }, "id": "b1431003-6bc7-4565-b8c3-7ca51ff03be2", "name": "编程猫跳跳", "path": "file:///android_asset/webview/res/drawable/a_7101_1.png", "texture": "res/drawable/a_7101_1.png" }, "50f5fbe6-6478-4eb6-bfae-1a420d712824": { "center_point": { "x": 0.0, "y": 0.0 }, "id": "50f5fbe6-6478-4eb6-bfae-1a420d712824", "name": "编程猫跳跳", "path": "file:///android_asset/webview/res/drawable/a_7101_2.png", "texture": "res/drawable/a_7101_2.png" }, "e0e58178-c6c4-4d26-a661-63ec7fe03b4d": { "center_point": { "x": 0.0, "y": 0.0 }, "id": "e0e58178-c6c4-4d26-a661-63ec7fe03b4d", "name": "编程猫跳跳", "path": "file:///android_asset/webview/res/drawable/a_7101_3.png", "texture": "res/drawable/a_7101_3.png" }, "6bca28d3-ef04-47ff-91ee-7060977590e0": { "center_point": { "x": 0.0, "y": 0.0 }, "id": "6bca28d3-ef04-47ff-91ee-7060977590e0", "name": "编程猫跳跳", "path": "file:///android_asset/webview/res/drawable/a_7101_4.png", "texture": "res/drawable/a_7101_4.png" }, "88bf7a3c-69c0-4cbf-80f0-4cdf29eb96d9": { "center_point": { "x": 0.0, "y": 0.0 }, "id": "88bf7a3c-69c0-4cbf-80f0-4cdf29eb96d9", "name": "编程猫跳跳", "path": "file:///android_asset/webview/res/drawable/a_7101_5.png", "texture": "res/drawable/a_7101_5.png" } } }, "toolbox": { "devices": ["microbit"] }, "variable": { "variable_dict": { "ba7e16b8-de1e-430b-9d40-bfbd685515f0": { "create_time": 1770388611, "id": "ba7e16b8-de1e-430b-9d40-bfbd685515f0", "is_global": true, "name": "测试数据", "offset": { "x": 0.0, "y": 0.0 }, "position": { "x": -271.0, "y": 442.0 }, "scale": 1.0, "theme": "common", "type": "list", "value": [], "valueForDebug": [], "visible": true }, "d7f67b4a-1710-4f90-9311-18016a4b471d": { "create_time": 1770978832, "id": "d7f67b4a-1710-4f90-9311-18016a4b471d", "is_global": true, "name": "a", "offset": { "x": 0.0, "y": 0.0 }, "position": { "x": -113.32931, "y": 419.7148 }, "scale": 1.0, "theme": "common", "type": "any", "value": 0.0, "valueForDebug": ["0"], "visible": true } } } });
    await sleep(100);
    const ws = await isBlocklyMainworkspaceLoaded();
    ws.add_change_listener(BetterNemo._.code);
    // const dom = Blockly.xml.text_to_dom(`<xml xmlns="http://www.w3.org/1999/xhtml"><block type="on_running_group_activated" id="04uXGGBRyb1fiHNv4ZEV" visible="visible" inline="true" x="274" y="150"><next><block type="controls_if" id="OMhlUo7LDMKfaG1uAPDY" visible="visible" inline="true"><value name="IF0"><empty type="logic_empty" id="XdvwIrtTA4hpcIkEKxWw" visible="visible" editable="false"></empty></value><next><block type="controls_if" id="u5muWCDG5AFoc2iawJrX" visible="visible" inline="true"><value name="IF0"><empty type="logic_empty" id="xoUgG0RPI17tsAmUwI72" visible="visible" editable="false"></empty></value><next last_next_in_stack="true"></next></block></next></block></next></block></xml>`);
    // Blockly.xml.dom_to_workspace(dom, Blockly.mainWorkspace);
  })();
