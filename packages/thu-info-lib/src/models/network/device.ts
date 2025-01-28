export interface Device {
    readonly key: number;
    readonly ip4: string;
    readonly ip6: string;
    readonly loggedAt: string;
    readonly mac: string;
    readonly authPermission: string;
}
