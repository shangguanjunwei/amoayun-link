# Amoayun Link

把消息账号接入 DeepSeek Harness 的独立 Host 插件。

Amoayun Link 不依赖 Electron，也不修改 DSH 主体。安装到 DSH profile 后，它会在 DSH Web 右下角提供一个悬浮入口，用扫码方式绑定消息账号，并把消息接入 DSH Agent。

当前版本：`2.3.4`

npm 包名：`@amoayun/dsh-amoayun-link-plugin`

---

## 功能

### 消息接入

- 多账号扫码登录、断线重连；
- 文本、图片、文件、视频、语音消息进入 Agent；
- 语音优先使用消息自带的转写文本，音频始终保存；
- 引用消息优先读取内联内容，只有消息 ID 时从该用户的聊天记录还原；
- 正在输入状态：处理期间显示 typing，每 5 秒续期，结束、停止或失败时取消；
- 每条入站消息都会产生一条出站文字回复；无文本、失败、手动停止时也有兜底回复；
- 新联系人第一次发消息时，把欢迎语合并进该条回复，每个联系人只欢迎一次；
- 纯文本通道：禁用 `ask_user_question`、`present` 等桌面交互工具，选项用 `1/2/3` 文本列出；
- 超长回复按 4000 字自动分片发送，不静默截断。

### 会话与工作区

- 启动时自动创建或复用名为 `amoayun-link` 的 DSH 工作区；
- 所有账号、所有联系人的 session 都挂载在这个工作区；
- **每个联系人使用独立 DSH session**，不同联系人之间不会串聊天上下文；
- 会话标题使用账号备注名；
- 断开连接只停止消息传输，不销毁 Agent/session，会话继续显示在工作区；
- 删除账号、移除插件都不会删除工作区、session 日志或用户文件。

### 文件与记录

每个联系人都有独立目录：

```text
$DSH_HOME/amoayun-link/users/<accountId>/<contactHash>/
  contact.json
  context-token.json
  history/<YYYY-MM-DD>.jsonl
  media/<日期>/
  files/
```

- `history/`：按日期拆分的 append-only 聊天记录；
- `media/`：入站图片、文件、视频、语音；
- `files/`：Agent 生成文件的默认目录；
- `context-token.json`：该联系人的回复上下文 token；
- `contact.json`：原始 sender/chat 信息。

旧版单个 `history.jsonl` 会在启动时自动迁移到按日期文件。

### 面板

- 「插件设置 / 账户设置」两个 tab，带切换动画；
- 工作区固定为 `$DSH_HOME/amoayun-link`，面板只读；
- 账户详情展示工作区、账号目录、技能目录、用户目录，以及每个用户的目录、聊天记录、媒体目录；
- 所有路径可直接点击打开；
- 显示每个用户目录占用、账号合计、全部用户文件总占用；
- 左侧竖排账号 tab，单账号也保留；
- 悬浮按钮位置保存在当前浏览器；
- 默认中文，`AMOAYUN_LINK_LANG=en` 切换英文。

### 访问控制

账号详情里可开启：

```text
仅允许已授权联系人
```

开启后：

- 只有 `allowFrom` 中的 sender 能进入 Agent；
- 未授权用户不创建 session，不进入 Agent，只收到授权提示；
- 可手动授权/取消授权；
- 自动生成 6 位配对码，用户回复配对码即可自助授权；
- 配对码可在面板重新生成。

默认关闭，不影响已有账号。

### 出站媒体

Agent 可调用工具：

```text
send_chat_media
```

参数：

- `path`：工作区内的本地文件路径；
- `caption`：可选文字说明。

支持：

- 图片：png、jpg、jpeg、gif、webp、bmp
- 视频：mp4、mov、webm、mkv、avi
- 其他：作为普通文件发送

发送链路：

```text
读取文件 → getuploadurl → AES-128-ECB 加密 → 上传 CDN
→ 取 x-encrypted-param → 构造 image/video/file item → sendmessage
```

安全限制：

