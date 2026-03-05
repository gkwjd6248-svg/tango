import {
  Controller, Post, UseGuards, UseInterceptors, UploadedFiles,
  BadRequestException, HttpCode, HttpStatus,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { randomUUID } from 'crypto';
import { existsSync, mkdirSync } from 'fs';

const UPLOAD_DIR = join(process.cwd(), 'uploads', 'events');

if (!existsSync(UPLOAD_DIR)) {
  mkdirSync(UPLOAD_DIR, { recursive: true });
}

const imageFileFilter = (_req: any, file: Express.Multer.File, cb: any) => {
  const allowed = /\.(jpg|jpeg|png|gif|webp)$/i;
  if (!allowed.test(extname(file.originalname))) {
    return cb(new BadRequestException('Only image files are allowed'), false);
  }
  cb(null, true);
};

const storage = diskStorage({
  destination: UPLOAD_DIR,
  filename: (_req, file, cb) => {
    const uniqueName = `${randomUUID()}${extname(file.originalname).toLowerCase()}`;
    cb(null, uniqueName);
  },
});

@Controller('events')
export class UploadsController {
  @Post('upload-images')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @UseInterceptors(
    FilesInterceptor('images', 5, {
      storage,
      fileFilter: imageFileFilter,
      limits: { fileSize: 5 * 1024 * 1024 },
    }),
  )
  async uploadImages(
    @UploadedFiles() files: Express.Multer.File[],
  ): Promise<{ urls: string[] }> {
    if (!files || files.length === 0) {
      throw new BadRequestException('At least one image is required');
    }

    const urls = files.map((f) => `/uploads/events/${f.filename}`);
    return { urls };
  }
}
