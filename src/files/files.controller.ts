import {
  BadRequestException,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Res,
  StreamableFile,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { UserRole } from '@prisma/client';
import type { Response } from 'express';
import { memoryStorage } from 'multer';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import { Roles } from '../auth/decorators/roles.decorator.js';
import type { AuthenticatedUser } from '../auth/interfaces/authenticated-user.js';
import { FilesService } from './files.service.js';

@Controller()
export class FilesController {
  constructor(private readonly files: FilesService) {}

  @Get('measurements/:measurementId/attachments')
  findForMeasurement(
    @Param('measurementId', ParseUUIDPipe) measurementId: string,
  ) {
    return this.files.findForMeasurement(measurementId);
  }

  @Post('measurements/:measurementId/attachments')
  @Roles(UserRole.ADMIN, UserRole.EDITOR)
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: 10 * 1024 * 1024, files: 1 },
    }),
  )
  upload(
    @Param('measurementId', ParseUUIDPipe) measurementId: string,
    @UploadedFile() file: Express.Multer.File | undefined,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    if (!file) {
      throw new BadRequestException(
        'Envía el archivo en el campo multipart "file".',
      );
    }
    return this.files.upload(measurementId, file, user);
  }

  @Get('attachments/:id/download')
  async download(
    @Param('id', ParseUUIDPipe) id: string,
    @Res({ passthrough: true }) response: Response,
  ) {
    const download = await this.files.getDownload(id);
    const encodedName = encodeURIComponent(download.name).replace(
      /['()*]/g,
      (character) =>
        `%${character.charCodeAt(0).toString(16).toUpperCase()}`,
    );
    response.setHeader(
      'Content-Disposition',
      `attachment; filename="evidence"; filename*=UTF-8''${encodedName}`,
    );
    response.setHeader('Content-Type', download.mimeType);
    response.setHeader('Content-Length', download.size);
    response.setHeader('Cache-Control', 'private, no-store');
    return new StreamableFile(download.stream);
  }

  @Delete('attachments/:id')
  @Roles(UserRole.ADMIN)
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.files.remove(id);
  }
}
