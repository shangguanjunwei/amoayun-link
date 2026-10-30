/**
 * Amoayun Link upstream control plane for DSH 消息插件.
 *
 * The service owns multiple Amoayun Link bot accounts, their QR login sessions,
 * long-poll runtimes, and the per-account DSH agent bridge. It exposes a small
 * JSON API on the DSH Web host so the injected panel can manage everything
 * without a separate process.
 */
import { spawn } from 'node:child_process'
import { createCipheriv, createHash, randomBytes, randomUUID } from 'node:crypto'
import { appendFile, lstat, mkdir, readdir, readFile, rm, stat, writeFile } from 'node:fs/promises'
import { basename, extname, isAbsolute, join, resolve, sep } from 'node:path'
import { homedir } from 'node:os'
import QRCode from '../vendor/qrcode/lib/index.js'
import { defineTool } from '@deepseek-ai/dsh-tools'
import { createUserMessage } from '@deepseek-ai/dsh-llm'
import { joinAssistantStreamText } from '@deepseek-ai/dsh-llm/assistant-stream'
import { UpstreamClient } from './upstream/client.js'
import { PANEL_UI_JS } from './ui.js'
import { AccountRuntime } from './upstream/runtime.js'
import { MediaStore } from './media.js'
import { FileSystemSkillProvider } from '@deepseek-ai/dsh-skill-filesystem'
import { setApprovalPolicy } from '@deepseek-ai/dsh-user-approval'
import { scopeChainOf, scopeOf } from '@deepseek-ai/dsh-scope'
import {
  createAccount,
  loadAccounts,
  loadCredentials,
  saveAccounts,
  saveCredentials,
} from './upstream/accounts.js'

const DEFAULT_BASE_URL = Buffer.from('aHR0cHM6Ly9pbGlua2FpLndlaXhpbi5xcS5jb20=', 'base64').toString('utf8')
const LOGIN_TTL_MS = 180_000
const LOGIN_POLL_MS = 1_500

const CHANNEL_POLICY = `## Messaging channel constraints (mandatory)

This session is a one-message-at-a-time plain-text chat channel. The user cannot see or click any DSH desktop UI.

- Every incoming user message must receive exactly one text reply, unless a newer message supersedes it; then only the newest message is answered.
- Never call ask_user_question, present, or any tool that opens a selection dialog, modal, card, or other desktop-only UI.
- When you need the user to choose, list plain-text options such as "1. ... 2. ..." or "a. ... b. ..." and ask them to reply with the number or letter.
- Ask at most one question per reply, keep replies concise, and never use tables, buttons, or cards.
- Do not stay silent: if you cannot answer, send a short text explanation instead.
- When the user asks you to send a file, image, or video, use send_chat_media with a local path under the current user's files directory.
- Each user message starts with a [Conversation workspace] block containing that contact's default files directory. Unless the user explicitly asks for another path, create every generated file inside that directory; never write generated files at the workspace root or the user directory root.`


function delay(ms) {
  return new Promise((resolveTimer) => setTimeout(resolveTimer, ms))
}

function splitReplyText(text, limit = 4000) {
  const value = String(text ?? '')
  if (value.length <= limit) return value ? [value] : []
  const chunks = []
  let rest = value
  while (rest.length > limit) {
    let cut = limit
    const window = rest.slice(0, limit)
    const newline = window.lastIndexOf('\n')
    const space = window.lastIndexOf(' ')
    if (newline > limit * 0.6) cut = newline + 1
    else if (space > limit * 0.6) cut = space + 1
    chunks.push(rest.slice(0, cut))
    rest = rest.slice(cut)
  }
  if (rest) chunks.push(rest)
  return chunks
}

function json(res, status, body) {
  const payload = JSON.stringify(body)
  res.statusCode = status
  res.setHeader('content-type', 'application/json; charset=utf-8')
  res.setHeader('cache-control', 'no-store')
  res.end(payload)
}

async function readJson(req, limit = 65_536) {
  const chunks = []
  let size = 0
  for await (const chunk of req) {
    size += chunk.length
    if (size > limit) throw new Error('request body too large')
    chunks.push(chunk)
  }
  if (size === 0) return {}
  return JSON.parse(Buffer.concat(chunks).toString('utf8'))
}

function publicLogin(login) {
  if (!login) return null
  return {
    status: login.status,
    image: login.image,
    content: login.content,
    expiresAt: login.expiresAt,
    error: login.error,
  }
}

export class AmoayunLinkService {
  constructor(ctx, config) {
    this.ctx = ctx
    this.config = {
      dataDir: resolve(config.dataDir || './.data'),
      baseUrl: config.baseUrl || DEFAULT_BASE_URL,
      provider: config.provider || '',
      model: config.model || '',
      autoReply: config.autoReply !== false,
      welcomeMessage: String(config.welcomeMessage ?? '').trim(),
      permissionPreset: config.permissionPreset || 'danger-full-access',
      agentPreset: config.agentPreset || '',
      cdnBaseUrl: config.cdnBaseUrl || Buffer.from('aHR0cHM6Ly9ub3ZhYzJjLmNkbi53ZWl4aW4ucXEuY29tL2MyYw==', 'base64').toString('utf8'),
      mediaMaxBytes: config.mediaMaxBytes ?? 100 * 1024 * 1024,
      mediaTimeoutMs: config.mediaTimeoutMs ?? 60_000,
      mediaOutboundMaxBytes: config.mediaOutboundMaxBytes ?? 100 * 1024 * 1024,
    }
    this.defaultWorkspaceRoot = resolve(join(this.config.dataDir, 'amoayun-link'))
    this.workspaceRoot = this.defaultWorkspaceRoot
    this.settingsPath = join(this.config.dataDir, 'amoayun-link', 'settings.json')
    this.token = randomUUID()
    this.accounts = new Map()
    this.sessionToAccount = new Map()
    this.workspace = null
    this.historyWrites = new Map()
    this.storageCache = { at: 0, value: null }
    this.skillProviders = new Map()
    this.scopeAccounts = new WeakMap()
    this.skillDisposer = null
    this.picking = false
    this.disposers = []
    this.disposed = false
    this.loggedIn = 0
    this.hardInterrupt = false
  }

  async loadSettings() {
    try {
      const parsed = JSON.parse(await readFile(this.settingsPath, 'utf8'))
      this.hardInterrupt = parsed.hardInterrupt === true
    } catch {
      // No saved settings yet: the bundled default applies.
    }
  }

  async saveSettings() {
    await mkdir(join(this.config.dataDir, 'amoayun-link'), { recursive: true, mode: 0o700 })
    await writeFile(
      this.settingsPath,
      `${JSON.stringify(
        { workspaceRoot: this.workspaceRoot, hardInterrupt: this.hardInterrupt },
        null,
        2,
      )}\n`,
      { mode: 0o600 },
    )
  }

  async resolveWorkspace(input) {
    let value = String(input ?? '').trim()
    if (!value) throw new Error('工作区路径不能为空')
    if (value === '~') value = homedir()
    else if (value.startsWith('~/') || value.startsWith('~\\')) {
      value = join(homedir(), value.slice(2))
    }
    if (!isAbsolute(value)) throw new Error('请填写绝对路径（例如 /Users/you/Amoayun Link）')
    const absolute = resolve(value)
    await mkdir(absolute, { recursive: true, mode: 0o700 })
    const info = await stat(absolute)
    if (!info.isDirectory()) throw new Error('该路径不是文件夹')
    return absolute
  }

  workspaceForAccount(_account) {
    // One DSH workspace owns every linked conversation. Workspace membership
    // validates the session cwd against this exact canonical path.
    return this.workspaceRoot
  }

  sessionIdFor(accountId, workspace) {
    const digest = createHash('sha256').update(resolve(workspace)).digest('hex').slice(0, 10)
    return `amoayun-link-${accountId}-${digest}`
  }

  sessionIdForMessage(accountId, message) {
    const key = `${message.chatType || 'single'}:${message.chatId || message.senderId}:${message.senderId}`
    const digest = createHash('sha256').update(key).digest('hex').slice(0, 12)
    return `amoayun-link-${accountId}-${digest}`
  }

  async ensureWorkspaceRegistration() {
    const path = resolve(this.workspaceRoot)
    await mkdir(path, { recursive: true, mode: 0o700 })
    try {
      // create() is idempotent by canonical path: an already-registered
      // workspace is returned without creating a duplicate.
      this.workspace = await this.ctx.workspaceRegistry.create(path, 'amoayun-link')
    } catch (error) {
      this.ctx.logger.warn(
        `Amoayun Link 工作区注册失败: ${error instanceof Error ? error.message : String(error)}`,
      )
    }
  }

  async attachSessionToWorkspace(sessionId) {
    if (!this.workspace) await this.ensureWorkspaceRegistration()
    if (!this.workspace) return
    try {
      // Workspace membership validates the persisted session cwd against the
      // workspace path. This records sessions created through the plugin.
      await this.workspace.attachSession(sessionId)
    } catch (error) {
      this.ctx.logger.warn(
        `会话加入工作区失败（${sessionId}）: ${error instanceof Error ? error.message : String(error)}`,
      )
    }
  }

