import {
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { google, type drive_v3 } from 'googleapis';
import { Readable } from 'node:stream';

export interface DriveFileMetadata {
  id: string;
  name: string;
  mimeType: string;
  size: string;
  webViewLink?: string | null;
}

@Injectable()
export class GoogleDriveService {
  constructor(private readonly config: ConfigService) {}

  async upload(
    name: string,
    mimeType: string,
    buffer: Buffer,
    parentId: string,
  ): Promise<DriveFileMetadata> {
    const response = await (await this.client()).files.create({
      requestBody: { name, mimeType, parents: [parentId] },
      media: { mimeType, body: Readable.from(buffer) },
      fields: 'id,name,mimeType,size,webViewLink',
      supportsAllDrives: true,
    });
    if (!response.data.id) {
      throw new InternalServerErrorException(
        'Google Drive no devolvió el identificador del archivo.',
      );
    }
    return {
      id: response.data.id,
      name: response.data.name ?? name,
      mimeType: response.data.mimeType ?? mimeType,
      size: response.data.size ?? String(buffer.byteLength),
      webViewLink: response.data.webViewLink,
    };
  }

  async download(fileId: string) {
    const response = await (await this.client()).files.get(
      { fileId, alt: 'media', supportsAllDrives: true },
      { responseType: 'stream' },
    );
    return response.data as Readable;
  }

  async delete(fileId: string): Promise<void> {
    await (await this.client()).files.delete({
      fileId,
      supportsAllDrives: true,
    });
  }

  async ensureFolder(name: string, parentId: string): Promise<string> {
    const drive = await this.client();
    const escapeQueryValue = (value: string) =>
      value.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
    const existing = await drive.files.list({
      q: `name = '${escapeQueryValue(name)}' and mimeType = 'application/vnd.google-apps.folder' and '${escapeQueryValue(parentId)}' in parents and trashed = false`,
      pageSize: 1,
      fields: 'files(id)',
      supportsAllDrives: true,
      includeItemsFromAllDrives: true,
    });
    const existingId = existing.data.files?.[0]?.id;
    if (existingId) return existingId;

    const created = await drive.files.create({
      requestBody: {
        name,
        mimeType: 'application/vnd.google-apps.folder',
        parents: [parentId],
      },
      fields: 'id',
      supportsAllDrives: true,
    });
    if (!created.data.id) {
      throw new InternalServerErrorException(
        'Google Drive no devolvió el identificador de la carpeta.',
      );
    }
    return created.data.id;
  }

  private async client(): Promise<drive_v3.Drive> {
    const clientId = this.config.get<string>('GOOGLE_OAUTH_CLIENT_ID');
    const clientSecret = this.config.get<string>(
      'GOOGLE_OAUTH_CLIENT_SECRET',
    );
    const refreshToken = this.config.get<string>('GOOGLE_REFRESH_TOKEN');
    if (!clientId || !clientSecret || !refreshToken) {
      throw new InternalServerErrorException(
        'Configura GOOGLE_OAUTH_CLIENT_ID, GOOGLE_OAUTH_CLIENT_SECRET y GOOGLE_REFRESH_TOKEN para usar evidencias.',
      );
    }
    const auth = new google.auth.OAuth2(clientId, clientSecret);
    auth.setCredentials({ refresh_token: refreshToken });
    return google.drive({ version: 'v3', auth });
  }
}
