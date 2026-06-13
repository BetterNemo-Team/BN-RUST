# BetterNemo Rust 渲染器实现文档

---

## 文档版本

| 版本 | 日期 | 作者 | 更新内容 |
|------|------|------|----------|
| v1.0 | 2026-06-13 | BetterNemo Team | 初始版本 |

---

## 目录

1. [项目概述](#1-项目概述)
2. [架构设计](#2-架构设计)
3. [技术选型](#3-技术选型)
4. [详细实现方案](#4-详细实现方案)
5. [代码结构](#5-代码结构)
6. [部署与测试](#6-部署与测试)
7. [性能优化](#7-性能优化)
8. [风险与应对](#8-风险与应对)

---

## 1. 项目概述

### 1.1 背景

BetterNemo 当前使用 `@crc/stage` + `pixi.js` 作为舞台渲染系统。由于 JavaScript 性能限制，在复杂场景下帧率表现不佳。本方案旨在通过 **Rust WASM** 替换渲染层，实现"留脑换手"的渐进式优化。

### 1.2 目标

| 目标 | 描述 |
|------|------|
| **性能提升** | 渲染性能提升 3-5 倍 |
| **兼容性** | 100% 兼容现有 `@crc/stage` 逻辑 |
| **可回退** | 可随时切换回原生 PIXI 渲染 |
| **可扩展** | 为后续物理、逻辑迁移铺路 |

### 1.3 核心策略

```
原有架构:  @crc/stage → PIXI.js → Canvas → 屏幕

新架构:    @crc/stage → PIXI Proxy → Rust WASM → WebGPU → 屏幕
                           ↓                      ↑
                       数据序列化            SharedArrayBuffer
```

---

## 2. 架构设计

### 2.1 整体架构图

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        BetterNemo 渲染架构                              │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ┌─────────────────┐                                                    │
│  │   @crc/stage    │  ← 原有逻辑层（场景管理、角色树、物理、动画）       │
│  │   (JavaScript)  │                                                    │
│  └────────┬────────┘                                                    │
│           │ 调用 PIXI API（如 new Sprite(), addChild()）                 │
│           ↓                                                            │
│  ┌─────────────────┐                                                    │
│  │   PIXI Proxy    │  ← 劫持层：拦截所有 PIXI 调用，记录状态变化         │
│  │   (JavaScript)  │                                                    │
│  └────────┬────────┘                                                    │
│           │ 序列化脏数据                                                  │
│           ↓                                                            │
│  ┌─────────────────┐                                                    │
│  │  Rust Renderer  │  ← 渲染层：WASM 编译，WebGPU 加速                  │
│  │   (WASM)        │                                                    │
│  └────────┬────────┘                                                    │
│           │ WebGL/WebGPU 绘制                                            │
│           ↓                                                            │
│  ┌─────────────────┐                                                    │
│  │    Canvas       │  ← 最终渲染目标                                     │
│  └─────────────────┘                                                    │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### 2.2 核心组件职责

| 组件 | 职责 | 技术栈 |
|------|------|--------|
| **PIXI Proxy** | 劫持 PIXI API，记录状态变化 | JavaScript |
| **Data Serializer** | 将 JS 对象序列化为 WASM 可接收格式 | msgpack/JSON |
| **Rust Renderer** | 接收绘制指令，执行 GPU 渲染 | Rust + wgpu |
| **Texture Manager** | 纹理上传与缓存管理 | Rust + WebGL |

### 2.3 数据流

```
1. @crc/stage 创建 Sprite → ProxySprite 拦截
2. ProxySprite 记录属性变化 → 标记为脏数据
3. 每帧结束时收集所有脏数据 → 序列化
4. 通过 WASM 边界传给 RustRenderer
5. RustRenderer 更新 GPU 资源 → 执行渲染
6. 输出到 Canvas
```

---

## 3. 技术选型

### 3.1 渲染引擎

| 方案 | 说明 | 选型理由 |
|------|------|----------|
| **wgpu** | Rust 原生 GPU 绑定 | 跨平台、支持 WebGPU/WebGL |
| **nannou** | 创意编码框架 | 基于 wgpu，提供高层抽象 |
| **PIXI.js** | 原有方案 | 作为被劫持对象 |

### 3.2 WASM 工具链

| 工具 | 作用 |
|------|------|
| **wasm-bindgen** | Rust ↔ JS 互操作 |
| **wasm-pack** | WASM 打包工具 |
| **wasm-opt** | WASM 优化 |

### 3.3 数据序列化

| 方案 | 优点 | 缺点 |
|------|------|------|
| **JSON** | 简单、兼容性好 | 序列化开销大 |
| **msgpack** | 紧凑、高效 | 需要额外库 |
| **SharedArrayBuffer** | 零拷贝 | 安全限制 |

---

## 4. 详细实现方案

### 4.1 PIXI Proxy 层

#### 4.1.1 需要劫持的 PIXI 类

| PIXI 类 | 劫持目的 | 关键方法/属性 |
|---------|----------|---------------|
| **Application** | 创建 canvas，启动渲染循环 | constructor, render() |
| **Sprite** | 记录位置、旋转、缩放、纹理 | x, y, rotation, scale, visible |
| **Container** | 管理子对象层级 | addChild(), removeChild() |
| **Graphics** | 捕获矢量绘制指令 | moveTo, lineTo, fill, stroke |
| **Text** | 捕获文本内容和样式 | text, style |
| **Texture** | 纹理加载与上传 | from(), fromCanvas() |

#### 4.1.2 脏标记机制

```javascript
class ProxySprite {
  constructor(texture) {
    this._dirty = true;           // 脏标记
    this._original = new PIXI.Sprite(texture);
    this._textureId = registerTexture(texture);
  }

  set x(value) {
    this._original.x = value;
    this._dirty = true;           // 属性变化时标记为脏
  }

  // ... 其他属性 setter
}
```

#### 4.1.3 帧同步策略

```javascript
function flushDirtyObjects() {
  const dirtySprites = [];
  
  for (const sprite of dirtySpriteSet) {
    if (sprite._dirty) {
      dirtySprites.push(sprite._getTransformData());
      sprite._dirty = false;      // 重置脏标记
    }
  }
  
  if (dirtySprites.length > 0) {
    rustRenderer.updateSprites(dirtySprites);
  }
}
```

### 4.2 Rust Renderer 层

#### 4.2.1 核心数据结构

```rust
#[repr(C)]
#[derive(Copy, Clone, bytemuck::Pod, bytemuck::Zeroable)]
struct SpriteVertex {
    position: [f32; 2],   // 位置
    uv: [f32; 2],         // 纹理坐标
    transform: [f32; 3],  // 缩放 + 旋转
    color: [f32; 4],      // 颜色 + 透明度
}

#[derive(serde::Deserialize)]
struct SpriteData {
    id: String,
    texture_id: u32,
    x: f32,
    y: f32,
    rotation: f32,
    scale_x: f32,
    scale_y: f32,
    visible: bool,
    width: f32,
    height: f32,
}
```

#### 4.2.2 渲染流程

```rust
pub fn render(&self) {
    // 1. 创建命令编码器
    let mut encoder = self.device.create_command_encoder(...);
    
    // 2. 开始渲染通道
    let mut render_pass = encoder.begin_render_pass(...);
    
    // 3. 设置管线和缓冲区
    render_pass.set_pipeline(&self.pipeline);
    render_pass.set_vertex_buffer(0, self.sprite_buffer.slice(...));
    
    // 4. 绘制
    render_pass.draw(0..self.sprite_count * 4, 0..self.sprite_count);
    
    // 5. 提交命令
    self.queue.submit(Some(encoder.finish()));
}
```

#### 4.2.3 着色器设计

```wgsl
// vertex shader
@vertex
fn vs_main(input: VertexInput) -> VertexOutput {
    var output: VertexOutput;
    
    // 应用旋转变换
    let cos = cos(input.transform.z);
    let sin = sin(input.transform.z);
    let rotated = vec2(
        input.position.x * cos - input.position.y * sin,
        input.position.x * sin + input.position.y * cos
    );
    
    // 应用缩放
    let scaled = rotated * input.transform.xy;
    
    output.position = vec4(scaled, 0.0, 1.0);
    output.uv = input.uv;
    return output;
}

// fragment shader
@fragment
fn fs_main(input: VertexOutput) -> @location(0) vec4<f32> {
    return texture(texture_sampler, input.uv);
}
```

### 4.3 纹理管理

#### 4.3.1 纹理上传流程

```javascript
async function uploadTextureToRust(texture, textureId) {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    // 绘制到临时 canvas
    canvas.width = texture.width;
    canvas.height = texture.height;
    ctx.drawImage(texture.source, 0, 0);
    
    // 获取像素数据
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    
    // 传给 Rust
    await rustRenderer.uploadTexture(textureId, imageData);
}
```

#### 4.3.2 Rust 纹理存储

```rust
pub struct TextureManager {
    textures: HashMap<u32, Texture>,
    samplers: HashMap<u32, Sampler>,
}

impl TextureManager {
    pub fn upload_texture(&mut self, id: u32, width: u32, height: u32, pixels: &[u8]) {
        let texture = self.device.create_texture(&TextureDescriptor {
            size: Extent3d { width, height, depth_or_array_layers: 1 },
            format: TextureFormat::Rgba8Unorm,
            usage: TextureUsages::TEXTURE_BINDING | TextureUsages::COPY_DST,
            ..Default::default()
        });
        
        self.queue.write_texture(
            ImageCopyTexture { texture: &texture, ..Default::default() },
            pixels,
            ImageDataLayout {
                bytes_per_row: Some(4 * width),
                ..Default::default()
            },
            Extent3d { width, height, depth_or_array_layers: 1 },
        );
        
        self.textures.insert(id, texture);
    }
}
```

---

## 5. 代码结构

### 5.1 目录结构

```
src/
├── render-bridge/           # JavaScript 桥接层
│   ├── pixi-proxy.js        # PIXI 劫持逻辑
│   ├── data-serializer.js   # 数据序列化
│   ├── texture-manager.js   # 纹理管理
│   └── index.js             # 入口文件
└── wasm/                    # Rust WASM 渲染器
    ├── Cargo.toml
    └── src/
        ├── lib.rs           # WASM 入口
        ├── renderer.rs      # 渲染核心
        ├── texture.rs       # 纹理管理
        ├── shader.wgsl      # 着色器
        └── data.rs          # 数据结构
```

### 5.2 文件职责说明

| 文件 | 职责 | 语言 |
|------|------|------|
| `pixi-proxy.js` | 劫持 PIXI 类，记录状态 | JavaScript |
| `data-serializer.js` | 数据序列化与传输 | JavaScript |
| `texture-manager.js` | 纹理加载与上传 | JavaScript |
| `lib.rs` | WASM 导出接口 | Rust |
| `renderer.rs` | wgpu 渲染核心 | Rust |
| `texture.rs` | 纹理缓存与管理 | Rust |
| `shader.wgsl` | 顶点/片段着色器 | WGSL |
| `data.rs` | 共享数据结构定义 | Rust |

---

## 6. 部署与测试

### 6.1 构建流程

```bash
# 1. 构建 WASM 模块
cd src/wasm
wasm-pack build --target web --out-dir ../../dist/wasm

# 2. 构建前端
npm run build:frontend

# 3. 构建 Tauri 应用
npm run build
```

### 6.2 测试方案

#### 6.2.1 单元测试

| 测试项 | 测试方法 |
|--------|----------|
| PIXI 劫持 | 验证 ProxySprite 属性修改是否被正确拦截 |
| 数据序列化 | 验证 JS 对象正确转换为 WASM 格式 |
| 纹理上传 | 验证纹理正确加载到 GPU |

#### 6.2.2 性能测试

| 指标 | 测试方法 | 目标 |
|------|----------|------|
| 帧率 | 使用 `requestAnimationFrame` 计时 | >60 FPS |
| 渲染耗时 | Chrome DevTools Performance | <16ms/帧 |
| 内存占用 | Chrome DevTools Memory | <200MB |

#### 6.2.3 兼容性测试

| 测试项 | 测试内容 |
|--------|----------|
| 现有积木 | 运行所有内置积木，验证行为一致 |
| 扩展插件 | 测试所有官方扩展 |
| 项目加载 | 加载复杂项目验证渲染正确性 |

---

## 7. 性能优化

### 7.1 批处理优化

```rust
// 将多个 sprite 合并为单次 draw call
pub fn batch_sprites(&mut self, sprites: &[SpriteData]) {
    let mut vertices = Vec::with_capacity(sprites.len() * 4);
    
    for sprite in sprites {
        // 为每个 sprite 创建 4 个顶点（两个三角形）
        let rect = create_rect_vertices(sprite);
        vertices.extend_from_slice(&rect);
    }
    
    // 一次性上传到 GPU
    self.queue.write_buffer(&self.sprite_buffer, 0, bytemuck::cast_slice(&vertices));
}
```

### 7.2 实例渲染优化

```rust
// 使用 instanced rendering 减少 draw call
pub fn setup_instanced_rendering(&mut self) {
    let instance_buffer = self.device.create_buffer(&BufferDescriptor {
        size: MAX_INSTANCES * std::mem::size_of::<InstanceData>() as BufferAddress,
        usage: BufferUsages::VERTEX | BufferUsages::COPY_DST,
        ..Default::default()
    });
    
    // 在着色器中使用 instance ID
    // @location(3) instance_id: u32
}
```

### 7.3 纹理压缩

```rust
// 使用 basis-universal 压缩纹理
pub fn compress_texture(&self, pixels: &[u8], width: u32, height: u32) -> Vec<u8> {
    // 使用 basis_universal crate 压缩
    basis_universal::compress(pixels, width, height)
}
```

---

## 8. 风险与应对

### 8.1 风险矩阵

| 风险 | 等级 | 应对措施 |
|------|------|----------|
| PIXI API 兼容性 | 高 | 完整测试所有 PIXI 版本 |
| WASM 加载时间 | 中 | 使用 wasm-opt 优化，懒加载 |
| 内存泄漏 | 中 | 定期清理不再使用的纹理 |
| 浏览器兼容性 | 低 | 降级到 WebGL 1.0 |
| 性能不如预期 | 中 | 提供开关可回退到原生 PIXI |

### 8.2 回退机制

```javascript
class RendererSwitch {
    static enableRustRenderer() {
        window.__USE_RUST_RENDERER = true;
        setupRustRenderer();
    }
    
    static disableRustRenderer() {
        window.__USE_RUST_RENDERER = false;
        if (window.__PIXI_PROXY) {
            window.__PIXI_PROXY.destroy();
        }
        window.PIXI = window.__ORIGINAL_PIXI;
    }
    
    static isEnabled() {
        return window.__USE_RUST_RENDERER || false;
    }
}
```

---

## 附录 A：API 参考

### A.1 JavaScript API

| 方法 | 说明 | 参数 |
|------|------|------|
| `setupRustRenderer()` | 初始化 Rust 渲染器 | 无 |
| `RendererSwitch.enable()` | 启用 Rust 渲染 | 无 |
| `RendererSwitch.disable()` | 禁用 Rust 渲染 | 无 |

### A.2 WASM API

| 方法 | 说明 | 参数 |
|------|------|------|
| `RustRenderer.new()` | 创建渲染器实例 | canvas, width, height |
| `uploadTexture()` | 上传纹理 | textureId, imageData |
| `updateSprites()` | 更新精灵数据 | sprites: Array |
| `render()` | 执行渲染 | 无 |

---

## 附录 B：性能对比预期

| 场景 | 原生 PIXI | Rust WASM | 提升 |
|------|-----------|-----------|------|
| 100 个精灵 | ~30 FPS | ~60 FPS | 2x |
| 1000 个精灵 | ~10 FPS | ~45 FPS | 4.5x |
| 纹理加载 | ~200ms | ~80ms | 2.5x |
| 矢量绘制 | ~50ms | ~15ms | 3.3x |

---

**文档结束**

---

*BetterNemo Team | 2026*
