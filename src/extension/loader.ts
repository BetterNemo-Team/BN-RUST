// Extension Format Loader — .bnex (zip) + legacy 目录格式
import JSZip from 'jszip';
import type { ExtensionManifest, LegacyExtensionMeta, ExtensionFormat } from './manifest';
import { EventBus } from './events';
import { createExtensionAPI } from './api';

const EXT_BASE = 'extensions';

// ─── .bnex (zip) 解压 ───

interface BnexContents {
  manifest: ExtensionManifest;
  files: Map<string, string>;
}

export async function extractBnex(buffer: ArrayBuffer): Promise<BnexContents | null> {
  try {
    const zip = await JSZip.loadAsync(buffer);

    const manifestFile = zip.file('manifest.json');
    if (!manifestFile) {
      console.error('[FormatLoader] .bnex missing manifest.json');
      return null;
    }

    const manifest: ExtensionManifest = JSON.parse(await manifestFile.async('text'));
    if (!manifest.id) manifest.id = 'unknown';
    if (!manifest.name) manifest.name = manifest.id;
    if (!manifest.version) manifest.version = '1.0.0';
    if (!manifest.description) manifest.description = '';
    if (!manifest.author) manifest.author = '';
    if (!manifest.main) manifest.main = 'index.js';

    const files = new Map<string, string>();
    const promises: Promise<void>[] = [];

    zip.forEach((relativePath, entry) => {
      if (entry.dir || relativePath === 'manifest.json') return;
      promises.push(
        entry.async('text').then(content => {
          files.set(relativePath, content);
        })
      );
    });

    await Promise.all(promises);
    return { manifest, files };
  } catch (e) {
    console.error('[FormatLoader] Failed to extract .bnex:', e);
    return null;
  }
}

// ─── .bnex 加载 ───

export async function loadExtensionBnex(
  fileName: string,
  eventBus: EventBus
): Promise<{ manifest: ExtensionManifest; api: any } | null> {
  try {
    const resp = await fetch(`${EXT_BASE}/${fileName}`);
    if (!resp.ok) return null;

    const buffer = await resp.arrayBuffer();
    const contents = await extractBnex(buffer);
    if (!contents) return null;

    const { manifest, files } = contents;
    if (!manifest.id || manifest.id === 'unknown') {
      manifest.id = fileName.replace(/\.bnex$/, '');
    }

    const api = createExtensionAPI(manifest, eventBus, 'bn_ext');

    // Build file URL map: relativePath → blob URL
    const fileUrls = new Map<string, string>();
    for (const [path, content] of files) {
      const blob = new Blob([content], { type: getMimeType(path) });
      fileUrls.set(path, URL.createObjectURL(blob));
    }

    // Expose fileUrls on api for extensions to resolve assets
    (api as any)._fileUrls = fileUrls;
    (api as any).resolveFile = (path: string) => fileUrls.get(path) || '';

    // Set up global Extension object for compat
    const compatExtension: any = { metaData: manifest, API: api };
    Object.defineProperty(compatExtension, 'metaData', {
      get() { return manifest; },
      set(v: any) { Object.assign(manifest, v); },
      configurable: true,
    });
    (window as any).Extension = compatExtension;

    // Pre-load CSS files
    for (const [path] of files) {
      if (path.endsWith('.css')) {
        const url = fileUrls.get(path)!;
        await new Promise<void>((resolve, reject) => {
          const l = document.createElement('link');
          l.rel = 'stylesheet';
          l.href = url;
          l.onload = () => resolve();
          l.onerror = () => resolve();
          document.head.appendChild(l);
        });
      }
    }

    // Load entry point
    const entryPath = manifest.main || 'index.js';
    const entryUrl = fileUrls.get(entryPath);
    if (!entryUrl) {
      console.error(`[FormatLoader] Entry point not found: ${entryPath}`);
      return null;
    }

    await new Promise<void>((resolve, reject) => {
      const s = document.createElement('script');
      s.src = entryUrl;
      s.onload = () => resolve();
      s.onerror = (e) => reject(e);
      document.head.appendChild(s);
    });

    return { manifest, api };
  } catch (e) {
    console.error(`[FormatLoader] Failed to load .bnex ${fileName}:`, e);
    return null;
  }
}

function getMimeType(path: string): string {
  const ext = path.split('.').pop()?.toLowerCase() || '';
  const mimeMap: Record<string, string> = {
    js: 'application/javascript',
    json: 'application/json',
    css: 'text/css',
    html: 'text/html',
    png: 'image/png',
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    gif: 'image/gif',
    svg: 'image/svg+xml',
    webp: 'image/webp',
    woff: 'font/woff',
    woff2: 'font/woff2',
    ttf: 'font/ttf',
  };
  return mimeMap[ext] || 'application/octet-stream';
}

// ─── 旧格式加载 ───

export async function loadExtensionLegacy(
  dirName: string,
  eventBus: EventBus
): Promise<{ manifest: ExtensionManifest; api: any } | null> {
  try {
    const scriptUrl = `${EXT_BASE}/${dirName}/index.js`;

    const legacyMeta: LegacyExtensionMeta & { fileName: string } = {
      fileName: dirName,
      name: dirName,
      version: '',
      description: '',
      author: '',
      docs: '',
      url: '',
    };

    const manifest: ExtensionManifest = {
      id: dirName,
      name: dirName,
      version: '0.0.0',
      description: '',
      author: '',
      main: 'index.js',
      capabilities: { blocks: true, toolbox: true, interpreter: true, ui: true, events: true },
    };

    const api = createExtensionAPI(manifest, eventBus, 'bn_ext');

    const compatExtension: any = { metaData: legacyMeta, API: api };
    Object.defineProperty(compatExtension, 'metaData', {
      get() { return legacyMeta; },
      set(newValue: any) { Object.assign(legacyMeta, newValue); },
      configurable: true,
    });

    (window as any).Extension = compatExtension;

    await new Promise<void>((resolve, reject) => {
      const s = document.createElement('script');
      s.src = scriptUrl;
      s.onload = () => resolve();
      s.onerror = (e) => reject(e);
      document.head.appendChild(s);
    });

    if (legacyMeta.name && legacyMeta.name !== dirName) manifest.name = legacyMeta.name;
    if (legacyMeta.version) manifest.version = legacyMeta.version;
    if (legacyMeta.description) manifest.description = legacyMeta.description;
    if (legacyMeta.author) manifest.author = legacyMeta.author;

    return { manifest, api };
  } catch (e) {
    console.error(`[FormatLoader] Failed to load legacy extension ${dirName}:`, e);
    return null;
  }
}

// ─── 格式检测 ───

export function isBnex(fileName: string): boolean {
  return fileName.endsWith('.bnex');
}

// ─── 统一加载入口 ───

export async function loadExtension(
  target: string,
  eventBus: EventBus
): Promise<{ manifest: ExtensionManifest; api: any; format: ExtensionFormat } | null> {
  if (isBnex(target)) {
    const result = await loadExtensionBnex(target, eventBus);
    return result ? { ...result, format: 'bnex' } : null;
  }

  const result = await loadExtensionLegacy(target, eventBus);
  return result ? { ...result, format: 'legacy' } : null;
}

// ─── 打包工具（开发用） ───

export async function packBnex(manifest: ExtensionManifest, files: Record<string, string>): Promise<Blob> {
  const zip = new JSZip();
  zip.file('manifest.json', JSON.stringify(manifest, null, 2));
  for (const [path, content] of Object.entries(files)) {
    zip.file(path, content);
  }
  return zip.generateAsync({ type: 'blob' });
}
