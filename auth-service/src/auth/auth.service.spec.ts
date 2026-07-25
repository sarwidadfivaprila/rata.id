import { Test } from '@nestjs/testing';
import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import bcrypt from 'bcrypt';
import { AuthService } from './auth.service';
import { PrismaService } from '../prisma/prisma.service';

jest.mock('bcrypt', () => ({
  hash: jest.fn(),
  compare: jest.fn(),
}));

const mockedBcrypt = jest.mocked(bcrypt);

describe('AuthService', () => {
  let authService: AuthService;
  let prisma: {
    user: {
      findUnique: jest.Mock;
      create: jest.Mock;
    };
  };
  let jwtService: {
    signAsync: jest.Mock;
    verifyAsync: jest.Mock;
  };

  const existingUser = {
    id: 'user-1',
    email: 'jane@example.com',
    password: 'hashed-password',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    prisma = {
      user: {
        findUnique: jest.fn(),
        create: jest.fn(),
      },
    };
    jwtService = {
      signAsync: jest.fn(),
      verifyAsync: jest.fn(),
    };

    const moduleRef = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: prisma },
        { provide: JwtService, useValue: jwtService },
      ],
    }).compile();

    authService = moduleRef.get(AuthService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('register', () => {
    it('hashes the password and creates the user when the email is free', async () => {
      prisma.user.findUnique.mockResolvedValue(null);
      prisma.user.create.mockImplementation(({ data }) =>
        Promise.resolve({ ...existingUser, ...data }),
      );
      mockedBcrypt.hash.mockResolvedValue('hashed-password' as never);

      const result = await authService.register({
        email: 'new@example.com',
        password: 'plain-password',
      });

      expect(mockedBcrypt.hash).toHaveBeenCalledWith('plain-password', 10);
      expect(prisma.user.create).toHaveBeenCalledWith({
        data: { email: 'new@example.com', password: 'hashed-password' },
      });
      expect(result.password).toBe('hashed-password');
    });

    it('throws a conflict error when the email is already registered', async () => {
      prisma.user.findUnique.mockResolvedValue(existingUser);

      await expect(
        authService.register({ email: existingUser.email, password: 'whatever' }),
      ).rejects.toThrow(ConflictException);
      expect(prisma.user.create).not.toHaveBeenCalled();
    });
  });

  describe('login', () => {
    it('returns an access token when credentials are valid', async () => {
      prisma.user.findUnique.mockResolvedValue(existingUser);
      mockedBcrypt.compare.mockResolvedValue(true as never);
      jwtService.signAsync.mockResolvedValue('signed-jwt');

      const result = await authService.login({
        email: existingUser.email,
        password: 'correct-password',
      });

      expect(jwtService.signAsync).toHaveBeenCalledWith({
        sub: existingUser.id,
        email: existingUser.email,
      });
      expect(result).toEqual({ accessToken: 'signed-jwt', user: existingUser });
    });

    it('throws unauthorized when the user does not exist', async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      await expect(
        authService.login({ email: 'missing@example.com', password: 'whatever' }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('throws unauthorized when the password does not match', async () => {
      prisma.user.findUnique.mockResolvedValue(existingUser);
      mockedBcrypt.compare.mockResolvedValue(false as never);

      await expect(
        authService.login({ email: existingUser.email, password: 'wrong-password' }),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('validateToken', () => {
    it('returns valid=true with user info for a valid token', async () => {
      jwtService.verifyAsync.mockResolvedValue({
        sub: existingUser.id,
        email: existingUser.email,
      });

      const result = await authService.validateToken('valid-token');

      expect(result).toEqual({
        valid: true,
        userId: existingUser.id,
        email: existingUser.email,
      });
    });

    it('returns valid=false for an invalid or expired token', async () => {
      jwtService.verifyAsync.mockRejectedValue(new Error('jwt expired'));

      const result = await authService.validateToken('bad-token');

      expect(result).toEqual({ valid: false });
    });
  });
});
