// Extension Host — 统一入口，支持 .bnex 单文件 + legacy 目录格式
import { EventBus } from './events';
import { ExtensionStorageManager } from './storage';
import { LifecycleManager } from './lifecycle';
import { createExtensionAPI } from './api';
import { loadExtension, isBnex } from './loader';
import type { ExtensionManifest } from './manifest';

export class ExtensionHost {
  private eventBus: EventBus;
  private storage: ExtensionStorageManager;
  private lifecycle: LifecycleManager;
  private apiCache: Map<string, any> = new Map();
  private loadedExtensions: Map<string, { manifest: ExtensionManifest; format: string }> = new Map();

  constructor() {
    this.eventBus = new EventBus();
    this.storage = new ExtensionStorageManager();
    this.lifecycle = new LifecycleManager(this.storage, this.eventBus);
    this.storage.migrateFromOldFormat();
    console.log('[ExtensionHost] Initialized');
  }

  async load(target: string): Promise<boolean> {
    if (this.loadedExtensions.has(target)) {
      console.warn(`[ExtensionHost] ${target} already loaded`);
      return true;
    }

    console.log(`[ExtensionHost] Loading: ${target}`);
    const result = await loadExtension(target, this.eventBus);
    if (!result) return false;

    const { manifest, api, format } = result;
    this.loadedExtensions.set(target, { manifest, format });
    this.apiCache.set(manifest.id, api);
    this.lifecycle.register(manifest);

    const enabled = this.storage.isExtensionEnabled(manifest.id);
    if (enabled) {
      await this.lifecycle.activate(manifest.id, api);
    }

    this.eventBus.emit(EventBus.EVENTS.EXTENSION_INSTALLED, { id: manifest.id, manifest, format });
    console.log(`[ExtensionHost] Loaded ${target} (${format})`);
    return true;
  }

  async loadAll(targets: string[]): Promise<void> {
    await Promise.all(targets.map(t => this.load(t)));
  }

  async install(manifest: ExtensionManifest): Promise<void> {
    this.lifecycle.register(manifest);
    const api = createExtensionAPI(manifest, this.eventBus, 'bn_ext');
    this.apiCache.set(manifest.id, api);
    this.eventBus.emit(EventBus.EVENTS.EXTENSION_INSTALLED, { id: manifest.id, manifest });
  }

  async activate(id: string): Promise<void> {
    const api = this.apiCache.get(id);
    if (!api) { console.error(`[ExtensionHost] No API for ${id}`); return; }
    await this.lifecycle.activate(id, api);
  }

  async deactivate(id: string): Promise<void> {
    await this.lifecycle.deactivate(id);
  }

  async uninstall(id: string): Promise<void> {
    await this.lifecycle.uninstall(id);
    this.apiCache.delete(id);
    this.loadedExtensions.delete(id);
  }

  getStatus(id: string): string { return this.lifecycle.getStatus(id); }
  getAPI(id: string): any { return this.apiCache.get(id); }
  getEventBus(): EventBus { return this.eventBus; }
  getStorage(): ExtensionStorageManager { return this.storage; }

  watch(id: string, callback: (status: string) => void): () => void {
    return this.eventBus.on(EventBus.EVENTS.EXTENSION_ACTIVATED, (data: any) => {
      if (data.id === id) callback('active');
    });
  }

  getLoaded(): Array<{ id: string; format: string; status: string }> {
    return Array.from(this.loadedExtensions.entries()).map(([id, info]) => ({
      id,
      format: info.format,
      status: this.lifecycle.getStatus(id),
    }));
  }
}

let instance: ExtensionHost | null = null;

export function getExtensionHost(): ExtensionHost {
  if (!instance) instance = new ExtensionHost();
  return instance;
}
