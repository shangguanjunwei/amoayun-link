# Amoayun Link

把 vx 接入 DeepSeek Harness 桌面端的独立 Host 插件。

安装后，DSH 桌面端右下角会出现「Amoayun Link」悬浮入口。用 vx 扫码绑定账号后，联系人的消息会进入 DSH Agent，回复会直接发回聊天。

当前版本：`2.3.4`

npm 包名：`@amoayun/dsh-amoayun-link-plugin`

macOS 图文安装教程：[docs/install-guide.html](https://github.com/shangguanjunwei/amoayun-link/blob/main/docs/install-guide.html)

---

## 接入前准备

- 已安装并打开 DeepSeek Harness 桌面端；
- 插件已经发布到 npm，或你拿到的是已经构建好的本地插件目录；
- 准备一个用于接入的 vx 账号；
- 建议先确认该账号只用于可信联系人。

---

## 桌面端接入

### 1. 打开插件管理

在 DSH 桌面端左侧边栏进入：

```text
插件
```

### 2. 添加插件

点击「添加插件」。

在插件包名输入框中填写：

```text
@amoayun/dsh-amoayun-link-plugin
```

如果拿到的是本地构建目录，也可以在同一个入口选择本地目录，指向插件的包目录。

### 3. 安装

确认 DSH 显示的包信息、版本和来源无误后，点击「安装」。

第三方插件会显示信任提示。只安装你信任的来源。

### 4. 启用插件

安装完成后点击「立即启用」。

启用后请直接重启 DSH 桌面端。无论是否出现重启提示，都重启一次，确保插件完整加载。

### 5. 打开 Amoayun Link

重启 DSH 后，窗口右下角会出现：

```text
Amoayun Link
```

点击悬浮按钮打开面板。

### 6. 绑定 vx

进入「账户设置」：

1. 点击「添加 vx」；
2. 输入账号备注，例如「工作号」；
3. 点击扫码登录；
4. 用 vx 扫描二维码并确认授权；
5. 登录成功后，账号状态会变为在线。

同一个插件支持多个 vx 账号，后续重复添加即可。

### 7. 开始聊天

账号在线后，让联系人给这个 vx 发一条消息。

第一条消息会自动进入 DSH，并创建对应会话。此后：

- 文本消息会直接进入 Agent；
- 图片、文件、视频、语音会保存并交给 Agent；
- Agent 的回复会发回该联系人；
- 每个联系人拥有独立会话，不会串上下文。

---

## 接入后可以实现的功能

### 聊天

- 接收文本、图片、文件、视频、语音；
- 语音优先使用转写文本，音频文件始终保存；
- 引用消息还原；
- 回答中自动显示「正在输入」；
- 长回复自动分片，不会静默截断；
- 每条消息都有文字兜底回复。

### Agent

- 每个联系人独立 DSH session；
- 所有会话统一显示在 `amoayun-link` 工作区；
- 联系人之间不会共享聊天上下文；
- Agent 可以读取该联系人的图片、文件、视频和语音记录；
- Agent 可以生成文件；
- Agent 可以通过工具把工作区内的图片、视频、文件发回给联系人。

### 文件

每个联系人拥有独立目录：

```text
$DSH_HOME/amoayun-link/users/<accountId>/<contactHash>/
  contact.json
  context-token.json
  history/<YYYY-MM-DD>.jsonl
  media/<日期>/
  files/
```

- `history/`：按日期保存聊天记录；
- `media/`：保存收到的图片、文件、视频、语音；
- `files/`：Agent 生成文件的默认目录；
- `context-token.json`：保存该联系人的回复上下文；
- `contact.json`：保存联系人的原始标识。

### 面板

「插件设置」和「账户设置」两个 tab：

- 插件设置：工作区、硬打断；
- 账户设置：账号列表、扫码登录、联系人列表、访问控制、存储占用；
- 账户详情显示工作区、账号目录、技能目录、用户目录；
- 每个联系人的目录、聊天记录、媒体目录都可直接点击打开；
- 显示每个用户占用、账号合计、全部用户文件总占用。

### 运行控制

- 支持手动「停止分析」；
- 支持「新消息硬打断」开关：
  - 默认关闭；
  - 开启后，新消息会取消当前分析，旧回复丢弃，只处理最新消息。

---

## 权限控制

### 1. 先决定谁可以使用 Agent

账户详情里有：

```text
仅允许已授权联系人
```

默认关闭。

关闭时：

- 任何能给该 vx 发消息的人都可以进入 Agent；
- 适合只绑定私人账号的场景。

开启时：

- 只有已授权联系人能进入 Agent；
- 未授权联系人不会创建 session、不会调用工具、不会触发模型；
- 未授权联系人只会收到授权提示。

### 2. 联系人授权

在账户详情的联系人列表里，可以直接：

- 授权；
- 取消授权。

取消授权不会删除：

- 聊天记录；
- 媒体文件；
- 用户目录；
- DSH session。

### 3. 配对码

开启访问控制后会自动生成 6 位配对码。

流程：

1. 管理员在面板看到配对码；
2. 把配对码发给可信联系人；
3. 对方回复配对码；
4. 自动加入已授权列表；
5. 之后可以正常聊天。

配对码可以重新生成，旧码立即失效。

### 4. Agent 权限

消息会话默认使用：

```text
danger-full-access
```

并对权限请求自动批准。

这意味着已授权联系人可以让 Agent：

- 执行命令；
- 读写工作区文件；
- 调用工具；
- 发送工作区内的文件。

访问控制只决定「谁可以触发 Agent」，不限制已授权联系人的 Agent 权限。

所以：

- 只授权可信联系人；
- 不要公开配对码；
- 不要把敏感凭据放在工作区；
- 不要把 `danger-full-access` 当成安全沙箱。

---

## 数据与保留

插件数据默认在：

```text
$DSH_HOME/amoayun-link
```

结构：

```text
amoayun-link/
  accounts.json
  settings.json
  accounts/
    <accountId>/
      credentials.json
      access.json
      state.json
      welcomed.json
      skills/
  users/
    <accountId>/
      <contactHash>/
        contact.json
        context-token.json
        history/
        media/
        files/
```

DSH session 日志在：

```text
$DSH_HOME/sessions
```

以下操作不会删除工作区、用户文件或会话日志：

- 断开账号；
- 删除账号；
- 移除插件；
- 升级插件。

---

## 出站媒体

Agent 可以使用工具：

```text
send_chat_media
```

参数：

- `path`：工作区内的本地文件路径；
- `caption`：可选文字说明。

支持图片、视频和普通文件。

发送链路：

```text
读取文件
→ AES-128-ECB 加密
→ 上传 CDN
→ 生成图片/视频/文件消息
→ 发送给当前联系人
```

默认单个文件上限 100 MiB。

---

## 限制

- 桌面端插件运行在 DSH Host 中，不是 OS 沙箱；
- 已授权用户的 Agent 可以执行工作区内的操作；
- 生成文件默认进入该联系人的 `files/`，但完全权限下无法阻止 Agent 通过绝对路径写到别处；
- 语音消息若没有转写文本，只保存音频，不自动识别；
- 正在输入依赖上游返回 `typing_ticket`，不保证所有环境都显示。

---

## 版本兼容

- DeepSeek Harness `>= 0.2.1-rc.3 < 0.3.0`；
- 支持 DSH 桌面端；
- 插件为纯 ESM；
- 发布包只包含混淆后的 `dist/index.js`，不包含源码。

---

## 开发与构建

仅开发者需要。仓库提供 `scripts/build.mjs`，负责 esbuild 打包和 javascript-obfuscator 混淆，生成：

```text
dist/index.js
```

构建产物：

```text
dist/index.js
```

发布包只包含：

```text
dist/index.js
cordis.patch.yml
README.md
THIRD_PARTY_NOTICES.md
scripts/register.mjs
package.json
```

混淆只提高阅读成本，不能保护协议、密钥或核心逻辑；不要依赖混淆保护敏感信息。
