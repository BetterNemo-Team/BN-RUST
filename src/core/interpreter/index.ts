import { waitHook } from '../../utils/wait-hook';

export function get_run_mgr(): any {
    const hookRuntime = (window as any).HookRuntime;
    if (!hookRuntime) return undefined;
    return hookRuntime.exports.get_webview_runtime().heart.runtime_manager.run_mgr;
}

export async function regDomainFunction(name: string, func: (...args: any[]) => any, error_msg = ''): Promise<void> {
    const registry = get_run_mgr().registry;
    registry.domain_function[name] = func;
    registry.domain_function_list.push(func);
    registry.domain_function_index[name] = registry.domain_function_types.push(name) - 1;
    
    const msgZhCN = await waitHook('MsgZhCN');
    if (error_msg) {
        msgZhCN.ZH_CN[`domain_function_error/${name}`] = error_msg;
    }
}

export function rewriteDomainFunction(name: string, func: (...args: any[]) => any): void {
    const registry = get_run_mgr().registry;
    registry.domain_function[name] = func;
    const index = registry.domain_function_index[name];
    registry.domain_function_list[index] = func;
}

export function regAction(action_type: {
    id: string;
    statefulness?: boolean;
    entity_specific: boolean;
    responder_blocks: Array<{
        id: string;
        type: string;
        async: boolean;
        priority?: number;
        trigger_function?: (...args: any[]) => any;
        filter_arg_names?: string[];
    }>;
}): void {
    const registry = get_run_mgr().registry;
    const r: any = {
        namespace: '',
        id: action_type.id,
    };
    if (action_type.statefulness !== undefined) {
        r.statefulness = action_type.statefulness;
    }
    registry.register_action_type(r);
    
    action_type.responder_blocks.forEach((responder) => {
        registry.register({
            namespace: '',
            id: responder.id,
            respond: {
                to_action: {
                    namespace: '',
                    id: action_type.id,
                },
                type: responder.type,
                async: responder.async,
                priority: responder.priority,
                entity_specific: action_type.entity_specific,
                trigger_function: responder.trigger_function,
                filter_arg_names: responder.filter_arg_names,
            },
        });
    });
}

export function regSimpleEvent(eventBlockId: string): void {
    regAction({
        id: eventBlockId,
        entity_specific: false,
        responder_blocks: [{
            id: eventBlockId,
            type: 'action',
            async: false,
        }],
    });
    regDomainFunction(eventBlockId, () => {});
}

export async function emitSimpleEvent(name: string, params: Record<string, any> = {}): Promise<void> {
    const Runtime = await waitHook('Runtime');
    Runtime.get_webview_runtime().send_action({
        id: name,
        namespace: '',
        parameters: params,
    });
}

export function getEventParams(utils: any): Record<string, any> | undefined {
    const interpreters = utils.runtime_manager.interpreters;
    const firstInterpreter = interpreters[Object.keys(interpreters)[0]];
    if (firstInterpreter && firstInterpreter.action_parameters) {
        return firstInterpreter.action_parameters;
    }
    return undefined;
}