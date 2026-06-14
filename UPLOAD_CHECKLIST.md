# BN-RUST 上传清单

## 核心项目文件
- package.json
- package-lock.json
- vite.config.ts
- tsconfig.json
- index.html
- style.css
- .gitignore
- README.md
- LICENSE

## Tauri 桌面端
- src-tauri/Cargo.toml
- src-tauri/Cargo.lock
- src-tauri/build.rs
- src-tauri/src/main.rs
- src-tauri/tauri.conf.json
- src-tauri/icons/

## Rust WASM 渲染器
- rust-renderer/Cargo.toml
- rust-renderer/Cargo.lock
- rust-renderer/src/lib.rs
- rust-renderer/src/renderer.rs
- rust-renderer/src/data.rs
- rust-renderer/src/texture.rs
- rust-renderer/src/shader.wgsl

## 前端公共资源
- public/bn/workspace.html
- public/bn/stage.html
- public/bn/bs.js
- public/bn/extension-loader.js
- public/bn/modify.css
- public/bn/settings.css
- public/bn/fa.min.css
- public/bn/mdui.css
- public/bn/mdui.global.js
- public/bn/material-icons.css
- public/bn/jszip.min.js
- public/bn/touchEmulator.js
- public/bn/ua-parser.min.js
- public/bn/saveSvgAsPng.min.js
- public/bn/eruda.js
- public/bn/res/bn_background.webp

## 工作区脚本
- public/bn/workspace-scripts/utils.js
- public/bn/workspace-scripts/menu.js
- public/bn/workspace-scripts/settings.js
- public/bn/workspace-scripts/blocks.js
- public/bn/workspace-scripts/toolbox.js
- public/bn/workspace-scripts/domain-functions.js
- public/bn/workspace-scripts/prototype-inject.js
- public/bn/workspace-scripts/cat-block.js
- public/bn/workspace-scripts/bn-format.js
- public/bn/workspace-scripts/storage.js

## 渲染桥接层
- public/bn/render-bridge/index.js
- public/bn/render-bridge/pixi-proxy.js
- public/bn/render-bridge/data-serializer.js
- public/bn/render-bridge/texture-manager.js
- public/bn/render-bridge/pixi-scanner.js

## WASM 产物
- public/wasm/bn_renderer.js
- public/wasm/bn_renderer.d.ts
- public/wasm/bn_renderer_bg.wasm
- public/wasm/bn_renderer_bg.wasm.d.ts
- public/wasm/package.json

## 扩展和主题
- public/bn/extensions/_CONFIG.js
- public/bn/extensions/[BNOnline内置]信息查询/
- public/bn/theme/_CONFIG.js
- public/bn/theme/default/
- public/bn/theme/classic/
- public/bn/theme/modern-flat-dark/
- public/bn/theme/angle/
- public/bn/theme/vanilla/
- public/bn/theme/AFS*/
- public/bn/theme/AFS-fonts/

## 资源文件（音频等）
- public/bn/*.mp3
- public/bn/*.png
- public/bn/*.svg
- public/bn/*.gif

## 工具脚本
- perf-test.js

## 不上传（已在 .gitignore）
- node_modules/
- src-tauri/target/
- rust-renderer/target/
- rust-renderer/pkg/
- dist/
- target/
- *.log
