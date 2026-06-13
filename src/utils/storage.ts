class Storage {
    private namespace: string;
    private storage: Record<string, any>;

    constructor(namespace: string) {
        this.namespace = namespace;
        this.storage = this.getAll() || {};
    }

    private getAll(): Record<string, any> {
        const data = localStorage.getItem(this.namespace);
        try {
            return data ? JSON.parse(data) : {};
        } catch (error) {
            console.error('解析存储数据失败:', error);
            return {};
        }
    }

    private save(data: Record<string, any>): void {
        localStorage.setItem(this.namespace, JSON.stringify(data));
    }

    get(id: string): any | null {
        if (!this.storage[id]) return null;
        return this.storage[id];
    }

    set(id: string, value: any): void {
        this.storage[id] = value;
        this.save(this.storage);
    }

    remove(id: string): void {
        delete this.storage[id];
        this.save(this.storage);
    }

    clear(): void {
        this.storage = {};
        localStorage.removeItem(this.namespace);
    }

    getAllData(): Record<string, any> {
        return { ...this.storage };
    }
}

export const storage = new Storage('bn');
export const eStorage = new Storage('localExtensions');

export interface ExperimentalConfig {
    disable_repeat_forever_in_warp: boolean;
    webview_debug: boolean;
}

export let experimentalConfig: ExperimentalConfig = {
    disable_repeat_forever_in_warp: false,
    webview_debug: false,
};

export function initExperimentalConfig(isPhoneTestEnv: boolean): void {
    experimentalConfig.webview_debug = isPhoneTestEnv;
    if (storage.get('experimentalConfig')) {
        experimentalConfig = storage.get('experimentalConfig');
    } else {
        storage.set('experimentalConfig', experimentalConfig);
    }
}