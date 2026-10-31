import { readFile, writeFile } from 'node:fs/promises'
import { join } from 'node:path'

const root = new URL('..', import.meta.url).pathname
const assets = join(root, 'docs', 'assets')
const packageName = '@amoayun/dsh-amoayun-link-plugin'

async function image(name) {
  const data = await readFile(join(assets, name))
  return `data:image/jpeg;base64,${data.toString('base64')}`
}

const steps = [
  {
    type: 'image',
    tag: '准备',
    title: '下载 DeepSeek Harness 桌面端',
    desc: '打开 DeepSeek 官方下载页，选择 macOS 版本。下载完成后安装并打开 DeepSeek Harness。',
    image: '001.jpg',
    alt: 'DeepSeek 官方下载页',
    hotspots: [
      { left: 57.5, top: 77.4, width: 10.9, height: 4.6, label: 'Harness 桌面端' },
    ],
    hint: '只支持 macOS。安装包下载完成后，按 macOS 常规方式安装并打开。',
  },
  {
    type: 'image',
    tag: '插件',
    title: '进入「插件」页面',
    desc: '打开 DeepSeek Harness，在左侧边栏点击「插件」。',
    image: '002.jpg',
    alt: 'DeepSeek Harness 插件页',
    hotspots: [
      { left: 1.3, top: 17.4, width: 16.2, height: 3.8, label: '插件' },
    ],
    hint: '截图中的工作区和联系人信息已打码。',
  },
  {
    type: 'image',
    tag: '插件',
    title: '点击「添加插件」',
    desc: '在插件页面右上角点击「添加插件」。',
    image: '002.jpg',
    alt: '添加插件按钮',
    hotspots: [
      { left: 82.2, top: 9.2, width: 8.3, height: 3.5, label: '添加插件' },
    ],
    hint: '不要点旁边的下拉箭头，直接点「添加插件」。',
  },
  {
    type: 'image',
    tag: '插件',
    title: '输入插件包名',
    desc: '在包名输入框里填写下面的完整包名。',
    image: '004.jpg',
    alt: '填写插件包名',
    hotspots: [
      { left: 17.8, top: 39.5, width: 39.9, height: 3.9, label: '包名输入框', side: 'bottom' },
    ],
    packageInput: true,
    hint: '包名必须完整，包括 @amoayun/ 前缀。',
  },
  {
    type: 'image',
    tag: '插件',
    title: '点击「安装」',
    desc: '确认包名、版本和来源无误后，点击「安装」。第三方插件会显示信任提示，只安装你信任的来源。',
    image: '004.jpg',
    alt: '安装插件',
    hotspots: [
      { left: 17.8, top: 65.6, width: 39.9, height: 4.0, label: '安装', side: 'bottom' },
    ],
    hint: '当前版本为 2.3.4。',
  },
  {
    type: 'image',
    tag: '插件',
    title: '等待安装完成',
    desc: 'DSH 会显示「插件安装中…」。不要关闭窗口，等待进度结束。',
    image: '005.jpg',
    alt: '插件安装中',
    hotspots: [],
    hint: '安装过程会下载并检查插件的依赖。',
  },
  {
    type: 'image',
    tag: '插件',
    title: '点击「立即启用」',
    desc: '看到「已安装」后，点击「立即启用」，让插件进入 DSH 的插件列表。',
    image: '006.jpg',
    alt: '插件安装完成',
    hotspots: [
      { left: 17.8, top: 62.4, width: 40.0, height: 4.5, label: '立即启用', side: 'bottom' },
    ],
    hint: '启用后先不要急着扫码，下一步必须先重启 DSH。',
  },
  {
    type: 'mock',
    tag: '关键',
    title: '必须重启 DeepSeek Harness',
    desc: '安装完成并点击「立即启用」后，请直接重启 DeepSeek Harness 桌面端。',
    mock: 'restart',
    strong: true,
    hint: '无论是否出现重启提示，都要重启一次。只刷新页面不够。',
  },
  {
    type: 'mock',
    tag: '入口',
    title: '打开右下角 Amoayun Link',
    desc: '重启后，DSH 窗口右下角会出现绿色「Amoayun Link」悬浮按钮。点击它打开插件面板。',
    mock: 'launcher',
    hint: '如果看不到按钮，先确认插件已启用，再完全退出并重新打开 DSH。',
  },
  {
    type: 'mock',
    tag: 'vx',
    title: '添加 vx 并扫码登录',
    desc: '进入「账户设置」，点击「添加 vx」，输入备注后点击扫码登录，用 vx 扫描二维码并确认授权。',
    mock: 'qr',
    hint: '二维码只用于当前登录，不要把二维码截图发给别人。',
  },
  {
    type: 'mock',
    tag: 'vx',
    title: '确认账号在线',
    desc: '扫码成功后，账号状态会从「等待扫码」变成「在线」。',
    mock: 'online',
    hint: '账号在线后，联系人发来的消息才会进入 Agent。',
  },
  {
    type: 'mock',
    tag: '安全',
    title: '建议开启访问控制',
    desc: '在账户详情中打开「仅允许已授权联系人」。把 6 位配对码单独发给可信联系人，对方回复配对码后才会进入 Agent。',
    mock: 'access',
    hint: '开启后，未授权联系人不会创建 session，也不会调用工具或模型。',
  },
  {
    type: 'mock',
    tag: '完成',
    title: '安装完成',
    desc: '让联系人发一条测试消息，确认 DSH 中创建了会话，并且联系人能收到回复。',
    mock: 'done',
    hint: '至此，Amoayun Link 已经在 macOS 的 DeepSeek Harness 中安装并运行。',
  },
]