  async install() {
    this.disposers.push(
      this.ctx.webServer.register({
        kind: 'prefix',
        path: '/amoayun-link-api',
        handler: (req, res) => this.handleApi(req, res),
      }),
    )
    this.disposers.push(
      this.ctx.webServer.register({
        kind: 'exact',
        path: '/amoayun-link-ui.js',
        handler: (req, res) => {
          res.statusCode = 200
          res.setHeader('content-type', 'text/javascript; charset=utf-8')
          res.setHeader('cache-control', 'no-store')
          res.end(PANEL_UI_JS)
        },
      }),
    )
    this.disposers.push(
      this.ctx.on('webserver/index-inject', (table) => {
        table.push({
          kind: 'script',
          placement: 'body',
          text: `window.__AMOAYUN_LINK__ = ${JSON.stringify({
            base: '/amoayun-link-api',
            token: this.token,
          })}`,
        })
        table.push({
          kind: 'html',
          placement: 'head',
          html:
            `<meta name="amoayun-link-token" content="${this.token}">` +
            `<meta name="amoayun-link-lang" content="${process.env.AMOAYUN_LINK_LANG ?? 'zh-CN'}">`,
        })
        table.push({
          kind: 'html',
          placement: 'head',
          html:
            '<style id="amoayun-link-session-style">' +
            'html[data-amoayun-link-session] [data-composer-seat],' +
            'html[data-amoayun-link-session] [data-conversation-region="composer"]{display:none!important}' +
            '</style>',
        })
        table.push({ kind: 'script-src', placement: 'body', src: '/amoayun-link-ui.js' })
      }),
    )
    this.disposers.push(
      this.ctx.on('session/event', (session, event) => this.onSessionEvent(session, event)),
    )
    this.disposers.push(
      this.ctx.on('approval/request', (request, next) => {
        const session = request.agent.session
        const accountId = this.sessionToAccount.get(String(session.id))
        const cwd = session.meta?.cwd
        if (!accountId && !this.isLinkedWorkspace(cwd)) return next()
        this.ctx.logger.warn(
          `消息会话自动批准权限请求：${request.toolName}${request.reason ? `（${request.reason}）` : ''}`,
        )
        return Promise.resolve('allowed-once')
      }, { prepend: true }),
    )
    this.disposers.push(
      this.ctx.systemPrompt.section({
        name: 'amoayun-link-channel-policy',
        order: 1,
        text: (assembly) => (this.accountForSkillScope(assembly.scope) ? CHANNEL_POLICY : ''),
      }),
    )
    this.disposers.push(
      this.ctx.on('tools/pre-execute', (exec, next) => {
        const session = exec.agent?.session
        const accountId = session ? this.sessionToAccount.get(String(session.id)) : undefined
        const linked = accountId !== undefined || this.isLinkedWorkspace(session?.meta?.cwd)
        if (linked && (exec.name === 'ask_user_question' || exec.name === 'present')) {
          return Promise.resolve({
            kind: 'deny',
            reason: 'This conversation is a plain-text messaging channel. Use text options instead of interactive UI.',
          })
        }
        return next()
      }, { prepend: true }),
    )
    await this.loadSettings()
    await this.ensureWorkspaceRegistration()
    this.installSkills()
    this.installMediaTool()
    await this.loadAccounts()
    void this.syncExistingSessionTitles().catch(() => undefined)
    this.ctx.logger.info(`DSH 消息插件已加载（${this.accounts.size} 个账号）`)
  }

  async loadAccounts() {
    const accounts = await loadAccounts(this.config.dataDir)
    for (const account of accounts) {
      const credentials = await loadCredentials(this.config.dataDir, account.id)
      this.accounts.set(account.id, {
        account,
        credentials,
        status: 'idle',
        login: null,
        runtime: null,
        controller: null,
        messageCount: 0,
        lastMessageAt: null,
        lastError: null,
        queue: [],
        handles: new Map(),
        externalAgents: new Map(),
        contextTokens: new Map(),
        typingTickets: new Map(),
        typing: null,
        typingGeneration: 0,
        access: { requireAuth: false, allowFrom: [], pairingCode: '' },
        skillContexts: new WeakSet(),
        contacts: new Map(),
        welcomed: new Set(),
        pendingWelcome: '',
        interrupting: false,
        suppressReply: false,
        busy: false,
        handle: null,
        pendingText: undefined,
        lastIncoming: undefined,
        externalAgent: null,
        sessionId: this.sessionIdFor(account.id, this.workspaceForAccount(account)),
      })
      const loaded = this.accounts.get(account.id)
      loaded.welcomed = await this.loadWelcomed(account.id)
      loaded.contacts = await this.loadContacts(account.id)
      loaded.contextTokens = await this.loadContextTokens(account.id).catch(() => new Map())
      loaded.access = await this.loadAccess(account.id).catch(() => ({ requireAuth: false, allowFrom: [], pairingCode: '' }))
      await this.ensurePairingCode(loaded).catch(() => undefined)
      await this.ensureSkillsDir(account.id).catch(() => undefined)
    }
  }

  async dispose() {
    this.disposed = true
    for (const state of this.accounts.values()) {
      await this.stopAccount(state).catch(() => undefined)
    }
    for (const dispose of this.disposers.splice(0)) {
      try {
        dispose()
      } catch {
        // The owning fiber may already have torn the route down.
      }
    }
    this.accounts.clear()
    this.sessionToAccount.clear()
  }

  publicState() {
    const accounts = [...this.accounts.values()].map((state) => {
      const agent =
        state.handle?.agent ??
        state.externalAgent ??
        this.ctx.agents.get(state.sessionId)
      return {
      id: state.account.id,
      label: state.account.label,
      status: state.status,
      hasCredentials: Boolean(state.credentials),
      messageCount: state.messageCount,
      lastMessageAt: state.lastMessageAt,
      lastError: state.lastError,
      workspace: this.workspaceForAccount(state.account),
      skillPath: this.skillPath(state.account.id),
      dirs: this.accountDirs(state.account.id),
      access: state.access,
      contacts: [...state.contacts.values()]
        .sort((a, b) => String(a.firstSeenAt ?? '').localeCompare(String(b.firstSeenAt ?? '')))
        .map((contact) => ({
          ...contact,
          allowed: this.senderAllowed(state, contact.senderId),
        })),
      customWorkspace: false,
      login: publicLogin(state.login),
      sessionId: state.sessionId,
      active: Boolean(agent && agent.status === 'running'),
    }
    })
    return {
      accounts,
      online: accounts.filter((account) => account.status === 'online').length,
      settings: {
        workspaceRoot: this.workspaceRoot,
        defaultWorkspaceRoot: this.defaultWorkspaceRoot,
        hardInterrupt: this.hardInterrupt,
      },
    }
  }

  find(accountId) {
    return this.accounts.get(accountId)
  }

  async addAccount(label) {
    const name = (label || '').trim() || `消息账号 ${this.accounts.size + 1}`
    const account = await createAccount(this.config.dataDir, name)
    const credentials = await loadCredentials(this.config.dataDir, account.id)
    this.accounts.set(account.id, {
      account,
      credentials,
      status: 'idle',
      login: null,
      runtime: null,
      controller: null,
      messageCount: 0,
      lastMessageAt: null,
      lastError: null,
      queue: [],
      handles: new Map(),
      externalAgents: new Map(),
      contextTokens: new Map(),
      typingTickets: new Map(),
      typing: null,
      typingGeneration: 0,
      access: { requireAuth: false, allowFrom: [], pairingCode: '' },
      skillContexts: new WeakSet(),
      contacts: new Map(),
      welcomed: new Set(),
      pendingWelcome: '',
      interrupting: false,
      suppressReply: false,
      busy: false,
      handle: null,
      pendingText: undefined,
      lastIncoming: undefined,
      externalAgent: null,
      sessionId: this.sessionIdFor(account.id, this.workspaceForAccount(account)),
    })
    const loaded = this.accounts.get(account.id)
    loaded.welcomed = await this.loadWelcomed(account.id)
    loaded.contacts = await this.loadContacts(account.id)
    loaded.contextTokens = await this.loadContextTokens(account.id).catch(() => new Map())
    loaded.access = await this.loadAccess(account.id).catch(() => ({ requireAuth: false, allowFrom: [], pairingCode: '' }))
    await this.ensurePairingCode(loaded).catch(() => undefined)
    await this.ensureSkillsDir(account.id).catch(() => undefined)
    return this.publicState()
  }

  async removeAccount(accountId) {
    const state = this.accounts.get(accountId)
    if (!state) throw new Error('账号不存在')
    await this.stopAccount(state)
    const accounts = (await loadAccounts(this.config.dataDir)).filter(
      (account) => account.id !== accountId,
    )
    await saveAccounts(this.config.dataDir, accounts)
    await rm(join(this.config.dataDir, 'amoayun-link', 'accounts', accountId), {
      recursive: true,
      force: true,
    })
    this.accounts.delete(accountId)
    return this.publicState()
  }

  async updateAccount(accountId, patch) {
    const state = this.accounts.get(accountId)
    if (!state) throw new Error('账号不存在')
    if (Object.prototype.hasOwnProperty.call(patch, 'workspace')) {
      throw new Error('所有会话共用 amoayun-link 工作区，不能再单独修改账号工作区')
    }
    if (!Object.prototype.hasOwnProperty.call(patch, 'label')) return this.publicState()
    const nextLabel = String(patch.label ?? '').trim()
    if (!nextLabel) throw new Error('账号备注不能为空')
    state.account.label = nextLabel
    void this.renameSessionTitle(accountId, state, nextLabel).catch(() => undefined)
    const accounts = await loadAccounts(this.config.dataDir)
    const target = accounts.find((account) => account.id === accountId)
    if (target) target.label = nextLabel
    await saveAccounts(this.config.dataDir, accounts)
    return this.publicState()
  }

  async updateWorkspaceRoot() {
    throw new Error('工作区由插件固定，不能修改')
  }

