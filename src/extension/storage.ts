// Extension Storage - Sandboxed localStorage wrapper
import type { ExtensionStorage, ExtensionConfig } from './manifest';

const STORAGE_KEY = 'bn_extensions';
const DEFAULT_STORAGE: ExtensionStorage = {
  version: 1,
  extensions: {},
  themes: {},
};

export class ExtensionStorageManager {
  private data: ExtensionStorage;

  constructor() {
    this.data = this.load();
  }

  private load(): ExtensionStorage {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        return JSON.parse(raw);
      }
    } catch (e) {
      console.error('[ExtensionStorage] Failed to load:', e);
    }
    return { ...DEFAULT_STORAGE };
  }

  private save(): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.data));
    } catch (e) {
      console.error('[ExtensionStorage] Failed to save:', e);
    }
  }

  // Extension methods
  getExtension(id: string): ExtensionConfig | undefined {
    return this.data.extensions[id];
  }

  setExtension(id: string, config: ExtensionConfig): void {
    this.data.extensions[id] = config;
    this.save();
  }

  removeExtension(id: string): void {
    delete this.data.extensions[id];
    this.save();
  }

  isExtensionEnabled(id: string): boolean {
    const ext = this.data.extensions[id];
    return ext ? ext.enabled === true : false;
  }

  setExtensionEnabled(id: string, enabled: boolean): void {
    if (!this.data.extensions[id]) {
      this.data.extensions[id] = {
        enabled,
        version: '',
        settings: {},
        installedAt: Date.now(),
        lastUsed: Date.now(),
      };
    } else {
      this.data.extensions[id].enabled = enabled;
    }
    this.save();
  }

  // Theme methods
  getTheme(name: string) {
    return this.data.themes[name];
  }

  setTheme(name: string, config: { enabled: boolean; settings: Record<string, any> }): void {
    this.data.themes[name] = config;
    this.save();
  }

  // Generic storage for extensions
  getExtensionSetting(extensionId: string, key: string): any {
    const ext = this.data.extensions[extensionId];
    return ext ? ext.settings[key] : undefined;
  }

  setExtensionSetting(extensionId: string, key: string, value: any): void {
    if (!this.data.extensions[extensionId]) {
      this.data.extensions[extensionId] = {
        enabled: true,
        version: '',
        settings: {},
        installedAt: Date.now(),
        lastUsed: Date.now(),
      };
    }
    this.data.extensions[extensionId].settings[key] = value;
    this.save();
  }

  // Migration from old format
  migrateFromOldFormat(): void {
    try {
      const oldConfig = JSON.parse(localStorage.getItem('bn') || '{}');
      if (oldConfig.extension_config) {
        Object.entries(oldConfig.extension_config).forEach(([name, enabled]) => {
          if (!this.data.extensions[name]) {
            this.data.extensions[name] = {
              enabled: enabled !== false,
              version: '',
              settings: {},
              installedAt: Date.now(),
              lastUsed: Date.now(),
            };
          }
        });
        this.save();
      }
      if (oldConfig.theme_config) {
        Object.entries(oldConfig.theme_config).forEach(([name, enabled]) => {
          if (!this.data.themes[name]) {
            this.data.themes[name] = { enabled: enabled === true, settings: {} };
          }
        });
        this.save();
      }
    } catch (e) {
      console.error('[ExtensionStorage] Migration failed:', e);
    }
  }
}
