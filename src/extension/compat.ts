// Extension Compatibility Layer - Bridges old Extension API to new system
import { ExtensionHost, getExtensionHost } from './host';
import { EventBus } from './events';
import type { ExtensionManifest } from './manifest';

// Store original functions for restoration
const originalFunctions: Map<string, Function> = new Map();

/**
 * Create a compatibility wrapper for the old Extension API
 * This allows old extensions to work without modification
 */
export function createCompatAPI(extensionId: string): any {
  const host = getExtensionHost();
  const eventBus = host.getEventBus();

  return {
    // Old API: Extension.metaData setter
    metaData: {
      get() { return {}; },
      set(value: any) {
        console.log(`[Compat] Extension ${extensionId} metaData set:`, value);
        // Store metadata for the extension
        host.getStorage().setExtensionSetting(extensionId, 'metaData', value);
      },
    },

    // Old API: Extension.API
    API: {
      // Blink integration - delegate to new system
      blink: {
        registerBlock: (def: any) => {
          eventBus.emit(EventBus.EVENTS.BLOCK_REGISTERED, { extensionId, blockType: def.type });
          // Also call original Blink API if available
          if (typeof (window as any).Blink !== 'undefined') {
            try {
              (window as any).Blink.define_block_with_object(def.type, def);
            } catch (e) {
              console.error(`[Compat] Failed to register block ${def.type}:`, e);
            }
          }
        },
        registerToolbox: (config: any) => {
          eventBus.emit(EventBus.EVENTS.TOOLBOX_UPDATED, { extensionId, config });
        },
        registerInterpreter: (name: string, handler: Function) => {
          eventBus.emit(EventBus.EVENTS.INTERPRETER_INJECTED, { extensionId, name, handler });
        },
      },

      // Event system
      events: {
        emit: (event: string, data?: any) => eventBus.emit(event, data),
        on: (event: string, handler: Function) => eventBus.on(event, handler),
        off: (event: string, handler: Function) => eventBus.off(event, handler),
      },

      // Storage
      storage: {
        get: (key: string) => host.getStorage().getExtensionSetting(extensionId, key),
        set: (key: string, value: any) => host.getStorage().setExtensionSetting(extensionId, key, value),
      },

      // UI
      ui: {
        showNotification: (message: string, type?: string) => {
          const snackbar = document.querySelector('mdui-snackbar');
          if (snackbar) {
            (snackbar as any).textContent = message;
            (snackbar as any).open = true;
          }
        },
      },

      // Utilities
      utils: {
        loadScript: (url: string) => new Promise((resolve, reject) => {
          const s = document.createElement('script');
          s.src = url;
          s.onload = resolve;
          s.onerror = reject;
          document.head.appendChild(s);
        }),
        loadStyle: (url: string) => new Promise((resolve, reject) => {
          const l = document.createElement('link');
          l.rel = 'stylesheet';
          l.href = url;
          l.onload = resolve;
          l.onerror = reject;
          document.head.appendChild(l);
        }),
        log: (module: string, ...msgs: any[]) => {
          console.log(`%c BetterNemo %c %c ${module} %c ${msgs.join(' ')}`,
            'border-radius:5px;padding:2px;font-weight:bold;background:#20A5C4;color:white;', '',
            'border-radius:5px;padding:2px;font-weight:bold;background:#20A5C4;color:white;', '');
        },
        error: (module: string, ...msgs: any[]) => {
          console.error(`%c BetterNemo %c %c ${module} %c ${msgs.join(' ')}`,
            'border-radius:5px;padding:2px;font-weight:bold;background:#ff0000;color:white;', '',
            'border-radius:5px;padding:2px;font-weight:bold;background:#ff0000;color:white;', '');
        },
      },

      // Block templates (same as old API)
      Block: {
        methodBlock: { previousStatement: true, nextStatement: true, inputsInline: true },
        eventBlock: { nextStatement: true, inputsInline: true },
      },

      // Toolbox helpers (same as old API)
      Toolbox: {
        title: (text: string) => `<label text="${text}" type="normal" gap="24" web-class="flyout-toolbox-title" vertical_padding="0"></label>`,
        block: (type: string, ...values: string[]) => `<block type="${type}">${values.join('')}</block>`,
        sep: (gap = 50) => `<sep gap="${gap}"></sep>`,
        line: (text: string, height = 25) => `<label type="flyout_line" height="${height}" text="${text}"/>`,
        flyout_bottom: (width = 130, height = 16) => `<label type="flyout_bottom" align="center" width="${width}" height="${height}"></label>`,
      },
    },
  };
}

/**
 * Load an extension using the compatibility layer
 * This wraps the old extension loading pattern
 */
export async function loadExtensionCompat(
  fileName: string,
  scriptUrl: string
): Promise<void> {
  const host = getExtensionHost();
  const manifest: ExtensionManifest = {
    id: fileName,
    name: fileName,
    version: '0.0.0',
    description: '',
    author: '',
    main: scriptUrl,
    capabilities: { blocks: true, toolbox: true, interpreter: true },
  };

  // Install the extension
  await host.install(manifest);

  // Create compat API
  const api = createCompatAPI(fileName);

  // Set up the global Extension object for the script
  (window as any).Extension = {
    metaData: {},
    API: api.API,
  };

  // Load the extension script
  try {
    await new Promise((resolve, reject) => {
      const s = document.createElement('script');
      s.src = scriptUrl;
      s.onload = resolve;
      s.onerror = reject;
      document.head.appendChild(s);
    });

    // Activate the extension
    await host.activate(fileName);

    console.log(`[Compat] Extension ${fileName} loaded successfully`);
  } catch (e) {
    console.error(`[Compat] Failed to load extension ${fileName}:`, e);
    await host.deactivate(fileName);
  }
}
