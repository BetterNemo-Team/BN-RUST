use serde::Deserialize;

#[derive(Debug, Clone, Deserialize)]
pub struct SpriteData {
    pub id: String,
    pub texture_id: u32,
    pub x: f32,
    pub y: f32,
    pub rotation: f32,
    pub scale_x: f32,
    pub scale_y: f32,
    pub visible: bool,
    pub width: f32,
    pub height: f32,
    pub alpha: f32,
}

#[derive(Debug, Clone, Deserialize)]
pub struct TextureUpload {
    pub id: u32,
    pub width: u32,
    pub height: u32,
    pub pixels: Vec<u8>,
}

#[repr(C)]
#[derive(Debug, Copy, Clone, bytemuck::Pod, bytemuck::Zeroable)]
pub struct SpriteVertex {
    pub position: [f32; 2],
    pub uv: [f32; 2],
    pub transform: [f32; 3],
    pub color: [f32; 4],
}

impl SpriteVertex {
    pub fn desc() -> wgpu::VertexBufferLayout<'static> {
        wgpu::VertexBufferLayout {
            array_stride: std::mem::size_of::<Self>() as wgpu::BufferAddress,
            step_mode: wgpu::VertexStepMode::Vertex,
            attributes: &[
                wgpu::VertexAttribute { offset: 0, shader_location: 0, format: wgpu::VertexFormat::Float32x2 },
                wgpu::VertexAttribute { offset: 8, shader_location: 1, format: wgpu::VertexFormat::Float32x2 },
                wgpu::VertexAttribute { offset: 16, shader_location: 2, format: wgpu::VertexFormat::Float32x3 },
                wgpu::VertexAttribute { offset: 28, shader_location: 3, format: wgpu::VertexFormat::Float32x4 },
            ],
        }
    }
}
