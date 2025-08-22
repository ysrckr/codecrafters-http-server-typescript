import fs from "fs";
import zlib from "zlib";

export function checkIfFileExists(path: string) {
  const isFileExists = fs.existsSync(path);
  return isFileExists;
}

export function fileContent(path: string) {
  const fileContent = fs.readFileSync(path);
  return Buffer.from(fileContent);
}

export function createFile(
  path: string,
  data: string | NodeJS.ArrayBufferView,
  options?: fs.WriteFileOptions,
) {
  fs.writeFileSync(path, data, options);
}

export function compress(
  compression: string,
  data: string,
): {
  data: Buffer;
  compression: string | null;
} {
  switch (compression) {
    case "br": {
      const compressed = zlib.brotliCompressSync(data);
      return { data: compressed, compression };
    }
    case "gzip": {
      const compressed = zlib.gzipSync(data);
      return { data: compressed, compression };
    }
    case "deflate": {
      const compressed = zlib.deflateSync(data);
      return { data: compressed, compression };
    }
    case "zstd": {
      const compressed = zlib.zstdCompressSync(data);
      return { data: compressed, compression };
    }
    default:
      return { data: Buffer.from(data), compression: null };
  }
}
