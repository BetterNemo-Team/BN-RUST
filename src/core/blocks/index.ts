import { BlockDefinition } from '../../types';
import { isBlocklyLoaded, waitHook } from '../../utils/wait-hook';

const blockObjects: BlockDefinition[] = [];
const rootBlockChecks: Array<{ blockType: string; rootBlockTypes: string[] }> = [];

export async function regBlocks(blocks: BlockDefinition[]): Promise<void> {
    await isBlocklyLoaded();
    blockObjects.push(...blocks);

    for (const block of blocks) {
        if (block.EventParam) {
            rootBlockChecks.push({
                blockType: block.type,
                rootBlockTypes: [block.EventParam.eventBlockId],
            });
            await defineEventParam(block.type, block.EventParam.text, block.EventParam.colorId);
            const simplifiedBlock: BlockDefinition = {
                type: block.type,
                message0: block.EventParam.text,
                args0: [],
                colour: `%{BKY_${block.EventParam.colorId}}`,
                output: 'String',
            };
            registerBlock(simplifiedBlock);
        } else {
            registerBlock(block);
        }
    }
}

function registerBlock(block: BlockDefinition): void {
    if (!block.args0) {
        block.args0 = [];
    }
    (Blockly.Blocks as any)[block.type] = {
        init(this: Blockly.Block) {
            this.jsonInit(block);
        },
    };
}

export async function defineEventParam(blockId: string, text: string, colorId: string): Promise<void> {
    const Di = await waitHook('Di');
    Blockly.define_block_with_object('__' + blockId, {
        init(this: Blockly.Block) {
            const thisBlock = this;
            const LabelSerializable = Blockly.di_container.get(Di.BINDING.FieldLabelSerializable);
            const label = LabelSerializable({ text });
            label.on_mouse_down = function (e: MouseEvent) {
                e.preventDefault();
            };
            this.append_dummy_input().append_field(label, 'TEXT');
            this.set_output(true);
            this.set_inputs_inline(true);
            this.set_colour(
                (Blockly.theme as any).block_color[colorId].fill,
                (Blockly.theme as any).block_color[colorId].border
            );
        },
    });
}

export function checkRootBlock({ blockType, rootBlockTypes }: { blockType: string; rootBlockTypes: string[] }): void {
    Blockly.mainWorkspace.get_all_blocks()
        .filter((block) => block.type === blockType)
        .forEach((block) => {
            if (block.get_colour() !== (Blockly.theme as any).disabled_color.fill) {
                (block as any)._color = block.get_colour();
            }
            if (block.get_root_block()) {
                if (rootBlockTypes.includes(block.get_root_block().type)) {
                    if ((block as any)._color) {
                        block.set_colour((block as any)._color);
                        return;
                    }
                }
            }
            block.set_colour((Blockly.theme as any).disabled_color.fill);
        });
}

export function getBlockObjects(): BlockDefinition[] {
    return [...blockObjects];
}

export function getRootBlockChecks(): Array<{ blockType: string; rootBlockTypes: string[] }> {
    return [...rootBlockChecks];
}