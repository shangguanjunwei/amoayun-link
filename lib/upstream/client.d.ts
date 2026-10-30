import type { GetBotQrcodeResponse, GetQrcodeStatusResponse, GetUpdatesResponse, UpstreamMessage } from './types.ts';
export declare class UpstreamError extends Error {
    readonly code?: number;
    constructor(message: string, code?: number);
}
export declare class UpstreamAuthError extends UpstreamError {
    constructor(message: string, code?: number);
}
interface ClientOptions {
    baseUrl: string;
    botToken?: string;
    channelVersion?: string;
    requestTimeoutMs?: number;
    pollTimeoutMs?: number;
}
export declare class UpstreamClient {
    private readonly baseUrl;
    private readonly botToken?;
    private readonly channelVersion;
    private readonly requestTimeoutMs;
    private readonly pollTimeoutMs;
    constructor(options: ClientOptions);
    getBotQrcode(botType?: number): Promise<GetBotQrcodeResponse>;
    getQrcodeStatus(qrcode: string): Promise<GetQrcodeStatusResponse>;
    getUpdates(getUpdatesBuf: string, signal?: AbortSignal): Promise<GetUpdatesResponse>;
    sendText(raw: UpstreamMessage, text: string, getUpdatesBuf?: string): Promise<void>;
    private request;
}
export {};