  async startLogin(accountId) {
    const state = this.accounts.get(accountId)
    if (!state) throw new Error('账号不存在')
    if (state.status === 'online' || state.status === 'connecting') {
      throw new Error('账号已连接，请先断开再重新扫码')
    }
    this.clearLogin(state)
    const client = new UpstreamClient({ baseUrl: this.config.baseUrl, requestTimeoutMs: 30_000 })
    const qr = await client.getBotQrcode()
    const content = qr.qrcode_img_content || qr.qrcode
    const image = await QRCode.toDataURL(content, {
      width: 280,
      margin: 1,
      errorCorrectionLevel: 'M',
    })
    state.login = {
      client,
      qrcode: qr.qrcode,
      content,
      image,
      status: 'wait',
      error: null,
      expiresAt: Date.now() + LOGIN_TTL_MS,
    }
    state.status = 'waiting_qr'
    state.lastError = null
    void this.pollLogin(accountId, state, state.login)
    return this.publicState()
  }

  clearLogin(state) {
    if (state.login?.timer !== undefined) clearTimeout(state.login.timer)
    state.login = null
  }

  async pollLogin(accountId, state, login) {
    while (!this.disposed && state.login === login) {
      if (Date.now() > login.expiresAt) {
        login.status = 'expired'
        login.error = '二维码已过期，请重新扫码'
        state.status = 'error'
        state.lastError = login.error
        return
      }
      try {
        const result = await login.client.getQrcodeStatus(login.qrcode)
        const status = result.status
        if (status === 'scaned') {
          login.status = 'scaned'
          state.status = 'scaned'
        } else if (status === 'confirmed') {
          if (!result.bot_token) throw new Error('扫码已确认，但 upstream 没有返回 bot_token')
          login.status = 'confirmed'
          state.credentials = {
            botToken: result.bot_token,
            baseUrl: result.baseurl || this.config.baseUrl,
            botId: result['i' + 'link_bot_id'],
            userId: result['i' + 'link_user_id'],
          }
          await saveCredentials(this.config.dataDir, accountId, state.credentials)
          state.login = null
          state.status = 'connecting'
          await this.connect(accountId)
          return
        } else if (status === 'expired') {
          login.status = 'expired'
          login.error = '二维码已过期，请重新扫码'
          state.status = 'error'
          state.lastError = login.error
          return
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error)
        // upstream can hold the status request until the user scans. A request
        // timeout is a normal poll boundary, not a failed login.
        if (/超时|timed?\s*out/i.test(message)) {
          await delay(LOGIN_POLL_MS)
          continue
        }
        login.status = 'error'
        login.error = message
        state.status = 'error'
        state.lastError = message
        return
      }
      await delay(LOGIN_POLL_MS)
    }
  }

  async connect(accountId) {
    const state = this.accounts.get(accountId)
    if (!state) throw new Error('账号不存在')
    if (!state.credentials) {
      state.credentials = await loadCredentials(this.config.dataDir, accountId)
    }
    if (!state.credentials) return this.startLogin(accountId)
    await this.stopRuntime(state)
    const controller = new AbortController()
    const runtime = new AccountRuntime({
      accountId,
      baseUrl: state.credentials.baseUrl,
      botToken: state.credentials.botToken,
      statePath: join(this.config.dataDir, 'amoayun-link', 'accounts', accountId, 'state.json'),
      logger: this.ctx.logger,
      pollTimeoutMs: 35_000,
    })
    state.controller = controller
    state.runtime = runtime
    state.status = 'connecting'
    state.lastError = null
    try {
      await runtime.start((message) => this.onMessage(accountId, message), controller.signal)
      state.status = 'online'
      this.sessionToAccount.set(state.sessionId, accountId)
      this.ctx.logger.info(`消息账号已连接: ${state.account.label}`)
    } catch (error) {
      state.status = 'error'
      state.lastError = error instanceof Error ? error.message : String(error)
      await this.stopRuntime(state)
    }
    return this.publicState()
  }

  async disconnect(accountId) {
    const state = this.accounts.get(accountId)
    if (!state) throw new Error('账号不存在')
    // Stop the transport but keep the Agent/session live so the conversation
    // stays visible in the workspace after disconnecting.
    await this.stopRuntime(state, { keepAgent: true })
    state.status = 'idle'
    state.lastError = null
    return this.publicState()
  }

  async cancel(accountId) {
    const state = this.accounts.get(accountId)
    if (!state) throw new Error('账号不存在')
    const agent =
      state.handle?.agent ??
      state.externalAgent ??
      this.ctx.agents.get(state.sessionId)
    if (agent) {
      state.interrupting = true
      state.suppressReply = false
      try {
        agent.cancel({ kind: 'user' })
      } catch (error) {
        this.ctx.logger.warn(
          `停止分析失败（${state.account.label}）: ${error instanceof Error ? error.message : String(error)}`,
        )
      }
    }
    state.pendingText = undefined
    // Keep busy/lastIncoming until the aborted turn's turn/end event settles,
    // so the queue cannot race ahead and so the stop reply is still sent.
    return this.publicState()
  }

  async stopRuntime(state, options = {}) {
    this.clearLogin(state)
    if (state.controller) state.controller.abort()
    if (state.runtime) await state.runtime.stop().catch(() => undefined)
    state.controller = null
    state.runtime = null
    state.typingGeneration += 1
    this.stopTyping(state)
    state.busy = false
    state.interrupting = false
    state.suppressReply = false
    state.queue.length = 0
    state.pendingText = undefined
    state.lastIncoming = undefined
    if (!options.keepAgent) {
      const handles = new Set(state.handles.values())
      if (state.handle) handles.add(state.handle)
      for (const handle of handles) {
        await handle.dispose().catch(() => undefined)
      }
      state.handles.clear()
      state.externalAgents.clear()
      state.externalAgent = null
      state.handle = null
      state.skillContexts = new WeakSet()
    }
    if (state.status === 'online' || state.status === 'connecting' || state.status === 'scaned' || state.status === 'waiting_qr') {
      state.status = 'idle'
    }
  }

  async stopAccount(state) {
    await this.stopRuntime(state)
  }

  onMessage(accountId, message) {
    const state = this.accounts.get(accountId)
    if (!state) return
    state.messageCount += 1
    state.lastMessageAt = new Date().toISOString()
    state.lastError = null
    this.recordInboundHistory(state, message)
    void this.ensureUserDir(accountId, message).catch(() => undefined)
    if (!this.config.autoReply) return
    if (!this.senderAllowed(state, message.senderId)) {
      void (async () => {
        try {
          if (await this.pairWithCode(state, message)) return
          await this.replyUnauthorized(state, message)
        } catch (error) {
          this.ctx.logger.warn(
            `配对处理失败: ${error instanceof Error ? error.message : String(error)}`,
          )
        }
      })()
      return
    }
    if (
      !message.raw?.dev &&
      message.chatType === 'single' &&
      this.config.welcomeMessage &&
      !state.welcomed.has(message.senderId)
    ) {
      state.welcomed.add(message.senderId)
      message.welcome = this.config.welcomeMessage
      void this.saveWelcomed(accountId, state.welcomed).catch((error) => {
        this.ctx.logger.warn(
          `欢迎语状态保存失败: ${error instanceof Error ? error.message : String(error)}`,
        )
      })
    }
    if (this.hardInterrupt && state.busy) {
      this.stopTyping(state)
      // The newest message supersedes everything already queued. Keep the
      // current message's first-contact welcome if the same contact sent it.
      if (
        state.pendingWelcome &&
        state.lastIncoming &&
        state.lastIncoming.senderId === message.senderId &&
        !message.welcome
      ) {
        message.welcome = state.pendingWelcome
      }
      state.interrupting = true
      state.suppressReply = true
      state.queue.length = 0
      const agent =
        state.handle?.agent ??
        state.externalAgent ??
        this.ctx.agents.get(state.sessionId)
      if (agent && agent.status === 'running') {
        try {
          agent.cancel({ kind: 'user' })
        } catch (error) {
          this.ctx.logger.warn(
            `硬打断当前分析失败（${state.account.label}）: ${error instanceof Error ? error.message : String(error)}`,
          )
        }
      }
    }
    state.queue.push(message)
    void this.drain(accountId)
  }

  async replyUnauthorized(state, message) {
    const text = state.access.pairingCode
      ? '当前账号需要授权。请回复管理员提供的 6 位配对码。'
      : '当前账号仅允许已授权联系人使用，请联系管理员授权后再试。'
    try {
      await this.sendDirectReply(state, message, text)
    } catch (error) {
      state.lastError = error instanceof Error ? error.message : String(error)
      this.ctx.logger.warn(`未授权提示发送失败: ${state.lastError}`)
    }
  }

  async drain(accountId) {
    const state = this.accounts.get(accountId)
    if (!state || state.busy) return
    const message = state.queue.shift()
    if (!message) return
    state.busy = true
    state.sessionId = this.sessionIdForMessage(accountId, message)
    state.lastIncoming = message
    state.pendingWelcome = message.welcome || ''
    state.pendingText = undefined
    try {
      await this.saveContextToken(accountId, message)
      void this.startTyping(state, message)
      const content = await this.buildContent(accountId, message)
      const agent = await this.ensureAgent(accountId, state)
      agent.followup(createUserMessage({ content, source: { kind: 'user' } }))
    } catch (error) {
      this.stopTyping(state)
      state.busy = false
      state.lastError = error instanceof Error ? error.message : String(error)
      this.ctx.logger.error(`消息消息转 Agent 失败: ${state.lastError}`)
      if (state.suppressReply) {
        state.suppressReply = false
        state.interrupting = false
        state.pendingWelcome = ''
        state.lastIncoming = undefined
      } else {
        await this.replyToIncoming(state, '抱歉，这条消息处理失败了，请稍后再试。')
      }
      void this.drain(accountId)
    }
  }

