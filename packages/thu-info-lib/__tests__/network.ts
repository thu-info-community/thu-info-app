import {beforeEach, expect, it, jest} from "@jest/globals";

jest.mock("cross-fetch", () => jest.fn());

import fetch from "cross-fetch";
import {clearCookies, cookies, getRedirectUrl, uFetch, updateCookiesFromHeaders} from "../src/utils/network";

type MockHeaders = {
    get: (key: string) => string | null;
    raw?: () => Record<string, string[] | string | undefined>;
    getSetCookie?: () => string[];
};

const mockedFetch = fetch as jest.MockedFunction<typeof fetch>;

const createHeaders = (setCookieValues: string[] = [], location?: string): MockHeaders => ({
    get: (key: string) => {
        if (key.toLowerCase() === "location") {
            return location ?? null;
        }
        if (key.toLowerCase() === "set-cookie") {
            return setCookieValues.length > 0 ? setCookieValues.join(", ") : null;
        }
        return null;
    },
    raw: () => ({
        "set-cookie": setCookieValues,
    }),
});

const createResponse = (status: number, headers: MockHeaders, body = "") => ({
    status,
    headers,
    arrayBuffer: async () => Buffer.from(body),
    blob: async () => new Blob([body]),
}) as unknown as Response;

beforeEach(() => {
    clearCookies();
    mockedFetch.mockReset();
});

it("captures cookies from manual redirects in Node.js", async () => {
    mockedFetch
        .mockResolvedValueOnce(createResponse(302, createHeaders([
            "wengine_vpn_ticket=abc123; Path=/; HttpOnly",
            "show_vpn=1; Expires=Wed, 01 Jan 2030 00:00:00 GMT; Path=/",
        ], "https://example.com/next")))
        .mockResolvedValueOnce(createResponse(200, createHeaders()));

    const result = await getRedirectUrl("https://example.com/start");

    expect(result).toEqual("https://example.com/next");
    expect(cookies.wengine_vpn_ticket).toEqual("abc123");
    expect(cookies.show_vpn).toEqual("1");
});

it("parses combined set-cookie fallback values safely", () => {
    updateCookiesFromHeaders({
        get: () => "wengine_vpn_ticket=abc123; Path=/, show_vpn=1; Expires=Wed, 01 Jan 2030 00:00:00 GMT; Path=/, heartbeat=alive; Path=/",
    } as unknown as Headers);

    expect(cookies.wengine_vpn_ticket).toEqual("abc123");
    expect(cookies.show_vpn).toEqual("1");
    expect(cookies.heartbeat).toEqual("alive");
});

it("follows node redirects manually and carries intermediate cookies forward", async () => {
    mockedFetch
        .mockResolvedValueOnce(createResponse(302, createHeaders([
            "portal_session=abc123; Path=/; HttpOnly",
        ], "/next")))
        .mockResolvedValueOnce(createResponse(200, createHeaders(), "{\"ok\":true}"));

    const body = await uFetch("https://example.com/start");

    expect(body).toEqual("{\"ok\":true}");
    expect(cookies.portal_session).toEqual("abc123");
    expect(mockedFetch).toHaveBeenCalledTimes(2);
    expect((mockedFetch.mock.calls[1]?.[1] as RequestInit).headers).toMatchObject({
        Cookie: "portal_session=abc123",
    });
});
