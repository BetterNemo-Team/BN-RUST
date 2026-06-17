# BetterNemo 扩展开发指南

## 新版本：`.bnex` 压缩包扩展

### 文件格式

`.bnex` 是一个 zip 压缩包（改后缀为 `.bnex`），内部结构：

```
my-extension.bnex
├── manifest.json    ← 扩展清单（必需）
├── index.js         ← 入口代码（默认）
├── style.css        ← 可选样式
├── assets/          ← 可选资源
│   ├── icon.png
│   └── ...
└── lib/             ← 可选子模块
    └── utils.js
```

### manifest.json

```json
{
  "id": "my-extension",
  "name": "我的扩展",
  "version": "1.0.0",
  "description": "扩展描述",
  "author": "作者名",
  "main": "index.js",
  "icon": "icon-my-ext",
  "capabilities": {
    "blocks": true,
    "toolbox": true,
    "interpreter": true,
    "events": true
  },
  "permissions": ["storage", "events"],
  "minVersion": "0.1.0"
}
```

### 清单字段说明

| 字段 | 必填 | 类型 | 说明 |
|------|------|------|------|
| `id` | 推荐 | string | 扩展唯一标识，缺省时使用文件名 |
| `name` | 推荐 | string | 显示名称 |
| `version` | 推荐 | string | 语义化版本号 |
| `description` | 否 | string | 扩展描述 |
| `author` | 否 | string | 作者 |
| `main` | 否 | string | 入口文件，默认 `index.js` |
| `icon` | 否 | string | SVG symbol ID |
| `capabilities` | 否 | object | 声明扩展能力 |
| `permissions` | 否 | string[] | 需要的权限 |
| `minVersion` | 否 | string | 最低 BetterNemo 版本 |

### capabilities 字段

```json
{
  "blocks": true,       // 注册自定义积木
  "toolbox": true,      // 添加积木盒分类
  "interpreter": true,  // 注册解释器函数
  "theme": false,       // 修改主题
  "ui": true,           // 使用 UI 提示
  "events": true        // 使用事件系统
}
```

### 入口代码模板

```javascript
// index.js
(async (Extension) => {
  const { blink, events, storage, ui, utils, Block, Toolbox } = Extension.API;

  // 等待 Blockly 加载
  await new Promise(r => {
    const check = () => {
      if (typeof Blockly !== 'undefined' && Blockly.mainWorkspace) r();
      else setTimeout(check, 100);
    };
    check();
  });

  // --- 积木注册 ---
  blink.registerBlock({
    type: 'my_block',
    message0: '执行 %1',
    args0: [{ type: 'input_value', name: 'VALUE' }],
    previousStatement: null,
    nextStatement: null,
    colour: 230,
  });

  // --- 解释器注册 ---
  blink.registerInterpreter('my_block', (args, blockId, entityId) => {
    const value = args.VALUE;
    utils.log('MyExt', `执行: ${value}`);
  });

  // --- 积木盒注册 ---
  const toolboxXML = [
    Toolbox.title('我的扩展'),
    Toolbox.block('my_block'),
    Toolbox.sep(),
    Toolbox.flyout_bottom(),
  ];

  BN.regIcon(`<symbol id="icon-my-ext" viewBox="-33 -33 90 90">
    <circle cx="12" cy="12" r="10" fill="#FF6600"/>
  </symbol>`);
  BN.addToolbox('my-toolbox', 'icon-my-ext', '#FF6600', toolboxXML);

  // --- 事件 ---
  events.on('extension:activated', (data) => {
    utils.log('MyExt', `${data.id} 已激活`);
  });

  // --- 存储 ---
  storage.set('myKey', 'myValue');
  const saved = storage.get('myKey');

  // --- UI ---
  ui.showNotification('扩展已加载');

})(Extension);
```

---

### API 参考

#### `blink` — Blink 积木系统

```javascript
// 注册积木定义
blink.registerBlock({
  type: 'unique_type_name',
  message0: '文本 %1 参数 %2',
  args0: [
    { type: 'field_label', name: 'LABEL', text: '标签' },
    { type: 'input_value', name: 'INPUT', check: 'String' },
  ],
  previousStatement: null,
  nextStatement: null,
  colour: 230,
});

// 注册解释器
blink.registerInterpreter('unique_type_name', (args) => {
  // args.LABEL = '标签值'
  // args.INPUT = 输入连接的值
});

// 覆写已有解释器
blink.rewriteInterpreter('existing_block', (args) => {
  // 替换已有积木的执行逻辑
});
```

