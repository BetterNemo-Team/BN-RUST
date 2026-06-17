// Extension Event Bus - Decoupled communication between extensions
export class EventBus {
  private listeners: Map<string, Set<Function>> = new Map();

  static EVENTS = {
    EXTENSION_INSTALLED: 'extension:installed',
    EXTENSION_ACTIVATED: 'extension:activated',
    EXTENSION_DEACTIVATED: 'extension:deactivated',
    EXTENSION_UNINSTALLED: 'extension:uninstalled',
    BLOCK_REGISTERED: 'block:registered',
    TOOLBOX_UPDATED: 'toolbox:updated',
    INTERPRETER_INJECTED: 'interpreter:injected',
    THEME_CHANGED: 'theme:changed',
    EXTENSION_ERROR: 'extension:error',
  };

  emit(event: string, data?: any): void {
    const handlers = this.listeners.get(event);
    if (handlers) {
      handlers.forEach(handler => {
        try {
          handler(data);
        } catch (e) {
          console.error(`[EventBus] Error in handler for ${event}:`, e);
        }
      });
    }
  }

  on(event: string, handler: Function): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(handler);
    return () => this.off(event, handler);
  }

  off(event: string, handler: Function): void {
    const handlers = this.listeners.get(event);
    if (handlers) {
      handlers.delete(handler);
    }
  }

  once(event: string, handler: Function): () => void {
    const wrapper = (data: any) => {
      handler(data);
      this.off(event, wrapper);
    };
    return this.on(event, wrapper);
  }

  removeAllListeners(event?: string): void {
    if (event) {
      this.listeners.delete(event);
    } else {
      this.listeners.clear();
    }
  }
}
