// Extension Manifest — .bnex (zip) 压缩包 + legacy 目录格式

// ─── .bnex manifest.json / extension.json 声明 ───
export interface ExtensionManifest {
  id: string;
  name: string;
  version: string;
  description: string;
  author: string;
  main?: string;
  icon?: string;
  capabilities?: ExtensionCapabilities;
  permissions?: string[];
  dependencies?: string[];
  minVersion?: string;
}

export interface ExtensionCapabilities {
  blocks?: boolean;
  toolbox?: boolean;
  interpreter?: boolean;
  theme?: boolean;
  ui?: boolean;
  events?: boolean;
}

// ─── 旧格式：Extension = { metaData, API } ───
export interface LegacyExtensionMeta {
  name: string;
  version: string;
  description: string;
  author: string;
  docs?: string;
  url?: string;
  fileName?: string;
}

// ─── 运行时状态 ───
export type ExtensionStatus = 'installed' | 'active' | 'inactive' | 'error';

export interface ExtensionConfig {
  enabled: boolean;
  version: string;
  settings: Record<string, any>;
  installedAt: number;
  lastUsed: number;
}

// ─── 存储结构 ───
export interface ExtensionStorage {
  version: number;
  extensions: Record<string, ExtensionConfig>;
  themes: Record<string, { enabled: boolean; settings: Record<string, any> }>;
}

// ─── 格式识别 ───
export type ExtensionFormat = 'bnex' | 'legacy';
