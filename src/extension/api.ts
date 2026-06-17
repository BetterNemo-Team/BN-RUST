// Extension API Proxy - Sandboxed API for extensions
import { EventBus } from './events';
import type { ExtensionManifest } from './manifest';

export interface ExtensionAPI {
  // Blink integration
  blink: {
    registerBlock(def: any): void;
    registerToolbox(config: any): void;
    registerInterpreter(name: string, handler: Function): void;
    rewriteInterpreter(name: string, handler: Function): void;
  };

  // Event system
  events: {
    emit(event: string, data?: any): void;
    on(event: string, handler: Function): () => void;
    off(event: string, handler: Function): void;
  };

  // Storage (sandboxed)
  storage: {
    get(key: string): any;
    set(key: string, value: any): void;
  };

  // UI
  ui: {
    showNotification(message: string, type?: string): void;
  };

  // Utilities
  utils: {
    loadScript(url: string): Promise<void>;
    loadStyle(url: string): Promise<void>;
    log(module: string, ...msgs: any[]): void;
    error(module: string, ...msgs: any[]): void;
  };

  // Block templates
  Block: {
    methodBlock: { previousStatement: boolean; nextStatement: boolean; inputsInline: boolean };
    eventBlock: { nextStatement: boolean; inputsInline: boolean };
  };

  // Toolbox helpers
  Toolbox: {
    title(text: string): string;
    block(type: string, ...values: string[]): string;
    sep(gap?: number): string;
    line(text: string, height?: number): string;
    flyout_bottom(width?: number, height?: number): string;
  };
}

export function createExtensionAPI(
  manifest: ExtensionManifest,
  eventBus: EventBus,
  storagePrefix: string
): ExtensionAPI {
  const extStorage = {
    get: (key: string) => {
      try {
        const raw = localStorage.getItem(`${storagePrefix}:${manifest.id}`);
        if (raw) {
          const data = JSON.parse(raw);
          return data[key];
        }
      } catch (e) {}
      return undefined;
    },
    set: (key: string, value: any) => {
      try {
        const raw = localStorage.getItem(`${storagePrefix}:${manifest.id}`);
        const data = raw ? JSON.parse(raw) : {};
        data[key] = value;
        localStorage.setItem(`${storagePrefix}:${manifest.id}`, JSON.stringify(data));
      } catch (e) {
        console.error(`[Extension:${manifest.id}] Storage error:`, e);
      }
    },
  };

  return {
    blink: {
      registerBlock: (def: any) => {
        if (!def || !def.type) {
          console.error(`[Extension:${manifest.id}] Invalid block definition`);
          return;
        }
        const Blink = (window as any).Blink;
        if (Blink && Blink.define_block_with_object) {
          try {
            Blink.define_block_with_object(def.type, def);
            eventBus.emit(EventBus.EVENTS.BLOCK_REGISTERED, { extensionId: manifest.id, blockType: def.type });
            console.log(`[Extension:${manifest.id}] Block registered: ${def.type}`);
          } catch (e) {
            console.error(`[Extension:${manifest.id}] Failed to register block ${def.type}:`, e);
          }
        } else {
          // Fallback: register via Blockly.Blocks
          const Blockly = (window as any).Blockly;
          if (Blockly && Blockly.Blocks) {
            Blockly.Blocks[def.type] = {
              init: function() { this.jsonInit(def); }
            };
            eventBus.emit(EventBus.EVENTS.BLOCK_REGISTERED, { extensionId: manifest.id, blockType: def.type });
          }
        }
      },
      registerToolbox: (config: any) => {
        try {
          const Blockly = (window as any).Blockly;
          if (Blockly && Blockly.mainWorkspace) {
            const toolbox = Blockly.mainWorkspace.get_toolbox();
            if (toolbox) {
              const node = toolbox.new_node(config);
              toolbox.add(node);
              eventBus.emit(EventBus.EVENTS.TOOLBOX_UPDATED, { extensionId: manifest.id, config });
              console.log(`[Extension:${manifest.id}] Toolbox registered`);
            }
          }
        } catch (e) {
          console.error(`[Extension:${manifest.id}] Failed to register toolbox:`, e);
        }
      },
      registerInterpreter: (name: string, handler: Function) => {
        try {
          const mgr = (window as any).get_run_mgr?.();
          if (mgr && mgr.registry) {
            mgr.registry.domain_function[name] = handler;
            mgr.registry.domain_function_list.push(handler);
            mgr.registry.domain_function_index[name] = mgr.registry.domain_function_types.push(name) - 1;
            eventBus.emit(EventBus.EVENTS.INTERPRETER_INJECTED, { extensionId: manifest.id, name, handler });
            console.log(`[Extension:${manifest.id}] Interpreter registered: ${name}`);
          }
        } catch (e) {
          console.error(`[Extension:${manifest.id}] Failed to register interpreter ${name}:`, e);
        }
      },
      rewriteInterpreter: (name: string, handler: Function) => {
        try {
          const mgr = (window as any).get_run_mgr?.();
          if (mgr && mgr.registry && mgr.registry.domain_function[name]) {
            mgr.registry.domain_function[name] = handler;
            const idx = mgr.registry.domain_function_index[name];
            if (idx !== undefined) {
              mgr.registry.domain_function_list[idx] = handler;
            }
            eventBus.emit(EventBus.EVENTS.INTERPRETER_INJECTED, { extensionId: manifest.id, name, handler, rewrite: true });
            console.log(`[Extension:${manifest.id}] Interpreter rewritten: ${name}`);
          }
        } catch (e) {
          console.error(`[Extension:${manifest.id}] Failed to rewrite interpreter ${name}:`, e);
        }
      },
    },
    events: {
      emit: (event: string, data?: any) => eventBus.emit(event, data),
      on: (event: string, handler: Function) => eventBus.on(event, handler),
      off: (event: string, handler: Function) => eventBus.off(event, handler),
    },
    storage: extStorage,
    ui: {
      showNotification: (message: string, type?: string) => {
        const snackbar = document.querySelector('mdui-snackbar');
        if (snackbar) {
          (snackbar as any).textContent = message;
          (snackbar as any).open = true;
        }
      },
    },
    utils: {
      loadScript: (url: string) => new Promise<void>((resolve, reject) => {
        const s = document.createElement('script');
        s.src = url;
        s.onload = () => resolve();
        s.onerror = (e) => reject(e);
        document.head.appendChild(s);
      }),
      loadStyle: (url: string) => new Promise<void>((resolve, reject) => {
        const l = document.createElement('link');
        l.rel = 'stylesheet';
        l.href = url;
        l.onload = () => resolve();
        l.onerror = (e) => reject(e);
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
    Block: {
      methodBlock: { previousStatement: true, nextStatement: true, inputsInline: true },
      eventBlock: { nextStatement: true, inputsInline: true },
    },
    Toolbox: {
      title: (text: string) => `<label text="${text}" type="normal" gap="24" web-class="flyout-toolbox-title" vertical_padding="0"></label>`,
      block: (type: string, ...values: string[]) => `<block type="${type}">${values.join('')}</block>`,
      sep: (gap = 50) => `<sep gap="${gap}"></sep>`,
      line: (text: string, height = 25) => `<label type="flyout_line" height="${height}" text="${text}"/>`,
      flyout_bottom: (width = 130, height = 16) => `<label type="flyout_bottom" align="center" width="${width}" height="${height}"></label>`,
    },
  };
}
