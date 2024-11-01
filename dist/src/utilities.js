"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Utils = void 0;
const nifti_extension_1 = require("./nifti-extension");
class Utils {
    /*** Static Pseudo-constants ***/
    static crcTable = null;
    static GUNZIP_MAGIC_COOKIE1 = 31;
    static GUNZIP_MAGIC_COOKIE2 = 139;
    /*** Static methods ***/
    static getStringAt(data, start, end) {
        var str = "", ctr, ch;
        for (ctr = start; ctr < end; ctr += 1) {
            ch = data.getUint8(ctr);
            if (ch !== 0) {
                str += String.fromCharCode(ch);
            }
        }
        return str;
    }
    static getByteAt = function (data, start) {
        return data.getInt8(start);
    };
    static getShortAt = function (data, start, littleEndian) {
        return data.getInt16(start, littleEndian);
    };
    static getIntAt(data, start, littleEndian) {
        return data.getInt32(start, littleEndian);
    }
    static getFloatAt(data, start, littleEndian) {
        return data.getFloat32(start, littleEndian);
    }
    static getDoubleAt(data, start, littleEndian) {
        return data.getFloat64(start, littleEndian);
    }
    static getLongAt(data, start, littleEndian) {
        var ctr, array = [], value = 0;
        for (ctr = 0; ctr < 8; ctr += 1) {
            array[ctr] = Utils.getByteAt(data, start + ctr);
        }
        for (ctr = array.length - 1; ctr >= 0; ctr--) {
            value = value * 256 + array[ctr];
        }
        return value;
    }
    static getExtensionsAt(data, start, littleEndian, voxOffset) {
        let extensions = [];
        let extensionByteIndex = start;
        // Multiple extended header sections are allowed
        while (extensionByteIndex < voxOffset) {
            // assume same endianess as header until proven otherwise
            let extensionLittleEndian = littleEndian;
            let esize = Utils.getIntAt(data, extensionByteIndex, littleEndian);
            if (!esize) {
                break; // no more extensions
            }
            // check if this takes us past vox_offset
            if (esize + extensionByteIndex > voxOffset) {
                // check if reversing byte order gets a proper size
                extensionLittleEndian = !extensionLittleEndian;
                esize = Utils.getIntAt(data, extensionByteIndex, extensionLittleEndian);
                if (esize + extensionByteIndex > voxOffset) {
                    throw new Error("This does not appear to be a valid NIFTI extension");
                }
            }
            // esize must be a positive integral multiple of 16
            if (esize % 16 != 0) {
                throw new Error("This does not appear to be a NIFTI extension");
            }
            let ecode = Utils.getIntAt(data, extensionByteIndex + 4, extensionLittleEndian);
            let edata = data.buffer.slice(extensionByteIndex + 8, extensionByteIndex + esize);
            let extension = new nifti_extension_1.NIFTIEXTENSION(esize, ecode, edata, extensionLittleEndian);
            extensions.push(extension);
            extensionByteIndex += esize;
        }
        return extensions;
    }
    static toArrayBuffer(buffer) {
        var ab, view, i;
        ab = new ArrayBuffer(buffer.length);
        view = new Uint8Array(ab);
        for (i = 0; i < buffer.length; i += 1) {
            view[i] = buffer[i];
        }
        return ab;
    }
    static isString(obj) {
        return typeof obj === "string" || obj instanceof String;
    }
    static formatNumber(num, shortFormat = undefined) {
        let val;
        if (Utils.isString(num)) {
            val = Number(num);
        }
        else {
            val = num;
        }
        if (shortFormat) {
            val = val.toPrecision(5);
        }
        else {
            val = val.toPrecision(7);
        }
        return parseFloat(val);
    }
    // http://stackoverflow.com/questions/18638900/javascript-crc32
    static makeCRCTable() {
        let c;
        let crcTable = [];
        for (var n = 0; n < 256; n++) {
            c = n;
            for (var k = 0; k < 8; k++) {
                c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
            }
            crcTable[n] = c;
        }
        return crcTable;
    }
    static crc32(dataView) {
        if (!Utils.crcTable) {
            Utils.crcTable = Utils.makeCRCTable();
        }
        const crcTable = Utils.crcTable;
        let crc = 0 ^ -1;
        for (var i = 0; i < dataView.byteLength; i++) {
            crc = (crc >>> 8) ^ crcTable[(crc ^ dataView.getUint8(i)) & 0xff];
        }
        return (crc ^ -1) >>> 0;
    }
}
exports.Utils = Utils;
//# sourceMappingURL=utilities.js.map