#### `events` — 事件系统

```javascript
const unsub = events.on('extension:activated', (data) => {
  console.log(data.id);
});

events.emit('my-custom-event', { payload: 'data' });

events.off('my-custom-event', handler);
unsub();  // 通过返回值取消
```

**预定义事件：**
| 事件 | 触发时机 |
|------|---------|
| `extension:installed` | 扩展安装 |
| `extension:activated` | 扩展激活 |
| `extension:deactivated` | 扩展停用 |
| `extension:uninstalled` | 扩展卸载 |
| `block:registered` | 积木注册 |
| `toolbox:updated` | 积木盒更新 |
| `interpreter:injected` | 解释器注入 |
| `extension:error` | 扩展出错 |

#### `storage` — 沙箱存储

```javascript
storage.set('myKey', { nested: 'object' });
const value = storage.get('myKey');
```

每个扩展存储空间自动隔离，key 为 `bn_ext:<extensionId>`。

#### `ui` — 界面提示

```javascript
ui.showNotification('操作成功');
ui.showNotification('出错了', 'error');
```

#### `utils` — 工具函数

```javascript
utils.log('MyExt', '日志消息');
utils.error('MyExt', '错误消息');
await utils.loadScript('path/to.js');
await utils.loadStyle('path/to.css');
```

#### `Block` — 积木模板

```javascript
// 方法积木（有上下连接口）
blink.registerBlock({
  type: 'my_method',
  ...Block.methodBlock,
  message0: '...',
});

// 事件积木（只有下方连接口）
blink.registerBlock({
  type: 'my_event',
  ...Block.eventBlock,
  message0: '当 %1',
});
```

#### `Toolbox` — 积木盒构建

```javascript
Toolbox.title('分类标题')
Toolbox.block('block_type', 'field_val')
Toolbox.button('btn_id', ' 按钮文字 ', cb)
Toolbox.sep(50)
Toolbox.line('分隔文字')
Toolbox.flyout_bottom(130, 16)
```

---

### 打包与安装

#### 打包

```bash
# 使用打包脚本
node pack-bnex.cjs <扩展目录> <输出路径>

# 示例
node pack-bnex.cjs extensions-dev/my-ext public/bn/extensions/my-ext.bnex
```

#### 编程打包

```javascript
import { packBnex } from './extension';

const blob = await packBnex(
  { id: 'my-ext', name: '我的扩展', version: '1.0.0', main: 'index.js', ... },
  { 'index.js': '...', 'style.css': '...' }
);
```

#### 安装

1. 将 `.bnex` 文件放入 `extensions/` 目录
2. 在 `extensions/_CONFIG.js` 中添加：

```javascript
const EXTENSION_FILES = [
  '[BNOnline内置]信息查询',
  'my-new-extension.bnex',
];
```

3. 重新加载编辑器

---

---

# 旧版本扩展迁移指南

## 旧格式结构

```
extensions/
└── [旧扩展名]/
    └── index.js
```

```javascript
Extension.metaData = {
  name: "扩展名",
  version: "1.0.0",
  description: "...",
  author: "作者",
};

(async (Extension) => {
  const BN = Extension.API;
  const Block = BN.Block;
  const Toolbox = BN.Toolbox;
  await BN.waitBlocklyLoaded();

  BN.regBlocks([...]);
  BN.addToolbox("id", "icon", "#color", xml);
  BN.regDomainFunction("name", fn);
  BN.regColor("NAME", "#fill", "#stroke");
  BN.regIcon(svg);
})(Extension);
```

## 迁移步骤

### Step 1: 创建扩展目录

```bash
mkdir extensions-dev/my-extension
```

### Step 2: 创建 manifest.json

将 `Extension.metaData` 转为 JSON：

```json
{
  "id": "my-extension",
  "name": "旧扩展名",
  "version": "1.0.0",
  "description": "从旧格式迁移",
  "author": "作者名",
  "main": "index.js",
  "capabilities": {
    "blocks": true,
    "toolbox": true,
    "interpreter": true
  }
}
```

