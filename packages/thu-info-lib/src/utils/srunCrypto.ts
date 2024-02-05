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

export const Base64 = function() {
    var n = "LVoJPiCN2R8G90yg+hmFHuacZ1OWMnrsSTXkYpUq/3dlbfKwv6xztjI7DeBE45QA"
      , r = "="
      , o = false
      , f = false;
    this.encode = function(t) {
        var o, i, h, u = "", a = t.length;
        r = r || "=";
        t = f ? e(t) : t;
        for (o = 0; o < a; o += 3) {
            h = t.charCodeAt(o) << 16 | (o + 1 < a ? t.charCodeAt(o + 1) << 8 : 0) | (o + 2 < a ? t.charCodeAt(o + 2) : 0);
            for (i = 0; i < 4; i += 1) {
                if (o * 8 + i * 6 > a * 8) {
                    u += r
                } else {
                    u += n.charAt(h >>> 6 * (3 - i) & 63)
                }
            }
        }
        return u
    }
    ;
    this.decode = function(e) {
        var o, i, h, u, a, c, l, D, B, C, A = "", s = [];
        if (!e) {
            return e
        }
        o = C = 0;
        e = e.replace(new RegExp("\\" + r,"gi"), "");
        do {
            a = n.indexOf(e.charAt(o += 1));
            c = n.indexOf(e.charAt(o += 1));
            l = n.indexOf(e.charAt(o += 1));
            D = n.indexOf(e.charAt(o += 1));
            B = a << 18 | c << 12 | l << 6 | D;
            i = B >> 16 & 255;
            h = B >> 8 & 255;
            u = B & 255;
            C += 1;
            if (l === 64) {
                s[C] = String.fromCharCode(i)
            } else if (D === 64) {
                s[C] = String.fromCharCode(i, h)
            } else {
                s[C] = String.fromCharCode(i, h, u)
            }
        } while (o < e.length);
        A = s.join("");
        A = f ? t(A) : A;
        return A
    }
    ;
    this.setPad = function(n) {
        r = n || r;
        return this
    }
    ;
    this.setTab = function(e) {
        n = e || n;
        return this
    }
    ;
    this.setUTF8 = function(n) {
        if (typeof n === "boolean") {
            f = n
        }
        return this
    }
}
