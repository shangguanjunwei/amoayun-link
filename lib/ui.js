/**
 * Injected workspace panel for Amoayun Link account management.
 *
 * The script is served from the DSH Web host and runs inside a shadow root so
 * the workspace's global CSS cannot collide with the panel. It talks only to
 * the same-origin `/amoayun-link-api` control routes.
 */
export const PANEL_UI_JS = String.raw`
(function () {
  if (window.__AMOAYUN_LINK_UI__) return
  window.__AMOAYUN_LINK_UI__ = true

  var tokenMeta = document.querySelector('meta[name="amoayun-link-token"]')
  var langMeta = document.querySelector('meta[name="amoayun-link-lang"]')
  var config = window.__AMOAYUN_LINK__
  var token = (config && config.token) || (tokenMeta ? tokenMeta.getAttribute('content') : '')
  // Chinese is the default. Set AMOAYUN_LINK_LANG=en to opt into English.
  var lang = (langMeta && langMeta.getAttribute('content')) || 'zh-CN'
  var zh = lang.toLowerCase().indexOf('zh') === 0
  var text = zh
    ? {
        title: 'Amoayun Link',
        subtitle: '扫码接入消息账号；文字、图片、文件和语音转写自动进入 Agent',
        pluginSettings: '插件设置',
        accountSettings: '账户设置',
        addPlaceholder: '账号备注，例如：爸爸',
        add: '添加消息账号',
        workspaceRoot: 'Amoayun Link 工作区',
        workspaceHint: '所有账号的会话都使用这个固定工作区；面板不支持修改。',
        workspaceFixed: '工作区由插件固定，不能在此修改。',
        workspace: '工作区',
        accountDir: '账号目录',
        usersDir: '用户目录',
        userFiles: '用户文件',
        userFile: '用户',
        noUserFiles: '还没有用户文件',
        historyFile: '聊天记录',
        mediaDir: '媒体目录',
        filesDir: '文件目录',
        accessControl: '访问控制',
        requireAuth: '仅允许已授权联系人',
        authorized: '已授权',
        unauthorized: '未授权',
        authorize: '授权',
        revoke: '取消授权',
        pairingCode: '配对码',
        regeneratePairing: '重新生成',
        storage: '存储',
        workspacePrompt: '输入该账号的工作区绝对路径；留空恢复默认',
        workspaceRootPrompt: '输入消息工作区根目录的绝对路径',
        workspaceConfirm: '修改工作区会断开在线账号，并为受影响的账号使用新的 DSH session（旧 session 保留）。继续？',
        pendingAccount: '将账号「{label}」的工作区改为：',
        pendingRoot: '将消息工作区根目录改为：',
        pendingWarning: '修改后会断开在线账号，并使用新的 DSH session；旧 session 保留。',
        fullAccessHint: '消息会话固定使用完全权限（danger-full-access），不再询问审批；请只绑定可信账号。',
        save: '保存',
        reset: '默认',
        pickFolder: '选择目录',
        hardInterrupt: '新消息到达时取消当前分析（硬打断）',
        hardInterruptHint: '默认关闭。开启后，Agent 正在分析时收到新消息，会取消当前 turn；旧消息不再回复，直接处理并回复最新消息。',
        skills: '技能',
        open: '打开',
        confirmChange: '确认修改',
        cancel: '取消',
        empty: '还没有消息账号，先添加一个，再点「连接」扫码。',
        connect: '连接',
        disconnect: '断开',
        stop: '停止分析',
        login: '重新扫码',
        rename: '改名',
        renamePrompt: '输入新的账号备注',
        renameTitle: '修改账号备注',
        renameHint: '只改变面板显示名称，不影响账号登录或工作区。',
        workspacePathTitle: '输入工作区路径',
        workspacePathHint: '请输入绝对路径；留空恢复默认，目录不存在会自动创建。修改路径会断开在线账号并使用新的 session。',
        remove: '删除',
        copy: '复制二维码链接',
        copied: '链接已复制',
        online: '在线',
        count: '个账号在线',
        messages: '条消息',
        noLogin: '未登录',
        loggedIn: '已登录',
        status: {
          idle: '未连接',
          waiting_qr: '等待扫码',
          scaned: '已扫码，等待确认',
          connecting: '连接中',
          online: '在线',
          error: '连接异常'
        },
        loginStatus: {
          wait: '请用手机扫描二维码',
          scaned: '已扫描，请在手机上确认',
          confirmed: '登录成功，正在连接…',
          expired: '二维码已过期',
          error: '获取二维码失败',
          none: '未开始扫码'
        },
        confirmDelete: '删除后该账号的登录凭据和游标会清除，聊天记录保留。继续？',
        close: '关闭'
      }
    : {
        title: 'Amoayun Link',
        subtitle: 'Scan to connect; text, images, files and voice go to the Agent',
        pluginSettings: 'Plugin settings',
        accountSettings: 'Accounts',
        addPlaceholder: 'Account label, e.g. Dad',
        add: 'Add account',
        workspaceRoot: 'Amoayun Link workspace',
        workspaceHint: 'All accounts use this fixed workspace; it cannot be changed here.',
        workspaceFixed: 'The workspace is fixed by the plugin and cannot be changed here.',
        workspace: 'Workspace',
        accountDir: 'Account directory',
        usersDir: 'Users directory',
        userFiles: 'User files',
        userFile: 'User',
        noUserFiles: 'No user files yet',
        historyFile: 'Chat history',
        mediaDir: 'Media',
        filesDir: 'Files',
        accessControl: 'Access control',
        requireAuth: 'Only authorized contacts',
        authorized: 'Authorized',
        unauthorized: 'Not authorized',
        authorize: 'Authorize',
        revoke: 'Revoke',
        pairingCode: 'Pairing code',
        regeneratePairing: 'Regenerate',
        storage: 'Storage',
        workspacePrompt: 'Absolute workspace path for this account; leave empty to use the default',
        workspaceRootPrompt: 'Absolute path for the workspace root',
        workspaceConfirm: 'Changing the workspace disconnects online accounts and starts a new DSH session for affected accounts (the old session is kept). Continue?',
        pendingAccount: 'Change the workspace for "{label}" to:',
        pendingRoot: 'Change the Amoayun Link workspace root to:',
        pendingWarning: 'Online accounts will be disconnected and a new DSH session will be used; the old session is kept.',
        fullAccessHint: 'Linked sessions use full access (danger-full-access) and never ask for approval. Only bind trusted accounts.',
        save: 'Save',
        reset: 'Default',
        pickFolder: 'Choose folder',
        hardInterrupt: 'Cancel the running turn when a new message arrives',
        hardInterruptHint: 'Off by default. When enabled, a new message cancels the current turn without replying to the old message, then answers only the newest message.',
        skills: 'Skills',
        open: 'Open',
        confirmChange: 'Confirm',
        cancel: 'Cancel',
        empty: 'No Amoayun Link account yet. Add one, then click Connect to scan.',
        connect: 'Connect',
        disconnect: 'Disconnect',
        stop: 'Stop',
        login: 'Scan again',
        rename: 'Rename',
        renamePrompt: 'New account label',
        renameTitle: 'Rename account',
        renameHint: 'Changes the panel label only; sign-in and workspace stay unchanged.',
        workspacePathTitle: 'Workspace path',
        workspacePathHint: 'Enter an absolute path; leave empty for the default. The directory is created if needed. Changing it disconnects the account and starts a new session.',
        remove: 'Remove',
        copy: 'Copy QR link',
        copied: 'Copied',
        online: 'Online',
        count: 'accounts online',
        messages: 'messages',
        noLogin: 'Not signed in',
        loggedIn: 'Signed in',
        status: {
          idle: 'Disconnected',
          waiting_qr: 'Waiting for scan',
          scaned: 'Scanned',
          connecting: 'Connecting',
          online: 'Online',
          error: 'Error'
        },
        loginStatus: {
          wait: 'Scan the QR code with your phone',
          scaned: 'Scanned. Confirm on your phone.',
          confirmed: 'Signed in. Connecting…',
          expired: 'QR code expired',
          error: 'Could not get a QR code',
          none: 'Not started'
        },
        confirmDelete: 'This removes the saved credentials and cursor for this account. Chat logs are kept. Continue?',
        close: 'Close'
      }

  var state = {
    open: false,
    busy: '',
    error: '',
    accounts: [],
    online: 0,
    settings: null,
    selectedAccountId: '',
    linkedSessionIds: [],
    rootDisplay: null,
    hardInterruptSwitch: null,
    mainTab: 'plugin',
    mainTabs: null,
    storage: null,
    storagePill: null,
    pending: null,
    pendingBox: null,
    pendingText: null,
    renameDialog: null,
    renameInput: null,
    renameTitle: null,
    renameHint: null,
    renameAccountId: '',
    dialogKind: '',
    dialogAccountId: '',
    dialogOnline: false,
    dialogLabel: '',
    timer: null,
    launcher: null,
    launcherDrag: null,
    launcherDragEndedAt: 0,
    launcherHasCustomPosition: false,
    overlay: null,
    list: null,
    tabs: null,
    accountLayout: null,
    addInput: null,
    errorBox: null,
    onlinePill: null,
    host: null,
    root: null
  }

  var CSS = [
    ':host{all:initial;display:contents;font-family:-apple-system,BlinkMacSystemFont,"SF Pro Text","PingFang SC",sans-serif;font-size:13px;line-height:1.5;color:#111827}',
    ':host([data-theme="dark"]){color:#e8eeff}',
    '*{box-sizing:border-box}',
    '.ccw-launcher{pointer-events:auto;position:fixed;right:22px;bottom:22px;z-index:2147483001;display:inline-flex;align-items:center;gap:7px;height:42px;padding:0 15px;border:0;border-radius:999px;background:linear-gradient(135deg,#07c160,#10a95a);color:#fff;font:inherit;font-size:12.5px;font-weight:600;white-space:nowrap;box-shadow:0 10px 30px rgba(7,193,96,.36),0 2px 8px rgba(0,0,0,.18);cursor:grab;touch-action:none;user-select:none;transition:transform .16s ease,box-shadow .16s ease}',
    '.ccw-launcher:hover{transform:translateY(-1px);box-shadow:0 14px 36px rgba(7,193,96,.42),0 2px 8px rgba(0,0,0,.18)}',
    '.ccw-launcher.dragging{cursor:grabbing;transition:none;transform:none}',
    '.ccw-count{min-width:18px;height:18px;padding:0 5px;border-radius:999px;background:#fff;color:#079b4f;font-size:10px;display:grid;place-items:center}',
    '.ccw-count[hidden]{display:none}',
    '.ccw-overlay{pointer-events:auto;position:fixed;inset:0;z-index:2147483000;background:rgba(4,8,16,.48);backdrop-filter:blur(6px);display:flex;align-items:center;justify-content:center;padding:24px}',
    '.ccw-overlay[hidden]{display:none}',
    '.ccw-panel{width:min(960px,94vw);max-height:min(82vh,760px);display:flex;flex-direction:column;overflow:hidden;border-radius:20px;border:1px solid rgba(148,163,184,.2);background:#fff;box-shadow:0 30px 90px rgba(0,0,0,.32)}',
    ':host([data-theme="dark"]) .ccw-panel{background:#15171d;border-color:rgba(148,163,184,.22);box-shadow:0 30px 90px rgba(0,0,0,.55)}',
    '.ccw-head{display:flex;align-items:flex-start;justify-content:space-between;gap:16px;padding:20px 22px 16px;border-bottom:1px solid rgba(148,163,184,.16)}',
    '.ccw-head h2{margin:0 0 3px;font-size:18px;font-weight:650;letter-spacing:-.02em}',
    '.ccw-head p{margin:0;font-size:12px;color:#6b7280}',
    ':host([data-theme="dark"]) .ccw-head p{color:#98a4bd}',
    '.ccw-close{width:30px;height:30px;border:0;border-radius:8px;background:transparent;color:#6b7280;font-size:18px;cursor:pointer;display:grid;place-items:center}',
    '.ccw-close:hover{background:rgba(148,163,184,.12);color:inherit}',
    '.ccw-body{padding:16px 22px 22px;overflow:auto}',
    '.ccw-add{display:flex;gap:10px;align-items:center;margin-bottom:14px}',
    '.ccw-add input,.ccw-settings input{flex:1;min-width:0;height:38px;padding:0 12px;border-radius:10px;border:1px solid rgba(148,163,184,.32);background:rgba(248,250,252,.8);color:inherit;font:inherit;font-size:12.5px;outline:0}',
    ':host([data-theme="dark"]) .ccw-add input,:host([data-theme="dark"]) .ccw-settings input{background:#0e1117;border-color:rgba(148,163,184,.24)}',
    '.ccw-add input:focus,.ccw-settings input:focus{border-color:#07c160;box-shadow:0 0 0 3px rgba(7,193,96,.14)}',
    '.ccw-btn{height:34px;padding:0 12px;border-radius:9px;border:1px solid rgba(148,163,184,.28);background:transparent;color:inherit;font:inherit;font-size:12px;cursor:pointer;white-space:nowrap}',
    '.ccw-btn:hover{background:rgba(148,163,184,.12)}',
    '.ccw-btn[disabled]{opacity:.45;cursor:default}',
    '.ccw-btn.primary{background:#07c160;border-color:#07c160;color:#fff}',
    '.ccw-btn.primary:hover{background:#06ad56}',
    '.ccw-btn.danger{color:#dc2626;border-color:rgba(220,38,38,.28)}',
    ':host([data-theme="dark"]) .ccw-btn.danger{color:#fca5a5;border-color:rgba(248,113,113,.28)}',
    '.ccw-settings{margin-bottom:14px;padding:12px;border-radius:12px;border:1px solid rgba(148,163,184,.2);background:rgba(248,250,252,.45)}',
    ':host([data-theme="dark"]) .ccw-settings{background:rgba(255,255,255,.025);border-color:rgba(148,163,184,.18)}',
    '.ccw-settings-title{font-size:11px;font-weight:600;margin-bottom:7px;color:#374151}',
    ':host([data-theme="dark"]) .ccw-settings-title{color:#c7d2e5}',
    '.ccw-settings-row{display:flex;gap:8px;align-items:center}',
    '.ccw-workspace-value{margin-top:2px;font-size:11px;line-height:1.5;color:#374151;word-break:break-all;overflow-wrap:anywhere;white-space:normal}',
    '.ccw-main-tabs{display:flex;gap:4px;margin:0 0 14px;padding:3px;border-radius:11px;background:rgba(148,163,184,.09)}',
    '.ccw-main-tab{flex:1;height:34px;border:0;border-radius:8px;background:transparent;color:#6b7280;font:inherit;font-size:12.5px;font-weight:600;cursor:pointer;transition:background .18s,color .18s,box-shadow .18s}',
    '.ccw-main-tab:hover{background:rgba(148,163,184,.12)}',
    '.ccw-main-tab.active{background:#fff;color:#111827;box-shadow:0 1px 4px rgba(0,0,0,.12)}',
    ':host([data-theme="dark"]) .ccw-main-tab{color:#98a4bd}',
    ':host([data-theme="dark"]) .ccw-main-tab.active{background:#2a2f3a;color:#f3f6ff}',
    '.ccw-main-pane{display:none}',
    '.ccw-main-pane.active{display:block;animation:ccw-pane-in .24s cubic-bezier(.22,.8,.32,1)}',
    '@keyframes ccw-pane-in{from{opacity:0;transform:translateX(var(--pane-shift,12px))}to{opacity:1;transform:translateX(0)}}',
    '.ccw-toggle-row{display:flex;align-items:flex-start;justify-content:space-between;gap:14px;margin-top:14px;padding-top:12px;border-top:1px solid rgba(148,163,184,.14)}',
    '.ccw-toggle-copy{min-width:0}',
    '.ccw-toggle-title{font-size:11.5px;font-weight:600;line-height:1.45}',
    '.ccw-toggle-hint{margin-top:3px;font-size:10px;line-height:1.45;color:#6b7280}',
    ':host([data-theme="dark"]) .ccw-toggle-hint{color:#98a4bd}',
    '.ccw-switch{position:relative;flex:none;width:40px;height:22px;margin-top:1px;padding:0;border:0;border-radius:999px;background:#cbd5e1;cursor:pointer;transition:background .2s ease}',
    '.ccw-switch::after{content:"";position:absolute;top:3px;left:3px;width:16px;height:16px;border-radius:50%;background:#fff;box-shadow:0 1px 3px rgba(0,0,0,.25);transition:transform .2s ease}',
    '.ccw-switch[aria-checked="true"]{background:#07c160}',
    '.ccw-switch[aria-checked="true"]::after{transform:translateX(18px)}',
    '.ccw-switch[disabled]{opacity:.55;cursor:default}',
    ':host([data-theme="dark"]) .ccw-switch{background:#475569}',
    ':host([data-theme="dark"]) .ccw-workspace-value{color:#c7d2e5}',
    '.ccw-settings-actions{display:flex;justify-content:flex-end;gap:8px;margin-top:8px}',
    '.ccw-hint{margin-top:6px;font-size:10px;line-height:1.45;color:#6b7280}',
    ':host([data-theme="dark"]) .ccw-hint{color:#98a4bd}',
    '.ccw-warn{color:#b45309}',
    ':host([data-theme="dark"]) .ccw-warn{color:#fcd34d}',
    '.ccw-detail{margin-top:10px;border-top:1px solid rgba(148,163,184,.12)}',
    '.ccw-detail-row{display:grid;grid-template-columns:72px minmax(0,1fr) auto;gap:10px;align-items:start;padding:8px 0;border-bottom:1px solid rgba(148,163,184,.1)}',
    '.ccw-detail-label{padding-top:0;font-size:10.5px;line-height:1.55;font-weight:600;color:#6b7280;white-space:nowrap}',
    ':host([data-theme="dark"]) .ccw-detail-label{color:#98a4bd}',
    '.ccw-detail-value{font-size:10.5px;line-height:1.55;color:#6b7280;word-break:break-all;overflow-wrap:anywhere;white-space:pre-line}',
    '.ccw-detail-value[data-open-path]{cursor:pointer;border-radius:5px;transition:color .15s,text-decoration-color .15s}',
    '.ccw-detail-value[data-open-path]:hover{color:#07c160;text-decoration:underline;text-underline-offset:2px}',
    '.ccw-detail-value[data-open-path]:focus-visible{outline:2px solid rgba(7,193,96,.55);outline-offset:2px}',
    ':host([data-theme="dark"]) .ccw-detail-value{color:#98a4bd}',
    '.ccw-detail-actions{display:flex;gap:6px;flex-wrap:wrap;justify-content:flex-end}',
    ':host([data-theme="dark"]) .ccw-workspace-path{color:#98a4bd}',
    '.ccw-confirm{margin-bottom:12px;padding:11px 12px;border-radius:12px;border:1px solid rgba(7,193,96,.35);background:rgba(7,193,96,.08)}',
    '.ccw-confirm-text{font-size:11.5px;line-height:1.5;white-space:pre-wrap;word-break:break-all}',
    '.ccw-confirm-actions{display:flex;gap:8px;justify-content:flex-end;margin-top:9px}',
    '.ccw-rename{pointer-events:auto;position:fixed;inset:0;z-index:2147483002;display:flex;align-items:center;justify-content:center;padding:24px;background:rgba(4,8,16,.55);backdrop-filter:blur(5px)}',
    '.ccw-rename[hidden]{display:none}',
    '.ccw-rename-card{width:min(420px,92vw);padding:20px;border-radius:16px;border:1px solid rgba(148,163,184,.2);background:#fff;box-shadow:0 24px 70px rgba(0,0,0,.35)}',
    ':host([data-theme="dark"]) .ccw-rename-card{background:#15171d;border-color:rgba(148,163,184,.22)}',
    '.ccw-rename-card h3{margin:0 0 4px;font-size:16px;font-weight:650}',
    '.ccw-rename-card p{margin:0 0 14px;font-size:11.5px;color:#6b7280}',
    ':host([data-theme="dark"]) .ccw-rename-card p{color:#98a4bd}',
    '.ccw-rename-card input{width:100%;height:38px;padding:0 12px;border-radius:10px;border:1px solid rgba(148,163,184,.32);background:rgba(248,250,252,.8);color:inherit;font:inherit;font-size:13px;outline:0}',
    ':host([data-theme="dark"]) .ccw-rename-card input{background:#0e1117;border-color:rgba(148,163,184,.24)}',
    '.ccw-rename-card input:focus{border-color:#07c160;box-shadow:0 0 0 3px rgba(7,193,96,.14)}',
    '.ccw-rename-actions{display:flex;gap:8px;justify-content:flex-end;margin-top:14px}',
    '.ccw-error{margin-bottom:12px;padding:10px 12px;border-radius:10px;background:rgba(239,68,68,.1);border:1px solid rgba(239,68,68,.24);color:#b91c1c;font-size:11.5px;white-space:pre-wrap}',
    ':host([data-theme="dark"]) .ccw-error{color:#fecaca}',
    '.ccw-list{display:flex;flex-direction:column;gap:10px}',
    '.ccw-account-layout{display:grid;grid-template-columns:158px minmax(0,1fr);gap:12px;align-items:start}',
    '.ccw-account-layout.is-single{grid-template-columns:minmax(0,1fr)}',
    '.ccw-account-layout.is-single .ccw-tabs{display:none}',
    '.ccw-tabs{display:flex;flex-direction:column;gap:4px;overflow-y:auto;overflow-x:hidden;max-height:430px;margin:0;padding:4px;border-radius:11px;background:rgba(148,163,184,.09)}',
    '.ccw-tabs[hidden]{display:none}',
    '.ccw-tabs::-webkit-scrollbar{width:3px}',
    '.ccw-tabs::-webkit-scrollbar-thumb{background:rgba(148,163,184,.3);border-radius:2px}',
    '.ccw-tab{flex:0 0 auto;display:flex;align-items:center;gap:6px;width:100%;height:34px;padding:0 9px;border:0;border-radius:8px;background:transparent;color:#6b7280;font:inherit;font-size:12px;text-align:left;cursor:pointer}',
    '.ccw-tab:hover{background:rgba(148,163,184,.12)}',
    '.ccw-tab.active{background:#fff;color:#111827;box-shadow:0 1px 4px rgba(0,0,0,.12)}',
    ':host([data-theme="dark"]) .ccw-tab{color:#98a4bd}',
    ':host([data-theme="dark"]) .ccw-tab:hover{background:rgba(255,255,255,.06)}',
    ':host([data-theme="dark"]) .ccw-tab.active{background:#2a2f3a;color:#f3f6ff;box-shadow:0 1px 4px rgba(0,0,0,.35)}',
    '.ccw-tab-label{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}',
    '.ccw-tab-dot{width:6px;height:6px;border-radius:50%;background:#9ca3af;flex:none}',
    '.ccw-tab-dot.online{background:#07c160}',
    '.ccw-tab-dot.warn{background:#f59e0b}',
    '.ccw-tab-dot.error{background:#ef4444}',
    '.ccw-empty{padding:26px 12px;text-align:center;color:#6b7280;font-size:12.5px;border:1px dashed rgba(148,163,184,.32);border-radius:14px}',
    ':host([data-theme="dark"]) .ccw-empty{color:#98a4bd}',
    '.ccw-account{border:1px solid rgba(148,163,184,.22);border-radius:14px;padding:13px 14px;background:rgba(248,250,252,.55)}',
    ':host([data-theme="dark"]) .ccw-account{background:rgba(255,255,255,.025);border-color:rgba(148,163,184,.18)}',
    '.ccw-account-top{display:flex;align-items:center;gap:10px}',
    '.ccw-avatar{width:34px;height:34px;border-radius:10px;background:linear-gradient(135deg,#07c160,#22d3ee);color:#fff;display:grid;place-items:center;font-weight:700;font-size:13px;flex:none}',
    '.ccw-account-copy{flex:1;min-width:0}',
    '.ccw-account-name{font-size:13px;font-weight:600;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}',
    '.ccw-account-meta{margin-top:1px;font-size:10.5px;color:#6b7280;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}',
    ':host([data-theme="dark"]) .ccw-account-meta{color:#98a4bd}',
    '.ccw-pill{flex:none;padding:3px 8px;border-radius:999px;font-size:10px;border:1px solid rgba(148,163,184,.24);color:#6b7280;background:rgba(148,163,184,.08)}',
    '.ccw-pill.online{color:#047857;border-color:rgba(5,150,105,.3);background:rgba(5,150,105,.1)}',
    ':host([data-theme="dark"]) .ccw-pill.online{color:#a7f3d0}',
    '.ccw-pill.warn{color:#b45309;border-color:rgba(245,158,11,.3);background:rgba(245,158,11,.1)}',
    ':host([data-theme="dark"]) .ccw-pill.warn{color:#fcd34d}',
    '.ccw-pill.error{color:#b91c1c;border-color:rgba(239,68,68,.3);background:rgba(239,68,68,.08)}',
    ':host([data-theme="dark"]) .ccw-pill.error{color:#fca5a5}',
    '.ccw-actions{display:flex;gap:8px;flex-wrap:wrap;margin-top:11px}',
    '.ccw-qr{margin-top:12px;padding:12px;border-radius:12px;border:1px solid rgba(148,163,184,.2);background:#fff;display:flex;flex-direction:column;align-items:center;gap:8px}',
    ':host([data-theme="dark"]) .ccw-qr{background:#0e1117;border-color:rgba(148,163,184,.18)}',
    '.ccw-qr img{width:210px;height:210px;display:block;border-radius:6px}',
    '.ccw-qr-note{font-size:11px;color:#6b7280;text-align:center;max-width:100%;word-break:break-all}',
    ':host([data-theme="dark"]) .ccw-qr-note{color:#98a4bd}',
    '.ccw-qr-actions{display:flex;gap:8px;flex-wrap:wrap;justify-content:center}',
    '.ccw-foot{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:12px 22px 16px;border-top:1px solid rgba(148,163,184,.14);font-size:11px;color:#6b7280}',
    ':host([data-theme="dark"]) .ccw-foot{color:#98a4bd}',
    '@media (max-width:640px){.ccw-overlay{padding:10px}.ccw-panel{max-height:92vh}.ccw-body{padding:14px 14px 18px}.ccw-head{padding:16px 16px 12px}.ccw-foot{padding:10px 16px 12px}}'
  ].join('\n')

  var HTML = [
    '<button class="ccw-launcher" type="button" title="' + text.title + '">',
    '  <span>' + text.title + '</span><span class="ccw-count" hidden>0</span>',
    '</button>',
    '<div class="ccw-overlay" hidden>',
    '  <section class="ccw-panel" role="dialog" aria-modal="true" aria-label="' + text.title + '">',
    '    <header class="ccw-head">',
    '      <div><h2>' + text.title + '</h2><p>' + text.subtitle + '</p></div>',
    '      <button class="ccw-close" type="button" aria-label="' + text.close + '">×</button>',
    '    </header>',
    '    <div class="ccw-body">',
    '      <div class="ccw-main-tabs" role="tablist">',
    '        <button class="ccw-main-tab active" type="button" role="tab" aria-selected="true" data-main-tab="plugin">' + text.pluginSettings + '</button>',
    '        <button class="ccw-main-tab" type="button" role="tab" aria-selected="false" data-main-tab="accounts">' + text.accountSettings + '</button>',
    '      </div>',
    '      <div class="ccw-error" hidden></div>',
    '      <div class="ccw-confirm" hidden><div class="ccw-confirm-text" data-pending-text></div><div class="ccw-confirm-actions"><button class="ccw-btn primary" type="button" data-confirm-workspace>' + text.confirmChange + '</button><button class="ccw-btn" type="button" data-cancel-workspace>' + text.cancel + '</button></div></div>',
    '      <section class="ccw-main-pane active" data-main-pane="plugin">',
    '        <div class="ccw-settings">',
    '          <div class="ccw-settings-title">' + text.workspaceRoot + '</div>',
    '          <div class="ccw-workspace-value" data-root-display></div>',
    '          <div class="ccw-hint">' + text.workspaceHint + '</div>',
    '          <div class="ccw-hint">' + text.workspaceFixed + '</div>',
    '          <div class="ccw-toggle-row">',
    '            <div class="ccw-toggle-copy"><div class="ccw-toggle-title">' + text.hardInterrupt + '</div><div class="ccw-toggle-hint">' + text.hardInterruptHint + '</div></div>',
    '            <button class="ccw-switch" type="button" role="switch" aria-checked="false" aria-label="' + text.hardInterrupt + '" data-hard-interrupt></button>',
    '          </div>',
    '          <div class="ccw-hint ccw-warn">' + text.fullAccessHint + '</div>',
    '        </div>',
    '      </section>',
    '      <section class="ccw-main-pane" data-main-pane="accounts">',
    '        <div class="ccw-add"><input type="text" maxlength="40" placeholder="' + text.addPlaceholder + '"><button class="ccw-btn primary" type="button" data-add>' + text.add + '</button></div>',
    '        <div class="ccw-account-layout" data-account-layout>',
    '          <div class="ccw-tabs" role="tablist" hidden></div>',
    '          <div class="ccw-list"></div>',
    '        </div>',
    '      </section>',
    '    </div>',
    '    <footer class="ccw-foot"><span data-online></span><span data-storage></span><span>' + text.subtitle + '</span></footer>',
    '  </section>',
    '</div>',
    '<div class="ccw-rename" hidden>',
    '  <div class="ccw-rename-card" role="dialog" aria-modal="true">',
    '    <h3 data-rename-title>' + text.renameTitle + '</h3>',
    '    <p data-rename-hint>' + text.renameHint + '</p>',
    '    <input type="text" maxlength="40" data-rename-input>',
    '    <div class="ccw-rename-actions"><button class="ccw-btn" type="button" data-rename-cancel>' + text.cancel + '</button><button class="ccw-btn primary" type="button" data-rename-confirm>' + text.save + '</button></div>',
    '  </div>',
    '</div>'
  ].join('\n')

  function statusClass(status) {
    if (status === 'online') return 'online'
    if (status === 'error') return 'error'
    if (status === 'waiting_qr' || status === 'scaned' || status === 'connecting') return 'warn'
    return ''
  }

  function api(path, options) {
    var opts = options || {}
    var headers = { 'x-amoayun-link-token': token }
    if (opts.body) headers['content-type'] = 'application/json'
    return fetch('/amoayun-link-api' + path, {
      method: opts.method || 'GET',
      headers: headers,
      body: opts.body ? JSON.stringify(opts.body) : undefined
    }).then(function (response) {
      return response.text().then(function (body) {
        var data = {}
        try { data = body ? JSON.parse(body) : {} } catch (error) { data = {} }
        if (!response.ok) throw new Error(data.error || ('HTTP ' + response.status))
        return data
      })
    })
  }

  function activeSessionId() {
    try {
      var raw = window.localStorage.getItem('dsh.sessions.current')
      if (!raw) return ''
      var parsed = JSON.parse(raw)
      if (typeof parsed === 'string') return parsed
      return parsed && parsed.sessionId ? String(parsed.sessionId) : ''
    } catch (error) {
      return ''
    }
  }

  function applyLinkedSessionMode() {
    var id = activeSessionId()
    var on = id !== '' && state.linkedSessionIds.indexOf(id) !== -1
    if (on) document.documentElement.setAttribute('data-amoayun-link-session', '')
    else document.documentElement.removeAttribute('data-amoayun-link-session')
  }

  async function refreshLinkedSessionIds() {
    try {
      var data = await api('/sessions')
      if (data && Array.isArray(data.sessionIds)) {
        state.linkedSessionIds = data.sessionIds.map(String)
        applyLinkedSessionMode()
      }
    } catch (error) {
      // Keep the last known set; a transient API failure must not reveal the
      // composer in an active Amoayun Link conversation.
    }
  }

  function startLinkedSessionMode() {
    applyLinkedSessionMode()
    void refreshLinkedSessionIds()
    window.setInterval(applyLinkedSessionMode, 400)
    window.setInterval(refreshLinkedSessionIds, 5000)
    window.addEventListener('storage', applyLinkedSessionMode)
  }

  function renderLauncher() {
    if (!state.launcher) return
    var count = state.launcher.querySelector('.ccw-count')
    if (!count) return
    if (state.online > 0) {
      count.hidden = false
      count.textContent = String(state.online)
    } else {
      count.hidden = true
    }
  }

  function applyState(data) {
    var previousSelection = state.selectedAccountId
    state.accounts = Array.isArray(data.accounts) ? data.accounts : []
    state.online = Number(data.online) || 0
    if (!state.accounts.some(function (account) { return account.id === previousSelection })) {
      state.selectedAccountId = state.accounts.length > 0 ? state.accounts[0].id : ''
    }
    state.settings = data.settings || state.settings
    if (state.rootDisplay && state.settings) {
      state.rootDisplay.textContent = state.settings.workspaceRoot || ''
      state.rootDisplay.title = state.settings.workspaceRoot || ''
    }
    if (state.hardInterruptSwitch && state.settings) {
      state.hardInterruptSwitch.setAttribute(
        'aria-checked',
        state.settings.hardInterrupt === true ? 'true' : 'false',
      )
    }
    if (state.storagePill) {
      state.storagePill.textContent =
        text.storage + ' ' + formatBytes(state.storage ? state.storage.total : 0)
    }
    state.error = ''
    render()
  }

  function showError(message) {
    state.error = message
    if (state.errorBox) {
      state.errorBox.hidden = message === ''
      state.errorBox.textContent = message
    }
  }

  function tabDotClass(status) {
    if (status === 'online') return 'online'
    if (status === 'error') return 'error'
    if (status === 'waiting_qr' || status === 'scaned' || status === 'connecting') return 'warn'
    return ''
  }

  function renderTabs() {
    if (!state.tabs) return
    if (state.accountLayout) {
      state.accountLayout.classList.toggle('is-single', state.accounts.length === 0)
    }
    state.tabs.textContent = ''
    if (state.accounts.length === 0) {
      state.tabs.hidden = true
      return
    }
    state.tabs.hidden = false
    for (var i = 0; i < state.accounts.length; i += 1) {
      var account = state.accounts[i]
      var tab = document.createElement('button')
      tab.type = 'button'
      tab.className = 'ccw-tab' + (account.id === state.selectedAccountId ? ' active' : '')
      tab.setAttribute('role', 'tab')
      tab.setAttribute('aria-selected', account.id === state.selectedAccountId ? 'true' : 'false')
      tab.setAttribute('data-account-tab', account.id)
      tab.title = account.label
      var dot = document.createElement('span')
      dot.className = 'ccw-tab-dot ' + tabDotClass(account.status)
      var label = document.createElement('span')
      label.className = 'ccw-tab-label'
      label.textContent = account.label
      tab.appendChild(dot)
      tab.appendChild(label)
      state.tabs.appendChild(tab)
    }
  }

  function render() {
    if (!state.list) return
    renderPending()
    state.host.setAttribute('data-theme', document.body && document.body.hasAttribute('data-ds-dark-theme') ? 'dark' : 'light')
    renderLauncher()
    renderTabs()
    if (state.onlinePill) state.onlinePill.textContent = state.online + ' ' + text.count
    state.list.textContent = ''
    if (state.accounts.length === 0) {
      var empty = document.createElement('div')
      empty.className = 'ccw-empty'
      empty.textContent = text.empty
      state.list.appendChild(empty)
      return
    }
    var selected = state.accounts.filter(function (account) {
      return account.id === state.selectedAccountId
    })[0] || state.accounts[0]
    state.selectedAccountId = selected.id
    state.list.appendChild(renderAccount(selected))
  }

  function formatBytes(value) {
    const bytes = Number(value)
    if (!Number.isFinite(bytes) || bytes <= 0) return '0 B'
    const units = ['B', 'KB', 'MB', 'GB', 'TB']
    let size = bytes
    let unit = 0
    while (size >= 1024 && unit < units.length - 1) {
      size /= 1024
      unit += 1
    }
    return (unit === 0 ? String(Math.round(size)) : size.toFixed(1)) + ' ' + units[unit]
  }

  function accessSwitch(account, enabled) {
    var button = document.createElement('button')
    button.className = 'ccw-switch'
    button.type = 'button'
    button.setAttribute('role', 'switch')
    button.setAttribute('aria-checked', enabled ? 'true' : 'false')
    button.setAttribute('aria-label', text.requireAuth)
    button.setAttribute('data-action', 'toggle-access')
    button.setAttribute('data-id', account.id)
    return button
  }

  function allowButton(account, contact) {
    var allowed = contact.allowed !== false
    var button = document.createElement('button')
    button.className = 'ccw-btn'
    button.type = 'button'
    button.setAttribute('data-action', 'toggle-allow')
    button.setAttribute('data-id', account.id)
    button.setAttribute('data-sender', contact.senderId || '')
    button.textContent = allowed ? text.revoke : text.authorize
    return button
  }

  async function openDirectory(path) {
    if (!path) return
    try {
      await api('/open-path', { method: 'POST', body: { path: path } })
    } catch (error) {
      showError(error instanceof Error ? error.message : String(error))
    }
  }

  function appendDetailRow(container, label, value, actions, openPath) {
    var row = document.createElement('div')
    row.className = 'ccw-detail-row'
    var labelNode = document.createElement('div')
    labelNode.className = 'ccw-detail-label'
    labelNode.textContent = label
    var valueNode = document.createElement('div')
    valueNode.className = 'ccw-detail-value'
    valueNode.textContent = value || ''
    valueNode.title = openPath ? '打开 ' + openPath : value || ''
    if (openPath) {
      valueNode.classList.add('ccw-detail-path')
      valueNode.setAttribute('data-open-path', openPath)
      valueNode.setAttribute('role', 'button')
      valueNode.tabIndex = 0
      valueNode.addEventListener('click', function (event) {
        event.stopPropagation()
        void openDirectory(openPath)
      })
      valueNode.addEventListener('keydown', function (event) {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault()
          void openDirectory(openPath)
        }
      })
    }
    var actionBox = document.createElement('div')
    actionBox.className = 'ccw-detail-actions'
    for (var i = 0; i < actions.length; i += 1) {
      actionBox.appendChild(actions[i])
    }
    row.appendChild(labelNode)
    row.appendChild(valueNode)
    row.appendChild(actionBox)
    container.appendChild(row)
  }

  function detailButton(account, action, label, title) {
    var button = document.createElement('button')
    button.className = 'ccw-btn'
    button.type = 'button'
    button.setAttribute('data-action', action)
    button.setAttribute('data-id', account.id)
    if (title) button.title = title
    button.textContent = label
    if (state.busy === account.id) button.disabled = true
    return button
  }

  function renderAccount(account) {
    var card = document.createElement('div')
    card.className = 'ccw-account'
    var top = document.createElement('div')
    top.className = 'ccw-account-top'
    var avatar = document.createElement('div')
    avatar.className = 'ccw-avatar'
    avatar.textContent = (account.label || '?').slice(0, 1)
    var copy = document.createElement('div')
    copy.className = 'ccw-account-copy'
    var name = document.createElement('div')
    name.className = 'ccw-account-name'
    name.textContent = account.label
    var meta = document.createElement('div')
    meta.className = 'ccw-account-meta'
    meta.textContent = account.hasCredentials ? text.loggedIn : text.noLogin
    copy.appendChild(name)
    copy.appendChild(meta)
    var pill = document.createElement('span')
    pill.className = 'ccw-pill ' + statusClass(account.status)
    pill.textContent = text.status[account.status] || account.status
    top.appendChild(avatar)
    top.appendChild(copy)
    top.appendChild(pill)
    card.appendChild(top)

    var detail = document.createElement('div')
    detail.className = 'ccw-detail'
    var dirs = account.dirs || {}
    appendDetailRow(
      detail,
      text.workspace,
      dirs.workspace || account.workspace || '',
      [],
      dirs.workspace || account.workspace || '',
    )
    appendDetailRow(detail, text.accountDir, dirs.account || '', [], dirs.account || '')
    appendDetailRow(detail, text.skills, account.skillPath, [], account.skillPath || '')
    appendDetailRow(detail, text.usersDir, dirs.users || '', [], dirs.users || '')
    var access = account.access || { requireAuth: false, allowFrom: [] }
    appendDetailRow(detail, text.accessControl, text.requireAuth, [
      accessSwitch(account, access.requireAuth === true),
    ])
    if (access.requireAuth && access.pairingCode) {
      var regenerate = document.createElement('button')
      regenerate.className = 'ccw-btn'
      regenerate.type = 'button'
      regenerate.setAttribute('data-action', 'regenerate-pairing')
      regenerate.setAttribute('data-id', account.id)
      regenerate.textContent = text.regeneratePairing
      appendDetailRow(detail, text.pairingCode, access.pairingCode, [regenerate])
    }
    var accountStorage = state.storage?.accounts?.[account.id]
    if (accountStorage) {
      appendDetailRow(detail, text.storage, formatBytes(accountStorage.total), [])
    }
    var contacts = Array.isArray(account.contacts) ? account.contacts : []
    for (var c = 0; c < contacts.length; c += 1) {
      var contact = contacts[c]
      var contactSize = accountStorage?.contacts?.[contact.id]
      var allowed = contact.allowed !== false
      var contactValue = [
        contact.senderId || contact.chatId || contact.id,
        contact.path || '',
        text.storage + ': ' + formatBytes(contactSize || 0),
        allowed ? text.authorized : text.unauthorized,
      ].join('\n')
      appendDetailRow(detail, text.userFile + ' ' + (c + 1), contactValue, [
        allowButton(account, contact),
      ], contact.path || '')
      appendDetailRow(
        detail,
        text.historyFile + ' ' + (c + 1),
        contact.historyDir || '',
        [],
        contact.historyDir || '',
      )
      appendDetailRow(
        detail,
        text.mediaDir + ' ' + (c + 1),
        contact.mediaPath || '',
        [],
        contact.mediaPath || '',
      )
      appendDetailRow(
        detail,
        text.filesDir + ' ' + (c + 1),
        contact.filesDir || '',
        [],
        contact.filesDir || '',
      )
    }
    card.appendChild(detail)

    var actions = document.createElement('div')
    actions.className = 'ccw-actions'
    var primary = document.createElement('button')
    primary.className = 'ccw-btn primary'
    primary.type = 'button'
    primary.setAttribute('data-action', account.status === 'online' ? 'disconnect' : 'connect')
    primary.setAttribute('data-id', account.id)
    primary.textContent = account.status === 'online' ? text.disconnect : text.connect
    if (state.busy === account.id) primary.disabled = true
    actions.appendChild(primary)
    if (account.active) {
      var stop = document.createElement('button')
      stop.className = 'ccw-btn'
      stop.type = 'button'
      stop.setAttribute('data-action', 'cancel')
      stop.setAttribute('data-id', account.id)
      stop.textContent = text.stop
      if (state.busy === account.id) stop.disabled = true
      actions.appendChild(stop)
    }
    if (account.status !== 'online') {
      var login = document.createElement('button')
      login.className = 'ccw-btn'
      login.type = 'button'
      login.setAttribute('data-action', 'login')
      login.setAttribute('data-id', account.id)
      login.textContent = text.login
      if (state.busy === account.id) login.disabled = true
      actions.appendChild(login)
    }
    var rename = document.createElement('button')
    rename.className = 'ccw-btn'
    rename.type = 'button'
    rename.setAttribute('data-action', 'rename')
    rename.setAttribute('data-id', account.id)
    rename.textContent = text.rename
    if (state.busy === account.id) rename.disabled = true
    actions.appendChild(rename)
    var remove = document.createElement('button')
    remove.className = 'ccw-btn danger'
    remove.type = 'button'
    remove.setAttribute('data-action', 'remove')
    remove.setAttribute('data-id', account.id)
    remove.textContent = text.remove
    if (state.busy === account.id) remove.disabled = true
    actions.appendChild(remove)
    card.appendChild(actions)

    if (account.login && account.login.image) {
      var qr = document.createElement('div')
      qr.className = 'ccw-qr'
      var image = document.createElement('img')
      image.src = account.login.image
      image.alt = text.title
      var note = document.createElement('div')
      note.className = 'ccw-qr-note'
      note.textContent = text.loginStatus[account.login.status] || account.login.status
      qr.appendChild(image)
      qr.appendChild(note)
      if (account.login.error) {
        var errorNote = document.createElement('div')
        errorNote.className = 'ccw-qr-note'
        errorNote.textContent = account.login.error
        qr.appendChild(errorNote)
      }
      var qrActions = document.createElement('div')
      qrActions.className = 'ccw-qr-actions'
      var copyButton = document.createElement('button')
      copyButton.className = 'ccw-btn'
      copyButton.type = 'button'
      copyButton.setAttribute('data-action', 'copy')
      copyButton.setAttribute('data-id', account.id)
      copyButton.setAttribute('data-content', account.login.content || '')
      copyButton.textContent = text.copy
      qrActions.appendChild(copyButton)
      if (account.login.status === 'expired' || account.login.status === 'error') {
        var retry = document.createElement('button')
        retry.className = 'ccw-btn primary'
        retry.type = 'button'
        retry.setAttribute('data-action', 'login')
        retry.setAttribute('data-id', account.id)
        retry.textContent = text.login
        qrActions.appendChild(retry)
      }
      qr.appendChild(qrActions)
      card.appendChild(qr)
    }
    if (account.lastError && account.status === 'error' && !(account.login && account.login.error)) {
      var error = document.createElement('div')
      error.className = 'ccw-error'
      error.textContent = account.lastError
      card.appendChild(error)
    }
    return card
  }

  async function refresh() {
    try {
      var data = await api('/state')
      try {
        state.storage = await api('/storage')
      } catch {
        // Storage statistics are optional; keep the last known value.
      }
      applyState(data)
    } catch (error) {
      showError(error instanceof Error ? error.message : String(error))
    }
  }

  async function run(accountId, action) {
    state.busy = accountId
    showError('')
    render()
    try {
      var result = await api('/accounts/' + encodeURIComponent(accountId) + '/' + action, { method: 'POST' })
      applyState(result)
    } catch (error) {
      showError(error instanceof Error ? error.message : String(error))
    } finally {
      state.busy = ''
      render()
      void refresh()
    }
  }

  async function addAccount() {
    var label = state.addInput ? state.addInput.value.trim() : ''
    state.busy = 'add'
    showError('')
    try {
      var result = await api('/accounts', { method: 'POST', body: { label: label } })
      if (state.addInput) state.addInput.value = ''
      if (result.accounts && result.accounts.length > 0) {
        state.selectedAccountId = result.accounts[result.accounts.length - 1].id
      }
      applyState(result)
    } catch (error) {
      showError(error instanceof Error ? error.message : String(error))
    } finally {
      state.busy = ''
      render()
    }
  }

  function renderPending() {
    if (!state.pendingBox) return
    if (!state.pending) {
      state.pendingBox.hidden = true
      return
    }
    state.pendingBox.hidden = false
    var pending = state.pending
    var head = pending.kind === 'root'
      ? text.pendingRoot
      : text.pendingAccount.replace('{label}', pending.label || '')
    if (state.pendingText) {
      state.pendingText.textContent = head + '\n' + pending.path + '\n\n' + text.pendingWarning
    }
  }

  function setPending(pending) {
    state.pending = pending
    renderPending()
  }

  function clearPending() {
    state.pending = null
    renderPending()
  }

  async function saveWorkspaceRoot(value) {
    if (!state.settings) return
    state.busy = 'settings'
    showError('')
    try {
      applyState(await api('/settings', { method: 'PUT', body: { workspaceRoot: value } }))
      clearPending()
    } catch (error) {
      showError(error instanceof Error ? error.message : String(error))
    } finally {
      state.busy = ''
      render()
    }
  }

  async function toggleHardInterrupt() {
    if (!state.hardInterruptSwitch) return
    var previous = state.settings && state.settings.hardInterrupt === true
    var next = !previous
    state.hardInterruptSwitch.setAttribute('aria-checked', next ? 'true' : 'false')
    state.hardInterruptSwitch.disabled = true
    try {
      applyState(await api('/settings', { method: 'PUT', body: { hardInterrupt: next } }))
    } catch (error) {
      state.hardInterruptSwitch.setAttribute('aria-checked', previous ? 'true' : 'false')
      showError(error instanceof Error ? error.message : String(error))
    } finally {
      state.hardInterruptSwitch.disabled = false
    }
  }

  function selectMainTab(tab, animate) {
    var next = tab === 'accounts' ? 'accounts' : 'plugin'
    var previous = state.mainTab
    if (!state.mainTabs) return
    var direction = next === 'accounts' ? 1 : -1
    var tabs = state.mainTabs.querySelectorAll('[data-main-tab]')
    for (var i = 0; i < tabs.length; i += 1) {
      var active = tabs[i].getAttribute('data-main-tab') === next
      tabs[i].classList.toggle('active', active)
      tabs[i].setAttribute('aria-selected', active ? 'true' : 'false')
    }
    var panes = state.root.querySelectorAll('[data-main-pane]')
    for (var j = 0; j < panes.length; j += 1) {
      var paneActive = panes[j].getAttribute('data-main-pane') === next
      panes[j].classList.toggle('active', paneActive)
      panes[j].hidden = !paneActive
      if (paneActive) {
        panes[j].style.setProperty('--pane-shift', direction > 0 ? '12px' : '-12px')
        if (animate !== false && previous !== next) {
          panes[j].classList.remove('ccw-pane-enter')
          void panes[j].offsetWidth
          panes[j].classList.add('ccw-pane-enter')
        }
      }
    }
    state.mainTab = next
  }

  async function resetWorkspaceRoot() {
    if (!state.settings) return
    await saveWorkspaceRoot(state.settings.defaultWorkspaceRoot || '')
  }

  async function pickDirectory(kind, accountId, currentPath, online, label) {
    state.busy = kind === 'root' ? 'settings' : accountId
    showError('')
    render()
    try {
      var data = await api('/pick-directory', { method: 'POST' })
      if (!data || !data.path) return
      if (kind === 'root') {
        await saveWorkspaceRoot(data.path)
        return
      } else {
        setPending({ kind: 'account', accountId: accountId, path: data.path, online: online, label: label })
      }
    } catch (error) {
      // Linux without zenity/kdialog (and any other non-native picker
      // deployment) opens the in-panel path dialog. Electron does not support
      // window.prompt, so the fallback must be real UI, not a browser prompt.
      if (kind === 'root') {
        openWorkspacePath(
          'root-workspace',
          '',
          currentPath || (state.settings ? state.settings.workspaceRoot : ''),
          false,
          ''
        )
      } else {
        openWorkspacePath('account-workspace', accountId, currentPath || '', online, label)
      }
    } finally {
      state.busy = ''
      render()
    }
  }

  async function resetAccountWorkspace(accountId, online) {
    if (online && !window.confirm(text.workspaceConfirm)) return
    state.busy = accountId
    showError('')
    try {
      applyState(await api('/accounts/' + encodeURIComponent(accountId), {
        method: 'PATCH',
        body: { workspace: '' },
      }))
      clearPending()
    } catch (error) {
      showError(error instanceof Error ? error.message : String(error))
    } finally {
      state.busy = ''
      render()
    }
  }

  async function openSkills(accountId) {
    try {
      await api('/accounts/' + encodeURIComponent(accountId) + '/open-skills', { method: 'POST' })
    } catch (error) {
      showError(error instanceof Error ? error.message : String(error))
    }
  }

  async function confirmPending() {
    if (!state.pending) return
    var pending = state.pending
    if (pending.kind === 'root') {
      await saveWorkspaceRoot(pending.path)
      return
    }
    state.busy = pending.accountId
    showError('')
    try {
      applyState(await api('/accounts/' + encodeURIComponent(pending.accountId), {
        method: 'PATCH',
        body: { workspace: pending.path },
      }))
      clearPending()
    } catch (error) {
      showError(error instanceof Error ? error.message : String(error))
    } finally {
      state.busy = ''
      render()
    }
  }

  function cancelPending() {
    clearPending()
  }

  function openTextDialog(kind, accountId, online, label, title, hint, value) {
    state.dialogKind = kind
    state.dialogAccountId = accountId || ''
    state.dialogOnline = Boolean(online)
    state.dialogLabel = label || ''
    state.renameAccountId = accountId || ''
    if (state.renameTitle) state.renameTitle.textContent = title
    if (state.renameHint) state.renameHint.textContent = hint
    if (state.renameDialog) state.renameDialog.hidden = false
    if (state.renameInput) {
      state.renameInput.value = value || ''
      window.setTimeout(function () {
        state.renameInput.focus()
        state.renameInput.select()
      }, 0)
    }
  }

  function openRename(accountId, currentLabel) {
    openTextDialog('rename', accountId, false, currentLabel, text.renameTitle, text.renameHint, currentLabel)
  }

  function openWorkspacePath(kind, accountId, currentPath, online, label) {
    openTextDialog(
      kind,
      accountId,
      online,
      label,
      text.workspacePathTitle,
      text.workspacePathHint,
      currentPath || ''
    )
  }

  function closeRename() {
    state.renameAccountId = ''
    state.dialogKind = ''
    state.dialogAccountId = ''
    state.dialogOnline = false
    state.dialogLabel = ''
    if (state.renameDialog) state.renameDialog.hidden = true
  }

  async function confirmRename() {
    var kind = state.dialogKind
    var accountId = state.dialogAccountId
    var value = state.renameInput ? state.renameInput.value.trim() : ''
    if (!kind) return
    if (kind === 'root-workspace') {
      closeRename()
      await saveWorkspaceRoot(value)
      return
    }
    if (!accountId) return
    if (kind === 'rename' && !value) {
      showError(text.renamePrompt)
      return
    }
    state.busy = accountId
    showError('')
    try {
      var body = kind === 'rename' ? { label: value } : { workspace: value }
      applyState(await api('/accounts/' + encodeURIComponent(accountId), { method: 'PATCH', body: body }))
      closeRename()
    } catch (error) {
      showError(error instanceof Error ? error.message : String(error))
    } finally {
      state.busy = ''
      render()
    }
  }

  async function removeAccount(accountId) {
    if (!window.confirm(text.confirmDelete)) return
    state.busy = accountId
    try {
      applyState(await api('/accounts/' + encodeURIComponent(accountId), { method: 'DELETE' }))
    } catch (error) {
      showError(error instanceof Error ? error.message : String(error))
    } finally {
      state.busy = ''
      render()
    }
  }

  async function copyContent(button) {
    var content = button.getAttribute('data-content') || ''
    try {
      await navigator.clipboard.writeText(content)
      button.textContent = text.copied
    } catch (error) {
      showError(error instanceof Error ? error.message : String(error))
    }
  }

  var LAUNCHER_POSITION_KEY = 'amoayun-link-launcher-position'

  function clampLauncherPosition(left, top) {
    var margin = 6
    var width = state.launcher ? state.launcher.offsetWidth : 0
    var height = state.launcher ? state.launcher.offsetHeight : 0
    var maxLeft = Math.max(margin, window.innerWidth - width - margin)
    var maxTop = Math.max(margin, window.innerHeight - height - margin)
    return {
      left: Math.min(Math.max(margin, left), maxLeft),
      top: Math.min(Math.max(margin, top), maxTop)
    }
  }

  function placeLauncher(left, top, persist) {
    if (!state.launcher) return
    var position = clampLauncherPosition(left, top)
    state.launcher.style.left = position.left + 'px'
    state.launcher.style.top = position.top + 'px'
    state.launcher.style.right = 'auto'
    state.launcher.style.bottom = 'auto'
    state.launcherHasCustomPosition = true
    if (persist) {
      try {
        window.localStorage.setItem(LAUNCHER_POSITION_KEY, JSON.stringify(position))
      } catch (error) {
        // Private mode or a locked-down WebView can reject localStorage.
      }
    }
  }

  function restoreLauncherPosition() {
    try {
      var raw = window.localStorage.getItem(LAUNCHER_POSITION_KEY)
      if (!raw) return
      var saved = JSON.parse(raw)
      if (typeof saved.left !== 'number' || typeof saved.top !== 'number') return
      window.requestAnimationFrame(function () {
        placeLauncher(saved.left, saved.top, false)
      })
    } catch (error) {
      // Ignore corrupt or unavailable saved positions.
    }
  }

  function saveLauncherPosition() {
    if (!state.launcher) return
    var left = parseFloat(state.launcher.style.left)
    var top = parseFloat(state.launcher.style.top)
    if (!isFinite(left) || !isFinite(top)) return
    try {
      window.localStorage.setItem(LAUNCHER_POSITION_KEY, JSON.stringify({ left: left, top: top }))
    } catch (error) {
      // Ignore storage failures; dragging still works for this page.
    }
  }

  function launcherPointerDown(event) {
    if (!state.launcher || event.button !== 0) return
    var rect = state.launcher.getBoundingClientRect()
    state.launcherDrag = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      offsetX: event.clientX - rect.left,
      offsetY: event.clientY - rect.top,
      moved: false
    }
    state.launcher.classList.add('dragging')
    try {
      state.launcher.setPointerCapture(event.pointerId)
    } catch (error) {
      // Pointer capture is best-effort; dragging still works over the button.
    }
  }

  function launcherPointerMove(event) {
    var drag = state.launcherDrag
    if (!drag || event.pointerId !== drag.pointerId) return
    var dx = event.clientX - drag.startX
    var dy = event.clientY - drag.startY
    if (!drag.moved && Math.sqrt(dx * dx + dy * dy) < 4) return
    drag.moved = true
    event.preventDefault()
    placeLauncher(event.clientX - drag.offsetX, event.clientY - drag.offsetY, false)
  }

  function endLauncherDrag(event) {
    var drag = state.launcherDrag
    if (!drag) return
    if (event && event.pointerId !== undefined && event.pointerId !== drag.pointerId) return
    state.launcherDrag = null
    if (state.launcher) {
      state.launcher.classList.remove('dragging')
      try {
        if (event && state.launcher.hasPointerCapture(event.pointerId)) {
          state.launcher.releasePointerCapture(event.pointerId)
        }
      } catch (error) {
        // Ignore a released or unsupported pointer capture.
      }
    }
    if (!drag.moved) return
    state.launcherDragEndedAt = Date.now()
    saveLauncherPosition()
  }

  function openPanel() {
    state.open = true
    state.overlay.hidden = false
    state.host.setAttribute('data-theme', document.body && document.body.hasAttribute('data-ds-dark-theme') ? 'dark' : 'light')
    void refresh()
    if (state.timer === null) {
      state.timer = window.setInterval(function () {
        if (state.open) void refresh()
      }, 2500)
    }
  }

  function closePanel() {
    state.open = false
    closeRename()
    state.overlay.hidden = true
    if (state.timer !== null) {
      window.clearInterval(state.timer)
      state.timer = null
    }
  }

  function boot() {
    if (document.getElementById('amoayun-link-host')) return
    var host = document.createElement('div')
    host.id = 'amoayun-link-host'
    document.body.appendChild(host)
    var root = host.attachShadow({ mode: 'open' })
    root.innerHTML = '<style>' + CSS + '</style>' + HTML
    state.host = host
    state.root = root
    state.launcher = root.querySelector('.ccw-launcher')
    state.overlay = root.querySelector('.ccw-overlay')
    state.list = root.querySelector('.ccw-list')
    state.tabs = root.querySelector('.ccw-tabs')
    state.accountLayout = root.querySelector('[data-account-layout]')
    state.addInput = root.querySelector('.ccw-add input')
    state.errorBox = root.querySelector('.ccw-error')
    state.onlinePill = root.querySelector('[data-online]')
    state.storagePill = root.querySelector('[data-storage]')

    state.launcher.addEventListener('pointerdown', launcherPointerDown)
    state.launcher.addEventListener('pointermove', launcherPointerMove)
    state.launcher.addEventListener('pointerup', endLauncherDrag)
    state.launcher.addEventListener('pointercancel', endLauncherDrag)
    // Fallback if pointer capture is unavailable and the pointer leaves the
    // button. These listeners never prevent DSH's own native window dragging.
    window.addEventListener('pointerup', endLauncherDrag)
    window.addEventListener('pointercancel', endLauncherDrag)
    window.addEventListener('blur', function () { endLauncherDrag(null) })
    window.addEventListener('resize', function () {
      if (!state.launcherHasCustomPosition || !state.launcher) return
      var left = parseFloat(state.launcher.style.left)
      var top = parseFloat(state.launcher.style.top)
      if (isFinite(left) && isFinite(top)) placeLauncher(left, top, false)
    })
    state.launcher.addEventListener('click', function (event) {
      // A drag ends with a click; do not open the panel for that gesture.
      if (Date.now() - state.launcherDragEndedAt < 300) {
        event.preventDefault()
        return
      }
      openPanel()
    })
    restoreLauncherPosition()
    root.querySelector('.ccw-close').addEventListener('click', closePanel)
    state.overlay.addEventListener('click', function (event) {
      if (event.target === state.overlay) closePanel()
    })
    root.querySelector('[data-add]').addEventListener('click', addAccount)
    state.rootDisplay = root.querySelector('[data-root-display]')
    state.mainTabs = root.querySelector('.ccw-main-tabs')
    state.mainTabs.addEventListener('click', function (event) {
      var tab = event.target && event.target.closest ? event.target.closest('[data-main-tab]') : null
      if (!tab) return
      selectMainTab(tab.getAttribute('data-main-tab'), true)
    })
    state.hardInterruptSwitch = root.querySelector('[data-hard-interrupt]')
    state.hardInterruptSwitch.addEventListener('click', function () {
      void toggleHardInterrupt()
    })
    state.pendingBox = root.querySelector('.ccw-confirm')
    state.pendingText = root.querySelector('[data-pending-text]')
    state.renameDialog = root.querySelector('.ccw-rename')
    state.renameInput = root.querySelector('[data-rename-input]')
    state.renameTitle = root.querySelector('[data-rename-title]')
    state.renameHint = root.querySelector('[data-rename-hint]')
    root.querySelector('[data-rename-cancel]').addEventListener('click', closeRename)
    root.querySelector('[data-rename-confirm]').addEventListener('click', function () {
      void confirmRename()
    })
    state.renameDialog.addEventListener('click', function (event) {
      if (event.target === state.renameDialog) closeRename()
    })
    state.renameInput.addEventListener('keydown', function (event) {
      if (event.key === 'Enter') void confirmRename()
      if (event.key === 'Escape') closeRename()
    })
    root.querySelector('[data-confirm-workspace]').addEventListener('click', function () {
      void confirmPending()
    })
    root.querySelector('[data-cancel-workspace]').addEventListener('click', function () {
      cancelPending()
    })
    state.addInput.addEventListener('keydown', function (event) {
      if (event.key === 'Enter') addAccount()
    })
    state.tabs.addEventListener('click', function (event) {
      var tab = event.target && event.target.closest ? event.target.closest('[data-account-tab]') : null
      if (!tab) return
      state.selectedAccountId = tab.getAttribute('data-account-tab')
      render()
    })
    state.list.addEventListener('click', function (event) {
      var target = event.target
      var button = target && target.closest ? target.closest('button[data-action]') : null
      if (!button) return
      var action = button.getAttribute('data-action')
      var accountId = button.getAttribute('data-id')
      if (action === 'copy') { void copyContent(button); return }
      if (action === 'toggle-access') {
        void (async () => {
          try {
            var result = await api('/accounts/' + encodeURIComponent(accountId) + '/access', {
              method: 'PUT',
              body: { requireAuth: button.getAttribute('aria-checked') !== 'true' },
            })
            applyState(result)
          } catch (error) {
            showError(error instanceof Error ? error.message : String(error))
          }
        })()
        return
      }
      if (action === 'regenerate-pairing') {
        void (async () => {
          try {
            var result = await api('/accounts/' + encodeURIComponent(accountId) + '/pairing-code', {
              method: 'POST',
              body: {},
            })
            applyState(result)
          } catch (error) {
            showError(error instanceof Error ? error.message : String(error))
          }
        })()
        return
      }
      if (action === 'toggle-allow') {
        void (async () => {
          try {
            var senderId = button.getAttribute('data-sender') || ''
            var account = state.accounts.filter(function (item) { return item.id === accountId })[0]
            var contact = account && account.contacts ? account.contacts.filter(function (item) { return item.senderId === senderId })[0] : null
            var result = await api('/accounts/' + encodeURIComponent(accountId) + '/allow', {
              method: 'POST',
              body: { senderId: senderId, allowed: !(contact && contact.allowed !== false) },
            })
            applyState(result)
          } catch (error) {
            showError(error instanceof Error ? error.message : String(error))
          }
        })()
        return
      }
      if (action === 'remove') { void removeAccount(accountId); return }
      if (action === 'rename') {
        var account = state.accounts.filter(function (item) { return item.id === accountId })[0]
        openRename(accountId, account ? account.label : '')
        return
      }
      if (action === 'workspace') {
        var wsAccount = state.accounts.filter(function (item) { return item.id === accountId })[0]
        void pickDirectory(
          'account',
          accountId,
          wsAccount ? wsAccount.workspace : '',
          wsAccount ? wsAccount.status === 'online' : false,
          wsAccount ? wsAccount.label : ''
        )
        return
      }
      if (action === 'skills') {
        void openSkills(accountId)
        return
      }
      if (action === 'reset-workspace') {
        var resetAccount = state.accounts.filter(function (item) { return item.id === accountId })[0]
        void resetAccountWorkspace(accountId, resetAccount ? resetAccount.status === 'online' : false)
        return
      }
      if (action === 'connect' || action === 'disconnect' || action === 'login' || action === 'cancel') {
        void run(accountId, action)
      }
    })
    state.overlay.addEventListener('keydown', function (event) {
      if (event.key === 'Escape') closePanel()
    })
    selectMainTab(state.mainTab, false)
    render()
    refresh()
    startLinkedSessionMode()
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot)
  } else {
    boot()
  }
})()
`
