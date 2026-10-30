# Amoayun Link

把消息账号接入 DeepSeek Harness 的独立 Host 插件。它不依赖 Electron 或宿主应用，安装到 DSH profile 后即可使用。

## 能力

- 启动时自动创建/复用名为 `amoayun-link` 的 DSH 工作区；
- 所有账号的会话都使用这个工作区，不会再为账号单独建工作区；
- 断开连接会停止消息传输，但保留 Agent/session，让会话继续显示在工作区；删除账号或移除插件都不会删除工作区和会话日志；
- 多消息账号，扫码登录、断线重连；
- 面板默认中文，`AMOAYUN_LINK_LANG=en` 可切英文；
- 工作区固定为 `$DSH_HOME/amoayun-link`，面板只读，不能修改；
- 按联系人建立独立文件目录 `users/<accountId>/<hash>/`；
- 每个联系人独立 `history.jsonl`，保存完整聊天记录和媒体路径；
- 每个联系人独立 DSH session，聊天上下文互不混用；仍共用 `amoayun-link` 工作区；
- 每个用户的 `context-token.json` 持久化回复上下文 token；重启后仍可续聊；
- 账号可开启「仅允许已授权联系人」，未授权消息不进入 Agent；面板可授权/取消授权；
- 开启访问控制后自动生成 6 位配对码；未授权用户回复配对码即可自助授权；面板可重新生成；
- 引用消息优先读取平台内联内容，只有消息 ID 时从该用户 history 还原；
- 超长回复按 4000 字自动分片发送，不静默截断；
- 自动获取 `typing_ticket`，处理期间显示“正在输入”，每 5 秒续期，回复/停止/失败时取消；
- 新增 `send_chat_media` 工具，Agent 可向当前联系人发送工作区内的图片、视频或文件；
- 账户详情展示工作区、账号目录、技能目录、用户目录，以及每个用户的目录/聊天记录/媒体路径；
- 所有展示的路径都改为直接点击路径打开，不再显示打开按钮；
- 显示每个用户目录占用空间、账号合计和全部用户文件总占用；
- 面板宽度增加到 960px；
- 入站图片/文件/视频/语音全部保存到该目录的 `media/`；
- 会话日志、媒体文件、用户目录在断开、删除账号或移除插件后都保留；
- 面板分「插件设置 / 账户设置」两个 tab，带切换动画；
- 插件设置里的「新消息硬打断」使用 switch 开关，默认关闭；
- 悬浮按钮可拖动到任意位置，位置会保存在当前浏览器；
- 左侧竖排账号 tab，单账号也保留；
- 每个账号独立 `skills` 目录（在账号数据下，不随会话工作区变化）；
- 文字、图片、文件、视频、语音消息进入 DSH Agent；
- 语音音频始终下载到工作区，但只把服务端转写文本交给 Agent；
- 每条入站消息强制产生一条出站文字回复，无文本/失败/停止时也有兜底回复；
- 新联系人第一次发消息时，把欢迎语合并进该条回复；一个联系人只欢迎一次；
- 纯文本通道：禁用 `ask_user_question`、`present` 等桌面交互工具，选项用 1/2/3 文本列出；
- 消息 session 使用完整工具集和完全权限，并自动批准权限请求；
- session 标题使用账号备注名，改名同步；
- 会话中隐藏输入框，只读查看；
- 目录选择使用原生 picker；没有原生 picker 时提供面板内手动路径输入。

## 要求

- DeepSeek Harness `>= 0.2.1-rc.3 < 0.3.0`（兼容 0.2.1-rc.3 / rc.4）
- Node.js `>= 22.19`
- 一个可用的 DSH Web profile（默认 `web`）
- `pnpm`（`dsh plugin` 安装插件时需要；没有可先 `npm i -g pnpm`）

## 安装

### 1. 安装到 DSH profile

QR 生成依赖已内置在 `vendor/`，不需要额外安装：

```bash
dsh plugin --profile web add /Users/shangguanjunwei/www/dsh-amoayun-link-plugin
```

然后用脚本把插件注册进 profile 的 bundle 列表：

```bash
node /Users/shangguanjunwei/www/dsh-amoayun-link-plugin/scripts/register.mjs web
```

手动等价于在 `$DSH_HOME/profiles/web/package.json` 中确认：

```json
{
  "dependencies": {
    "dsh-amoayun-link-plugin": "file:/Users/shangguanjunwei/www/dsh-amoayun-link-plugin"
  },
  "dsh": {
    "profile": {
      "bundles": [
        "@deepseek-ai/dsh-base",
        "@deepseek-ai/dsh-web-app",
        "dsh-amoayun-link-plugin"
      ]
    }
  }
}
```

### 2. 启动

```bash
dsh web
```

