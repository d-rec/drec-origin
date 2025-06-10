import { BadRequestException } from '@nestjs/common';
import { Request } from 'express';
import { FileFilterCallback } from 'multer';

export const fileFilter = (
  req: Request,
  file: Express.Multer.File,
  callback: FileFilterCallback,
): void => {
  const allowedExtensions = [
    'avif',
    'bmp',
    'gif',
    'ico',
    'jpeg',
    'jpg',
    'png',
    'svg',
    'tif',
    'tiff',
    'webp',
    'pdf',
    'doc',
    'xls',
    'docx',
    'xlsx',
    'pptx',
    'gsheet',
    'gdoc',
    'txt',
    'csv',
  ];
  const extension = file.originalname.split('.').pop()?.toLowerCase();
  const sizeInMB = file.size / (1024 * 1024);

  if (!extension || !allowedExtensions.includes(extension)) {
    return (callback as any)(
      new BadRequestException(
        `${file.originalname} has unsupported file type: .${extension}`,
      ),
      false,
    );
  }
  if (sizeInMB > 20) {
    return (callback as any)(
      new BadRequestException(
        `${file.originalname} exceeds max file size of 20MB`,
      ),
      false,
    );
  }
  callback(null, true);
};
