import {ISizeCalculationResult} from "image-size/dist/types/interface";
import {BMP} from "image-size/dist/types/bmp";
import {CUR} from "image-size/dist/types/cur";
import {DDS} from "image-size/dist/types/dds";
import {GIF} from "image-size/dist/types/gif";
import {ICNS} from "image-size/dist/types/icns";
import {ICO} from "image-size/dist/types/ico";
import {J2C} from "image-size/dist/types/j2c";
import {JP2} from "image-size/dist/types/jp2";
import {JPG} from "image-size/dist/types/jpg";
import {KTX} from "image-size/dist/types/ktx";
import {PNG} from "image-size/dist/types/png";
import {PNM} from "image-size/dist/types/pnm";
import {PSD} from "image-size/dist/types/psd";
import {SVG} from "image-size/dist/types/svg";
import {WEBP} from "image-size/dist/types/webp";

const typeHandlers = {
    bmp: BMP,
    cur: CUR,
    dds: DDS,
    gif: GIF,
    icns: ICNS,
    ico: ICO,
    j2c: J2C,
    jp2: JP2,
    jpg: JPG,
    ktx: KTX,
    png: PNG,
    pnm: PNM,
    psd: PSD,
    svg: SVG,
    webp: WEBP,
};

type imageType = keyof typeof typeHandlers;

const keys = Object.keys(typeHandlers) as imageType[];

// This map helps avoid validating for every single image type
const firstBytes: { [byte: number]: imageType } = {
    0x38: "psd",
    0x42: "bmp",
    0x44: "dds",
    0x47: "gif",
    0x52: "webp",
    0x69: "icns",
    0x89: "png",
    0xff: "jpg",
};

export function detector(buffer: Buffer): imageType | undefined {
    const byte = buffer[0];
    if (byte in firstBytes) {
        const type = firstBytes[byte];
        if (type && typeHandlers[type].validate(buffer)) {
            return type;
        }
    }

    const finder = (key: imageType) => typeHandlers[key].validate(buffer);
    return keys.find(finder);
}

export default function imageSize(buffer: Buffer): ISizeCalculationResult {
    // detect the file type.. don't rely on the extension
    const type = detector(buffer);

    if (typeof type !== "undefined") {
        // find an appropriate handler for this file type
        if (type in typeHandlers) {
            const size = typeHandlers[type].calculate(buffer);
            if (size !== undefined) {
                size.type = type;
                return size;
            }
        }
    }

    // throw up, if we don't understand the file
    throw new TypeError("unsupported file type: " + type);
}
