use std::sync::Arc;
use crate::data::*;
use crate::texture::TextureManager;
use wgpu::{*, SurfaceTarget};

pub struct Renderer {
    pub device: Arc<Device>,
    pub queue: Arc<Queue>,
    pub surface: Surface<'static>,
    pub config: SurfaceConfiguration,
    pub texture_manager: TextureManager,
    pipeline: RenderPipeline,
    sampler: Sampler,
    sprite_buffer: Buffer,
    bind_group_layout: BindGroupLayout,
    vertex_count: u32,
    clear_color: Color,
    // 缓存的默认白色纹理（避免每帧创建）
    default_tex: Texture,
    default_tex_view: TextureView,
}

impl Renderer {
    pub async fn new(canvas: web_sys::HtmlCanvasElement) -> Self {
        let instance = Instance::new(InstanceDescriptor::default());
        let surface = instance.create_surface(SurfaceTarget::Canvas(canvas.clone())).unwrap();
        let adapter = instance.request_adapter(&RequestAdapterOptions { power_preference: PowerPreference::HighPerformance, compatible_surface: Some(&surface), force_fallback_adapter: false }).await.unwrap();
        let (device, queue) = adapter.request_device(&DeviceDescriptor { label: None, required_features: Features::empty(), required_limits: Limits::default() }, None).await.unwrap();

        let device = Arc::new(device);
        let queue = Arc::new(queue);

        let width = canvas.width().max(1);
        let height = canvas.height().max(1);
        let format = surface.get_capabilities(&adapter).formats[0];
        let config = SurfaceConfiguration { usage: TextureUsages::RENDER_ATTACHMENT, format, width, height, present_mode: PresentMode::Fifo, desired_maximum_frame_latency: 2, alpha_mode: CompositeAlphaMode::Auto, view_formats: vec![] };
        surface.configure(device.as_ref(), &config);

        let shader = device.create_shader_module(ShaderModuleDescriptor {
            label: Some("sprite_shader"),
            source: ShaderSource::Wgsl(include_str!("shader.wgsl").into()),
        });

        let bind_group_layout = device.create_bind_group_layout(&BindGroupLayoutDescriptor {
            label: Some("tex_bind_group_layout"),
            entries: &[
                BindGroupLayoutEntry { binding: 0, visibility: ShaderStages::FRAGMENT, ty: BindingType::Texture { sample_type: TextureSampleType::Float { filterable: true }, view_dimension: TextureViewDimension::D2, multisampled: false }, count: None },
                BindGroupLayoutEntry { binding: 1, visibility: ShaderStages::FRAGMENT, ty: BindingType::Sampler(SamplerBindingType::Filtering), count: None },
            ],
        });

        let pipeline_layout = device.create_pipeline_layout(&PipelineLayoutDescriptor {
            label: Some("sprite_pipeline_layout"),
            bind_group_layouts: &[&bind_group_layout],
            push_constant_ranges: &[],
        });

        let pipeline = device.create_render_pipeline(&RenderPipelineDescriptor {
            label: Some("sprite_pipeline"),
            layout: Some(&pipeline_layout),
            vertex: VertexState { module: &shader, entry_point: "vs_main", buffers: &[SpriteVertex::desc()] },
            fragment: Some(FragmentState { module: &shader, entry_point: "fs_main", targets: &[Some(ColorTargetState { format, blend: Some(BlendState::ALPHA_BLENDING), write_mask: ColorWrites::ALL })], }),
            primitive: PrimitiveState { topology: PrimitiveTopology::TriangleList, ..Default::default() },
            depth_stencil: None,
            multisample: MultisampleState::default(),
            multiview: None,
        });

        let sampler = device.create_sampler(&SamplerDescriptor {
            label: Some("sprite_sampler"),
            address_mode_u: AddressMode::ClampToEdge,
            address_mode_v: AddressMode::ClampToEdge,
            address_mode_w: AddressMode::ClampToEdge,
            mag_filter: FilterMode::Linear,
            min_filter: FilterMode::Linear,
            mipmap_filter: FilterMode::Nearest,
            ..Default::default()
        });

        let max_sprites = 4096u32;
        let sprite_buffer = device.create_buffer(&BufferDescriptor {
            label: Some("sprite_vertex_buffer"),
            size: (max_sprites as u64) * 4 * std::mem::size_of::<SpriteVertex>() as u64,
            usage: BufferUsages::VERTEX | BufferUsages::COPY_DST,
            mapped_at_creation: false,
        });

        let texture_manager = TextureManager::new(device.clone(), queue.clone());

        // 创建默认白色纹理（只创建一次）
        let default_tex = device.create_texture(&TextureDescriptor {
            label: Some("default_white"),
            size: Extent3d { width: 1, height: 1, depth_or_array_layers: 1 },
            mip_level_count: 1,
            sample_count: 1,
            dimension: TextureDimension::D2,
            format: TextureFormat::Rgba8Unorm,
            usage: TextureUsages::TEXTURE_BINDING | TextureUsages::COPY_DST,
            view_formats: &[],
        });
        queue.write_texture(
            ImageCopyTexture { texture: &default_tex, mip_level: 0, origin: Origin3d::ZERO, aspect: TextureAspect::All },
            &[255u8, 255, 255, 255],
            ImageDataLayout { offset: 0, bytes_per_row: Some(4), rows_per_image: Some(1) },
            Extent3d { width: 1, height: 1, depth_or_array_layers: 1 },
        );
        let default_tex_view = default_tex.create_view(&TextureViewDescriptor::default());

        Self { device, queue, surface, config, texture_manager, pipeline, sampler, sprite_buffer, bind_group_layout, vertex_count: 0, clear_color: Color { r: 0.0, g: 0.0, b: 0.0, a: 1.0 }, default_tex, default_tex_view }
    }

