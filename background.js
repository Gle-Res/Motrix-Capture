// ========== 配置读取 ==========
async function getConfig() {
  return await chrome.storage.local.get({
    rpc: 'http://127.0.0.1:16800/jsonrpc',
    secret: '',
    enabled: true
  });
}

// ========== 调用 aria2 RPC ==========
async function aria2Call(method, params) {
  const { rpc, secret } = await getConfig();
  const finalParams = secret ? [`token:${secret}`, ...params] : params;
  const body = {
    jsonrpc: '2.0',
    id: Date.now().toString(),
    method: method,
    params: finalParams
  };
  const resp = await fetch(rpc, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
  const data = await resp.json();
  if (data.error) throw new Error(data.error.message);
  return data.result;
}

// ========== 从 URL 提取文件名（去掉 query/hash） ==========
function extractFilename(url) {
  try {
    const path = url.split('#')[0].split('?')[0];
    const name = decodeURIComponent(path.split('/').pop());
    return name || '';
  } catch (e) {
    return '';
  }
}

// ========== 判断文件名是否合法（有后缀、无路径分隔符） ==========
function isValidFilename(name) {
  if (!name) return false;
  if (/[\\/]/.test(name)) return false;
  if (!/\.\w{1,8}$/.test(name)) return false;
  return true;
}

// ========== 添加下载 ==========
async function addDownload(url, referer, filename) {
  const options = {
    split: '16',
    'max-connection-per-server': '16',
    'min-split-size': '1M'
  };
  if (referer) options.referer = referer;

  // 只在文件名合法时才传 out，否则让 aria2 自己从
  // URL / Content-Disposition 推断（更准，且带后缀）
  if (isValidFilename(filename)) {
    options.out = filename;
  }

  return await aria2Call('aria2.addUri', [[url], options]);
}

// ========== 拦截浏览器下载 ==========
chrome.downloads.onCreated.addListener(async (item) => {
  const { enabled } = await getConfig();
  if (!enabled) return;
  if (!/^https?:/i.test(item.url)) return;

  // 扩展商店 / crx / 浏览器内部地址不拦截
  if (/chromewebstore\.google\.com|chrome\.google\.com\/webstore|\.crx(\?|$)/i.test(item.url)) {
    return;
  }
  if (/^(qqbrowser|chrome|edge|extension|about):/i.test(item.url)) return;

  // 取消浏览器自带下载
  try {
    await chrome.downloads.cancel(item.id);
    await chrome.downloads.erase({ id: item.id });
  } catch (e) {}

  // 取 referer
  let referer = '';
  try {
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tabs[0]) referer = tabs[0].url;
  } catch (e) {}

  // 决定文件名：优先浏览器给的，没后缀就用 URL 的，都没有就让 aria2 自己猜
  let filename = '';
  try {
    const fromItem = decodeURIComponent(
      (item.filename || '').split(/[\\/]/).pop() || ''
    );
    if (isValidFilename(fromItem)) filename = fromItem;
  } catch (e) {}

  if (!filename) {
    const fromUrl = extractFilename(item.url);
    if (isValidFilename(fromUrl)) filename = fromUrl;
  }

  try {
    await addDownload(item.url, referer, filename);
    notify('已添加到下载列表', filename || extractFilename(item.url) || '新任务');
  } catch (e) {
    notify('添加到 Motrix 失败', e.message);
  }
});

// ========== 右键菜单 ==========
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: 'aria2-download-link',
    title: '通过 Motrix 下载此链接',
    contexts: ['link']
  });
  chrome.contextMenus.create({
    id: 'aria2-download-image',
    title: '通过 Motrix 下载此图片',
    contexts: ['image']
  });
});

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  const url = info.linkUrl || info.srcUrl;
  if (!url) return;
  try {
    // 不传文件名，让 aria2 从响应头推断（右键场景拿不到可靠文件名）
    await addDownload(url, tab?.url, '');
    notify('已添加到下载列表', extractFilename(url) || '新任务');
  } catch (e) {
    notify('添加失败', e.message);
  }
});

// ========== 系统通知 ==========
function notify(title, message) {
  chrome.notifications.create({
    type: 'basic',
    iconUrl: 'icon.png',
    title: title,
    message: String(message).slice(0, 200)
  });
}