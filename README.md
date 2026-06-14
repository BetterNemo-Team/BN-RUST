# BN-RUST — BetterNemo Desktop with Rust WASM Renderer

> 基于 Tauri + Rust WASM 的编程猫扩展框架桌面版，通过 Rust 替换 JavaScript 渲染层实现性能提升。

---

## 项目简介

BetterNemo 是一个编程猫（Codemao）扩展框架的桌面客户端。本项目在原版基础上引入 **Rust WASM 渲染器**，使用 wgpu 实现 GPU 加速的精灵渲染，同时保持与原版 PIXI.js 引擎的完整兼容。

### 核心特性

| 特性 | 说明 |
|------|------|
| **Rust WASM 渲染器** | 基于 wgpu 的 GPU 加速精灵渲染，支持 WebGPU/WebGL |
| **双引擎切换** | 可在 PIXI.js（Canvas）和 Rust（WebGPU）之间自由切换 |
| **独立舞台窗口** | 舞台运行时独立于编辑器，不加载编辑器 UI |
| **BCM 作品导入** | 支持编程猫 BCM 格式和 BetterNemo .bn 格式导入 |
| **Rust 渲染器修复** | 修复 bind group、绘制数量、缩放旋转顺序等核心 bug |
| **UI 性能优化** | MutationObserver 断开、DocumentFragment 批量插入、rAF 防抖 |
| **背景本地化** | 背景图片内置，裁剪填充，设置持久化 |

---

## 项目结构

```
BN-RUST/
├── src-tauri/                  # Tauri 桌面端
│   ├── Cargo.toml
│   ├── src/main.rs
│   └── tauri.conf.json
├── rust-renderer/              # Rust WASM 渲染器
│   ├── Cargo.toml
│   └── src/
│       ├── lib.rs              # WASM 导出接口
│       ├── renderer.rs         # wgpu 渲染核心
│       ├── data.rs             # 数据结构定义
│       ├── texture.rs          # 纹理管理
│       └── shader.wgsl         # 顶点/片段着色器
├── public/
│   ├── bn/                     # 前端公共资源
│   │   ├── workspace.html      # 编辑器主页面
│   │   ├── stage.html          # 舞台窗口（独立初始化）
│   │   ├── bs.js               # dsbridge 桥接模拟
│   │   ├── extension-loader.js # 初始化加载器
│   │   ├── modify.css          # 编辑器样式覆盖
│   │   ├── settings.css        # UI 样式
│   │   ├── workspace-scripts/  # 工作区脚本
│   │   │   ├── utils.js        # 工具函数 + BCM 导入
│   │   │   ├── menu.js         # 顶栏菜单
│   │   │   ├── settings.js     # 设置对话框
│   │   │   ├── blocks.js       # 自定义积木
│   │   │   ├── domain-functions.js # 解释器
│   │   │   └── bn-format.js    # .bn 格式处理
│   │   ├── render-bridge/      # 渲染桥接层
│   │   │   ├── index.js        # 桥接入口
│   │   │   ├── pixi-proxy.js   # PIXI 代理
│   │   │   ├── data-serializer.js
│   │   │   ├── texture-manager.js
│   │   │   └── pixi-scanner.js
│   │   ├── res/                # 资源（背景图等）
│   │   ├── extensions/         # 内置扩展
│   │   └── theme/              # 主题文件
│   └── wasm/                   # WASM 编译产物
│       ├── bn_renderer.js
│       ├── bn_renderer_bg.wasm
│       └── bn_renderer.d.ts
├── src/                        # TypeScript 源码
├── index.html
├── vite.config.ts
├── package.json
└── RUST_RENDERER_IMPLEMENTATION.md
```

---

## 快速开始

### 环境要求

- [Node.js](https://nodejs.org/) >= 18
- [Rust](https://rustup.rs/) >= 1.70
- [wasm-pack](https://rustwasm.github.io/wasm-pack/installer/) (用于编译 WASM)
- [Tauri CLI](https://v2.tauri.app/) v1.x

### 安装依赖

```bash
npm install
```

### 编译 WASM 渲染器

```bash
npm run build:wasm
```

### 开发模式

```bash
npm run dev
```

### 构建发行版

```bash
npm run build
```

---

## Rust WASM 渲染器

### 架构

```
@crc/stage → PIXI Proxy → 数据序列化 → Rust WASM → WebGPU → Canvas
                 ↓                      ↑
            脏数据收集          SharedArrayBuffer
```

### API

| 函数 | 说明 | 参数 |
|------|------|------|
| `init_renderer(canvas)` | 初始化渲染器 | HTMLCanvasElement |
| `update_sprites(json)` | 更新精灵数据 | JSON 字符串 |
| `render_frame()` | 渲染一帧 | 无 |
| `upload_texture(id, w, h, pixels)` | 上传纹理 | ID, 宽, 高, RGBA 像素 |
| `remove_texture(id)` | 删除纹理 | ID |
| `clear_textures()` | 清空纹理 | 无 |
| `resize(w, h)` | 调整画布大小 | 宽, 高 |

### 引擎切换

通过编辑器 "运行时" 菜单切换引擎：

- **PIXI.js (Canvas)** — 默认引擎，兼容性最佳
- **Rust (WebGPU)** — GPU 加速渲染，性能更优

切换后设置自动持久化到 localStorage。

---

## 舞台窗口

舞台窗口独立于编辑器运行：

1. 通过 `workspace.html` 顶栏 "运行" → "启动运行" 或按 F5 打开
2. 舞台窗口使用独立初始化，不加载编辑器 UI
3. 自动运行当前作品

---

## BCM 作品导入

支持两种格式：

| 格式 | 扩展名 | 说明 |
|------|--------|------|
| **BCM** | `.bcm` | 编程猫原生格式（JSON），自动转换为运行时格式 |
| **BN** | `.bn` | BetterNemo 格式（ZIP 容器） |

导入路径：
- 菜单 "更多" → "导入作品"
- 拖拽文件到编辑器

---

## UI 性能优化

| 优化项 | 技术 | 效果 |
|--------|------|------|
| MutationObserver | 找到 injectionDiv 后立即 `disconnect()` | 避免持续监听整个 DOM 子树 |
| 菜单渲染 | `DocumentFragment` 批量插入 | N 次重排降为 1 次 |
| 积木变化监听 | `requestAnimationFrame` 防抖 | 同帧多次事件只执行一次 |
| 积木盒切换 | CSS `transition` 平滑过渡 | 视觉反馈更流畅 |

---

## 已知问题

- BCM 导入：编程猫原生 BCM 格式需要格式转换，部分复杂作品可能有兼容性问题
- Rust WASM 渲染器：WebGPU 不可用时自动降级到 WebGL
- dsbridge 桌面端模拟：部分原生 API 在桌面端不可用

---

## 相关链接

- [原版 BetterNemo](https://github.com/HHCL233/BetterNemoPC)
- [在线版](https://bn-p.pages.dev)
- [编程猫扩展框架文档](https://better-nemo.feishu.cn/wiki/HH4kwHOoJihAVLkEIDacNawKnMf)
- [扩展仓库](https://gitee.com/SandMo/BetterNemo-Extensions)

---

## License

MIT