  onSessionEvent(session, event) {
    const accountId = this.sessionToAccount.get(String(session.id))
    if (!accountId) return
    const state = this.accounts.get(accountId)
    if (!state) return
    if (event.type === 'assistant/message') {
      try {
        const text = joinAssistantStreamText(event.data.stream).trim()
        if (text) state.pendingText = text
      } catch {
        // Ignore malformed stream fragments; a later event may carry text.
      }
      return
    }
    if (event.type === 'turn/end') {
      const reason = event.data?.reason
      if (reason && reason.kind !== 'completed') {
        const failure = reason.kind === 'error'
          ? '抱歉，这次处理失败了，请稍后再试。'
          : '已停止。'
        if (reason.kind === 'error') {
          state.lastError = 'Agent 请求失败，请检查模型配置或服务日志'
        }
        void this.finishTurn(accountId, failure)
        return
      }
      void this.finishTurn(accountId)
    }
  }

  async replyToIncoming(state, text) {
    const incoming = state.lastIncoming
    state.lastIncoming = undefined
    if (!incoming || incoming.raw?.dev || !state.runtime) return
    const welcome = state.pendingWelcome
    state.pendingWelcome = ''
    const body = [welcome, String(text ?? '').trim() || '收到。']
      .filter((part) => part)
      .join('\n\n')
    try {
      // One inbound message produces exactly one outbound message. The welcome
      // text is folded into the first reply for a new private contact.
      const chunks = splitReplyText(body)
      for (const chunk of chunks) {
        await state.runtime.sendReply(incoming.raw, chunk)
      }
      this.appendHistory(this.userDirFor(state.account.id, incoming), {
        direction: 'out',
        text: body,
        replyTo: incoming.raw?.message_id,
      })
    } catch (error) {
      state.lastError = error instanceof Error ? error.message : String(error)
      this.ctx.logger.error(`消息回复发送失败: ${state.lastError}`)
    }
  }

  async finishTurn(accountId, fallbackText) {
    const state = this.accounts.get(accountId)
    if (!state) return
    this.stopTyping(state)
    if (state.suppressReply) {
      // Hard-interrupted turn: no stop bubble for the superseded message.
      state.suppressReply = false
      state.pendingWelcome = ''
      state.pendingText = undefined
      state.lastIncoming = undefined
      state.busy = false
      state.interrupting = false
      void this.drain(accountId)
      return
    }
    const text = fallbackText || state.pendingText || '收到。'
    state.pendingText = undefined
    state.busy = false
    state.interrupting = false
    await this.replyToIncoming(state, text)
    void this.drain(accountId)
  }

  workspacePath(accountId) {
    const state = this.accounts.get(accountId)
    if (!state) throw new Error('账号不存在')
    return this.workspaceForAccount(state.account)
  }

  skillPath(accountId) {
    return join(this.config.dataDir, 'amoayun-link', 'accounts', accountId, 'skills')
  }

  welcomedPath(accountId) {
    return join(this.config.dataDir, 'amoayun-link', 'accounts', accountId, 'welcomed.json')
  }

  async loadWelcomed(accountId) {
    try {
      const parsed = JSON.parse(await readFile(this.welcomedPath(accountId), 'utf8'))
      return new Set(Array.isArray(parsed?.contacts) ? parsed.contacts.map(String) : [])
    } catch {
      return new Set()
    }
  }

  async saveWelcomed(accountId, welcomed) {
    const path = this.welcomedPath(accountId)
    await mkdir(join(path, '..'), { recursive: true, mode: 0o700 })
    await writeFile(path, `${JSON.stringify({ contacts: [...welcomed] }, null, 2)}\n`, {
      mode: 0o600,
    })
  }

  async ensureSkillsDir(accountId) {
    const dir = this.skillPath(accountId)
    await mkdir(dir, { recursive: true, mode: 0o700 })
    return dir
  }

  isLinkedWorkspace(cwd) {
    return Boolean(cwd) && resolve(cwd) === resolve(this.workspaceRoot)
  }

  installAgentSkills(state, accountId, agentCtx) {
    if (!agentCtx) return
    if (state.skillContexts.has(agentCtx)) return
    state.skillContexts.add(agentCtx)
    this.scopeAccounts.set(agentCtx, accountId)
    try {
      const scope = scopeOf(agentCtx)
      if (scope && scope !== agentCtx) this.scopeAccounts.set(scope, accountId)
    } catch (error) {
      this.ctx.logger.warn(
        `账号技能作用域解析失败（${accountId}）: ${error instanceof Error ? error.message : String(error)}`,
      )
    }
  }

  accountForSkillScope(scope) {
    if (!scope) return undefined
    const direct = this.scopeAccounts.get(scope)
    if (direct) return direct
    try {
      for (const key of scopeChainOf(scope)) {
        const accountId = this.scopeAccounts.get(key)
        if (accountId) return accountId
      }
    } catch (error) {
      // A non-scope object has no chain; fall through to no account.
    }
    return undefined
  }

  installSkills() {
    this.skillDisposer = this.ctx.skills.registerProvider((control) => {
      this.skillControl = control
      const service = this
      return {
        name: 'amoayun-link-skills',
        async list(options) {
          const accountId = service.accountForSkillScope(options.scope)
          if (!accountId) return []
          return service.skillProviderForAccount(accountId, control).list(options)
        },
        async get(candidate, options) {
          const accountId = service.accountForSkillScope(options.scope)
          if (!accountId) return undefined
          return service.skillProviderForAccount(accountId, control).get(candidate, options)
        },
      }
    })
    this.disposers.push(this.skillDisposer)
  }

  skillProviderForAccount(accountId, control) {
    let provider = this.skillProviders.get(accountId)
    if (!provider) {
      provider = new FileSystemSkillProvider(this.ctx, control, {
        providerName: 'amoayun-link-skills',
        includeDefaultRoots: false,
        customSkillDirs: [this.skillPath(accountId)],
        watch: true,
        watchUsePolling: false,
      })
      this.skillProviders.set(accountId, provider)
    }
    return provider
  }

  async openSkills(accountId) {
    const dir = await this.ensureSkillsDir(accountId)
    const command =
      process.platform === 'darwin' ? 'open' : process.platform === 'win32' ? 'explorer' : 'xdg-open'
    const child = spawn(command, [dir], { detached: true, stdio: 'ignore' })
    child.on('error', (error) => {
      this.ctx.logger.warn(`打开技能文件夹失败: ${error.message}`)
    })
    child.unref()
    return dir
  }

  async listSkills(accountId) {
    const dir = await this.ensureSkillsDir(accountId)
    const controller = new AbortController()
    const provider = new FileSystemSkillProvider(
      this.ctx,
      { signal: controller.signal, invalidate() {} },
      {
        providerName: 'amoayun-link-skills',
        includeDefaultRoots: false,
        customSkillDirs: [dir],
      },
    )
    try {
      const observed = await provider.list({ cwd: this.workspaceRoot })
      const candidates = Array.isArray(observed) ? observed : observed.candidates
      return candidates.map((skill) => ({
        name: skill.name,
        description: skill.description,
        source: skill.source,
      }))
    } finally {
      controller.abort()
      await provider.dispose().catch(() => undefined)
    }
  }

  async pickDirectory(req, res) {
    if (this.picking) {
      json(res, 409, { error: '已有文件夹选择框打开' })
      return
    }
    const capability = this.ctx.directoryPicker?.capability?.()
    if (!capability || capability.kind !== 'native') {
      json(res, 409, {
        error: '当前 DSH 目录选择器不是本机原生模式，请手动输入绝对路径',
        kind: capability?.kind ?? 'none',
      })
      return
    }
    this.picking = true
    const controller = new AbortController()
    const abort = () => controller.abort()
    req.once('aborted', abort)
    res.once('close', abort)
    try {
      const selected = await capability.pick(controller.signal)
      if (!res.writableEnded && !res.destroyed) json(res, 200, { path: selected ?? null })
    } catch (error) {
      if (res.writableEnded || res.destroyed) return
      if (controller.signal.aborted) json(res, 200, { path: null })
      else json(res, 400, { error: error instanceof Error ? error.message : String(error) })
    } finally {
      this.picking = false
      req.off('aborted', abort)
      res.off('close', abort)
    }
  }

  async loadContextTokens(accountId) {
    const tokens = new Map()
    const usersDir = join(this.workspaceRoot, 'users', accountId)
    let entries = []
    try {
      entries = await readdir(usersDir, { withFileTypes: true })
    } catch {
      return tokens
    }
    for (const entry of entries) {
      if (!entry.isDirectory()) continue
      try {
        const parsed = JSON.parse(await readFile(join(usersDir, entry.name, 'context-token.json'), 'utf8'))
        if (typeof parsed.contextToken === 'string' && parsed.contextToken) {
          tokens.set(entry.name, parsed.contextToken)
        }
      } catch {
        // No saved token yet.
      }
    }
    return tokens
  }

  accessPath(accountId) {
    return join(this.config.dataDir, 'amoayun-link', 'accounts', accountId, 'access.json')
  }

