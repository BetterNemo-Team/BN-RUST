// Extension Lifecycle Manager
import type { ExtensionManifest, ExtensionStatus } from './manifest';
import { ExtensionStorageManager } from './storage';
import { EventBus } from './events';

interface ExtensionInstance {
  manifest: ExtensionManifest;
  status: ExtensionStatus;
  api: any;
  error?: string;
}

export class LifecycleManager {
  private instances: Map<string, ExtensionInstance> = new Map();
  private storage: ExtensionStorageManager;
  private eventBus: EventBus;

  constructor(storage: ExtensionStorageManager, eventBus: EventBus) {
    this.storage = storage;
    this.eventBus = eventBus;
  }

  getStatus(id: string): ExtensionStatus {
    const instance = this.instances.get(id);
    return instance ? instance.status : 'inactive';
  }

  async activate(id: string, api: any): Promise<void> {
    const instance = this.instances.get(id);
    if (!instance) {
      console.error(`[Lifecycle] Extension ${id} not installed`);
      return;
    }

    try {
      instance.status = 'active';
      instance.api = api;
      instance.error = undefined;

      // Update storage
      this.storage.setExtensionEnabled(id, true);

      // Emit event
      this.eventBus.emit(EventBus.EVENTS.EXTENSION_ACTIVATED, { id });

      console.log(`[Lifecycle] Extension ${id} activated`);
    } catch (e: any) {
      instance.status = 'error';
      instance.error = e.message;
      this.eventBus.emit(EventBus.EVENTS.EXTENSION_ERROR, { id, error: e.message });
      console.error(`[Lifecycle] Failed to activate ${id}:`, e);
    }
  }

  async deactivate(id: string): Promise<void> {
    const instance = this.instances.get(id);
    if (!instance) return;

    try {
      instance.status = 'inactive';
      instance.api = undefined;

      // Update storage
      this.storage.setExtensionEnabled(id, false);

      // Emit event
      this.eventBus.emit(EventBus.EVENTS.EXTENSION_DEACTIVATED, { id });

      console.log(`[Lifecycle] Extension ${id} deactivated`);
    } catch (e) {
      console.error(`[Lifecycle] Failed to deactivate ${id}:`, e);
    }
  }

  async uninstall(id: string): Promise<void> {
    const instance = this.instances.get(id);
    if (!instance) return;

    // Deactivate first
    if (instance.status === 'active') {
      await this.deactivate(id);
    }

    // Clean up
    this.instances.delete(id);
    this.storage.removeExtension(id);

    // Emit event
    this.eventBus.emit(EventBus.EVENTS.EXTENSION_UNINSTALLED, { id });

    console.log(`[Lifecycle] Extension ${id} uninstalled`);
  }

  register(manifest: ExtensionManifest): void {
    this.instances.set(manifest.id, {
      manifest,
      status: 'inactive',
      api: undefined,
    });

    // Ensure extension is in storage
    if (!this.storage.getExtension(manifest.id)) {
      this.storage.setExtensionEnabled(manifest.id, true);
    }
  }

  getAll(): ExtensionInstance[] {
    return Array.from(this.instances.values());
  }

  getActive(): ExtensionInstance[] {
    return Array.from(this.instances.values()).filter(i => i.status === 'active');
  }
}
