const $ = id => document.getElementById(id);

// 加载配置
chrome.storage.local.get({
  rpc: 'http://127.0.0.1:16800/jsonrpc',
  secret: '',
  enabled: true
}, (cfg) => {
  $('rpc').value = cfg.rpc;
  $('secret').value = cfg.secret;
  $('enabled').checked = cfg.enabled;
});

// 保存
$('save').onclick = () => {
  chrome.storage.local.set({
    rpc: $('rpc').value.trim(),
    secret: $('secret').value.trim(),
    enabled: $('enabled').checked
  }, () => {
    setStatus('status', '已保存 ✓', '#a6e3a1');
    setTimeout(() => $('status').textContent = '', 1800);
  });
};

// 测试连接
$('test').onclick = async () => {
  const rpc = $('rpc').value.trim();
  const secret = $('secret').value.trim();
  const params = secret ? [`token:${secret}`, []] : [[]];
  setStatus('status', '测试中...', '#f9e2af');
  try {
    const resp = await fetch(rpc, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0', id: '1',
        method: 'aria2.getVersion',
        params: params
      })
    });
    const data = await resp.json();
    if (data.error) {
      setStatus('status', '失败：' + data.error.message, '#f38ba8');
    } else {
      setStatus('status', '连接成功 ✓ aria2 ' + data.result.version, '#a6e3a1');
    }
  } catch (e) {
    setStatus('status', '连不上，检查 Motrix 是否运行', '#f38ba8');
  }
};

// 手动添加链接
$('addUrl').onclick = async () => {
  const text = $('manualUrl').value.trim();
  if (!text) {
    setStatus('addStatus', '请输入链接', '#f38ba8');
    return;
  }
  const urls = text.split('\n').map(s => s.trim()).filter(Boolean);
  const cfg = await chrome.storage.local.get({
    rpc: 'http://127.0.0.1:16800/jsonrpc',
    secret: ''
  });
  const params0 = cfg.secret ? [`token:${cfg.secret}`] : [];
  let ok = 0, fail = 0;
  for (const url of urls) {
    try {
      const resp = await fetch(cfg.rpc, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0', id: Date.now().toString(),
          method: 'aria2.addUri',
          params: [...params0, [url], {
            split: '16',
            'max-connection-per-server': '16',
            'min-split-size': '1M'
          }]
        })
      });
      const data = await resp.json();
      if (data.error) throw new Error(data.error.message);
      ok++;
    } catch (e) {
      fail++;
    }
  }
  $('manualUrl').value = '';
  if (fail === 0) {
    setStatus('addStatus', `已添加 ${ok} 个任务 ✓`, '#a6e3a1');
  } else {
    setStatus('addStatus', `成功 ${ok} 个，失败 ${fail} 个`, '#f9e2af');
  }
  setTimeout(() => $('addStatus').textContent = '', 2500);
};

function setStatus(id, text, color) {
  const el = $(id);
  el.textContent = text;
  el.style.color = color || '#a6e3a1';
}