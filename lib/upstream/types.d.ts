export interface UpstreamEnvelope {
    ret?: number;
    errcode?: number;
    errmsg?: string;
    [key: string]: unknown;
}
export interface UpstreamItem {
    type?: number;
    text_item?: {
        text?: string;
    };
    [key: string]: unknown;
}
export interface UpstreamMessage {
    seq?: number;
    message_id?: string | number;
    client_id?: string;
    from_user_id?: string;
    to_user_id?: string;
    session_id?: string;
    group_id?: string;
    context_token?: string;
    message_type?: number;
    message_state?: number;
    create_time_ms?: number;
    item_list?: UpstreamItem[];
    [key: string]: unknown;
}
export interface GetUpdatesResponse extends UpstreamEnvelope {
    msgs?: UpstreamMessage[];
    get_updates_buf?: string;
}
export interface GetBotQrcodeResponse extends UpstreamEnvelope {
    qrcode: string;
    qrcode_img_content: string;
}
export interface GetQrcodeStatusResponse extends UpstreamEnvelope {
    status?: string;
    baseurl?: string;
    bot_token?: string;
    [key: string]: unknown;
}
