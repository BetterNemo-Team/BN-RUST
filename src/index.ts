export * from './core';
export * from './utils';
export * from './ui';
export * from './types';

import { init, hook, log, error, loadScript, loadStyle } from './core/loader';
import { regBlocks, checkRootBlock } from './core/blocks';
import { regDomainFunction, rewriteDomainFunction, regSimpleEvent, emitSimpleEvent, getEventParams } from './core/interpreter';
import { Toolbox } from './ui/toolbox';
import { storage } from './utils/storage';
import { waitHook, isBlocklyLoaded } from './utils/wait-hook';

export const BetterNemo = {
    log,
    error,
    hook,
    getHook: waitHook,
    Block: {
        methodBlock: {
            previousStatement: true,
            nextStatement: true,
            inputsInline: true,
        },
        eventBlock: {
            nextStatement: true,
            inputsInline: true,
        },
    },
    Toolbox,
    regColor: (colorID: string, fill: string, border: string, layer = ''): void => {
        if (layer) {
            (Blockly.theme as any).block_color[colorID] = { fill, border, layer };
        } else {
            (Blockly.theme as any).block_color[colorID] = { fill, border };
        }
    },
    defineBlocks: regBlocks,
    regBlocks,
    regSimpleEvent,
    regEvent: regSimpleEvent,
    regMethod: regDomainFunction,
    regDomainFunction,
    rewriteDomainFunction,
    addIcon: (svg: string): void => {
        const spriteNode = document.querySelector('#__SVG_SPRITE_NODE__');
        if (spriteNode) {
            spriteNode.insertAdjacentHTML('beforeend', svg);
        }
    },
    regIcon: (svg: string): void => BetterNemo.addIcon(svg),
    waitBlocklyLoaded: isBlocklyLoaded,
    waitHook,
    emitSimpleEvent,
    getEventParams,
    updateBrush: (actor: any): void => {
        actor.parent_scene.should_update_brush();
    },
    getCtx: async (): Promise<any> => {
        await isBlocklyLoaded();
        return Blockly.utils.canvas_context;
    },
    CAPI: {
        getToken: (): string => {
            if ((window as any).WEBVIEW_DATA) {
                if ((window as any).WEBVIEW_DATA.user_token) {
                    return (window as any).WEBVIEW_DATA.user_token;
                }
            }
            return '';
        },
        getWorkId: (): number => {
            if ((window as any).WEBVIEW_DATA) {
                if ((window as any).WEBVIEW_DATA.work_id) {
                    return parseInt((window as any).WEBVIEW_DATA.work_id);
                }
            }
            return -1;
        },
    },
    init,
    loadScript,
    loadStyle,
    storage,
};