// Extension System — Main Entry Point
export { ExtensionHost, getExtensionHost } from './host';
export { EventBus } from './events';
export { ExtensionStorageManager } from './storage';
export { LifecycleManager } from './lifecycle';
export { createExtensionAPI } from './api';
export { createCompatAPI, loadExtensionCompat } from './compat';
export { loadExtension, loadExtensionBnex, loadExtensionLegacy, extractBnex, isBnex, packBnex } from './loader';
export type { ExtensionManifest, ExtensionStatus, ExtensionConfig, ExtensionStorage, ExtensionFormat, ExtensionCapabilities, LegacyExtensionMeta } from './manifest';
