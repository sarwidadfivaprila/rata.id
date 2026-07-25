import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterInput } from './dto/register.input';
import { LoginInput } from './dto/login.input';
import { AuthPayload } from './models/auth-payload.model';
import { ValidateTokenResult } from './models/validate-token-result.model';

const SALT_ROUNDS = 10;

interface JwtPayload {
  sub: string;
  email: string;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  async register(input: RegisterInput) {
    const existing = await this.prisma.user.findUnique({
      where: { email: input.email },
    });
    if (existing) {
      throw new ConflictException('Email is already registered');
    }

    const hashedPassword = await bcrypt.hash(input.password, SALT_ROUNDS);

    return this.prisma.user.create({
      data: {
        email: input.email,
        password: hashedPassword,
      },
    });
  }

  async login(input: LoginInput): Promise<AuthPayload> {
    const user = await this.prisma.user.findUnique({
      where: { email: input.email },
    });
    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const passwordMatches = await bcrypt.compare(
      input.password,
      user.password,
    );
    if (!passwordMatches) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const payload: JwtPayload = { sub: user.id, email: user.email };
    const accessToken = await this.jwtService.signAsync(payload);

    return { accessToken, user };
  }

  async validateToken(token: string): Promise<ValidateTokenResult> {
    try {
      const payload = await this.jwtService.verifyAsync<JwtPayload>(token);
      return { valid: true, userId: payload.sub, email: payload.email };
    } catch {
      return { valid: false };
    }
  }
}