打开 DSH Web 后，右下角浮动按钮会出现「Amoayun Link」入口。

## 数据目录

默认工作区：

```text
$DSH_HOME/amoayun-link
```

每个账号的每个联系人默认目录：

```text
$DSH_HOME/amoayun-link/users/<accountId>/<contactHash>/
  contact.json
  history/<YYYY-MM-DD>.jsonl
  media/<date>/...
  files/...
```

`history/<YYYY-MM-DD>.jsonl` 是按日期拆分的 append-only 聊天记录（旧版单个 `history.jsonl` 会在启动时自动迁移）：

- `direction: in`：入站文本、sender/chat、message id、时间；
- `direction: in, event: media`：图片/文件/视频/语音的本地路径、MIME、大小；
- `direction: out`：实际发出的回复文本；
- 账号删除、插件移除不会删除该文件。

`<contactHash>` 由聊天类型、会话 ID 和发送者 ID 稳定哈希得到，`contact.json` 保留原始 sender/chat 信息。Agent 每轮都会收到这个目录作为默认输出目录。

所有入站媒体都会下载到该用户的 `media/` 下；每轮消息会把与 `history/`、`media/` 并列的 `files/` 作为默认输出目录交给 Agent，生成文件默认写入这里。若用户明确指定了其他路径，则按用户指定路径为准。

注意：会话使用完全权限，插件通过每轮上下文约束默认输出目录，但无法在内核层阻止 Agent 通过绝对路径或 `bash` 写到工作区其他位置；如果需要 OS 级硬隔离，需要改成每用户独立 cwd/沙箱，这会影响当前单工作区结构。

插件启动时会确保该目录存在，并在 DSH 工作区注册表中创建标题为 `amoayun-link` 的工作区；如果同一路径的工作区已经存在，则直接复用，不重复创建。

所有账号的 session `cwd` 都是这个工作区，因此会话都归入 `amoayun-link`。修改工作区根目录会为所有账号使用新的工作区和新 session，旧工作区和旧会话不会删除。

如果未设置 `DSH_HOME`，使用：

```text
~/.dsh/amoayun-link
```

可以在启动时覆盖：

```bash
AMOAYUN_LINK_DATA_DIR=/path/to/harness-home dsh web
```

`AMOAYUN_LINK_DATA_DIR` 是 Harness 级别的 home，插件会在其下创建 `amoayun-link/accounts`、`amoayun-link/workspaces` 和 `amoayun-link/settings.json`。

## 配置

插件 profile 配置可以覆盖：

```yaml
- insert:
    - id: dsh-amoayun-link-plugin
      name: dsh-amoayun-link-plugin
      config:
        # 数据 home；默认取 DSH_HOME
        dataDir: /path/to/harness-home
        # 上游网关；留空使用内置默认值
        baseUrl: ''
        # 模型路由；留空使用 DSH 默认模型
        provider: ''
        model: ''
        # 消息 session 的权限 preset；默认完全权限
        permissionPreset: danger-full-access
        # 消息 session 的 agent preset；留空使用 DSH 默认 preset
        agentPreset: ''
        autoReply: true
        # 新联系人第一次发消息时的欢迎语；留空关闭
        welcomeMessage: 你好，我是 Amoayun Link 助手。请直接告诉我你想做什么；需要选择时，我会用 1/2/3 或 a/b/c 以文字发给你。
        # 新消息硬打断当前分析；默认关闭
        hardInterrupt: false
```

## 安全说明

消息 session 默认固定为 `danger-full-access`，并对审批请求自动批准。任何能给你的消息账号发消息的人，都可能让 Agent 执行命令、读写文件。**只绑定可信账号**，并建议使用专用工作区。

每个账号的 `skills` 位于账号数据目录下，例如：

```text
$DSH_HOME/amoayun-link/accounts/<accountId>/skills
```

同一账号的不同联系人共享这套 skills；不是按联系人隔离。

## 会话不会被删除

- 断开连接会停止消息传输运行时，但保留当前 Agent/session，使会话继续显示在工作区；不会删除 DSH session 日志；
- 删除账号只清除账号凭据、游标和账号目录，不删除已产生的会话；
- 移除/卸载插件不会删除 `amoayun-link` 工作区注册，也不会删除 `$DSH_HOME/sessions` 下的会话内容；
- 重新安装插件后会复用已有工作区，历史会话仍然可以在 DSH 中查看。

## 版本兼容

