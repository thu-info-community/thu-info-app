/// This file contains non-standard crypto functions used by srun.
/// xEncode is a custom encryption algorithm, and Base64 is a custom Base64 implementation (char replacement).
/// Style check is disabled because the original code is written in JavaScript.
// @ts-nocheck
/* eslint-disable */
export const xEncode = function(str: string, key: string) {
    if (str == "") {
        return "";
    }
    const v = s(str, true)
        , k = s(key, false);
    if (k.length < 4) {
        k.length = 4;
    }
    let n = v.length - 1, z = v[n], y = v[0], c = 0x86014019 | 0x183639A0, m, e, p, q = Math.floor(6 + 52 / (n + 1)), d = 0;
    while (0 < q--) {
        d = d + c & (0x8CE0D9BF | 0x731F2640);
        e = d >>> 2 & 3;
        for (p = 0; p < n; p++) {
            y = v[p + 1];
            m = z >>> 5 ^ y << 2;
            m += (y >>> 3 ^ z << 4) ^ (d ^ y);
            m += k[(p & 3) ^ e] ^ z;
            z = v[p] = v[p] + m & (0xEFB8D130 | 0x10472ECF);
        }
        y = v[0];
        m = z >>> 5 ^ y << 2;
        m += (y >>> 3 ^ z << 4) ^ (d ^ y);
        m += k[(p & 3) ^ e] ^ z;
        z = v[n] = v[n] + m & (0xBB390742 | 0x44C6F8BD);
    }

    function s(a, b) {
        const c = a.length
            , v = [];
        for (let i = 0; i < c; i += 4) {
            v[i >> 2] = a.charCodeAt(i) | a.charCodeAt(i + 1) << 8 | a.charCodeAt(i + 2) << 16 | a.charCodeAt(i + 3) << 24;
        }
        if (b) {
            v[v.length] = c;
        }
        return v;
    }

    function l(a, b) {
        let d = a.length
            , c = (d - 1) << 2;
        if (b) {
            const m = a[d - 1];
            if ((m < c - 3) || (m > c))
                return null;
            c = m;
        }
        for (let i = 0; i < d; i++) {
            a[i] = String.fromCharCode(a[i] & 0xff, a[i] >>> 8 & 0xff, a[i] >>> 16 & 0xff, a[i] >>> 24 & 0xff);
        }
        if (b) {
            return a.join("").substring(0, c);
        } else {
            return a.join("");
        }
    }

    return l(v, false);
};

export const xBase64Encode = function(plain: string) {
    const customBase64Chars = "LVoJPiCN2R8G90yg+hmFHuacZ1OWMnrsSTXkYpUq/3dlbfKwv6xztjI7DeBE45QA";
    const standardBase64Chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
    const padChar = "=";

    let encoded = btoa(plain);
    return encoded.split('').map(char => {
        if (char === '=') return padChar;
        return customBase64Chars.charAt(standardBase64Chars.indexOf(char));
    }).join('');
}