function hotspots(list) {
  return list.map((h) => `
    <span class="hotspot ${h.side === 'bottom' ? 'label-bottom' : ''}" style="left:${h.left}%;top:${h.top}%;width:${h.width}%;height:${h.height}%">
      <span class="hotspot-label">${h.label}</span>
    </span>`).join('')
}

function packagePill() {
  return `
    <div class="package-pill">
      <code>${packageName}</code>
      <button class="copy-btn" data-copy="${packageName}" type="button">复制</button>
    </div>`
}

function mock(kind) {
  if (kind === 'restart') {
    return `
      <div class="mock mock-restart" aria-label="重启 DSH 示意图">
        <div class="mini-menubar">
          <span class="mini-apple">●</span>
          <strong>DeepSeek Harness</strong>
          <span>文件</span><span>Edit</span><span>Window</span>
        </div>
        <div class="restart-menu">
          <div class="menu-item">关于 DeepSeek Harness</div>
          <div class="menu-item">设置…</div>
          <div class="menu-sep"></div>
          <div class="menu-item quit">退出 DeepSeek Harness <span>⌘Q</span></div>
        </div>
        <div class="restart-cursor"></div>
        <div class="restart-copy">
          <strong>完全退出</strong>
          <span>然后重新打开 DSH</span>
        </div>
      </div>`
  }
  if (kind === 'launcher') {
    return `
      <div class="mock mock-launcher" aria-label="右下角悬浮入口示意图">
        <div class="fake-app">
          <div class="fake-sidebar"></div>
          <div class="fake-content">
            <div class="fake-line w40"></div>
            <div class="fake-line w70"></div>
            <div class="fake-line w55"></div>
          </div>
        </div>
        <div class="launcher-pulse"></div>
        <div class="fake-launcher">Amoayun Link <span>1</span></div>
        <div class="launcher-arrow">点这里</div>
      </div>`
  }
  if (kind === 'qr') {
    return `
      <div class="mock mock-panel" aria-label="添加 vx 并扫码示意图">
        <div class="panel-title">Amoayun Link</div>
        <div class="panel-sub">扫码接入 vx，文字、图片、文件和语音自动进入 Agent</div>
        <div class="panel-tabs"><span>插件设置</span><span class="active">账户设置</span></div>
        <div class="panel-add-row"><div class="panel-input"><span>账号备注，例如：工作号</span></div><button>添加 vx</button></div>
        <div class="panel-account">
          <div class="account-avatar">消</div>
          <div><strong>工作号</strong><small>等待扫码</small></div>
          <span class="online-pill">等待扫码</span>
        </div>
        <div class="qr-box" aria-label="二维码示意，不可扫描">
          <div class="fake-qr"></div>
          <div class="scanline"></div>
          <p>二维码仅为示意<br>请扫描 DSH 面板中的真实二维码</p>
        </div>
      </div>`
  }
  if (kind === 'online') {
    return `
      <div class="mock mock-online" aria-label="账号在线示意图">
        <div class="panel-title">账户详情</div>
        <div class="online-card">
          <div class="account-avatar">消</div>
          <div><strong>工作号</strong><small>已登录</small></div>
          <span class="online-status"><i></i>在线</span>
        </div>
        <div class="online-note">账号已连接，联系人消息会自动进入 Agent。</div>
        <div class="online-lines"><span></span><span></span><span></span></div>
      </div>`
  }
  if (kind === 'access') {
    return `
      <div class="mock mock-access" aria-label="访问控制示意图">
        <div class="panel-title">账户详情</div>
        <div class="access-row">
          <div><strong>仅允许已授权联系人</strong><small>未授权用户不会进入 Agent</small></div>
          <div class="switch on"><i></i></div>
        </div>
        <div class="pair-row">
          <span>配对码</span>
          <strong class="fake-code">••••••</strong>
          <small>仅发给可信联系人</small>
        </div>
        <div class="access-note">已授权用户可以正常聊天，也可以使用 Agent 的完全权限。</div>
      </div>`
  }
  return `
    <div class="mock mock-done" aria-label="安装完成示意图">
      <div class="done-ring"><svg viewBox="0 0 52 52"><circle cx="26" cy="26" r="23"></circle><path d="M14 27l8 8 16-17"></path></svg></div>
      <h3>安装完成</h3>
      <p>现在可以让联系人发送一条测试消息。</p>
      <div class="fake-chat"><span>你好</span><span class="reply">已收到，我来帮你处理。</span></div>
    </div>`
}