- `1.0.1` 起同时兼容 DSH `0.2.1-rc.3` 和 `0.2.1-rc.4`；
- `1.0.2` 起把 QR 生成库内置到 `vendor/`，不会再出现缺包；
- `1.1.0` 起改名并移除所有平台品牌词，包名、UI、API、环境变量、数据目录和 session 前缀统一为 `Amoayun Link` / `amoayun-link`；
- `1.2.0` 起自动创建/复用 `amoayun-link` 工作区，所有会话统一归入该工作区；
- `1.2.1` 起断开连接保留 Agent/session，避免会话从工作区列表消失；
- `1.2.2` 起插件宿主不再覆盖整个窗口，DSH 标题栏拖动恢复正常；
- `1.2.3` 起插件浮层独立设置高层级，避免被 DSH 的代码块工具栏覆盖；
- `1.2.4` 起面板默认中文，设置 `AMOAYUN_LINK_LANG=en` 可切回英文；
- `1.2.5` 起面板加入「停止分析」，可取消当前 turn 而不删除会话；
- `1.2.6` 起所有会话强制 channel policy：每条消息必回、纯文本选项、禁用桌面交互工具；
- `1.2.7` 起新联系人首次发消息时合并发送欢迎语（每个联系人只一次），并在底层恢复正确的上游协议请求头；
- `1.3.0` 起面板加入「新消息硬打断」设置，默认关闭；开启后新消息会取消当前 turn，当前消息回「已停止」，再处理新消息；
- `1.3.1` 起面板改为「插件设置 / 账户设置」两个 tab，并带切换动画；硬打断设置改为 switch 开关；
- `1.3.2` 起硬打断不再回复旧消息的「已停止」，直接丢弃旧 turn 的回复，只处理并回复最新消息；
- `1.3.3` 起工作区固定为 `$DSH_HOME/amoayun-link`，面板和后端均禁止修改；
- `1.4.0` 起按联系人建立独立文件/媒体目录，并把该目录作为每轮默认输出目录；会话和媒体保留不删除；
- `1.5.0` 起每个联系人目录新增 `history.jsonl`，保存入站、出站和媒体记录；
- `1.5.1` 起账户详情展示相关文件夹和每个用户文件的完整路径；
- `1.6.0` 起用户文件信息并入账号详情的同一组行；聊天记录改为按日期文件保存，并自动迁移旧 `history.jsonl`；
- `1.7.0` 起面板加宽、所有路径支持打开、增加每用户/账号/全部存储占用统计；
- `1.7.1` 起去掉路径后的打开按钮，直接点击路径打开；
- `1.7.2` 修复面板 `renderTabs is not defined`，恢复账号 tab 渲染；
- `1.7.3` 修复路径点击处理中缺失的 `openDirectory`，点击路径可正常调用打开；
- `1.7.4` 联系人加载时自动创建 `history/`、`media/`；点击路径时如果目录不存在也会先创建再打开；
- `1.8.0` 每个用户新增 `files/`，作为生成文件的默认目录，与 `history/`、`media/` 并列；详情页展示并可点击打开；
- `1.9.0` 按联系人拆分 DSH session，同一账号下不同联系人不再共享聊天上下文；所有 session 仍挂载在同一工作区；
- `1.9.1` 按用户持久化 `context-token.json`，回复时优先使用内存或磁盘 token；
- `2.0.0` 新增账号级访问控制：`access.json`、仅授权联系人开关、联系人授权/取消授权；未授权用户只收到提示，不进入 Agent；
- `2.0.2` 新增引用消息还原；长回复按 4000 字分片发送；
- `2.1.0` 新增 6 位配对码授权：未授权用户回复配对码即可加入 allowFrom；面板展示并支持重新生成；
- `2.2.0` 新增正在输入：按用户请求 `getconfig` 获取 `typing_ticket`，处理期间每 5 秒续期，结束/取消时发送取消状态；
- `2.3.0` 新增出站媒体工具 `send_chat_media`：本地工作区文件经 AES-128-ECB 加密、上传 CDN 后按图片/视频/文件发送；默认单文件上限 100 MiB。
- `2.3.1` 修复 `send_chat_media` 工具执行时 `this` 未绑定导致 `sessionToAccount` 读取失败的问题。
- `2.3.2` 修复出站消息复用入站 `client_id/message_id/seq` 导致平台接受但去重不显示的问题；每次发送使用新的 `client_id`。
- `2.3.3` 修复媒体 `media.aes_key` 编码：按协议发送十六进制密钥字符串的 base64，而不是原始 16 字节密钥的 base64。
- 插件用到的 `sessionTitle`、`agents.resume`、agent preset、skills、approval 接口在 rc.3 中均存在；
- 如果你的 DSH 更旧（rc.2 或更早），请先升级 DSH。

## 开发与验证

插件是纯 ESM，无编译步骤：

```bash
node --check lib/index.js
node --check lib/service.js
node --check lib/ui.js
```

插件通过 DSH 的 `webServer` 注入面板，通过 `/amoayun-link-api` 提供控制接口；不修改 DSH 主体，也不需要 Electron。
