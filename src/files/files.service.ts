import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { fileTypeFromBuffer } from 'file-type';
import { PrismaService } from '../prisma/prisma.service.js';
import type { AuthenticatedUser } from '../auth/interfaces/authenticated-user.js';
import { GoogleDriveService } from './google-drive.service.js';

const MAX_FILE_SIZE = 10 * 1024 * 1024;
const mimeTypesByExtension: Record<string, string> = {
  '.csv': 'text/csv',
  '.docx':
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  '.jpeg': 'image/jpeg',
  '.jpg': 'image/jpeg',
  '.pdf': 'application/pdf',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.xls': 'application/vnd.ms-excel',
  '.xlsx':
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
};

@Injectable()
export class FilesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly drive: GoogleDriveService,
    private readonly config: ConfigService,
  ) {}

  async findForMeasurement(measurementId: string) {
    await this.requireMeasurement(measurementId);
    const attachments = await this.prisma.attachment.findMany({
      where: { measurementId },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        measurementId: true,
        name: true,
        size: true,
        mimeType: true,
        createdAt: true,
        uploadedBy: { select: { id: true, name: true } },
      },
    });
    return attachments.map((attachment) => ({
      ...attachment,
      downloadUrl: `/api/attachments/${attachment.id}/download`,
    }));
  }

  async upload(
    measurementId: string,
    file: Express.Multer.File,
    user: AuthenticatedUser,
  ) {
    if (!file?.buffer?.byteLength) {
      throw new BadRequestException('Adjunta un archivo no vacío.');
    }
    if (file.size > MAX_FILE_SIZE) {
      throw new BadRequestException('El archivo no puede superar 10 MB.');
    }

    const name = file.originalname.split(/[\\/]/).pop()?.trim();
    const extension = name?.slice(name.lastIndexOf('.')).toLowerCase();
    const expectedMime = extension ? mimeTypesByExtension[extension] : undefined;
    if (!name || !extension || name.length > 255 || !expectedMime) {
      throw new BadRequestException(
        'Tipo de archivo no permitido. Usa PDF, imágenes, CSV, XLS/XLSX o DOCX.',
      );
    }
    await this.validateFileContent(file.buffer, extension, expectedMime);

    const measurement = await this.requireMeasurement(measurementId);
    const rootFolderId = this.config.get<string>(
      'GOOGLE_DRIVE_ROOT_FOLDER_ID',
    );
    if (!rootFolderId) {
      throw new InternalServerErrorException(
        'Configura GOOGLE_DRIVE_ROOT_FOLDER_ID para usar evidencias.',
      );
    }

    const kpiFolder = await this.drive.ensureFolder(
      this.safeFolderName(measurement.kpi.code),
      rootFolderId,
    );
    const yearFolder = await this.drive.ensureFolder(
      String(measurement.year),
      kpiFolder,
    );
    const quarterFolder = await this.drive.ensureFolder(
      measurement.quarter,
      yearFolder,
    );
    const driveFile = await this.drive.upload(
      name,
      expectedMime,
      file.buffer,
      quarterFolder,
    );

    try {
      const attachment = await this.prisma.attachment.create({
        data: {
          measurementId,
          name,
          storageKey: driveFile.id,
          externalUrl: driveFile.webViewLink ?? null,
          size: file.size,
          mimeType: expectedMime,
          uploadedById: user.id,
        },
        select: {
          id: true,
          measurementId: true,
          name: true,
          size: true,
          mimeType: true,
          createdAt: true,
          uploadedBy: { select: { id: true, name: true } },
        },
      });
      return {
        ...attachment,
        downloadUrl: `/api/attachments/${attachment.id}/download`,
      };
    } catch (databaseError) {
      try {
        await this.drive.delete(driveFile.id);
      } catch (cleanupError) {
        throw new AggregateError(
          [databaseError, cleanupError],
          'No se guardó el registro y tampoco fue posible eliminar el archivo de Drive.',
        );
      }
      throw databaseError;
    }
  }

  async getDownload(id: string) {
    const attachment = await this.prisma.attachment.findUnique({
      where: { id },
      select: { storageKey: true, name: true, mimeType: true, size: true },
    });
    if (!attachment) {
      throw new NotFoundException(`No existe la evidencia ${id}.`);
    }
    return {
      stream: await this.drive.download(attachment.storageKey),
      name: attachment.name,
      mimeType: attachment.mimeType,
      size: attachment.size,
    };
  }

  async remove(id: string) {
    const attachment = await this.prisma.attachment.findUnique({
      where: { id },
      select: { id: true, storageKey: true },
    });
    if (!attachment) {
      throw new NotFoundException(`No existe la evidencia ${id}.`);
    }
    await this.drive.delete(attachment.storageKey);
    await this.prisma.attachment.delete({ where: { id } });
    return { message: 'Evidencia eliminada.' };
  }

  private async requireMeasurement(id: string) {
    const measurement = await this.prisma.measurement.findUnique({
      where: { id },
      select: {
        id: true,
        year: true,
        quarter: true,
        kpi: { select: { code: true } },
      },
    });
    if (!measurement) {
      throw new NotFoundException(`No existe la medición ${id}.`);
    }
    return measurement;
  }

  private safeFolderName(value: string) {
    return value.replace(/[\\/]/g, '-').trim().slice(0, 100) || 'KPI';
  }

  private async validateFileContent(
    buffer: Buffer,
    extension: string,
    expectedMime: string,
  ) {
    if (extension === '.csv') {
      try {
        new TextDecoder('utf-8', { fatal: true }).decode(buffer);
      } catch {
        throw new BadRequestException('El archivo CSV debe estar en UTF-8.');
      }
      if (buffer.includes(0)) {
        throw new BadRequestException('El archivo CSV no puede ser binario.');
      }
      return;
    }

    const detected = await fileTypeFromBuffer(buffer);
    if (!detected || detected.mime !== expectedMime) {
      throw new BadRequestException(
        'El contenido del archivo no coincide con su extensión.',
      );
    }
  }
}