function stepHtml(step, index) {
  const stepNo = String(index + 1).padStart(2, '0')
  const body = step.type === 'image'
    ? `<div class="shot"><img src="${step.image}" alt="${step.alt}">${hotspots(step.hotspots)}</div>`
    : mock(step.mock)
  const copy = step.packageInput ? packagePill() : ''
  return `
    <section class="step ${step.strong ? 'step-strong' : ''}" id="step-${index + 1}" data-step="${index + 1}">
      <div class="step-index">${stepNo}</div>
      <div class="step-card">
        <div class="step-meta"><span class="tag">${step.tag}</span><span class="step-count">${stepNo} / ${String(steps.length).padStart(2, '0')}</span></div>
        <h2>${step.title}</h2>
        <p class="step-desc">${step.desc}</p>
        ${copy}
        ${body}
        ${step.hint ? `<p class="hint">${step.hint}</p>` : ''}
        ${step.strong ? '<div class="restart-warning"><span>!</span><strong>安装成功不等于已经加载，必须重启 DSH。</strong></div>' : ''}
      </div>
    </section>`
}

const imageData = {}
for (const name of ['001.jpg', '002.jpg', '004.jpg', '005.jpg', '006.jpg']) {
  imageData[name] = await image(name)
}

// Replace image references with embedded data URLs for the single-file output.
for (const step of steps) {
  if (step.image) step.image = imageData[step.image]
}

