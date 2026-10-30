export interface AccountRecord {
    id: string;
    label: string;
    skillsDir?: string;
}
export interface AccountCredentials {
    botToken: string;
    baseUrl: string;
    botId?: string;
    userId?: string;
}
export declare function loadAccounts(dataDir: string): Promise<AccountRecord[]>;
export declare function loadCredentials(dataDir: string, accountId: string): Promise<AccountCredentials | null>;
export declare function saveAccounts(dataDir: string, accounts: AccountRecord[]): Promise<void>;
export declare function createAccount(dataDir: string, label: string): Promise<AccountRecord>;
export declare function saveCredentials(dataDir: string, accountId: string, credentials: AccountCredentials): Promise<void>;