- 只能发送 `amoayun-link` 工作区内的文件；
- 默认单文件上限 100 MiB，可通过 `mediaOutboundMaxBytes` 调整；
- 只在当前联系人会话内可用。

---

## 要求

- DeepSeek Harness `>= 0.2.1-rc.3 < 0.3.0`（兼容 `0.2.1-rc.3` / `rc.4`）
- Node.js `>= 22.19`
- 一个可用的 DSH Web profile（默认 `web`）
- `pnpm`

---

## 安装

### 从 npm 安装

> 发布前需要拥有或加入 npm 的 `@amoayun` scope。

```bash
dsh plugin --profile web add @amoayun/dsh-amoayun-link-plugin
```

注册到 profile 的 bundle 列表：

```bash
node "$DSH_HOME/profiles/web/node_modules/@amoayun/dsh-amoayun-link-plugin/scripts/register.mjs" web
```

启动：

```bash
dsh web
```

打开 DSH Web 后，右下角会出现「Amoayun Link」入口。

### 从源码安装

```bash
git clone git@github.com:shangguanjunwei/amoayun-link.git
cd amoayun-link
npm install
npm run build
dsh plugin --profile web add "$PWD"
node scripts/register.mjs web
dsh web
```

`npm run build` 会生成混淆后的 `dist/index.js`，源码不会进入 npm 包。

### profile 中的等价配置

```json
{
  "dependencies": {
    "@amoayun/dsh-amoayun-link-plugin": "file:/absolute/path/to/amoayun-link"
  },
  "dsh": {
    "profile": {
      "bundles": [
        "@deepseek-ai/dsh-base",
        "@deepseek-ai/dsh-web-app",
        "@amoayun/dsh-amoayun-link-plugin"
      ]
    }
  }
}
```

npm 安装时依赖值是版本号，而不是 `file:` 路径。

---

## 配置

在 DSH profile 的插件配置中覆盖：

```yaml
- insert:
    - id: dsh-amoayun-link-plugin
      name: "@amoayun/dsh-amoayun-link-plugin"
      config:
        # Harness home；默认取 DSH_HOME
        dataDir: /path/to/harness-home

        # 上游网关；留空使用内置默认值
        baseUrl: ''

        # 模型路由；留空使用 DSH 默认模型
        provider: ''
        model: ''

        # 消息 session 的权限 preset
        permissionPreset: danger-full-access

        # 消息 session 的 agent preset；留空使用默认
        agentPreset: ''

        # 是否自动回复；false 时只记录消息
        autoReply: true

        # 新联系人首次消息的欢迎语；留空关闭
        welcomeMessage: 你好，我是 Amoayun Link 助手。请直接告诉我你想做什么；需要选择时，我会用 1/2/3 或 a/b/c 以文字发给你。

        # 媒体
        mediaMaxBytes: 104857600
        mediaTimeoutMs: 60000
        mediaOutboundMaxBytes: 104857600
```

### 环境变量

| 变量 | 作用 |
| --- | --- |
| `DSH_HOME` | DSH home，默认 `~/.dsh` |
| `AMOAYUN_LINK_DATA_DIR` | 覆盖插件使用的 Harness home |
| `AMOAYUN_LINK_LANG` | `en` 切换英文面板 |
| `AMOAYUN_LINK_DEV` | `1` 时启用开发用 `/dev/message` 接口 |

### 面板设置

「新消息硬打断」在面板中管理，默认关闭。

开启后：

- 新消息到达时取消当前 turn；
- 旧消息不再回复；
- 只处理并回复最新消息。

---

## 数据目录

```text
$DSH_HOME/amoayun-link/
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
          YYYY-MM-DD.jsonl
        media/
          YYYY-MM-DD/
        files/
```

说明：

- `settings.json`：插件级设置，例如硬打断；
- `accounts/<id>/access.json`：账号访问控制、`allowFrom`、配对码；
- `accounts/<id>/state.json`：上游消息游标；
- `accounts/<id>/welcomed.json`：已欢迎联系人；
- `accounts/<id>/skills/`：该账号的 skills，同一账号的联系人共享；
- `users/`：按联系人隔离的聊天记录、媒体和生成文件。

