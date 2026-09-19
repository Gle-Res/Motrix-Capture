# Motrix-Capture

把浏览器下载自动转发到本地 Motrix。

## 功能

- 网页点下载，自动转交 Motrix，浏览器下载自动取消
- 右键链接 / 图片，通过 Motrix 下载
- 弹窗内批量粘贴链接（HTTP / magnet）
- 支持 BT、磁力链接
- 默认多线程提速
- 暗色 UI，一键测试 RPC 连接

## 安装

1. 先装并运行 Motrix（https://motrix.app）
2. 下载本仓库代码
3. 浏览器打开 chrome://extensions/
   （Edge 用 edge://extensions/，QQ 浏览器用 qqbrowser://extensions/）
4. 开启「开发者模式」，点「加载已解压的扩展程序」，选择本目录
5. 点扩展图标，填 RPC 地址和密钥，测试连接，保存

## RPC 配置

地址：http://127.0.0.1:16800/jsonrpc
密钥：Motrix 设置里的 RPC 授权密钥

在 Motrix 里打开：设置 → 进阶设置 → 记下 RPC 监听端口和 RPC 授权密钥。

## 使用

- 自动接管：Motrix 运行时，点网页下载即自动转入
- 右键下载：右键链接 / 图片，通过 Motrix 下载
- 手动添加：点扩展图标，粘贴链接，添加到下载列表

## 常见问题

还是走浏览器下载？
  检查 Motrix 是否运行、RPC 地址和密钥是否正确，点「测试连接」确认。

提示添加到 Motrix 失败？
  RPC 连不上，检查 Motrix 是否启动、地址密钥是否一致。

弹「新建下载任务」对话框？
  那是浏览器自身的下载确认，扩展拦不住。
  去浏览器设置里关掉「下载前询问保存位置」。

## 目录

| 文件 | 说明 |
|------|------|
| manifest.json | 扩展清单 |
| background.js | 拦截下载、RPC 调用、右键菜单 |
| popup.html | 弹窗界面 |
| popup.js | 弹窗逻辑 |
| icon.png | 图标 |

## License

MIT
