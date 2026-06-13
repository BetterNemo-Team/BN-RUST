export function getBrowserVersion(): number {
    const parser = (window as any).UAParser;
    if (!parser) return 0;
    return parseInt(parser().getResult().browser.version) || 0;
}

export function getName(filename: string): string {
    const match = filename.match(/\[([^\]]+)\]/);
    return match ? match[1] : '';
}

export async function sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

export function createBlock(id: string): Blockly.Block {
    const block = Blockly.mainWorkspace.new_block(id);
    block.init_svg();
    block.render();
    return block;
}