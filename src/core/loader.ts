import { storage, initExperimentalConfig } from '../utils/storage';
import { waitHook, isBlocklyLoaded, isElementLoaded } from '../utils/wait-hook';

declare const BetterNemoVersion: string;

export function hook(id: string, name: string, getThis = false): void {
    const map = new Map<any, any>();
    Object.defineProperty(Object.prototype, id, {
        configurable: true,
        get() {
            return map.get(this);
        },
        set(value) {
            map.set(this, value);
            if (!getThis) {
                (window as any)[name] = value;
            } else {
                (window as any)[name] = this;
            }
        },
    });
}

export function initializeHooks(): void {
    hook('./src/webview/runtime/index.ts', 'HookRuntime');
    hook('./src/common/redux/index.ts', 'HookRedux');
    hook('./node_modules/@crc/stage/build/core/actors/brush.js', 'HookBrush');
    hook('./node_modules/@crc/stage/build/core/utils/index.js', 'HookUtils');
    hook('./node_modules/@crc/blink/dist/core/di/index.js', 'HookDi');
    hook('./node_modules/@crc/stage/build/core/scenes/scene.js', 'HookScene');
    hook('./src/i18n/zh_CN.ts', 'HookMsgZhCN');
    hook('./src/webview/bridge/index.ts', 'HookBridge');
    hook('./src/webview/bridge/messages.ts', 'HookBridgeMsg');
    hook('./node_modules/@crc/heart/build/opti/compiler.js', 'HookOptiCompiler');
    hook('./node_modules/@crc/stage/build/core/physics/actor_body.js', 'HookActorBody');
    hook('./node_modules/dsbridge/index.js', 'HookDsbridge');
    hook('./node_modules/@crc/blink/dist/core/singletons/theme.js', 'HookTheme');
    hook('./src/i18n/index.ts', 'HookI18n');
}

const PLAYER = new URLSearchParams(window.location.search).get('player');
const IS_BN_APP = new URLSearchParams(window.location.search).get('is_bn_app');

export function isPhoneTestEnv(): boolean {
    if (PLAYER) return false;
    return !navigator.userAgent.includes('__TEST_ENV__') && BetterNemoVersion === '999999.99';
}

export function isPCTestEnv(): boolean {
    return navigator.userAgent.includes('__TEST_ENV__') && BetterNemoVersion === '999999.99';
}

export function isCloudflareEnv(): boolean {
    return window.location.hostname === 'bn-p.pages.dev';
}

export async function loadScript(src: string): Promise<void> {
    if (isPhoneTestEnv()) {
        src = `http://192.168.1.11:8080/${src}`;
    }
    return new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = src;
        script.onload = () => resolve();
        script.onerror = () => reject(new Error(`Failed to load script: ${src}`));
        document.head.appendChild(script);
    });
}

export async function loadStyle(src: string): Promise<void> {
    if (isPhoneTestEnv()) {
        src = `http://192.168.1.11:8080/${src}`;
    }
    return new Promise((resolve, reject) => {
        const style = document.createElement('link');
        style.rel = 'stylesheet';
        style.type = 'text/css';
        style.classList.add('bn-theme');
        style.href = src;
        style.onload = () => resolve();
        style.onerror = () => reject(new Error(`Failed to load style: ${src}`));
        document.head.appendChild(style);
    });
}

export function log(moduleName: string, ...msgs: any[]): void {
    if (moduleName) {
        console.log(
            `%c BetterNemo %c %c ${moduleName} %c ${msgs.join(' ')}`,
            'border-radius:5px;padding:2px;font-weight:bold;background: #20A5C4;color:white;',
            '',
            'border-radius:5px;padding:2px;font-weight:bold;background: #20A5C4;color:white;',
            ''
        );
    } else {
        console.log(`%c BetterNemo %c ${msgs.join(' ')}`, 'border-radius:5px;padding:2px;font-weight:bold;background: #20A5C4;color:white;', '');
    }
}

export function error(moduleName: string, ...msgs: any[]): void {
    if (moduleName) {
        console.log(
            `%c BetterNemo %c %c ${moduleName} %c ${msgs.join(' ')}`,
            'border-radius:5px;padding:2px;font-weight:bold;background: #ff0000;color:white;',
            '',
            'border-radius:5px;padding:2px;font-weight:bold;background: #ff0000;color:white;',
            ''
        );
    } else {
        console.log(`%c BetterNemo %c ${msgs.join(' ')}`, 'border-radius:5px;padding:2px;font-weight:bold;background: #ff0000;color:white;', '');
    }
}

export async function init(): Promise<void> {
    console.log(
        '\n%c  Welcome to ❤ BetterNemo - ' + BetterNemoVersion + ' ❤ for Nemo o(*￣▽￣*)ブ  %c \n\n',
        'border-radius: 5px; padding: 2px; font-weight: bold;background-color: #20A5C4; font-size: 16px; color: white;',
        ''
    );

    initializeHooks();

    initExperimentalConfig(isPhoneTestEnv());

    await loadStyle('style.css');

    if (!PLAYER && isPCTestEnv()) {
        setInterval(() => {
            const theatre = document.querySelector('#theatre_container');
            if (theatre) {
                theatre.style.display = 'none';
            }
        }, 100);
    }

    await loadScript('extensions/_CONFIG.js');
    log('扩展管理', '扩展列表:', (window as any).EXTENSION_FILES?.join(', ') || '无');

    await loadScript('theme/_CONFIG.js');
    log('主题管理', '主题列表:', (window as any).THEME_FILES?.join(', ') || '无');

    await loadScript('workspace-scripts/storage.js');
    await loadScript('workspace-scripts/utils.js');

    if (isCloudflareEnv()) {
        loadScript('https://db0l8fnn8oqtof.database.nocode.cn/storage/v1/object/public/wenjian/anonymous/1776601566193_aowalndxrwh.js');
    } else {
        loadScript('assets/workspace.bundle.79d6432e01ccdecb492a.js');
    }

    await loadScript('workspace-scripts/blocks.js');
    await loadScript('workspace-scripts/prototype-inject.js');
    await loadScript('workspace-scripts/toolbox.js');
    await loadScript('workspace-scripts/domain-functions.js');
    await loadScript('workspace-scripts/cat-block.js');
    await loadScript('workspace-scripts/float-ball.js');

    log('初始化', '资源加载完成！');
    document.title = 'BN Player';
}