const html = `<!doctype html>
<html lang="zh-CN">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Amoayun Link · macOS 安装教程</title>
<style>
:root{--green:#07c160;--green-dark:#05a14f;--ink:#101828;--muted:#667085;--line:#e6eaf0;--bg:#f4f7fa;--card:#fff;--amber:#b45309;--shadow:0 24px 70px rgba(16,24,40,.12)}
*{box-sizing:border-box}html{scroll-behavior:smooth}body{margin:0;background:var(--bg);color:var(--ink);font-family:-apple-system,BlinkMacSystemFont,"SF Pro Display","PingFang SC","Helvetica Neue",Arial,sans-serif;line-height:1.65}
body:before{content:"";position:fixed;inset:0;pointer-events:none;background:radial-gradient(circle at 12% 0%,rgba(7,193,96,.11),transparent 30%),radial-gradient(circle at 88% 8%,rgba(59,130,246,.08),transparent 28%);z-index:-1}
a{color:inherit}.progress{position:fixed;top:0;left:0;height:4px;width:0;background:linear-gradient(90deg,#07c160,#34d399,#60a5fa);z-index:99;box-shadow:0 0 18px rgba(7,193,96,.5)}
.shell{max-width:1180px;margin:0 auto;padding:0 26px}
.hero{padding:64px 0 42px}
.hero-grid{display:grid;grid-template-columns:1.1fr .9fr;gap:44px;align-items:center}
.eyebrow{display:inline-flex;align-items:center;gap:8px;padding:7px 10px;border:1px solid rgba(7,193,96,.24);border-radius:999px;background:rgba(7,193,96,.08);color:#057a3f;font-size:12px;font-weight:700;letter-spacing:.02em}
h1{font-size:clamp(36px,5vw,64px);line-height:1.08;letter-spacing:-.045em;margin:20px 0 16px;font-weight:800}
h1 em{font-style:normal;color:var(--green-dark)}
.hero p{max-width:560px;color:var(--muted);font-size:16px;margin:0 0 24px}
.package-pill{display:flex;align-items:center;gap:10px;flex-wrap:wrap;margin:18px 0 24px}
.package-pill code{background:#0d1b2a;color:#d1fae5;border-radius:12px;padding:11px 14px;font-size:12.5px;word-break:break-all;box-shadow:0 8px 20px rgba(13,27,42,.16)}
.copy-btn{border:0;border-radius:10px;background:var(--green);color:#fff;padding:10px 14px;font:inherit;font-size:12px;font-weight:700;cursor:pointer;transition:transform .2s,background .2s}
.copy-btn:hover{background:var(--green-dark);transform:translateY(-1px)}
.hero-actions{display:flex;gap:10px;flex-wrap:wrap}
.btn{display:inline-flex;align-items:center;gap:8px;border-radius:12px;padding:12px 16px;font-weight:700;font-size:13px;text-decoration:none;border:1px solid var(--line);background:#fff;color:var(--ink);transition:transform .2s,box-shadow .2s}
.btn.primary{background:var(--green);border-color:var(--green);color:#fff;box-shadow:0 12px 26px rgba(7,193,96,.24)}
.btn:hover{transform:translateY(-2px);box-shadow:0 14px 28px rgba(16,24,40,.1)}
.hero-visual{position:relative;min-height:360px}
.visual-card{position:absolute;inset:20px 0 0 20px;border-radius:26px;background:linear-gradient(145deg,#fff,#f0fdf4);border:1px solid #d9f7e6;box-shadow:var(--shadow);padding:22px;overflow:hidden}
.visual-card:before{content:"";position:absolute;width:200px;height:200px;border-radius:50%;background:rgba(7,193,96,.12);filter:blur(2px);right:-60px;top:-70px}
.visual-top{display:flex;gap:7px;margin-bottom:24px}.dot{width:9px;height:9px;border-radius:50%;background:#d1d5db}.dot:nth-child(1){background:#fca5a5}.dot:nth-child(2){background:#fcd34d}.dot:nth-child(3){background:#86efac}
.visual-line{height:9px;border-radius:99px;background:#e5e7eb;margin:12px 0}.w70{width:70%}.w45{width:45%}.w88{width:88%}
.visual-launcher{position:absolute;right:22px;bottom:22px;background:var(--green);color:#fff;border-radius:999px;padding:12px 18px;font-size:13px;font-weight:800;box-shadow:0 14px 35px rgba(7,193,96,.38);animation:float 3.6s ease-in-out infinite}
.visual-launcher:after{content:"1";display:inline-flex;align-items:center;justify-content:center;width:18px;height:18px;border-radius:50%;background:#fff;color:var(--green);margin-left:9px;font-size:11px}
.visual-pulse{position:absolute;right:14px;bottom:14px;width:150px;height:56px;border-radius:999px;border:1px solid rgba(7,193,96,.4);animation:pulse 2.4s ease-out infinite}
.stats{display:flex;gap:22px;margin-top:26px;border-top:1px solid var(--line);padding-top:18px}.stat b{display:block;font-size:18px}.stat span{font-size:11px;color:var(--muted)}
.section-head{display:flex;align-items:end;justify-content:space-between;gap:20px;margin:16px 0 18px}.section-head h2{font-size:24px;margin:0;letter-spacing:-.03em}.section-head span{font-size:12px;color:var(--muted)}
.steps{position:relative;padding:10px 0 50px}.steps:before{content:"";position:absolute;left:38px;top:0;bottom:50px;width:1px;background:linear-gradient(#bbf7d0,#e5e7eb 60%,transparent)}
.step{display:grid;grid-template-columns:76px minmax(0,1fr);gap:18px;margin:0 0 30px;opacity:0;transform:translateY(24px);transition:opacity .7s ease,transform .7s cubic-bezier(.22,.8,.32,1)}
.step.visible{opacity:1;transform:none}
.step-index{position:relative;z-index:1;display:flex;justify-content:center;padding-top:24px}.step-index span{display:none}
.step-index{position:relative;height:38px;padding-top:0;display:flex;align-items:center;justify-content:center;font-weight:800;color:#059669;font-size:11px;letter-spacing:.02em}.step-index:before{content:"";position:absolute;left:50%;top:0;transform:translateX(-50%);width:38px;height:38px;border-radius:50%;background:#fff;border:1px solid #a7f3d0;box-shadow:0 8px 20px rgba(7,193,96,.12);z-index:-1}
.step-card{background:rgba(255,255,255,.9);border:1px solid rgba(230,234,240,.95);border-radius:22px;padding:24px;box-shadow:0 12px 40px rgba(16,24,40,.06);backdrop-filter:blur(10px)}
.step-strong .step-card{border-color:rgba(245,158,11,.45);box-shadow:0 18px 48px rgba(180,83,9,.12)}
.step-meta{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:6px}.tag{font-size:11px;font-weight:800;color:#047857;background:#ecfdf5;border:1px solid #bbf7d0;border-radius:999px;padding:4px 8px;letter-spacing:.04em}.step-count{font-size:11px;color:#98a2b3;font-variant-numeric:tabular-nums}
.step h2{font-size:clamp(20px,2.6vw,29px);line-height:1.25;letter-spacing:-.03em;margin:6px 0 8px}.step-desc{color:#475467;font-size:14.5px;margin:0 0 18px;max-width:780px}
.hint{font-size:12px;color:#667085;background:#f8fafc;border-left:3px solid #cbd5e1;padding:9px 12px;border-radius:0 8px 8px 0;margin:14px 0 0}
.shot{position:relative;overflow:hidden;border-radius:15px;border:1px solid #e4e7ec;background:#f8fafc;box-shadow:0 16px 38px rgba(16,24,40,.1)}
.shot img{display:block;width:100%;height:auto}
.hotspot{position:absolute;border:2.5px solid var(--green);border-radius:10px;box-shadow:0 0 0 4px rgba(7,193,96,.14),0 0 24px rgba(7,193,96,.4);animation:hotspotPulse 2.2s ease-in-out infinite;z-index:2}
.hotspot:before{content:"";position:absolute;inset:-9px;border:1px solid rgba(7,193,96,.32);border-radius:14px;animation:ring 2.2s ease-out infinite}
.hotspot-label{position:absolute;left:50%;bottom:calc(100% + 9px);transform:translateX(-50%);white-space:nowrap;background:#064e3b;color:#ecfdf5;font-size:10px;font-weight:700;padding:5px 8px;border-radius:7px;box-shadow:0 7px 18px rgba(6,78,59,.25)}
.hotspot-label:after{content:"";position:absolute;left:50%;top:100%;border:5px solid transparent;border-top-color:#064e3b;transform:translateX(-50%)}.hotspot.label-bottom .hotspot-label{bottom:auto;top:calc(100% + 9px)}.hotspot.label-bottom .hotspot-label:after{top:auto;bottom:100%;border-top-color:transparent;border-bottom-color:#064e3b}
.package-pill code{max-width:100%}
.mock{position:relative;border-radius:16px;border:1px solid #e4e7ec;background:#f8fafc;min-height:280px;overflow:hidden;padding:22px}
.mock-restart{background:linear-gradient(135deg,#fff7ed,#fffbeb);border-color:#fed7aa;min-height:320px}
.mini-menubar{display:flex;gap:16px;align-items:center;background:rgba(255,255,255,.8);border:1px solid #f1f5f9;border-radius:10px;padding:9px 12px;font-size:11px;color:#475467;box-shadow:0 6px 18px rgba(16,24,40,.06)}
.mini-menubar strong{color:#111827}.mini-apple{color:#111827;font-size:13px}
.restart-menu{position:absolute;right:42px;top:62px;width:238px;background:#fff;border:1px solid #e5e7eb;border-radius:12px;padding:7px;box-shadow:0 20px 45px rgba(16,24,40,.18);font-size:11.5px;animation:menuDrop .7s .35s both}
.menu-item{padding:7px 10px;border-radius:7px;color:#344054}.menu-item.quit{background:#ecfdf5;color:#047857;font-weight:700}.menu-item.quit span{float:right;color:#059669}
.menu-sep{height:1px;background:#f1f5f9;margin:5px 6px}
.restart-cursor{position:absolute;right:152px;top:184px;width:16px;height:20px;background:#111827;clip-path:polygon(0 0,0 80%,20% 65%,36% 100%,48% 92%,32% 58%,58% 58%);animation:cursorMove 2.8s ease-in-out infinite;filter:drop-shadow(0 4px 5px rgba(0,0,0,.2))}
.restart-copy{position:absolute;left:22px;bottom:22px;display:flex;flex-direction:column;gap:3px;color:#9a3412}.restart-copy strong{font-size:18px}.restart-copy span{font-size:12px;color:#b45309}
.restart-warning{display:flex;align-items:center;gap:10px;margin-top:16px;padding:13px 14px;border-radius:12px;background:#fff7ed;border:1px solid #fed7aa;color:#9a3412;font-size:12.5px}.restart-warning span{width:22px;height:22px;flex:none;display:grid;place-items:center;border-radius:50%;background:#f59e0b;color:#fff;font-weight:800}
.mock-launcher{background:#0f172a;min-height:330px;border-color:#1e293b}.fake-app{position:absolute;inset:22px;background:#f8fafc;border-radius:13px;overflow:hidden;display:flex;opacity:.92}.fake-sidebar{width:24%;background:#e9eef5}.fake-content{flex:1;padding:28px}.fake-line{height:10px;background:#e2e8f0;border-radius:99px;margin:0 0 16px}.w40{width:40%}.w70{width:70%}.w55{width:55%}
.fake-launcher{position:absolute;right:22px;bottom:22px;z-index:3;background:var(--green);color:#fff;border-radius:999px;padding:12px 18px;font-size:12px;font-weight:800;box-shadow:0 16px 38px rgba(7,193,96,.45);animation:float 3s ease-in-out infinite}.fake-launcher span{display:inline-grid;place-items:center;width:18px;height:18px;border-radius:50%;background:#fff;color:var(--green);font-size:10px;margin-left:6px}
.launcher-pulse{position:absolute;right:12px;bottom:12px;width:154px;height:57px;border:1px solid rgba(7,193,96,.45);border-radius:999px;z-index:2;animation:pulse 2.6s ease-out infinite}
.launcher-arrow{position:absolute;right:54px;bottom:92px;color:#d1fae5;font-size:12px;font-weight:800;text-shadow:0 1px 5px rgba(0,0,0,.45)}.launcher-arrow:after{content:"↓";display:block;text-align:center;font-size:20px;animation:bounce 1.6s ease-in-out infinite}
.mock-panel{padding:18px;background:#eef2f7}.panel-title{font-size:17px;font-weight:800}.panel-sub{font-size:10px;color:#667085;margin-top:2px}.panel-tabs{display:flex;background:#e2e8f0;border-radius:9px;padding:3px;margin:14px 0;font-size:10px}.panel-tabs span{flex:1;text-align:center;padding:7px;color:#667085}.panel-tabs .active{background:#fff;border-radius:6px;color:#111827;font-weight:700;box-shadow:0 2px 7px rgba(16,24,40,.08)}
.panel-add-row{display:flex;gap:8px;align-items:stretch}.panel-input{display:flex;flex:1;align-items:center;background:#fff;border:1px solid #e5e7eb;border-radius:9px;padding:7px 8px;font-size:10px;color:#98a2b3}.panel-add-row>button{border:0;background:var(--green);color:#fff;border-radius:7px;padding:7px 10px;font:inherit;font-size:10px;font-weight:700;white-space:nowrap}
.panel-account{display:flex;align-items:center;gap:9px;background:#fff;border:1px solid #e5e7eb;border-radius:10px;margin:10px 0;padding:10px}.account-avatar{width:28px;height:28px;border-radius:7px;background:#14b8a6;color:#fff;display:grid;place-items:center;font-size:10px;font-weight:800}.panel-account small{display:block;color:#98a2b3;font-size:9px}.online-pill{margin-left:auto;border:1px solid #fed7aa;background:#fffbeb;color:#b45309;border-radius:999px;padding:3px 7px;font-size:9px}
.qr-box{position:relative;background:#fff;border:1px solid #e5e7eb;border-radius:10px;display:flex;flex-direction:column;align-items:center;padding:12px;gap:7px;overflow:hidden}.fake-qr{width:118px;height:118px;background:repeating-conic-gradient(#111827 0 25%,#fff 0 50%) 0 0/12px 12px;border:8px solid #fff;box-shadow:0 0 0 1px #e5e7eb;position:relative}.fake-qr:before,.fake-qr:after{content:"";position:absolute;width:24px;height:24px;background:#fff;border:5px solid #111827}.fake-qr:before{left:-5px;top:-5px}.fake-qr:after{right:-5px;bottom:-5px}.qr-box p{font-size:9px;line-height:1.4;color:#98a2b3;text-align:center;margin:0}.scanline{position:absolute;left:16%;right:16%;top:30px;height:2px;background:linear-gradient(90deg,transparent,#07c160,transparent);box-shadow:0 0 10px rgba(7,193,96,.65);animation:scan 2.8s ease-in-out infinite}
.mock-online{background:#f8fafc;padding:28px;min-height:260px}.online-card{display:flex;align-items:center;gap:12px;background:#fff;border:1px solid #e5e7eb;border-radius:14px;padding:18px;margin:18px 0;box-shadow:0 8px 24px rgba(16,24,40,.05)}.online-card strong{display:block;font-size:15px}.online-card small{display:block;color:#98a2b3;font-size:10px;margin-top:2px}.online-status{margin-left:auto;display:inline-flex;align-items:center;gap:6px;border:1px solid #bbf7d0;background:#ecfdf5;color:#047857;border-radius:999px;padding:5px 10px;font-size:11px;font-weight:700}.online-status i{width:6px;height:6px;border-radius:50%;background:#07c160;box-shadow:0 0 0 4px rgba(7,193,96,.13);animation:pulse 2s ease-out infinite}.online-note{font-size:11px;color:#667085;background:#ecfdf5;border:1px solid #d1fae5;border-radius:10px;padding:10px 12px}.online-lines{display:flex;flex-direction:column;gap:8px;margin-top:22px}.online-lines span{height:7px;border-radius:99px;background:#e5e7eb}.online-lines span:nth-child(1){width:42%}.online-lines span:nth-child(2){width:68%}.online-lines span:nth-child(3){width:55%}.mock-access{background:#f8fafc;padding:24px}.access-row{display:flex;align-items:center;justify-content:space-between;gap:18px;background:#fff;border:1px solid #e5e7eb;border-radius:12px;padding:16px;margin:16px 0}.access-row strong{display:block;font-size:13px}.access-row small{display:block;color:#98a2b3;font-size:10px;margin-top:3px}.switch{width:40px;height:23px;border-radius:99px;background:#cbd5e1;position:relative;flex:none}.switch i{position:absolute;top:3px;left:3px;width:17px;height:17px;border-radius:50%;background:#fff;box-shadow:0 2px 5px rgba(0,0,0,.2);transition:transform .25s}.switch.on{background:var(--green)}.switch.on i{transform:translateX(17px)}
.pair-row{display:flex;align-items:center;gap:12px;background:#ecfdf5;border:1px solid #bbf7d0;border-radius:12px;padding:14px 16px;font-size:11px;color:#475467}.pair-row strong{font-size:20px;letter-spacing:.16em;color:#047857}.pair-row small{margin-left:auto;color:#059669}.access-note{font-size:10.5px;color:#b45309;background:#fffbeb;border:1px solid #fde68a;border-radius:9px;padding:10px;margin-top:13px}
.mock-done{display:flex;flex-direction:column;justify-content:center;align-items:center;text-align:center;background:linear-gradient(160deg,#f0fdf4,#fff);min-height:300px}.done-ring{width:64px;height:64px;border-radius:50%;background:#ecfdf5;border:1px solid #bbf7d0;display:grid;place-items:center}.done-ring svg{width:44px;height:44px}.done-ring circle{fill:none;stroke:#86efac;stroke-width:2;stroke-dasharray:145;stroke-dashoffset:145;animation:draw 1.2s .3s forwards}.done-ring path{fill:none;stroke:#07c160;stroke-width:3;stroke-linecap:round;stroke-linejoin:round;stroke-dasharray:40;stroke-dashoffset:40;animation:draw 0.7s 1s forwards}.mock-done h3{margin:14px 0 4px;font-size:22px}.mock-done p{font-size:12px;color:#667085;margin:0 0 14px}.fake-chat{display:flex;flex-direction:column;gap:6px;font-size:11px;width:min(260px,90%)}.fake-chat span{background:#fff;border:1px solid #e5e7eb;padding:7px 10px;border-radius:9px 9px 9px 2px;text-align:left;width:fit-content}.fake-chat .reply{align-self:flex-end;background:#dcfce7;border-color:#bbf7d0;border-radius:9px 9px 2px 9px}
.faq{padding:10px 0 70px}.faq-grid{display:grid;grid-template-columns:1fr 1fr;gap:12px}.faq details{background:#fff;border:1px solid var(--line);border-radius:14px;padding:0 16px;box-shadow:0 6px 20px rgba(16,24,40,.04)}.faq summary{cursor:pointer;font-size:13px;font-weight:700;padding:15px 0;list-style:none;display:flex;justify-content:space-between;gap:10px}.faq summary::-webkit-details-marker{display:none}.faq summary:after{content:"+";color:#07a34f;font-size:17px;line-height:1}.faq details[open] summary:after{content:"−"}.faq p{font-size:12px;color:#667085;margin:0 0 15px;line-height:1.7}
.privacy{display:flex;gap:10px;align-items:flex-start;background:#eff6ff;border:1px solid #bfdbfe;border-radius:12px;padding:12px 14px;margin:20px 0 28px;color:#1d4ed8;font-size:11.5px}.privacy b{color:#1e3a8a}
.footer{border-top:1px solid var(--line);padding:26px 0 40px;color:#98a2b3;font-size:11px;display:flex;justify-content:space-between;gap:12px;flex-wrap:wrap}.footer strong{color:#475467}
.toast{position:fixed;left:50%;bottom:28px;transform:translate(-50%,20px);background:#0f172a;color:#fff;border-radius:999px;padding:10px 16px;font-size:12px;opacity:0;pointer-events:none;transition:opacity .25s,transform .25s;z-index:120;box-shadow:0 14px 30px rgba(15,23,42,.3)}.toast.show{opacity:1;transform:translate(-50%,0)}
@keyframes float{0%,100%{transform:translateY(0)}50%{transform:translateY(-6px)}}
@keyframes pulse{0%{transform:scale(.86);opacity:.9}70%{transform:scale(1.16);opacity:0}100%{transform:scale(1.16);opacity:0}}
@keyframes ring{0%{transform:scale(.92);opacity:.9}70%{transform:scale(1.08);opacity:0}100%{opacity:0}}
@keyframes hotspotPulse{0%,100%{box-shadow:0 0 0 4px rgba(7,193,96,.14),0 0 20px rgba(7,193,96,.3)}50%{box-shadow:0 0 0 7px rgba(7,193,96,.2),0 0 28px rgba(7,193,96,.48)}}
@keyframes scan{0%,100%{transform:translateY(0);opacity:.4}50%{transform:translateY(100px);opacity:1}}
@keyframes draw{to{stroke-dashoffset:0}}
@keyframes menuDrop{from{opacity:0;transform:translateY(-10px) scale(.98)}to{opacity:1;transform:none}}
@keyframes cursorMove{0%,100%{transform:translate(0,0)}45%{transform:translate(-72px,42px)}55%{transform:translate(-72px,42px)}}
@keyframes bounce{0%,100%{transform:translateY(0)}50%{transform:translateY(5px)}}
@media (max-width:900px){.hero-grid{grid-template-columns:1fr;gap:10px}.hero{padding-top:38px}.hero-visual{min-height:280px;max-width:520px}.step{grid-template-columns:44px minmax(0,1fr);gap:9px}.steps:before{left:21px}.step-index{height:30px;font-size:10px;padding-top:0}.step-index:before{width:30px;height:30px}.step-card{padding:17px}.faq-grid{grid-template-columns:1fr}.package-pill{align-items:flex-start;flex-direction:column}.package-pill code{width:100%}.visual-card{inset:0;padding:16px}.stats{gap:14px;flex-wrap:wrap}}
@media (prefers-reduced-motion:reduce){*,*:before,*:after{animation:none!important;transition:none!important}html{scroll-behavior:auto}.step{opacity:1;transform:none}}
</style>
</head>
<body>
<div class="progress" id="progress"></div>
<main class="shell">
  <header class="hero">
    <div class="hero-grid">
      <div>
        <div class="eyebrow">macOS · DeepSeek Harness</div>
        <h1>安装 <em>Amoayun Link</em><br>只要几分钟</h1>
        <p>从下载 DeepSeek Harness 桌面端，到插件安装、重启、扫码登录，一步一步完成。整个过程不需要使用命令行。</p>
        ${packagePill()}
        <div class="hero-actions">
          <a class="btn primary" href="#step-1">开始安装 <span>↓</span></a>
          <a class="btn" href="#faq">常见问题</a>
        </div>
        <div class="stats"><div class="stat"><b>13</b><span>步骤</span></div><div class="stat"><b>macOS</b><span>支持系统</span></div><div class="stat"><b>2.3.4</b><span>插件版本</span></div></div>
      </div>
      <div class="hero-visual" aria-hidden="true">
        <div class="visual-card">
          <div class="visual-top"><i class="dot"></i><i class="dot"></i><i class="dot"></i></div>
          <div class="visual-line w45"></div><div class="visual-line w88"></div><div class="visual-line w70"></div><div class="visual-line w55"></div>
          <div class="visual-line w88" style="margin-top:34px"></div>
        </div>
        <div class="visual-pulse"></div>
        <div class="visual-launcher">Amoayun Link</div>
      </div>
    </div>
  </header>

  <div class="privacy"><span>🔒</span><div><b>截图隐私说明：</b>教程中的工作区、账号路径、二维码和联系人信息已做打码处理；二维码和配对码仅作示意，请以你本机的实际界面为准。</div></div>

  <div class="section-head"><h2>安装步骤</h2><span>向下滚动，关键按钮会自动圈出</span></div>
  <div class="steps">
    ${steps.map(stepHtml).join('')}
  </div>

  <section class="faq" id="faq">
    <div class="section-head"><h2>常见问题</h2><span>安装过程中遇到问题先看这里</span></div>
    <div class="faq-grid">
      <details><summary>安装完成后右下角没有 Amoayun Link</summary><p>先确认插件已经「立即启用」，然后完全退出 DeepSeek Harness 并重新打开。只关闭窗口或刷新页面不一定能加载 Host 插件。</p></details>
      <details><summary>添加插件时提示找不到包</summary><p>确认包名完整填写为 <code>@amoayun/dsh-amoayun-link-plugin</code>。如果仍然失败，检查网络和插件页面显示的版本信息。</p></details>
      <details><summary>扫码后账号一直显示等待扫码</summary><p>重新点击扫码登录，使用 vx 扫描最新的二维码并确认授权。二维码过期后需要重新生成。</p></details>
      <details><summary>联系人发消息没有进入 Agent</summary><p>检查账号是否在线；如果开启了「仅允许已授权联系人」，确认对方已经授权，或者输入了正确的 6 位配对码。</p></details>
      <details><summary>插件安装成功但功能没有变化</summary><p>必须重启 DSH 桌面端。安装和启用只是写入插件，重启后 Host 才会完整加载插件。</p></details>
      <details><summary>截图里的二维码和路径为什么被遮挡</summary><p>这些内容包含账号、登录或联系人信息。教程只保留操作界面，二维码和路径已经做隐私处理。</p></details>
    </div>
  </section>

  <footer class="footer"><span><strong>Amoayun Link</strong> · macOS 安装教程</span><span>DeepSeek Harness 桌面端 · 插件版本 2.3.4</span></footer>
</main>
<div class="toast" id="toast">已复制包名</div>
<script>
const steps = [...document.querySelectorAll('.step')];
const observer = new IntersectionObserver((entries) => { entries.forEach((entry) => { if (entry.isIntersecting) { entry.target.classList.add('visible'); observer.unobserve(entry.target); } }); }, { threshold: 0.12 });
steps.forEach((el) => observer.observe(el));
const progress = document.getElementById('progress');
function updateProgress() { const max = document.documentElement.scrollHeight - innerHeight; const value = max > 0 ? (scrollY / max) * 100 : 0; progress.style.width = value + '%'; }
addEventListener('scroll', updateProgress, { passive: true }); updateProgress();
const toast = document.getElementById('toast');
async function copyText(text) {
  try { await navigator.clipboard.writeText(text); } catch { const area = document.createElement('textarea'); area.value = text; document.body.appendChild(area); area.select(); document.execCommand('copy'); area.remove(); }
  toast.classList.add('show'); setTimeout(() => toast.classList.remove('show'), 1600);
}
document.querySelectorAll('[data-copy]').forEach((button) => button.addEventListener('click', () => copyText(button.getAttribute('data-copy'))));
</script>
</body>
</html>`

await writeFile(join(root, 'docs', 'install-guide.html'), html)
console.log(`generated docs/install-guide.html (${Buffer.byteLength(html)} bytes)`)
