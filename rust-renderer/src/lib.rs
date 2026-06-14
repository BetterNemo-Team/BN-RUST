mod data;
mod renderer;
mod texture;

use std::cell::RefCell;
use wasm_bindgen::prelude::*;
use renderer::Renderer;

thread_local! {
    static RENDERER: RefCell<Option<Renderer>> = const { RefCell::new(None) };
}

#[wasm_bindgen]
pub async fn init_renderer(canvas: web_sys::HtmlCanvasElement) {
    let renderer = Renderer::new(canvas).await;
    RENDERER.with(|r| *r.borrow_mut() = Some(renderer));
}

#[wasm_bindgen]
pub fn resize(width: u32, height: u32) {
    RENDERER.with(|r| {
        if let Some(ref mut renderer) = *r.borrow_mut() {
            renderer.resize(width, height);
        }
    });
}

#[wasm_bindgen]
pub fn update_sprites(sprites_json: &str) {
    RENDERER.with(|r| {
        if let Some(ref mut renderer) = *r.borrow_mut() {
            renderer.update_sprites(sprites_json);
        }
    });
}

#[wasm_bindgen]
pub fn render_frame() {
    RENDERER.with(|r| {
        if let Some(ref renderer) = *r.borrow() {
            renderer.render();
        }
    });
}

#[wasm_bindgen]
pub fn upload_texture(id: u32, width: u32, height: u32, pixels: &[u8]) {
    RENDERER.with(|r| {
        if let Some(ref mut renderer) = *r.borrow_mut() {
            renderer.texture_manager.upload(id, width, height, pixels);
        }
    });
}

#[wasm_bindgen]
pub fn remove_texture(id: u32) {
    RENDERER.with(|r| {
        if let Some(ref mut renderer) = *r.borrow_mut() {
            renderer.texture_manager.remove(id);
        }
    });
}

#[wasm_bindgen]
pub fn clear_textures() {
    RENDERER.with(|r| {
        if let Some(ref mut renderer) = *r.borrow_mut() {
            renderer.texture_manager.clear();
        }
    });
}
