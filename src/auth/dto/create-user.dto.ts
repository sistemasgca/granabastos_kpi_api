import { UserRole } from '@prisma/client';
import {
  IsEmail,
  IsEnum,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export class CreateUserDto {
  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(2)
  @MaxLength(120)
  name!: string;

  @IsString()
  @MinLength(12)
  @MaxLength(72)
  password!: string;

  @IsEnum(UserRole)
  role!: UserRole;
}