DSH session 日志位于：

```text
$DSH_HOME/sessions/
```

插件不会删除这些日志。

默认工作区：

```text
$DSH_HOME/amoayun-link
```

如果未设置 `DSH_HOME`，使用：

```text
~/.dsh/amoayun-link
```

---

## 工作区与 session

- 所有账号共用 `amoayun-link` 工作区；
- 每个联系人一个独立 session，session ID 形如：

```text
amoayun-link-<accountId>-<contactHash>
```

- 所有 session 的 `cwd` 都是 `$DSH_HOME/amoayun-link`；
- 因此在 DSH 侧边栏中，所有会话都归在 `amoayun-link` 工作区；
- 联系人之间不会因为共用工作区而共享聊天上下文。

断开连接、删除账号或移除插件时：

- 停止消息运行时；
- 保留 Agent/session；
- 保留 `users/`、`media/`、`history/`、`files/`；
- 保留 `$DSH_HOME/sessions`。

---

## 安全说明

消息 session 默认使用 `danger-full-access`，并自动批准权限请求。

这意味着已授权联系人可以让 Agent：

- 执行命令；
- 读写工作区文件；
- 调用工具；
- 发送工作区内的文件。

所以：

- 只绑定可信账号；
- 建议开启「仅允许已授权联系人」；
- 不要把配对码发给不可信的人；
- 不要把敏感凭据放在工作区。

访问控制只决定“谁可以触发 Agent”，不限制已授权用户的 Agent 权限。

生成文件默认写入该联系人的 `files/`，但这只是每轮上下文约束，不是 OS 级沙箱。完全权限下，Agent 仍可能通过绝对路径或命令写到工作区其他位置。

---

## 兼容性

- DSH `0.2.1-rc.3` / `0.2.1-rc.4`；
- 发布产物为纯 ESM 单文件；源码构建需要 esbuild 和 javascript-obfuscator；
- QR 生成库已内置在 `vendor/qrcode`；
- 使用 DSH 的 `webServer`、`workspaceRegistry`、`agents`、`skills`、`systemPrompt`、`tools` 等 Host 接口。

---

## 开发与打包

源码运行：

```bash
npm install
npm run build
npm run check
```

构建：

```bash
npm run build
```

构建流程：

```text
lib/ + vendor/ → esbuild bundle → javascript-obfuscator → dist/index.js
```

发布包只包含：

- `dist/index.js`
- `cordis.patch.yml`
- `README.md`
- `THIRD_PARTY_NOTICES.md`
- `scripts/register.mjs`

发布前检查：

```bash
npm pack --dry-run
npm run build
node --check dist/index.js
```

语法检查：

```bash
node --check lib/index.js
node --check lib/service.js
node --check lib/ui.js
node --check lib/upstream/client.js
node --check lib/upstream/runtime.js
```

本地加载时，插件通过 DSH 的 `webServer` 注入面板，通过 `/amoayun-link-api` 提供控制接口；不修改 DSH 主体，也不需要 Electron。

---

## 版本摘要

| 版本 | 主要变化 |
| --- | --- |
| `1.x` | 多账号、扫码登录、固定工作区、per-user 文件/记录、面板、硬打断 |
| `2.0.0` | 账号级访问控制、联系人授权 |
| `2.1.0` | 6 位配对码自助授权 |
| `2.2.0` | 正在输入状态 |
| `2.3.0` | 出站媒体工具 `send_chat_media` |
| `2.3.1` | 修复媒体工具 `this` 绑定 |
| `2.3.2` | 修复出站消息复用入站 `client_id` 导致不显示 |
| `2.3.3` | 修复媒体 `aes_key` 编码 |
| `2.3.4` | 增加 esbuild + javascript-obfuscator 发布构建，npm 包只发布混淆后的 `dist/` |
