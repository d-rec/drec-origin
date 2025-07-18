import fs from 'fs';

function getFileData(file: Express.Multer.File): Buffer | fs.ReadStream {
  if (file.buffer) {
    return Buffer.isBuffer(file.buffer)
      ? file.buffer
      : Buffer.from((file.buffer as { data: number[] }).data);
  }

  if (file.path && typeof file.path === 'string') {
    return fs.createReadStream(file.path);
  }

  throw new Error('File data not found (no buffer or path)');
}

export default getFileData;
