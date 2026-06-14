export async function waitHook(name: string): Promise<any> {
    const hookName = `Hook${name}` as string;
    while (!(window as any)[hookName]) {
        await new Promise((resolve) => requestAnimationFrame(resolve));
    }
    return (window as any)[hookName].exports;
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

export async function isToolboxLoaded(): Promise<any> {
    while (!Blockly.mainWorkspace.get_toolbox()) {
        await new Promise((resolve) => requestAnimationFrame(resolve));
    }
    return Blockly.mainWorkspace.get_toolbox();
}

export async function isElementLoaded(element: string): Promise<HTMLElement> {
    while (!document.querySelector(element)) {
        await new Promise((resolve) => requestAnimationFrame(resolve));
    }
    return document.querySelector(element) as HTMLElement;
}