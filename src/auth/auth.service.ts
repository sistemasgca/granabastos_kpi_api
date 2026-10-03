import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Prisma, UserRole } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service.js';
import { AuthenticatedUser } from './interfaces/authenticated-user.js';
import { ChangePasswordDto } from './dto/change-password.dto.js';
import { CreateUserDto } from './dto/create-user.dto.js';
import { LoginDto } from './dto/login.dto.js';
import { UpdateUserDto } from './dto/update-user.dto.js';

const publicUserSelect = {
  id: true,
  email: true,
  name: true,
  role: true,
  isActive: true,
  createdAt: true,
  updatedAt: true,
} as const;

const BCRYPT_ROUNDS = 12;

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {}

  async login(dto: LoginDto) {
    this.ensureBcryptPasswordLength(dto.password);
    const email = dto.email.trim().toLowerCase();
    const user = await this.prisma.user.findUnique({ where: { email } });
    const passwordMatches = user
      ? await bcrypt.compare(dto.password, user.passwordHash)
      : false;

    if (!user || !user.isActive || !passwordMatches) {
      throw new UnauthorizedException('Correo o contraseña incorrectos.');
    }

    const accessToken = await this.jwt.signAsync({
      sub: user.id,
      email: user.email,
      tokenVersion: user.tokenVersion,
    });

    return {
      accessToken,
      tokenType: 'Bearer',
      expiresIn: this.config.get<string>('JWT_EXPIRES_IN', '15m'),
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    };
  }

  findUsers() {
    return this.prisma.user.findMany({
      select: publicUserSelect,
      orderBy: { email: 'asc' },
    });
  }

  async createUser(dto: CreateUserDto) {
    const email = dto.email.trim().toLowerCase();
    const existingUser = await this.prisma.user.findUnique({
      where: { email },
      select: { id: true },
    });
    if (existingUser) {
      throw new ConflictException('Ya existe un usuario con ese correo.');
    }

    this.ensureBcryptPasswordLength(dto.password);
    const passwordHash = await bcrypt.hash(dto.password, BCRYPT_ROUNDS);
    try {
      return await this.prisma.user.create({
        data: {
          email,
          name: dto.name.trim(),
          passwordHash,
          role: dto.role,
        },
        select: publicUserSelect,
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException('Ya existe un usuario con ese correo.');
      }
      throw error;
    }
  }

  async changePassword(
    currentUser: AuthenticatedUser,
    dto: ChangePasswordDto,
  ) {
    this.ensureBcryptPasswordLength(dto.currentPassword);
    this.ensureBcryptPasswordLength(dto.newPassword);
    const user = await this.prisma.user.findUnique({
      where: { id: currentUser.id },
      select: { id: true, passwordHash: true },
    });
    if (!user || !(await bcrypt.compare(dto.currentPassword, user.passwordHash))) {
      throw new UnauthorizedException('La contraseña actual no es correcta.');
    }
    if (dto.currentPassword === dto.newPassword) {
      throw new BadRequestException(
        'La nueva contraseña debe ser diferente a la actual.',
      );
    }

    const passwordHash = await bcrypt.hash(dto.newPassword, BCRYPT_ROUNDS);
    await this.prisma.user.update({
      where: { id: user.id },
      data: { passwordHash, tokenVersion: { increment: 1 } },
    });
    return { changed: true };
  }

  async updateUser(
    id: string,
    dto: UpdateUserDto,
    currentUser: AuthenticatedUser,
  ) {
    if (Object.keys(dto).length === 0) {
      throw new BadRequestException(
        'Debe enviar al menos un campo para actualizar.',
      );
    }
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: { id: true, role: true, isActive: true },
    });
    if (!user) throw new NotFoundException(`No existe el usuario ${id}.`);

    const willLoseAdminAccess =
      user.role === UserRole.ADMIN &&
      (dto.role !== undefined && dto.role !== UserRole.ADMIN ||
        dto.isActive === false);

    if (willLoseAdminAccess) {
      const activeAdmins = await this.prisma.user.count({
        where: { role: UserRole.ADMIN, isActive: true },
      });
      if (user.isActive && activeAdmins <= 1) {
        throw new ConflictException(
          'No se puede quitar el acceso al último administrador activo.',
        );
      }
    }

    if (id === currentUser.id && dto.isActive === false) {
      throw new ConflictException('No puedes desactivar tu propio usuario.');
    }

    return this.prisma.user.update({
      where: { id },
      data: {
        name: dto.name?.trim(),
        role: dto.role,
        isActive: dto.isActive,
      },
      select: publicUserSelect,
    });
  }

  private ensureBcryptPasswordLength(password: string) {
    if (Buffer.byteLength(password, 'utf8') > 72) {
      throw new ConflictException(
        'La contraseña supera el máximo de 72 bytes admitido.',
      );
    }
  }
}
