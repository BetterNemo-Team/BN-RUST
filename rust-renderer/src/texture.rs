use std::collections::HashMap;
use std::sync::Arc;
use wgpu::{Device, Queue, Texture, TextureFormat, Extent3d, TextureDescriptor, TextureDimension, TextureUsages, ImageCopyTexture, ImageDataLayout};

pub struct TextureManager {
    pub textures: HashMap<u32, Texture>,
    device: Arc<Device>,
    queue: Arc<Queue>,
}

impl TextureManager {
    pub fn new(device: Arc<Device>, queue: Arc<Queue>) -> Self {
        Self { textures: HashMap::new(), device, queue }
    }

    pub fn upload(&mut self, id: u32, width: u32, height: u32, pixels: &[u8]) {
        // 显式 drop 旧纹理，释放 GPU 内存
        self.textures.remove(&id);
        let texture = self.device.create_texture(&TextureDescriptor {
            label: Some(&format!("tex_{}", id)),
            size: Extent3d { width, height, depth_or_array_layers: 1 },
            mip_level_count: 1,
            sample_count: 1,
            dimension: TextureDimension::D2,
            format: TextureFormat::Rgba8Unorm,
            usage: TextureUsages::TEXTURE_BINDING | TextureUsages::COPY_DST,
            view_formats: &[],
        });
        self.queue.write_texture(
            ImageCopyTexture { texture: &texture, mip_level: 0, origin: wgpu::Origin3d::ZERO, aspect: wgpu::TextureAspect::All },
            pixels,
            ImageDataLayout { offset: 0, bytes_per_row: Some(4 * width), rows_per_image: Some(height) },
            Extent3d { width, height, depth_or_array_layers: 1 },
        );
        self.textures.insert(id, texture);
    }

    pub fn remove(&mut self, id: u32) {
        self.textures.remove(&id);
    }

    pub fn get(&self, id: u32) -> Option<&Texture> {
        self.textures.get(&id)
    }

    pub fn clear(&mut self) {
        self.textures.clear();
    }
}
