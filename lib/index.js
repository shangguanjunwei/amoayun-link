import { homedir } from 'node:os'
import { join } from 'node:path'
import Schema from '@deepseek-ai/schemastery'
import { AmoayunLinkService } from './service.js'

export const name = 'dsh-amoayun-link-plugin'
export const inject = ['agents', 'agentDefaultModel', 'webServer', 'attachments', 'directoryPicker', 'skills', 'permissionPresets', 'approval', 'agentPresets', 'sessionTitle', 'workspaceRegistry', 'systemPrompt', 'tools']

/**
 * DSH_HOME is the Harness home. The plugin stores its own state under
 * `<DSH_HOME>/amoayun-link`, matching the layout of the standalone Harness CLI.
 * AMOAYUN_LINK_DATA_DIR can point the plugin at another Harness home.
 */
const dshHome = (process.env.DSH_HOME ?? '').trim() || join(homedir(), '.dsh')
const defaultDataDir = (process.env.AMOAYUN_LINK_DATA_DIR ?? '').trim() || dshHome

export const Config = Schema.object({
  dataDir: Schema.string().default(defaultDataDir),
  baseUrl: Schema.string().default(''),
  provider: Schema.string().default(''),
  model: Schema.string().default(''),
  permissionPreset: Schema.string().default('danger-full-access'),
  agentPreset: Schema.string().default(''),
  autoReply: Schema.boolean().default(true),
  welcomeMessage: Schema.string().default('你好，我是 Amoayun Link 助手。请直接告诉我你想做什么；需要选择时，我会用 1/2/3 或 a/b/c 以文字发给你。'),
  cdnBaseUrl: Schema.string().default(''),
  mediaMaxBytes: Schema.number().default(100 * 1024 * 1024),
  mediaTimeoutMs: Schema.number().default(60_000),
  mediaOutboundMaxBytes: Schema.number().default(100 * 1024 * 1024),
})

export function apply(ctx, config) {
  const service = new AmoayunLinkService(ctx, config)
  ctx.effect(() => {
    void service.install().catch((error) => {
      ctx.logger.error(
        `DSH 消息插件启动失败: ${error instanceof Error ? error.message : String(error)}`,
      )
    })
    return () => service.dispose()
  }, 'dsh-amoayun-link-plugin')
}
