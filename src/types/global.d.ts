declare namespace Blockly {
    const Blocks: Record<string, any>;
    const theme: {
        block_color: Record<string, { fill: string; border: string; layer?: string }>;
        disabled_color: { fill: string; border: string };
    };
    const mainWorkspace: {
        get_toolbox(): any;
        get_all_blocks(): any[];
        new_node(obj: any): any;
        register_button_callback(key: string, callback: () => void): void;
    };
    const di_container: {
        get(key: string): any;
    };
    function define_block_with_object(type: string, definition: any): void;
    const utils: {
        canvas_context: any;
    };
    class Block {
        type: string;
        get_root_block(): Block;
        get_colour(): string;
        set_colour(colour: string): void;
        append_dummy_input(): any;
        set_output(output: boolean): void;
        set_inputs_inline(inline: boolean): void;
        set_colour(fill: string, border?: string): void;
        jsonInit(json: any): void;
    }
    class WorkspaceSvg {
        get_toolbox(): Toolbox;
        get_all_blocks(): Block[];
    }
    class Toolbox {
        add(node: any): void;
        new_node(obj: any): any;
    }
}

declare const HookRuntime: any;
declare const HookRedux: any;
declare const HookBrush: any;
declare const HookUtils: any;
declare const HookDi: any;
declare const HookScene: any;
declare const HookMsgZhCN: any;
declare const HookBridge: any;
declare const HookBridgeMsg: any;
declare const HookOptiCompiler: any;
declare const HookActorBody: any;
declare const HookDsbridge: any;
declare const HookTheme: any;
declare const HookI18n: any;

declare const WEBVIEW_DATA: {
    user_token?: string;
    work_id?: string;
} | undefined;

declare const BetterNemoVersion: string;
