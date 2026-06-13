export async function waitHook<T extends keyof HookMap>(name: T): Promise<HookMap[T]['exports']> {
    while (!window[`Hook${name}` as keyof Window]) {
        await new Promise((resolve) => requestAnimationFrame(resolve));
    }
    return (window[`Hook${name}` as keyof Window] as RuntimeHook).exports;
}

export async function waitGetGlobal(name: string): Promise<any> {
    while (!window[name as keyof Window]) {
        await new Promise((resolve) => requestAnimationFrame(resolve));
    }
    return window[name as keyof Window];
}

export async function isBlocklyLoaded(): Promise<typeof Blockly> {
    while (!window['Blockly']) {
        await new Promise((resolve) => requestAnimationFrame(resolve));
    }
    return window['Blockly'];
}

export async function isBlocklyMainworkspaceLoaded(): Promise<Blockly.WorkspaceSvg> {
    await isBlocklyLoaded();
    while (!Blockly.mainWorkspace) {
        await new Promise((resolve) => requestAnimationFrame(resolve));
    }
    return Blockly.mainWorkspace;
}

export async function isToolboxLoaded(): Promise<Blockly.Toolbox> {
    while (!Blockly.mainWorkspace.get_toolbox()) {
        await new Promise((resolve) => requestAnimationFrame(resolve));
    }
    return Blockly.mainWorkspace.get_toolbox();
}

export async function isElementLoaded(element: string): Promise<HTMLElement> {
    while (!document.querySelector(element)) {
        await new Promise((resolve) => requestAnimationFrame(resolve));
    }
    return document.querySelector(element)!;
}