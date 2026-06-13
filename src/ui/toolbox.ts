import { isToolboxLoaded } from '../utils/wait-hook';

export async function regToolbox(
    name: string,
    icon: string,
    color: string,
    blocks: string[],
    selectedColor = 'white'
): Promise<void> {
    await isToolboxLoaded();

    const toolboxObject = {
        color,
        name: `toolbox-${name}`,
        icon: { font_id: icon },
        blocks: blocks.flat(1).map((block) => str2xml(block)),
    };

    setTimeout(() => {
        const toolbox = Blockly.mainWorkspace.get_toolbox();
        toolbox.add(toolbox.new_node(toolboxObject));

        const styleElement = document.getElementById('toolbox-style');
        if (!styleElement) {
            const newStyleElement = document.createElement('style');
            newStyleElement.id = 'toolbox-style';
            newStyleElement.textContent = `#toolbox-${name}.blocklyTreeSelected>div>svg { fill: ${selectedColor};}#toolbox-${name}{box-shadow: 4px 0px 0px ${color}}`;
            document.head.appendChild(newStyleElement);
        } else {
            styleElement.textContent += `#toolbox-${name}.blocklyTreeSelected>div>svg { fill: ${selectedColor};}#toolbox-${name}{box-shadow: 4px 0px 0px ${color}}`;
        }
    }, 1000);
}

function str2xml(str: string): Element {
    const parser = new DOMParser();
    const doc = parser.parseFromString(str, 'text/xml');
    return doc.firstChild as Element;
}

export const Toolbox = {
    title: (text: string): string =>
        `<label text="${text}" type="normal" gap="24" web-class="flyout-toolbox-title" vertical_padding="0"></label>`,

    error: (text: string): string =>
        `<label text="${text}" type="normal" gap="24" web-class="flyout-toolbox-error" vertical_padding="0"></label>`,

    line: (text: string, height = 25): string =>
        `<label type="flyout_line" height="${height}" text="${text}"/>`,

    flyout_bottom: (width = 130, height = 16): string =>
        `<label type="flyout_bottom" align="center" width="${width}" height="${height}"></label>`,

    sep: (gap = 50): string => `<sep gap="${gap}"></sep>`,

    numValue: (name: string, value: number): string =>
        `<value name="${name}"><shadow type="math_number"><field name="NUM">${value}</field></shadow></value>`,

    textValue: (name: string, value: string): string =>
        `<value name="${name}"><shadow type="text"><field name="TEXT">${value}</field></shadow></value>`,

    optionValue: (name: string, value: string): string => `<field name="${name}">${value}</field>`,

    block: (type: string, ...values: string[]): string | string[] => {
        const blockJSON = (window as any).blockObjects?.find((block: any) => block.type === type);
        if (blockJSON) {
            if (!blockJSON.args0) {
                return [Toolbox.error(type + '缺少args0属性'), `<block type="${type}">${values.join('')}</block>`];
            }
            for (let i = 1; i <= (blockJSON.args0 as any[]).length; i++) {
                if (!blockJSON.message0.includes(`%${i}`)) {
                    const msg = `${type}的message0缺少%${i}`;
                    console.error(msg);
                    return Toolbox.error(msg);
                }
            }
            (blockJSON.args0 as any[]).forEach((arg: any) => {
                if (arg.value !== undefined) {
                    switch (arg.type) {
                        case 'input_value':
                            if (!Array.isArray(arg.check)) arg.check = [arg.check];
                            if (arg.check[0] === 'Number' && arg.check.length === 1) {
                                values.push(Toolbox.numValue(arg.name, arg.value));
                            } else if (arg.check.includes('String')) {
                                values.push(Toolbox.textValue(arg.name, arg.value));
                            }
                            break;
                        case 'field_dropdown':
                            values.push(Toolbox.optionValue(arg.name, arg.value));
                            break;
                    }
                }
            });
            return `<block type="${type}">${values.join('')}</block>`;
        } else if ((Blockly.Blocks as any)[type]) {
            return `<block type="${type}">${values.join('')}</block>`;
        } else {
            return Toolbox.error('错误：未能找到' + type + '的定义');
        }
    },

    eventBlock: (type: string, ...params: Array<[string, string]>): string[] => [
        Toolbox.sep(15),
        `<block type="${type}">${params.map(([name, paramType]) => `<value name="${name}"><block type="__${paramType}"></block></value>`).join('')}</block>`,
    ],

    button: (key: string, text: string, callback: () => void, className = ''): string => {
        Blockly.mainWorkspace.register_button_callback(key, callback);
        return `<button text="${text}" callbackkey="${key}" type="normal"${className ? ` web-class="${className}"` : ''}></button>`;
    },
};