  async loadAccess(accountId) {
    try {
      const parsed = JSON.parse(await readFile(this.accessPath(accountId), 'utf8'))
      return {
        requireAuth: parsed.requireAuth === true,
        allowFrom: Array.isArray(parsed.allowFrom)
          ? parsed.allowFrom.map(String).filter(Boolean)
          : [],
        pairingCode: typeof parsed.pairingCode === 'string' ? parsed.pairingCode : '',
      }
    } catch {
      return { requireAuth: false, allowFrom: [] }
    }
  }

  async saveAccess(accountId, access) {
    const path = this.accessPath(accountId)
    await mkdir(join(this.config.dataDir, 'amoayun-link', 'accounts', accountId), {
      recursive: true,
      mode: 0o700,
    })
    await writeFile(path, `${JSON.stringify(access, null, 2)}\n`, { mode: 0o600 })
  }

  senderAllowed(state, senderId) {
    return !state.access.requireAuth || state.access.allowFrom.includes(String(senderId))
  }

  newPairingCode() {
    return String(Math.floor(100000 + Math.random() * 900000))
  }

  async ensurePairingCode(state) {
    if (!state.access.requireAuth || state.access.pairingCode) return state.access
    state.access = { ...state.access, pairingCode: this.newPairingCode() }
    await this.saveAccess(state.account.id, state.access)
    return state.access
  }

  async pairWithCode(state, message) {
    const code = String(state.access.pairingCode || '')
    if (!code) return false
    if (String(message.text || '').trim() !== code) return false
    if (!state.access.allowFrom.includes(message.senderId)) {
      state.access = {
        ...state.access,
        allowFrom: [...state.access.allowFrom, message.senderId],
      }
      await this.saveAccess(state.account.id, state.access)
    }
    await this.sendDirectReply(
      state,
      message,
      '授权成功，现在可以开始聊天了。',
    )
    return true
  }

  async sendDirectReply(state, message, text) {
    if (!state.runtime) return
    await state.runtime.sendReply(message.raw, text)
    this.appendHistory(this.userDirFor(state.account.id, message), {
      direction: 'out',
      text,
      replyTo: message.raw?.message_id,
    })
  }

  async saveContextToken(accountId, message) {
    const token = message.raw?.context_token
    if (typeof token !== 'string' || !token) return
    const dir = this.userDirFor(accountId, message)
    const key = basename(dir)
    const state = this.accounts.get(accountId)
    if (state) state.contextTokens.set(key, token)
    await mkdir(dir, { recursive: true, mode: 0o700 })
    await writeFile(
      join(dir, 'context-token.json'),
      `${JSON.stringify(
        {
          senderId: message.senderId,
          chatType: message.chatType || 'single',
          chatId: message.chatId || message.senderId,
          contextToken: token,
          updatedAt: new Date().toISOString(),
        },
        null,
        2,
      )}\n`,
      { mode: 0o600 },
    )
  }

  accountDirs(accountId) {
    const accountDir = join(this.config.dataDir, 'amoayun-link', 'accounts', accountId)
    const usersDir = join(this.workspaceRoot, 'users', accountId)
    return {
      workspace: this.workspaceRoot,
      account: accountDir,
      skills: join(accountDir, 'skills'),
      users: usersDir,
    }
  }

  async loadContacts(accountId) {
    const usersDir = join(this.workspaceRoot, 'users', accountId)
    const contacts = new Map()
    let entries = []
    try {
      entries = await readdir(usersDir, { withFileTypes: true })
    } catch {
      return contacts
    }
    for (const entry of entries) {
      if (!entry.isDirectory()) continue
      const dir = join(usersDir, entry.name)
      try {
        await mkdir(join(dir, 'history'), { recursive: true, mode: 0o700 })
        await mkdir(join(dir, 'media'), { recursive: true, mode: 0o700 })
        await mkdir(join(dir, 'files'), { recursive: true, mode: 0o700 })
        await this.migrateHistory(dir)
        const meta = JSON.parse(await readFile(join(dir, 'contact.json'), 'utf8'))
        contacts.set(entry.name, {
          id: entry.name,
          senderId: String(meta.senderId ?? ''),
          chatType: String(meta.chatType ?? 'single'),
          chatId: String(meta.chatId ?? ''),
          firstSeenAt: meta.firstSeenAt ?? null,
          path: dir,
          historyDir: join(dir, 'history'),
          mediaPath: join(dir, 'media'),
          filesDir: join(dir, 'files'),
        })
      } catch {
        // Ignore incomplete contact directories.
      }
    }
    return contacts
  }

  historyDate(entry) {
    const raw = entry.receivedAt || entry.ts
    const date = raw ? new Date(raw) : new Date()
    if (Number.isNaN(date.getTime())) return new Date().toISOString().slice(0, 10)
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }

  async migrateHistory(dir) {
    const oldPath = join(dir, 'history.jsonl')
    const historyDir = join(dir, 'history')
    await mkdir(historyDir, { recursive: true, mode: 0o700 })
    let raw
    try {
      raw = await readFile(oldPath, 'utf8')
    } catch {
      return
    }
    for (const line of raw.split('\n')) {
      if (!line.trim()) continue
      let entry = {}
      try { entry = JSON.parse(line) } catch { entry = {} }
      const target = join(historyDir, `${this.historyDate(entry)}.jsonl`)
      await appendFile(target, `${line}\n`, { mode: 0o600 })
    }
    await rm(oldPath, { force: true })
  }

  async directorySize(dir) {
    let info
    try {
      info = await lstat(dir)
    } catch {
      return 0
    }
    if (info.isSymbolicLink()) return 0
    if (info.isFile()) return info.size
    if (!info.isDirectory()) return 0
    let total = 0
    let entries = []
    try {
      entries = await readdir(dir, { withFileTypes: true })
    } catch {
      return total
    }
    for (const entry of entries) {
      total += await this.directorySize(join(dir, entry.name))
    }
    return total
  }

  async storageState() {
    const now = Date.now()
    if (this.storageCache.value && now - this.storageCache.at < 5000) {
      return this.storageCache.value
    }
    const accounts = {}
    let total = 0
    for (const [accountId, state] of this.accounts) {
      const contacts = {}
      let accountTotal = 0
      for (const contact of state.contacts.values()) {
        const size = await this.directorySize(contact.path)
        contacts[contact.id] = size
        accountTotal += size
      }
      accounts[accountId] = { total: accountTotal, contacts }
      total += accountTotal
    }
    const value = { total, accounts, at: new Date().toISOString() }
    this.storageCache = { at: now, value }
    return value
  }

  async openDirectory(input) {
    const root = resolve(this.config.dataDir, 'amoayun-link')
    const target = resolve(String(input ?? ''))
    if (target !== root && !target.startsWith(`${root}${sep}`)) {
      throw new Error('只能打开 Amoayun Link 工作区内的目录')
    }
    let info
    try {
      info = await stat(target)
    } catch (error) {
      if (error && typeof error === 'object' && 'code' in error && error.code === 'ENOENT') {
        await mkdir(target, { recursive: true, mode: 0o700 })
        info = await stat(target)
      } else {
        throw error
      }
    }
    if (!info.isDirectory()) throw new Error('该路径不是文件夹')
    const command =
      process.platform === 'darwin' ? 'open' : process.platform === 'win32' ? 'explorer' : 'xdg-open'
    const child = spawn(command, [target], { detached: true, stdio: 'ignore' })
    await new Promise((resolve, reject) => {
      child.once('error', reject)
      child.once('spawn', resolve)
    }).catch((error) => {
      this.ctx.logger.warn(`打开文件夹失败: ${error instanceof Error ? error.message : String(error)}`)
      throw new Error(`打开文件夹失败: ${error instanceof Error ? error.message : String(error)}`)
    })
    child.unref()
    return target
  }

  typingKey(message) {
    return `${message.chatType || 'single'}:${message.chatId || message.senderId}:${message.senderId}`
  }

  stopTyping(state) {
    state.typingGeneration += 1
    const active = state.typing
    state.typing = null
    if (!active) return
    if (active.timer) clearInterval(active.timer)
    if (active.ticket && state.runtime) {
      void state.runtime
        .sendTyping(active.senderId, active.ticket, 2)
        .catch(() => undefined)
    }
  }

  async typingTicketFor(state, message) {
    const senderId = String(message.senderId || '')
    if (!senderId || !state.runtime) return ''
    const cached = state.typingTickets.get(senderId)
    if (cached && Date.now() - cached.at < 12 * 60 * 60 * 1000) return cached.ticket
    const ticket = await state.runtime.getTypingTicket(senderId, message.raw?.context_token)
    if (ticket) state.typingTickets.set(senderId, { ticket, at: Date.now() })
    return ticket
  }

  async startTyping(state, message) {
    if (!state.runtime) return
    this.stopTyping(state)
    const generation = ++state.typingGeneration
    let ticket
    try {
      ticket = await this.typingTicketFor(state, message)
    } catch (error) {
      this.ctx.logger.debug(
        `typing ticket 获取失败: ${error instanceof Error ? error.message : String(error)}`,
      )
      return
    }
    if (!ticket || generation !== state.typingGeneration || !state.runtime) return
    try {
      await state.runtime.sendTyping(message.senderId, ticket, 1)
    } catch (error) {
      this.ctx.logger.debug(
        `typing 状态发送失败: ${error instanceof Error ? error.message : String(error)}`,
      )
      return
    }
    if (generation !== state.typingGeneration) return
    const timer = setInterval(() => {
      if (!state.runtime || !state.typing || state.typing.ticket !== ticket) return
      void state.runtime
        .sendTyping(message.senderId, ticket, 1)
        .catch(() => undefined)
    }, 5000)
    if (typeof timer.unref === 'function') timer.unref()
    state.typing = {
      key: this.typingKey(message),
      senderId: message.senderId,
      ticket,
      timer,
    }
  }

