export type ZipExportFile = {
  path: string;
  content: string | Uint8Array;
};

export type ZipExportOptions = {
  projectName: string;
  rootDirectoryName?: string;
};

export class ZipExportError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ZipExportError";
  }
}

const CENTRAL_DIRECTORY_FILE_HEADER_LENGTH = 46;
const DOS_DATE_1980_01_01 = 33;
const DOS_TIME_MIDNIGHT = 0;
const LOCAL_FILE_HEADER_LENGTH = 30;
const MAX_FILE_COUNT_WITHOUT_ZIP64 = 0xffff;
const MAX_PATH_BYTE_LENGTH = 0xffff;
const MAX_PATH_LENGTH = 4096;
const MAX_UINT32 = 0xffffffff;
const UTF8_FILENAME_FLAG = 0x0800;
const VERSION_MADE_BY_UNIX = 0x0314;
const VERSION_NEEDED_TO_EXTRACT = 20;

const INVALID_WINDOWS_PATH_CHARS = /[<>:"|?*]/;
const RESERVED_WINDOWS_NAMES = new Set([
  "CON",
  "PRN",
  "AUX",
  "NUL",
  "COM1",
  "COM2",
  "COM3",
  "COM4",
  "COM5",
  "COM6",
  "COM7",
  "COM8",
  "COM9",
  "LPT1",
  "LPT2",
  "LPT3",
  "LPT4",
  "LPT5",
  "LPT6",
  "LPT7",
  "LPT8",
  "LPT9",
]);

const textEncoder = new TextEncoder();

type PreparedFile = {
  archivePath: string;
  compressedSize: number;
  crc32: number;
  fileNameBytes: Uint8Array;
  localHeaderOffset: number;
  uncompressedSize: number;
};

export function createProjectZip(
  files: readonly ZipExportFile[],
  options: ZipExportOptions,
) {
  if (files.length === 0) {
    throw new ZipExportError("Add at least one file before creating a ZIP.");
  }

  if (files.length > MAX_FILE_COUNT_WITHOUT_ZIP64) {
    throw new ZipExportError("Too many files for this ZIP export.");
  }

  const projectName = normalizeRootDirectoryName(
    options.projectName,
    "projectName",
  );
  const rootDirectoryName = normalizeRootDirectoryName(
    options.rootDirectoryName ?? projectName,
    "rootDirectoryName",
  );

  const seenPaths = new Set<string>();
  const localChunks: Uint8Array[] = [];
  const centralDirectoryChunks: Uint8Array[] = [];
  const preparedFiles: PreparedFile[] = [];
  let offset = 0;

  for (const file of files) {
    const filePath = normalizeFilePath(file.path);
    const archivePath = `${rootDirectoryName}/${filePath}`;

    if (seenPaths.has(archivePath)) {
      throw new ZipExportError(`Duplicate ZIP path: ${filePath}`);
    }

    seenPaths.add(archivePath);

    const fileNameBytes = textEncoder.encode(archivePath);

    if (fileNameBytes.length > MAX_PATH_BYTE_LENGTH) {
      throw new ZipExportError(`ZIP path is too long: ${filePath}`);
    }

    const contentBytes = toBytes(file.content);

    if (contentBytes.length > MAX_UINT32) {
      throw new ZipExportError(`File is too large for this ZIP: ${filePath}`);
    }

    const crc32 = calculateCrc32(contentBytes);
    const localHeader = createLocalFileHeader({
      compressedSize: contentBytes.length,
      crc32,
      fileNameBytes,
      uncompressedSize: contentBytes.length,
    });

    localChunks.push(localHeader, fileNameBytes, contentBytes);
    preparedFiles.push({
      archivePath,
      compressedSize: contentBytes.length,
      crc32,
      fileNameBytes,
      localHeaderOffset: offset,
      uncompressedSize: contentBytes.length,
    });

    offset = checkedAdd(
      offset,
      localHeader.length + fileNameBytes.length + contentBytes.length,
    );
  }

  const centralDirectoryOffset = offset;

  for (const file of preparedFiles) {
    const centralDirectoryHeader = createCentralDirectoryFileHeader(file);
    centralDirectoryChunks.push(centralDirectoryHeader, file.fileNameBytes);
    offset = checkedAdd(
      offset,
      centralDirectoryHeader.length + file.fileNameBytes.length,
    );
  }

  const centralDirectorySize = offset - centralDirectoryOffset;
  const endOfCentralDirectory = createEndOfCentralDirectoryRecord({
    centralDirectoryOffset,
    centralDirectorySize,
    fileCount: preparedFiles.length,
  });

  return concatUint8Arrays(
    [...localChunks, ...centralDirectoryChunks, endOfCentralDirectory],
    checkedAdd(offset, endOfCentralDirectory.length),
  );
}

function normalizeRootDirectoryName(value: string, optionName: string) {
  const trimmed = value.trim();

  if (!trimmed) {
    throw new ZipExportError(`${optionName} is required for ZIP export.`);
  }

  const directoryName = normalizeFilePath(trimmed);

  if (directoryName.includes("/")) {
    throw new ZipExportError(`${optionName} must be a single folder name.`);
  }

  return directoryName;
}

function normalizeFilePath(filePath: string) {
  if (!filePath) {
    throw new ZipExportError("ZIP file paths cannot be empty.");
  }

  if (filePath.length > MAX_PATH_LENGTH) {
    throw new ZipExportError(`ZIP file path is too long: ${filePath}`);
  }

  if (filePath !== filePath.trim()) {
    throw new ZipExportError(`ZIP file path has extra whitespace: ${filePath}`);
  }

  if (hasControlCharacter(filePath)) {
    throw new ZipExportError(`ZIP file path has unsafe characters: ${filePath}`);
  }

  if (
    filePath.startsWith("/") ||
    filePath.startsWith("\\") ||
    /^[A-Za-z]:/.test(filePath)
  ) {
    throw new ZipExportError(`ZIP file path must be relative: ${filePath}`);
  }

  const normalizedPath = filePath.replace(/\\/g, "/");
  const segments = normalizedPath.split("/");

  for (const segment of segments) {
    validatePathSegment(segment, filePath);
  }

  return normalizedPath;
}

function validatePathSegment(segment: string, filePath: string) {
  if (!segment || segment === "." || segment === "..") {
    throw new ZipExportError(`ZIP file path cannot escape the project: ${filePath}`);
  }

  if (segment !== segment.trim()) {
    throw new ZipExportError(`ZIP file path has extra whitespace: ${filePath}`);
  }

  if (INVALID_WINDOWS_PATH_CHARS.test(segment)) {
    throw new ZipExportError(`ZIP file path has unsafe characters: ${filePath}`);
  }

  const basename = segment.split(".")[0]?.toUpperCase();

  if (basename && RESERVED_WINDOWS_NAMES.has(basename)) {
    throw new ZipExportError(`ZIP file path uses a reserved name: ${filePath}`);
  }
}

function hasControlCharacter(value: string) {
  for (let index = 0; index < value.length; index += 1) {
    const charCode = value.charCodeAt(index);

    if (charCode < 32 || charCode === 127) {
      return true;
    }
  }

  return false;
}

function toBytes(content: string | Uint8Array) {
  return typeof content === "string" ? textEncoder.encode(content) : content;
}

function createLocalFileHeader({
  compressedSize,
  crc32,
  fileNameBytes,
  uncompressedSize,
}: {
  compressedSize: number;
  crc32: number;
  fileNameBytes: Uint8Array;
  uncompressedSize: number;
}) {
  const header = new Uint8Array(LOCAL_FILE_HEADER_LENGTH);
  const view = new DataView(header.buffer);

  view.setUint32(0, 0x04034b50, true);
  view.setUint16(4, VERSION_NEEDED_TO_EXTRACT, true);
  view.setUint16(6, UTF8_FILENAME_FLAG, true);
  view.setUint16(8, 0, true);
  view.setUint16(10, DOS_TIME_MIDNIGHT, true);
  view.setUint16(12, DOS_DATE_1980_01_01, true);
  view.setUint32(14, crc32, true);
  view.setUint32(18, compressedSize, true);
  view.setUint32(22, uncompressedSize, true);
  view.setUint16(26, fileNameBytes.length, true);
  view.setUint16(28, 0, true);

  return header;
}

function createCentralDirectoryFileHeader(file: PreparedFile) {
  const header = new Uint8Array(CENTRAL_DIRECTORY_FILE_HEADER_LENGTH);
  const view = new DataView(header.buffer);

  view.setUint32(0, 0x02014b50, true);
  view.setUint16(4, VERSION_MADE_BY_UNIX, true);
  view.setUint16(6, VERSION_NEEDED_TO_EXTRACT, true);
  view.setUint16(8, UTF8_FILENAME_FLAG, true);
  view.setUint16(10, 0, true);
  view.setUint16(12, DOS_TIME_MIDNIGHT, true);
  view.setUint16(14, DOS_DATE_1980_01_01, true);
  view.setUint32(16, file.crc32, true);
  view.setUint32(20, file.compressedSize, true);
  view.setUint32(24, file.uncompressedSize, true);
  view.setUint16(28, file.fileNameBytes.length, true);
  view.setUint16(30, 0, true);
  view.setUint16(32, 0, true);
  view.setUint16(34, 0, true);
  view.setUint16(36, 0, true);
  view.setUint32(38, 0, true);
  view.setUint32(42, file.localHeaderOffset, true);

  return header;
}

function createEndOfCentralDirectoryRecord({
  centralDirectoryOffset,
  centralDirectorySize,
  fileCount,
}: {
  centralDirectoryOffset: number;
  centralDirectorySize: number;
  fileCount: number;
}) {
  const header = new Uint8Array(22);
  const view = new DataView(header.buffer);

  view.setUint32(0, 0x06054b50, true);
  view.setUint16(4, 0, true);
  view.setUint16(6, 0, true);
  view.setUint16(8, fileCount, true);
  view.setUint16(10, fileCount, true);
  view.setUint32(12, centralDirectorySize, true);
  view.setUint32(16, centralDirectoryOffset, true);
  view.setUint16(20, 0, true);

  return header;
}

function checkedAdd(left: number, right: number) {
  const total = left + right;

  if (total > MAX_UINT32) {
    throw new ZipExportError("ZIP archive is too large for this exporter.");
  }

  return total;
}

function concatUint8Arrays(chunks: readonly Uint8Array[], totalLength: number) {
  const bytes = new Uint8Array(totalLength);
  let offset = 0;

  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.length;
  }

  return bytes;
}

function calculateCrc32(bytes: Uint8Array) {
  let crc = 0xffffffff;

  for (const byte of bytes) {
    const tableValue = CRC32_TABLE[(crc ^ byte) & 0xff]!;
    crc = (crc >>> 8) ^ tableValue;
  }

  return (crc ^ 0xffffffff) >>> 0;
}

const CRC32_TABLE = createCrc32Table();

function createCrc32Table() {
  const table = new Uint32Array(256);

  for (let index = 0; index < table.length; index += 1) {
    let value = index;

    for (let bit = 0; bit < 8; bit += 1) {
      value = value & 1 ? 0xedb88320 ^ (value >>> 1) : value >>> 1;
    }

    table[index] = value >>> 0;
  }

  return table;
}
