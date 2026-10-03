import { Test, TestingModule } from '@nestjs/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { PrismaService } from '../prisma/prisma.service.js';
import { GoogleDriveService } from './google-drive.service.js';
import { FilesService } from './files.service.js';
import { ConfigService } from '@nestjs/config';
import type { AuthenticatedUser } from '../auth/interfaces/authenticated-user.js';

describe('FilesService', () => {
  let service: FilesService;
  const measurementId = '3c3d9a24-4595-4e53-a6f3-f14da7df9911';
  const user: AuthenticatedUser = {
    id: '709ef035-9500-43ba-8aca-cdcf86434b14',
    email: 'editor@example.com',
    name: 'Editor',
    role: 'EDITOR',
  };
  const drive = {
    ensureFolder: vi.fn(),
    upload: vi.fn(),
    delete: vi.fn(),
    download: vi.fn(),
  };
  const prisma = {
    measurement: { findUnique: vi.fn() },
    attachment: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      delete: vi.fn(),
    },
  };
  const config = { get: vi.fn(() => 'root-folder') };
  const pdf = (): Express.Multer.File =>
    ({
      originalname: 'evidencia.pdf',
      size: 14,
      buffer: Buffer.from('%PDF-1.7\nsample'),
    }) as Express.Multer.File;

  beforeEach(async () => {
    vi.clearAllMocks();
    prisma.measurement.findUnique.mockResolvedValue({
      id: measurementId,
      year: 2026,
      quarter: 'T1',
      kpi: { code: 'KPI-CAL-01' },
    });
    drive.ensureFolder
      .mockResolvedValueOnce('kpi-folder')
      .mockResolvedValueOnce('year-folder')
      .mockResolvedValueOnce('quarter-folder');
    drive.upload.mockResolvedValue({
      id: 'drive-file-id',
      webViewLink: 'https://drive.google.com/file/d/drive-file-id/view',
    });
    prisma.attachment.create.mockResolvedValue({
      id: 'attachment-id',
      measurementId,
      name: 'evidencia.pdf',
      size: 14,
      mimeType: 'application/pdf',
      createdAt: new Date('2026-03-31T00:00:00.000Z'),
      uploadedBy: { id: user.id, name: user.name },
    });

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FilesService,
        { provide: PrismaService, useValue: prisma },
        { provide: GoogleDriveService, useValue: drive },
        { provide: ConfigService, useValue: config },
      ],
    }).compile();
    service = module.get<FilesService>(FilesService);
  });

  it('stores evidence in the KPI/year/quarter folder and records the uploader', async () => {
    const result = await service.upload(measurementId, pdf(), user);

    expect(drive.ensureFolder.mock.calls).toEqual([
      ['KPI-CAL-01', 'root-folder'],
      ['2026', 'kpi-folder'],
      ['T1', 'year-folder'],
    ]);
    expect(prisma.attachment.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          measurementId,
          storageKey: 'drive-file-id',
          uploadedById: user.id,
        }),
      }),
    );
    expect(result).toMatchObject({
      id: 'attachment-id',
      downloadUrl: '/api/attachments/attachment-id/download',
    });
  });

  it('rejects content that does not match the file extension before contacting Drive', async () => {
    const fakePdf = pdf();
    fakePdf.buffer = Buffer.from('not actually a PDF');

    await expect(service.upload(measurementId, fakePdf, user)).rejects.toThrow(
      'no coincide con su extensión',
    );
    expect(drive.upload).not.toHaveBeenCalled();
  });

  it('removes the Drive file when saving its database record fails', async () => {
    prisma.attachment.create.mockRejectedValue(new Error('database failed'));

    await expect(service.upload(measurementId, pdf(), user)).rejects.toThrow(
      'database failed',
    );
    expect(drive.delete).toHaveBeenCalledWith('drive-file-id');
  });
});
