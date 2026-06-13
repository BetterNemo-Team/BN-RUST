export interface BlockDefinition {
    type: string;
    message0: string;
    args0?: Array<{
        type: string;
        name: string;
        check?: string | string[];
        value?: string | number;
        options?: Array<[string, string]>;
    }>;
    colour: string;
    output?: string;
    previousStatement?: boolean;
    nextStatement?: boolean;
    inputsInline?: boolean;
    EventParam?: {
        eventBlockId: string;
        colorId: string;
        text: string;
    };
}

export interface Extension {
    name: string;
    version: string;
    description: string;
    author: string;
    docs?: string;
    fileName: string;
}

export interface Theme {
    name: string;
    version: string;
    description: string;
    author: string;
}

export interface ToolboxOptions {
    name: string;
    icon: string;
    color: string;
    blocks: string[];
    selectedColor?: string;
}

export interface RuntimeHook {
    exports: any;
}

export interface HookMap {
    Runtime: RuntimeHook;
    Redux: RuntimeHook;
    Brush: RuntimeHook;
    Utils: RuntimeHook;
    Di: RuntimeHook;
    Scene: RuntimeHook;
    MsgZhCN: RuntimeHook;
    Bridge: RuntimeHook;
    BridgeMsg: RuntimeHook;
    OptiCompiler: RuntimeHook;
    ActorBody: RuntimeHook;
    Dsbridge: RuntimeHook;
    Theme: RuntimeHook;
    I18n: RuntimeHook;
}