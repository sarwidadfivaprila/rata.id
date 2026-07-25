import { Test } from '@nestjs/testing';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { DoctorService } from './doctor.service';
import { PrismaService } from '../prisma/prisma.service';

describe('DoctorService', () => {
  let service: DoctorService;
  let prisma: {
    doctor: {
      findUnique: jest.Mock;
      findMany: jest.Mock;
      count: jest.Mock;
      create: jest.Mock;
      update: jest.Mock;
      delete: jest.Mock;
    };
  };

  const existingDoctor = {
    id: 'doc-1',
    name: 'Dr. Smith',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    prisma = {
      doctor: {
        findUnique: jest.fn(),
        findMany: jest.fn(),
        count: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
    };

    const moduleRef = await Test.createTestingModule({
      providers: [DoctorService, { provide: PrismaService, useValue: prisma }],
    }).compile();

    service = moduleRef.get(DoctorService);
  });

  it('creates a doctor', async () => {
    prisma.doctor.create.mockResolvedValue(existingDoctor);

    const result = await service.create({ name: 'Dr. Smith' });

    expect(result).toEqual(existingDoctor);
  });

  describe('update', () => {
    it('throws not found when the doctor does not exist', async () => {
      prisma.doctor.findUnique.mockResolvedValue(null);

      await expect(
        service.update('missing-id', { name: 'New Name' }),
      ).rejects.toThrow(NotFoundException);
    });

    it('updates the doctor when it exists', async () => {
      prisma.doctor.findUnique.mockResolvedValue(existingDoctor);
      prisma.doctor.update.mockResolvedValue({
        ...existingDoctor,
        name: 'Updated',
      });

      const result = await service.update(existingDoctor.id, {
        name: 'Updated',
      });

      expect(result.name).toBe('Updated');
    });
  });

  describe('findAll', () => {
    it('paginates results', async () => {
      prisma.doctor.findMany.mockResolvedValue([existingDoctor]);
      prisma.doctor.count.mockResolvedValue(1);

      const result = await service.findAll({ page: 1, limit: 10 });

      expect(result).toEqual({
        data: [existingDoctor],
        total: 1,
        page: 1,
        limit: 10,
      });
    });
  });

  describe('findOne', () => {
    it('throws not found for a missing doctor', async () => {
      prisma.doctor.findUnique.mockResolvedValue(null);

      await expect(service.findOne('missing-id')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('remove', () => {
    it('throws not found when the doctor does not exist', async () => {
      prisma.doctor.findUnique.mockResolvedValue(null);

      await expect(service.remove('missing-id')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('throws a conflict error when the doctor has existing schedules', async () => {
      prisma.doctor.findUnique.mockResolvedValue(existingDoctor);
      prisma.doctor.delete.mockRejectedValue(new Error('FK violation'));

      await expect(service.remove(existingDoctor.id)).rejects.toThrow(
        ConflictException,
      );
    });
  });
});