  mediaInfo(filePath) {
    const ext = extname(filePath).toLowerCase()
    const image = new Set(['.png', '.jpg', '.jpeg', '.gif', '.webp', '.bmp'])
    const video = new Set(['.mp4', '.mov', '.webm', '.mkv', '.avi'])
    if (image.has(ext)) return { kind: 'image', type: 1, mime: `image/${ext === '.jpg' ? 'jpeg' : ext.slice(1)}` }
    if (video.has(ext)) return { kind: 'video', type: 2, mime: `video/${ext.slice(1)}` }
    return { kind: 'file', type: 3, mime: 'application/octet-stream' }
  }

  async uploadOutboundMedia(state, filePath, toUserId) {
    if (!state.runtime) throw new Error('账号未连接')
    const info = this.mediaInfo(filePath)
    const data = await readFile(filePath)
    const rawsize = data.length
    if (rawsize > this.config.mediaOutboundMaxBytes) {
      throw new Error(`文件超过发送上限（${this.config.mediaOutboundMaxBytes} 字节）`)
    }
    const rawfilemd5 = createHash('md5').update(data).digest('hex')
    const filesize = Math.ceil((rawsize + 1) / 16) * 16
    const filekey = randomBytes(16).toString('hex')
    const aeskey = randomBytes(16)
    const cipher = createCipheriv('aes-128-ecb', aeskey, null)
    const ciphertext = Buffer.concat([cipher.update(data), cipher.final()])
    const upload = await state.runtime.getUploadUrl({
      filekey,
      mediaType: info.type,
      toUserId: toUserId || state.lastIncoming?.senderId,
      rawsize,
      rawfilemd5,
      filesize,
      aeskey: aeskey.toString('hex'),
    })
    const fullUrl = String(upload.upload_full_url ?? '').trim()
    const uploadParam = String(upload.upload_param ?? '').trim()
    let url = fullUrl
    if (!url && uploadParam) {
      url = `${this.config.cdnBaseUrl.replace(/\/+$/, '')}/upload?encrypted_query_param=${encodeURIComponent(uploadParam)}&filekey=${encodeURIComponent(filekey)}`
    }
    if (!url) throw new Error('上传地址缺失')
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/octet-stream' },
      body: ciphertext,
    })
    if (!response.ok) {
      throw new Error(`媒体上传失败: HTTP ${response.status}`)
    }
    const downloadParam = response.headers.get('x-encrypted-param')
    if (!downloadParam) throw new Error('媒体上传缺少 x-encrypted-param')
    const media = {
      encrypt_query_param: downloadParam,
      // Protocol expects base64 of the 32-char hex key, not base64 of raw 16 bytes.
      aes_key: Buffer.from(aeskey.toString('hex'), 'ascii').toString('base64'),
      encrypt_type: 1,
    }
    let item
    if (info.kind === 'image') {
      item = { type: 2, image_item: { media, mid_size: filesize } }
    } else if (info.kind === 'video') {
      item = { type: 5, video_item: { media, video_size: filesize } }
    } else {
      item = {
        type: 4,
        file_item: { media, file_name: basename(filePath), len: String(rawsize) },
      }
    }
    return { item, info, rawsize, filesize }
  }

  async sendChatMedia(accountId, message, filePath, caption = '') {
    const state = this.accounts.get(accountId)
    if (!state) throw new Error('账号不存在')
    const workspace = resolve(this.workspacePath(accountId))
    const target = resolve(filePath)
    if (target !== workspace && !target.startsWith(`${workspace}${sep}`)) {
      throw new Error('只能发送 Amoayun Link 工作区内的文件')
    }
    const info = await stat(target)
    if (!info.isFile()) throw new Error('路径不是文件')
    if (!message.raw?.context_token) {
      const token = state.contextTokens.get(basename(this.userDirFor(accountId, message)))
      if (token) message.raw = { ...message.raw, context_token: token }
    }
    const uploaded = await this.uploadOutboundMedia(state, target, message.senderId)
    const text = String(caption ?? '').trim()
    if (text) {
      for (const chunk of splitReplyText(text)) {
        await state.runtime.sendReply(message.raw, chunk)
      }
    }
    await state.runtime.sendItem(message.raw, uploaded.item)
    this.appendHistory(this.userDirFor(accountId, message), {
      direction: 'out',
      event: 'media',
      text,
      files: [
        {
          kind: uploaded.info.kind,
          fileName: basename(target),
          localPath: target,
          size: uploaded.rawsize,
        },
      ],
      replyTo: message.raw?.message_id,
    })
    return { path: target, kind: uploaded.info.kind }
  }

  installMediaTool() {
    if (this.mediaToolInstalled) return
    this.mediaToolInstalled = true
    const service = this
    this.ctx.tools.register(defineTool({
      name: 'send_chat_media',
      description:
        'Send a local image, video, or file from the Amoayun Link workspace to the current chat user. Use this only when the user asks you to send or return a file.',
      parameters: {
        path: { type: 'string', required: true, description: 'Local file path, preferably under the current user files directory.' },
        caption: { type: 'string', description: 'Optional short text sent before the media.' },
      },
      output: {
        schema: {
          type: 'object',
          additionalProperties: false,
          properties: {
            sent: { type: 'boolean', required: true },
            path: { type: 'string', required: true },
            kind: { type: 'string', required: true },
          },
        },
        render: (_args, value) => [
          { type: 'text', text: `已发送${value.kind}：${value.path}` },
        ],
      },
      async execute(args, exec) {
        const agentId = exec.agent ? String(exec.agent.id) : ''
        const accountId = service.sessionToAccount.get(agentId)
        if (!accountId) throw new Error('当前会话不是 Amoayun Link 联系人会话')
        const state = service.accounts.get(accountId)
        if (!state || state.sessionId !== agentId || !state.lastIncoming) {
          throw new Error('当前没有可发送的联系人消息')
        }
        const target = isAbsolute(args.path)
          ? args.path
          : resolve(service.workspacePath(accountId), args.path)
        const result = await service.sendChatMedia(
          accountId,
          state.lastIncoming,
          target,
          args.caption || '',
        )
        return { sent: true, path: result.path, kind: result.kind }
      },
    }))
  }

  quoteBodyFromRef(ref) {
    const parts = []
    if (typeof ref?.title === 'string' && ref.title.trim()) parts.push(ref.title.trim())
    const item = ref?.message_item
    if (item) {
      if (typeof item.text_item?.text === 'string' && item.text_item.text.trim()) {
        parts.push(item.text_item.text.trim())
      }
      if (typeof item.voice_item?.text === 'string' && item.voice_item.text.trim()) {
        parts.push(item.voice_item.text.trim())
      }
    }
    return parts.join(' | ')
  }

  async findHistoryMessage(accountId, message, id) {
    const dir = join(this.userDirFor(accountId, message), 'history')
    let files = []
    try {
      files = (await readdir(dir)).filter((name) => name.endsWith('.jsonl')).sort().reverse()
    } catch {
      return ''
    }
    for (const file of files) {
      let raw
      try {
        raw = await readFile(join(dir, file), 'utf8')
      } catch {
        continue
      }
      const lines = raw.split('\n')
      for (let i = lines.length - 1; i >= 0; i -= 1) {
        if (!lines[i].trim()) continue
        let entry
        try {
          entry = JSON.parse(lines[i])
        } catch {
          continue
        }
        if (String(entry.messageId ?? '') === String(id)) {
          if (typeof entry.text === 'string' && entry.text.trim()) return entry.text.trim()
          const filesInfo = Array.isArray(entry.files) ? entry.files : []
          const kind = filesInfo[0]?.kind
          if (kind) return `[${kind}]`
        }
        if (String(entry.replyTo ?? '') === String(id) && typeof entry.text === 'string') {
          return entry.text.trim()
        }
      }
    }
    return ''
  }

  async quoteContext(accountId, message) {
    const items = Array.isArray(message.raw?.item_list) ? message.raw.item_list : []
    const item = items.find((entry) => entry && entry.ref_msg)
    const ref = item?.ref_msg
    if (!ref) return ''
    let body = this.quoteBodyFromRef(ref)
    if (!body) {
      const id = String(ref.svr_id || ref.message_item?.msg_id || '').trim()
      if (id) body = await this.findHistoryMessage(accountId, message, id)
    }
    if (!body) body = '[引用消息内容未缓存]'
    return body
  }

  appendHistory(dir, entry) {
    const historyDir = join(dir, 'history')
    const path = join(historyDir, `${this.historyDate(entry)}.jsonl`)
    const line = `${JSON.stringify({ ts: new Date().toISOString(), ...entry })}\n`
    const previous = this.historyWrites.get(path) ?? Promise.resolve()
    const next = previous
      .then(async () => {
        await mkdir(historyDir, { recursive: true, mode: 0o700 })
        await appendFile(path, line, { mode: 0o600 })
      })
      .catch((error) => {
        this.ctx.logger.warn(
          `聊天记录写入失败: ${error instanceof Error ? error.message : String(error)}`,
        )
      })
    this.historyWrites.set(path, next)
    void next.finally(() => {
      if (this.historyWrites.get(path) === next) this.historyWrites.delete(path)
    })
  }

  recordInboundHistory(state, message) {
    const dir = this.userDirFor(state.account.id, message)
    this.appendHistory(dir, {
      direction: 'in',
      kind: message.kind,
      text: message.text,
      senderId: message.senderId,
      chatType: message.chatType,
      chatId: message.chatId,
      messageId: message.raw?.message_id,
      receivedAt: message.raw?.create_time_ms
        ? new Date(message.raw.create_time_ms).toISOString()
        : undefined,
    })
  }

  userDirFor(accountId, message) {
    const key = createHash('sha256')
      .update(`${message.chatType || 'single'}:${message.chatId || message.senderId}:${message.senderId}`)
      .digest('hex')
      .slice(0, 12)
    return join(this.workspacePath(accountId), 'users', accountId, key)
  }

  async ensureUserDir(accountId, message) {
    const dir = this.userDirFor(accountId, message)
    await mkdir(join(dir, 'media'), { recursive: true, mode: 0o700 })
    await mkdir(join(dir, 'history'), { recursive: true, mode: 0o700 })
    await mkdir(join(dir, 'files'), { recursive: true, mode: 0o700 })
    const metaPath = join(dir, 'contact.json')
    try {
      await writeFile(
        metaPath,
        `${JSON.stringify(
          {
            accountId,
            senderId: message.senderId,
            chatType: message.chatType || 'single',
            chatId: message.chatId || message.senderId,
            firstSeenAt: new Date().toISOString(),
          },
          null,
          2,
        )}\n`,
        { mode: 0o600, flag: 'wx' },
      )
    } catch (error) {
      if (!(error && typeof error === 'object' && 'code' in error && error.code === 'EEXIST')) throw error
    }
    const state = this.accounts.get(accountId)
    if (state) {
      const id = basename(dir)
      state.contacts.set(id, {
        id,
        senderId: message.senderId,
        chatType: message.chatType || 'single',
        chatId: message.chatId || message.senderId,
        firstSeenAt: state.contacts.get(id)?.firstSeenAt ?? new Date().toISOString(),
        path: dir,
        historyDir: join(dir, 'history'),
        mediaPath: join(dir, 'media'),
        filesDir: join(dir, 'files'),
      })
    }
    return dir
  }

  async buildContent(accountId, message) {
    const sender = message.chatType === 'group' ? '群聊' : '私聊'
    const pieces = [`来自消息${sender}（发送者 ${message.senderId}）`]
    let messageText = message.text
    if (!messageText) {
      messageText = (message.raw?.item_list ?? [])
        .flatMap((item) => [
          typeof item.text_item?.text === 'string' ? item.text_item.text : '',
          typeof item.voice_item?.text === 'string' ? item.voice_item.text : '',
        ])
        .filter(Boolean)
        .join('\n')
        .trim()
    }
    if (messageText) pieces.push(messageText)
    const userDir = await this.ensureUserDir(accountId, message)
    const outputDir = join(userDir, 'files')
    const quote = await this.quoteContext(accountId, message).catch(() => '')
    if (quote) pieces.unshift(`[引用消息] ${quote}`)
    pieces.unshift(
      `[Conversation workspace]\n` +
        `sender: ${message.senderId}\n` +
        `default output directory: ${outputDir}\n` +
        `When the user does not specify a path, save every generated file under this directory and never at the workspace root or the user directory root.`,
    )
    const content = [{ type: 'text', text: pieces.join('\n') }]
    const mediaStore = new MediaStore({
      dir: join(userDir, 'media'),
      cdnBaseUrl: this.config.cdnBaseUrl,
      maxBytes: this.config.mediaMaxBytes,
      timeoutMs: this.config.mediaTimeoutMs,
    })
    const media = await mediaStore.downloadAll(message.raw)
    for (const item of media) {
      const label = item.kind === 'image' ? '图片' : item.kind === 'file' ? '文件' : item.kind === 'video' ? '视频' : '语音'
      if (item.error) {
        content.push({ type: 'text', text: `[${label}处理失败] ${item.error}` })
        continue
      }
      if (!item.data) continue
      if (item.kind === 'voice') {
        // Audio is archived by MediaStore. The Agent receives the
        // transcript from voice_item.text; never add a file block for audio.
        continue
      }
      if (item.kind === 'image' && ['image/png', 'image/jpeg', 'image/webp', 'image/gif'].includes(item.mimeType)) {
        try {
          const attachment = await this.ctx.attachments.saveImage({
            data: item.data,
            mediaType: item.mimeType,
            name: item.fileName,
          })
          content.push({ type: 'text', text: `[图片 ${item.fileName ?? ''}]` })
          content.push({ type: 'image', attachment })
          continue
        } catch (error) {
          content.push({
            type: 'text',
            text: `[图片 ${item.fileName ?? ''}] 未作为图片附件接收（${error instanceof Error ? error.message : String(error)}），已保存到 ${item.localPath}`,
          })
        }
      }
      try {
        const attachment = await this.ctx.attachments.saveFile({
          data: item.data,
          name: item.fileName || `${item.kind}-${Date.now()}`,
        })
        const note =
          item.kind === 'voice'
            ? `[语音 ${item.fileName ?? ''}] 消息没有提供转写，音频已保存为文件；当前不能自动识别音频内容。`
            : `[${label} ${item.fileName ?? ''}]`
        content.push({ type: 'text', text: note })
        content.push({ type: 'file', attachment })
      } catch (error) {
        content.push({
          type: 'text',
          text: `[${label} ${item.fileName ?? ''}] 已保存到 ${item.localPath}，但无法作为附件交给 Agent：${error instanceof Error ? error.message : String(error)}`,
        })
      }
    }
    if (media.length > 0) {
      this.appendHistory(userDir, {
        direction: 'in',
        event: 'media',
        files: media.map((item) => ({
          kind: item.kind,
          fileName: item.fileName,
          mimeType: item.mimeType,
          localPath: item.localPath,
          size: item.size,
          error: item.error,
        })),
      })
    }
    const voiceItems = (message.raw?.item_list ?? []).filter((item) => item.voice_item)
    const hasVoiceTranscript = voiceItems.some(
      (item) => typeof item.voice_item?.text === 'string' && item.voice_item.text.trim().length > 0,
    )
    if (voiceItems.length > 0 && !hasVoiceTranscript) {
      const hasSavedVoice = media.some((item) => item.kind === 'voice' && item.data)
      const hasVoiceMedia = voiceItems.some((item) => item.voice_item?.media !== undefined)
      content.push({
        type: 'text',
        text: hasSavedVoice
          ? '[语音消息已保存为音频文件；消息没有提供转写，当前不能自动识别音频内容。]'
          : hasVoiceMedia
            ? '[语音消息下载失败；消息没有提供转写，当前不能自动识别音频内容。]'
            : '[语音消息没有提供转写，也没有可下载的音频。]',
      })
    }
    if (content.length === 1 && !message.text && media.length === 0) {
      content.push({ type: 'text', text: '[收到一条暂不支持的消息类型]' })
    }
    return content
  }

  setSessionTitle(session, label) {
    try {
      const current = this.ctx.sessionTitle.get(session)
      if (current?.title === label && current.source?.kind === 'user') return true
      this.ctx.sessionTitle.rename(session, label)
      return true
    } catch (error) {
      this.ctx.logger.warn(
        `消息会话标题设置失败（${label}）: ${error instanceof Error ? error.message : String(error)}`,
      )
      return false
    }
  }

  applySessionTitle(accountId, state, label) {
    const agent =
      state.handle?.agent ??
      state.externalAgent ??
      this.ctx.agents.get(state.sessionId)
    if (!agent) return false
    return this.setSessionTitle(agent.session, label ?? state.account.label)
  }

  async renameSessionTitle(accountId, state, label) {
    // The live path is cheap. For a persisted-but-offline session, resume only
    // long enough to append the user title, then release it. Discovery stays
    // side-effect free when the session has never been created.
    if (this.applySessionTitle(accountId, state, label)) return true
    let handle
    try {
      handle = await this.ctx.agents.resume({ resumeSessionId: state.sessionId })
    } catch {
      return false
    }
    try {
      return this.setSessionTitle(handle.agent.session, label ?? state.account.label)
    } finally {
      await handle.dispose().catch(() => undefined)
    }
  }

  async syncExistingSessionTitles() {
    for (const [accountId, state] of this.accounts) {
      await this.renameSessionTitle(accountId, state, state.account.label).catch(() => undefined)
    }
  }

  applyLinkedSessionPolicy(agent) {
    try {
      if (this.config.permissionPreset) {
        this.ctx.permissionPresets.set(agent.session, this.config.permissionPreset)
        // The full-access preset pins approval=never; asks would be rejected.
        // Keep the sandbox full and let the prepended Amoayun Link approval listener
        // grant every ask instead.
        setApprovalPolicy(agent.session, 'ask')
      }
    } catch (error) {
      this.ctx.logger.warn(
        `消息会话设置权限预设失败（${this.config.permissionPreset}）: ${error instanceof Error ? error.message : String(error)}`,
      )
    }
  }

  adoptLiveAgent(accountId, state, agent) {
    state.handle = null
    state.externalAgent = agent
    state.externalAgents.set(state.sessionId, agent)
    this.applyLinkedSessionPolicy(agent)
    this.installAgentSkills(state, accountId, agent.ctx)
    this.applySessionTitle(accountId, state, state.account.label)
    this.sessionToAccount.set(state.sessionId, accountId)
    this.ctx.logger.info(`消息会话复用工作台已打开的 Agent: ${state.sessionId}`)
    return agent
  }

  async ensureAgent(accountId, state) {
    const knownHandle = state.handles.get(state.sessionId)
    if (knownHandle) {
      state.handle = knownHandle
      state.externalAgent = null
      return knownHandle.agent
    }
    const knownExternal = state.externalAgents.get(state.sessionId)
    if (knownExternal) {
      state.handle = null
      state.externalAgent = knownExternal
      return knownExternal
    }
    const live = this.ctx.agents.get(state.sessionId)
    if (live) {
      const agent = this.adoptLiveAgent(accountId, state, live)
      await this.attachSessionToWorkspace(state.sessionId)
      return agent
    }
    const workspace = this.workspacePath(accountId)
    await mkdir(workspace, { recursive: true, mode: 0o700 })
    await this.ensureSkillsDir(accountId).catch(() => undefined)
    let agentOptions
    if (this.config.provider && this.config.model) {
      agentOptions = { provider: this.config.provider, model: this.config.model }
    } else {
      const selection = this.ctx.agentDefaultModel?.currentSelection?.()
      if (selection?.provider && selection?.model) {
        agentOptions = {
          provider: selection.provider,
          model: selection.model,
          ...(selection.reasoningEffort ? { reasoningEffort: selection.reasoningEffort } : {}),
        }
      }
    }

    const presetId = this.config.agentPreset || this.ctx.agentPresets.defaultId
    const preset = await this.ctx.agentPresets.resolve(presetId)
    const presetScope = await this.ctx.agentPresets.acquireScope(preset.id)
    const setup = async (agentCtx) => {
      this.installAgentSkills(state, accountId, agentCtx)
      await this.ctx.agentPresets.mount(agentCtx, preset.id)
    }
    try {
      try {
        state.handle = await this.ctx.agents.resume({
          resumeSessionId: state.sessionId,
          ...(agentOptions === undefined ? {} : { agentOptions }),
          setup,
        })
      } catch {
        const adopted = this.ctx.agents.get(state.sessionId)
        if (adopted) return this.adoptLiveAgent(accountId, state, adopted)
        state.handle = await this.ctx.agents.create({
          sessionId: state.sessionId,
          meta: { cwd: workspace, agentPreset: preset.id },
          ...(agentOptions === undefined ? {} : { agentOptions }),
          setup,
        })
      }
    } finally {
      await presetScope[Symbol.asyncDispose]()
    }
    state.handles.set(state.sessionId, state.handle)
    this.applyLinkedSessionPolicy(state.handle.agent)
    this.applySessionTitle(accountId, state, state.account.label)
    this.sessionToAccount.set(state.sessionId, accountId)
    await this.attachSessionToWorkspace(state.sessionId)
    return state.handle.agent
  }

  authorized(req) {
    return req.headers['x-amoayun-link-token'] === this.token
  }

  async handleApi(req, res) {
    if (!this.authorized(req)) {
      json(res, 401, { error: 'unauthorized' })
      return
    }
    try {
      const url = new URL(req.url ?? '/', 'http://localhost')
      const path = url.pathname.slice('/amoayun-link-api'.length) || '/'
      const method = req.method ?? 'GET'

      if (method === 'GET' && (path === '/state' || path === '/')) {
        json(res, 200, this.publicState())
        return
      }
      if (method === 'GET' && path === '/health') {
        json(res, 200, { ok: true, accounts: this.accounts.size })
        return
      }
      if (method === 'GET' && path === '/sessions') {
        json(res, 200, {
          sessionIds: [...this.accounts.values()].map((state) => state.sessionId),
        })
        return
      }
      if (method === 'GET' && path === '/picker') {
        const capability = this.ctx.directoryPicker?.capability?.()
        json(res, 200, { kind: capability?.kind ?? 'none', native: capability?.kind === 'native' })
        return
      }
      if (method === 'POST' && path === '/pick-directory') {
        await this.pickDirectory(req, res)
        return
      }
      if (method === 'GET' && path === '/storage') {
        json(res, 200, await this.storageState())
        return
      }
      if (method === 'POST' && path === '/open-path') {
        const body = await readJson(req)
        json(res, 200, { path: await this.openDirectory(body.path) })
        return
      }
      if (method === 'GET' && path === '/settings') {
        json(res, 200, {
          workspaceRoot: this.workspaceRoot,
          defaultWorkspaceRoot: this.defaultWorkspaceRoot,
          hardInterrupt: this.hardInterrupt,
        })
        return
      }
      if (method === 'PUT' && path === '/settings') {
        const body = await readJson(req)
        if (Object.prototype.hasOwnProperty.call(body, 'workspaceRoot')) {
          throw new Error('工作区由插件固定，不能修改')
        }
        if (typeof body.hardInterrupt === 'boolean') {
          this.hardInterrupt = body.hardInterrupt
          await this.saveSettings()
        }
        json(res, 200, this.publicState())
        return
      }
      const accessMatch = /^\/accounts\/([^/]+)\/access$/.exec(path)
      if (method === 'PUT' && accessMatch) {
        const state = this.find(decodeURIComponent(accessMatch[1]))
        if (!state) throw new Error('账号不存在')
        const body = await readJson(req)
        state.access = {
          ...state.access,
          requireAuth: body.requireAuth === true,
        }
        if (state.access.requireAuth && !state.access.pairingCode) {
          state.access = { ...state.access, pairingCode: this.newPairingCode() }
        }
        await this.saveAccess(state.account.id, state.access)
        json(res, 200, this.publicState())
        return
      }
      const pairingMatch = /^\/accounts\/([^/]+)\/pairing-code$/.exec(path)
      if (method === 'POST' && pairingMatch) {
        const state = this.find(decodeURIComponent(pairingMatch[1]))
        if (!state) throw new Error('账号不存在')
        state.access = { ...state.access, pairingCode: this.newPairingCode() }
        await this.saveAccess(state.account.id, state.access)
        json(res, 200, this.publicState())
        return
      }
      const allowMatch = /^\/accounts\/([^/]+)\/allow$/.exec(path)
      if (method === 'POST' && allowMatch) {
        const state = this.find(decodeURIComponent(allowMatch[1]))
        if (!state) throw new Error('账号不存在')
        const body = await readJson(req)
        const senderId = String(body.senderId ?? '').trim()
        if (!senderId) throw new Error('senderId 不能为空')
        const allowed = body.allowed === true
        const set = new Set(state.access.allowFrom)
        if (allowed) set.add(senderId)
        else set.delete(senderId)
        state.access = { ...state.access, allowFrom: [...set] }
        await this.saveAccess(state.account.id, state.access)
        json(res, 200, this.publicState())
        return
      }
      if (process.env.AMOAYUN_LINK_DEV === '1' && method === 'POST' && path === '/dev/message') {
        const body = await readJson(req)
        const state = this.find(body.accountId)
        if (!state) throw new Error('账号不存在')
        state.status = 'online'
        const senderId = String(body.senderId || 'dev')
        const chatId = String(body.chatId || senderId)
        const raw = {
          dev: true,
          context_token: 'dev',
          from_user_id: senderId,
          to_user_id: 'bot',
          message_id: Date.now(),
          create_time_ms: Date.now(),
        }
        if (Array.isArray(body.itemList)) {
          raw.item_list = body.itemList
        } else {
          raw.item_list = [{ type: 1, text_item: { text: String(body.text || '你好') } }]
        }
        this.onMessage(body.accountId, {
          text: String(body.text || ''),
          senderId,
          chatType: 'single',
          chatId,
          raw,
        })
        json(res, 200, this.publicState())
        return
      }

      const addMatch = /^\/accounts$/.exec(path)
      if (method === 'POST' && addMatch) {
        const body = await readJson(req)
        json(res, 200, await this.addAccount(body.label))
        return
      }

      const openSkillsMatch = /^\/accounts\/([^/]+)\/open-skills$/.exec(path)
      if (method === 'POST' && openSkillsMatch) {
        const accountId = decodeURIComponent(openSkillsMatch[1])
        json(res, 200, { path: await this.openSkills(accountId) })
        return
      }
      const skillsMatch = /^\/accounts\/([^/]+)\/skills$/.exec(path)
      if (method === 'GET' && skillsMatch) {
        const accountId = decodeURIComponent(skillsMatch[1])
        json(res, 200, { skills: await this.listSkills(accountId) })
        return
      }

      const accountMatch = /^\/accounts\/([^/]+)$/.exec(path)
      if (accountMatch) {
        const accountId = decodeURIComponent(accountMatch[1])
        if (method === 'DELETE') {
          json(res, 200, await this.removeAccount(accountId))
          return
        }
        if (method === 'PATCH' || method === 'PUT') {
          const body = await readJson(req)
          json(res, 200, await this.updateAccount(accountId, body))
          return
        }
      }

      const actionMatch = /^\/accounts\/([^/]+)\/(login|connect|disconnect|cancel)$/.exec(path)
      if (actionMatch && method === 'POST') {
        const accountId = decodeURIComponent(actionMatch[1])
        const action = actionMatch[2]
        if (action === 'login') json(res, 200, await this.startLogin(accountId))
        else if (action === 'connect') json(res, 200, await this.connect(accountId))
        else if (action === 'cancel') json(res, 200, await this.cancel(accountId))
        else json(res, 200, await this.disconnect(accountId))
        return
      }

      const loginMatch = /^\/accounts\/([^/]+)\/login$/.exec(path)
      if (loginMatch && method === 'GET') {
        const accountId = decodeURIComponent(loginMatch[1])
        const state = this.find(accountId)
        if (!state) throw new Error('账号不存在')
        json(res, 200, publicLogin(state.login) ?? { status: 'none' })
        return
      }

      json(res, 404, { error: 'not found' })
    } catch (error) {
      json(res, 400, { error: error instanceof Error ? error.message : String(error) })
    }
  }
}