### Step 3: 迁移 index.js

替换 API 调用：

| 旧 API | 新 API |
|--------|--------|
| `Extension.metaData = { ... }` | 移除，用 manifest.json 替代 |
| `BN.regBlocks([...])` | `blink.registerBlock({...})` 逐个注册 |
| `BN.addToolbox(id, icon, color, xml)` | `BN.addToolbox(id, icon, color, xml)` 不变 |
| `BN.regDomainFunction(name, fn)` | `blink.registerInterpreter(name, fn)` |
| `BN.rewriteDomainFunction(name, fn)` | `blink.rewriteInterpreter(name, fn)` |
| `BN.regColor(name, fill, stroke)` | `BN.regColor(name, fill, stroke)` 不变 |
| `BN.regIcon(svg)` | `BN.regIcon(svg)` 不变 |
| `BN.waitBlocklyLoaded()` | `await new Promise(r => { ... })` |
| `BN.Block.methodBlock` | `Block.methodBlock` |
| `BN.Toolbox.title(...)` | `Toolbox.title(...)` |
| `window.xxx = value` | `storage.set('xxx', value)` |

### Step 4: 解构 API

```javascript
// 旧
const BN = Extension.API;
const Block = BN.Block;
const Toolbox = BN.Toolbox;

// 新
const { blink, events, storage, ui, utils, Block, Toolbox } = Extension.API;
const BN = Extension.API;  // 保留兼容旧 API（regIcon, addToolbox 等）
```

### Step 5: 打包

```bash
node pack-bnex.cjs extensions-dev/my-extension public/bn/extensions/my-extension.bnex
```

---

## 完整迁移示例

### 迁移前

```
extensions/
└── [BNOnline内置]信息查询/
    └── index.js
```

### 迁移后

**extensions-dev/bnonline-info/manifest.json:**
```json
{
  "id": "bnonline-info",
  "name": "信息查询",
  "version": "1.0.0",
  "description": "BNOnline辅助扩展",
  "author": "BNOnline",
  "main": "index.js",
  "capabilities": {
    "blocks": true,
    "toolbox": true
  }
}
```

**extensions-dev/bnonline-info/index.js:**
```javascript
(async (Extension) => {
  const { blink, events, storage, ui, utils, Block, Toolbox } = Extension.API;
  const BN = Extension.API;

  await new Promise(r => {
    const check = () => {
      if (typeof Blockly !== 'undefined' && Blockly.mainWorkspace) r();
      else setTimeout(check, 100);
    };
    check();
  });

  BN.regColor("MY_HUE", "#FF6600", "#FF6600");

  const toolboxXML = [
    Toolbox.title("信息查询"),
    Toolbox.button("show_info", " 显示信息 ", () => {
      alert("Hello!");
    }, "procedure-add-param"),
    Toolbox.flyout_bottom(),
  ];

  BN.regIcon(`<symbol id="icon-info" viewBox="-33 -33 90 90">
    <circle cx="12" cy="12" r="10" fill="#FF6600"/>
  </symbol>`);
  BN.addToolbox("info-toolbox", "icon-info", "#FF6600", toolboxXML);
})(Extension);
```

**打包：**
```bash
node pack-bnex.cjs extensions-dev/bnonline-info public/bn/extensions/bnonline-info.bnex
```

---

## 向后兼容说明

**旧格式仍然完全支持。** 不需要迁移，除非你想使用新功能。

| 特性 | 旧格式 | 新格式 (.bnex) |
|------|--------|----------------|
| 积木注册 | `regBlocks()` | `blink.registerBlock()` |
| 解释器 | `regDomainFunction()` | `blink.registerInterpreter()` |
| 事件系统 | 无 | `events.on/emit/off` |
| 沙箱存储 | `storage`（共享命名空间） | `storage`（隔离命名空间） |
| 清单声明 | `Extension.metaData = {}` | manifest.json |
| 文件结构 | 目录 + index.js | zip 压缩包 .bnex |
| 多文件支持 | 手动 loadScript | 内置支持（CSS/JS/资源） |
| 资源打包 | 无 | 压缩包内打包 |
