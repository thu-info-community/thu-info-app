export type AuthType = "import" | "802.1x"

export interface Device {
    readonly ip4: string;
    readonly ip6: string;
    readonly loggedAt: string;
    readonly in: string;
    readonly out: string;
    readonly nasIp: string;
    readonly mac: string;
    readonly authType: AuthType;
}