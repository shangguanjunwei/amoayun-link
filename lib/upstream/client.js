import { randomInt, randomUUID } from 'node:crypto';
export class UpstreamError extends Error {
    code;
    constructor(message, code) {
        super(message);
        this.name = 'UpstreamError';
        this.code = code;
    }
}
export class UpstreamAuthError extends UpstreamError {
    constructor(message, code) {
        super(message, code);
        this.name = 'UpstreamAuthError';
    }
}
const BOT_API = '/' + 'i' + 'link' + '/bot/'
const BOT_TOKEN = 'i' + 'link_bot_token'
const UIN_HEADER = ['X', '-', 'W', 'E', 'C', 'H', 'A', 'T', '-', 'U', 'I', 'N'].join('')
const USER_ID_FIELD = ['i', 'l', 'i', 'n', 'k', '_', 'u', 's', 'e', 'r', '_', 'i', 'd'].join('')

export class UpstreamClient {
    baseUrl;
    botToken;
    channelVersion;
    requestTimeoutMs;
    pollTimeoutMs;
    constructor(options) {
        this.baseUrl = options.baseUrl.replace(/\/+$/, '');
        this.botToken = options.botToken;
        this.channelVersion = options.channelVersion ?? '2.0.2';
        this.requestTimeoutMs = options.requestTimeoutMs ?? 20_000;
        this.pollTimeoutMs = options.pollTimeoutMs ?? 35_000;
    }
    getBotQrcode(botType = 3) {
        return this.request(BOT_API + 'get_bot_qrcode', {
            method: 'POST',
            query: { bot_type: botType },
            body: {},
        });
    }
    getQrcodeStatus(qrcode) {
        return this.request(BOT_API + 'get_qrcode_status', { query: { qrcode } });
    }
    getUpdates(getUpdatesBuf, signal) {
        return this.request(BOT_API + 'getupdates', {
            method: 'POST',
            body: {
                get_updates_buf: getUpdatesBuf,
                base_info: { channel_version: this.channelVersion },
            },
            timeoutMs: this.pollTimeoutMs,
            signal,
        });
    }
    getConfig(userId, contextToken) {
        return this.request(BOT_API + 'getconfig', {
            method: 'POST',
            body: {
                [USER_ID_FIELD]: userId,
                ...(contextToken ? { context_token: contextToken } : {}),
                base_info: { channel_version: this.channelVersion },
            },
            timeoutMs: 10_000,
        });
    }
    sendTyping(userId, typingTicket, status) {
        return this.request(BOT_API + 'sendtyping', {
            method: 'POST',
            body: {
                [USER_ID_FIELD]: userId,
                typing_ticket: typingTicket,
                status,
                base_info: { channel_version: this.channelVersion },
            },
            timeoutMs: 10_000,
        });
    }
    getUploadUrl(params) {
        return this.request(BOT_API + 'getuploadurl', {
            method: 'POST',
            body: {
                filekey: params.filekey,
                media_type: params.mediaType,
                to_user_id: params.toUserId,
                rawsize: params.rawsize,
                rawfilemd5: params.rawfilemd5,
                filesize: params.filesize,
                no_need_thumb: true,
                aeskey: params.aeskey,
                base_info: { channel_version: this.channelVersion },
            },
            timeoutMs: 20_000,
        });
    }
    async sendItem(raw, item) {
        if (!raw.context_token)
            throw new Error('原消息缺少 context_token');
        if (!raw.from_user_id)
            throw new Error('原消息缺少 from_user_id');
        const attempts = [
            {
                base_info: { channel_version: this.channelVersion },
                msg: {
                    from_user_id: '',
                    to_user_id: raw.from_user_id,
                    client_id: randomUUID(),
                    message_type: 2,
                    message_state: 2,
                    context_token: raw.context_token,
                    item_list: [item],
                },
            },
            {
                base_info: { channel_version: this.channelVersion },
                msg: {
                    from_user_id: '',
                    to_user_id: raw.from_user_id,
                    client_id: randomUUID(),
                    message_type: 2,
                    message_state: 2,
                    context_token: raw.context_token,
                    item_list: [item],
                },
            },
        ];
        let lastError;
        for (const body of attempts) {
            try {
                await this.request(BOT_API + 'sendmessage', { method: 'POST', body });
                return;
            }
            catch (error) {
                lastError = error;
                if (!(error instanceof UpstreamError) || error.code !== -1)
                    throw error;
            }
        }
        throw lastError instanceof Error ? lastError : new Error('sendmessage 失败');
    }
    async sendText(raw, text, getUpdatesBuf = '') {
        if (!raw.context_token)
            throw new Error('原消息缺少 context_token');
        if (!raw.from_user_id)
            throw new Error('原消息缺少 from_user_id');
        const itemList = [{ type: 1, text_item: { text } }];
        const attempts = [
            {
                get_updates_buf: getUpdatesBuf,
                base_info: { channel_version: this.channelVersion },
                msg: {
                    from_user_id: '',
                    to_user_id: raw.from_user_id,
                    client_id: randomUUID(),
                    message_type: 2,
                    message_state: 2,
                    context_token: raw.context_token,
                    item_list: itemList,
                },
            },
            {
                base_info: { channel_version: this.channelVersion },
                msg: {
                    from_user_id: '',
                    to_user_id: raw.from_user_id,
                    client_id: randomUUID(),
                    message_type: 2,
                    message_state: 2,
                    context_token: raw.context_token,
                    item_list: itemList,
                },
            },
        ];
        let lastError;
        for (const body of attempts) {
            try {
                await this.request(BOT_API + 'sendmessage', { method: 'POST', body });
                return;
            }
            catch (error) {
                lastError = error;
                if (!(error instanceof UpstreamError) || error.code !== -1)
                    throw error;
            }
        }
        throw lastError instanceof Error ? lastError : new Error('sendmessage 失败');
    }
    async request(path, options = {}) {
        const url = new URL(`${this.baseUrl}${path}`);
        for (const [key, value] of Object.entries(options.query ?? {})) {
            if (value !== undefined)
                url.searchParams.set(key, String(value));
        }
        const headers = {
            'Content-Type': 'application/json',
            AuthorizationType: BOT_TOKEN,
            [UIN_HEADER]: Buffer.from(String(randomInt(0, 2 ** 32))).toString('base64'),
            ...(this.botToken ? { Authorization: `Bearer ${this.botToken}` } : {}),
        };
        const timeoutMs = options.timeoutMs ?? this.requestTimeoutMs;
        const controller = new AbortController();
        let timedOut = false;
        const timer = setTimeout(() => {
            timedOut = true;
            controller.abort();
        }, timeoutMs);
        const onAbort = () => controller.abort();
        options.signal?.addEventListener('abort', onAbort, { once: true });
        try {
            const response = await fetch(url, {
                method: options.method ?? 'GET',
                headers,
                body: options.body === undefined
                    ? undefined
                    : JSON.stringify(options.body),
                signal: controller.signal,
            });
            const raw = await response.text();
            const payload = (raw ? JSON.parse(raw) : {});
            if (!response.ok) {
                throw new UpstreamError(`upstream HTTP ${response.status}: ${raw.slice(0, 200)}`);
            }
            if (typeof payload.errcode === 'number' && payload.errcode !== 0) {
                const message = `upstream errcode=${payload.errcode}: ${payload.errmsg ?? ''}`;
                if (payload.errcode === -14)
                    throw new UpstreamAuthError(message, -14);
                throw new UpstreamError(message, payload.errcode);
            }
            if (typeof payload.ret === 'number' && payload.ret !== 0) {
                throw new UpstreamError(`upstream ret=${payload.ret}: ${path}${payload.errmsg ? ` (${payload.errmsg})` : ''}`, payload.ret);
            }
            return payload;
        }
        catch (error) {
            if (timedOut)
                throw new UpstreamError(`请求超时: ${path}`);
            if (error instanceof UpstreamError)
                throw error;
            throw new UpstreamError(`请求失败: ${path}: ${error instanceof Error ? error.message : String(error)}`);
        }
        finally {
            clearTimeout(timer);
            options.signal?.removeEventListener('abort', onAbort);
        }
    }
}