    pub fn resize(&mut self, width: u32, height: u32) {
        self.config.width = width.max(1);
        self.config.height = height.max(1);
        self.surface.configure(self.device.as_ref(), &self.config);
    }

    pub fn set_clear_color(&mut self, r: f32, g: f32, b: f32, a: f32) {
        self.clear_color = Color { r: r as f64, g: g as f64, b: b as f64, a: a as f64 };
    }

    pub fn update_sprites(&mut self, sprites_json: &str) {
        let sprites: Vec<SpriteData> = match serde_json::from_str(sprites_json) {
            Ok(s) => s,
            Err(e) => { web_sys::console::warn_1(&e.to_string().into()); return; }
        };
        let mut vertices = Vec::with_capacity(sprites.len() * 4);
        for s in &sprites {
            if !s.visible { continue; }
            let hw = s.width / 2.0;
            let hh = s.height / 2.0;
            // 先缩放再旋转
            let cos = s.rotation.cos();
            let sin = s.rotation.sin();
            let local = |x: f32, y: f32| -> [f32; 2] {
                let sx = x * s.scale_x;
                let sy = y * s.scale_y;
                let rx = sx * cos - sy * sin;
                let ry = sx * sin + sy * cos;
                [s.x + rx, s.y + ry]
            };
            let (r, g, b, a) = (1.0, 1.0, 1.0, s.alpha);
            for &(dx, dy, u, v) in &[(-hw, -hh, 0.0, 0.0), (hw, -hh, 1.0, 0.0), (-hw, hh, 0.0, 1.0), (hw, hh, 1.0, 1.0)] {
                vertices.push(SpriteVertex { position: local(dx, dy), uv: [u, v], transform: [1.0, 1.0, 0.0], color: [r, g, b, a] });
            }
        }
        self.vertex_count = vertices.len() as u32;
        if self.vertex_count > 0 {
            self.queue.write_buffer(&self.sprite_buffer, 0, bytemuck::cast_slice(&vertices));
        }
    }

    pub fn render(&self) {
        if self.vertex_count == 0 { return; }
        let frame = match self.surface.get_current_texture() {
            Ok(f) => f,
            Err(_) => return,
        };
        let view = frame.texture.create_view(&TextureViewDescriptor::default());

        // 使用缓存的默认白色纹理
        let bind_group = self.device.create_bind_group(&BindGroupDescriptor {
            label: Some("sprite_bind_group"),
            layout: &self.bind_group_layout,
            entries: &[
                BindGroupEntry { binding: 0, resource: BindingResource::TextureView(&self.default_tex_view) },
                BindGroupEntry { binding: 1, resource: BindingResource::Sampler(&self.sampler) },
            ],
        });

        let mut encoder = self.device.create_command_encoder(&CommandEncoderDescriptor { label: Some("render_encoder") });
        {
            let mut rp = encoder.begin_render_pass(&RenderPassDescriptor {
                label: Some("render_pass"),
                color_attachments: &[Some(RenderPassColorAttachment {
                    view: &view,
                    resolve_target: None,
                    ops: Operations { load: LoadOp::Clear(self.clear_color), store: StoreOp::Store },
                })],
                depth_stencil_attachment: None,
                occlusion_query_set: None,
                timestamp_writes: None,
            });
            rp.set_pipeline(&self.pipeline);
            rp.set_bind_group(0, &bind_group, &[]);
            rp.set_vertex_buffer(0, self.sprite_buffer.slice(..));
            rp.draw(0..self.vertex_count, 0..1);
        }
        self.queue.submit(Some(encoder.finish()));
        frame.present();
    }
}
