// BNOnline 辅助扩展 — 从旧格式迁移至 .bnex
(async (Extension) => {
  const { blink, events, storage, ui, utils, Block, Toolbox } = Extension.API;
  const BN = Extension.API;

  await new Promise(r => {
    const check = () => {
      if (typeof Blockly !== 'undefined' && Blockly.mainWorkspace) r();
      else setTimeout(check, 100);
    };
    check();
  });

  window.bnOnline = {
    postMessage: (content) => {
      window.parent.postMessage({
        "__bn_bridge__": true,
        "direction": "webview->host",
        "api": "_dsbridge.call",
        "args": [
          "postMessageSyn",
          "{\"data\":\"{\\\"type\\\":\\\"SHOW_TOAST\\\",\\\"payload\\\":{\\\"text\\\":\\\"" + content + "\\\"}}\"}"
        ],
        "method": "postMessageSyn",
        "arg": {
          "data": "{\"type\":\"SHOW_TOAST\",\"payload\":{\"text\":\"" + content + "\"}}"
        },
        "callbackId": null
      }, '*');
    }
  };

  window.loadURLExtension = async (url, isLoad = true) => {
    function getRandomStr(n = 6) {
      const chars = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
      let str = '';
      for (let i = 0; i < n; i++) {
        str += chars[Math.floor(Math.random() * chars.length)];
      }
      return str;
    }
    function createExtensionAPI(extensionMetaData) {
      const api = Object.create(BetterNemo);
      api.addToolbox = function (...args) {
        extensionToolboxs.push([extensionMetaData.fileName, args]);
        return args;
      };
      api.loadScript = async function (ext, fallbackUrl) {
        try {
          await loadScript('extensions/' + extensionMetaData.fileName + '/' + ext);
        } catch {
          if (!fallbackUrl) return;
          await loadScript(fallbackUrl);
        }
      };
      return api;
    }
    function loadScript(src) {
      if (isPhoneTestEnv())
        src = `http://192.168.1.11:8080/${src}`;
      return new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = src;
        script.onload = resolve;
        script.onerror = reject;
        document.body.appendChild(script);
      });
    }
    const config = storage.get('extension_config');
    setLoaderInfo(`加载扩展 ${url}`, 2);
    window.bnOnline.postMessage(`正在加载远程扩展 ${url} ...`);
    const key = `远程扩展-${getRandomStr()}`;
    if (config[key] == undefined) {
      config[key] = true;
      storage.set('extension_config', config);
    }
    const extMetaData = {
      fileName: key,
      name: "未命名",
      version: "",
      description: "",
      author: "未知",
      docs: "",
      url: ''
    };
    Object.defineProperty(Extension, 'metaData', {
      get() { return extMetaData; },
      set(newValue) {
        Object.assign(extMetaData, newValue);
      },
      configurable: true
    });
    const extensionAPI = createExtensionAPI(extMetaData);
    Extension.API = extensionAPI;
    if (isLoad) {
      await loadScript(url);
      extensionMetaData[key] = { ...extMetaData };
      utils.log('ConfigPanel', '已从URL使用扩展' + key);
      EXTENSION_FILES.push(key);
      setLoaderInfo('扩展加载完成！', 2);
      await isElementLoaded('#toolbox-bn');
      setTimeout(() => {
        reloadExtension();
        utils.log('扩展管理', '已重新加载扩展积木盒');
        window.bnOnline.postMessage(`远程扩展 ${url} 加载成功!`);
      }, 500);
    }
  };

  BN.regColor("RUNTIME_CONFIG_HUE", "#2D0078", "#2D0078");

  let toolboxXML = [
    Toolbox.title("BNOnline"),
    Toolbox.button("device_info", " 设备信息 ", () => {
      const userAgent = navigator.userAgent;
      let webviewVersion = '未知';
      const webviewMatch = userAgent.match(/Version\/(\d+\.\d+)/);
      if (webviewMatch) webviewVersion = webviewMatch[1];
      else if (userAgent.includes('Chrome/')) {
        const chromeMatch = userAgent.match(/Chrome\/(\d+)/);
        if (chromeMatch) webviewVersion = chromeMatch[1];
      }

      const loaderVersion = window.BetterNemoVersion || '未知';
      const screenInfo = `${screen.width}x${screen.height}`;
      let os = '未知';
      if (userAgent.includes('Android')) os = 'Android';
      else if (userAgent.includes('iPhone') || userAgent.includes('iPad')) os = 'iOS';
      else if (userAgent.includes('Windows')) os = 'Windows';
      else if (userAgent.includes('Mac')) os = 'macOS';
      else if (userAgent.includes('Linux')) os = 'Linux';

      const infoText = `加载器版本：${loaderVersion}(BetterNemo)\nWebView 版本：${webviewVersion}\n操作系统：${os}\n屏幕尺寸：${screenInfo}\nUser Agent：${userAgent}`;
      alert(infoText);
      utils.log('ConfigPanel', '已显示设备信息');
    }, "procedure-add-param"),
    Toolbox.button("About", " 关于 ", () => {
      alert("BetterNemo 辅助扩展");
    }, "procedure-add-param"),
    Toolbox.sep(20),
  ];

  toolboxXML.push(Toolbox.line("主题"));
  let config = storage.get('theme_config');
  for (const themeName of THEME_FILES) {
    toolboxXML.push(Toolbox.button(`UseTheme${themeName}`, ` 使用主题 ${themeName} `, async () => {
      Object.keys(config).forEach(key => {
        config[key] = (key == themeName);
      });
      storage.set('theme_config', config);
      reloadTheme();
      utils.log('ConfigPanel', '已设置主题' + themeName);
    }, "procedure-add-param"));
  }

  toolboxXML.push(Toolbox.line("扩展"));
  toolboxXML.push(Toolbox.button(`UseExtension`, ` 从URL使用扩展 `, async () => {
    let url = prompt("请输入URL:", "默认URL");
    window.loadURLExtension(url);
  }, "procedure-add-param"));

  toolboxXML.push(Toolbox.flyout_bottom());

  BN.regIcon(`<symbol id="icon-bnonline" viewBox="-33 -33 90 90">
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm1-13h-2v6l5.25 3.15L17 12.23l-4-2.37V7z"/>
    </symbol>`);
  BN.addToolbox("bnonline-config", "icon-bnonline", "#2D0078", toolboxXML);

})(Extension);
