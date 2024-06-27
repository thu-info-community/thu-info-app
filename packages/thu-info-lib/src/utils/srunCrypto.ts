/// This file contains non-standard crypto functions used by srun.
/// xEncode is a custom encryption algorithm, and Base64 is a custom Base64 implementation (char replacement).
/// Style check is disabled because the original code is written in JavaScript.

function preprocess(str: string, useLen = false): number[] {
    const v: number[] = []
    const len = str.length

    for (let i = 0; i < len; i += 4) {
        v.push(
            str.charCodeAt(i) | (str.charCodeAt(i + 1) << 8) | (str.charCodeAt(i + 2) << 16) | (str.charCodeAt(i + 3) << 24),
        )
    }

    return useLen ? [...v, len] : v
}

/**
 * xxtea encrypt for srun network
 */
export function xEncode(str: string, key: string): string {
    if (str === '')
        return ''

    const s = preprocess(str, true)
    const k = preprocess(key)

    if (k.length < 4)
        k.length = 4

    const n = s.length - 1
    const delta = 0x9E3779B9

    let z = s[n]
    let y = s[0]
    let q = Math.floor(6 + 52 / (n + 1))
    let d = 0

    while (q-- > 0) {
        d += delta
        const e = d >>> 2 & 3

        for (let p = 0; p < n; p++) {
            y = s[p + 1]
            let mx = z >>> 5 ^ y << 2
            mx += y >>> 3 ^ z << 4 ^ (d ^ y)
            mx += k[p & 3 ^ e] ^ z
            s[p] += mx
            z = s[p]
        }

        y = s[0]
        let mx = z >>> 5 ^ y << 2
        mx += y >>> 3 ^ z << 4 ^ (d ^ y)
        mx += k[n & 3 ^ e] ^ z
        s[n] += mx
        z = s[n]
    }

    return s.map(v => String.fromCharCode(v & 0xFF, v >> 8 & 0xFF, v >> 16 & 0xFF, v >> 24 & 0xFF)).join('')
}

/**
 * A minimal modified base64 encoder for srun network
 */
export function xEncodeBase64(str: string): string {
    const rule = 'LVoJPiCN2R8G90yg+hmFHuacZ1OWMnrsSTXkYpUq/3dlbfKwv6xztjI7DeBE'
    const padding = '='

    const len = str.length
    let res = ''

    for (let i = 0; i < len; i += 3) {
        const h = str.charCodeAt(i) << 16 | (i + 1 < len ? str.charCodeAt(i + 1) << 8 : 0) | (i + 2 < len ? str.charCodeAt(i + 2) : 0)

        for (let j = 0; j < 4; j += 1)
            i * 8 + j * 6 > len * 8 ? res += padding : res += rule.charAt(h >>> 6 * (3 - j) & 63)
    }

    return res
}

// with decode as a class
// export class XBase64 {
//   private n = 'LVoJPiCN2R8G90yg+hmFHuacZ1OWMnrsSTXkYpUq/3dlbfKwv6xztjI7DeBE'
//   private r = '='

//   public encode(t: string): string {
//     const a = t.length
//     let u = ''

//     for (let o = 0; o < a; o += 3) {
//       const h = t.charCodeAt(o) << 16 | (o + 1 < a ? t.charCodeAt(o + 1) << 8 : 0) | (o + 2 < a ? t.charCodeAt(o + 2) : 0)

//       for (let i = 0; i < 4; i += 1)
//         o * 8 + i * 6 > a * 8 ? u += this.r : u += this.n.charAt(h >>> 6 * (3 - i) & 63)
//     }

//     return u
//   }

//   public decode(e: string): string {
//     if (!e)
//       return e

//     let o = 0
//     let C = 0

//     const s: string[] = []

//     e = e.replace(new RegExp(`\\${this.r}`, 'gi'), '')
//     do {
//       const a = this.n.indexOf(e.charAt(o += 1))
//       const c = this.n.indexOf(e.charAt(o += 1))
//       const l = this.n.indexOf(e.charAt(o += 1))
//       const D = this.n.indexOf(e.charAt(o += 1))

//       const B = a << 18 | c << 12 | l << 6 | D
//       const i = B >> 16 & 255
//       const h = B >> 8 & 255
//       const u = B & 255
//       C += 1

//       if (l === 64) {
//         s[C] = String.fromCharCode(i)
//       }
//       else if (D === 64) {
//         s[C] = String.fromCharCode(i, h)
//       }
//       else {
//         s[C] = String.fromCharCode(i, h, u)
//       }
//     } while (o < e.length)

//     return s.join('')
//   }
// }
