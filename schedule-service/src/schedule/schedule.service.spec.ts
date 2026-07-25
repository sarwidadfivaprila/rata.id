import { Test } from '@nestjs/testing';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { ScheduleService } from './schedule.service';
import { PrismaService } from '../prisma/prisma.service';

describe('ScheduleService', () => {
  let service: ScheduleService;
  let prisma: {
    customer: { findUnique: jest.Mock };
    doctor: { findUnique: jest.Mock };
    schedule: {
      findUnique: jest.Mock;
      findMany: jest.Mock;
      count: jest.Mock;
      create: jest.Mock;
      delete: jest.Mock;
    };
  };

  const customer = { id: 'cust-1', name: 'Jane' };
  const doctor = { id: 'doc-1', name: 'Dr. Smith' };
  const scheduledAt = new Date('2026-08-01T10:00:00.000Z');
  const existingSchedule = {
    id: 'sched-1',
    objective: 'Checkup',
    customerId: customer.id,
    doctorId: doctor.id,
    scheduledAt,
    customer,
    doctor,
  };

  beforeEach(async () => {
    prisma = {
      customer: { findUnique: jest.fn() },
      doctor: { findUnique: jest.fn() },
      schedule: {
        findUnique: jest.fn(),
        findMany: jest.fn(),
        count: jest.fn(),
        create: jest.fn(),
        delete: jest.fn(),
      },
    };

    const moduleRef = await Test.createTestingModule({
      providers: [
        ScheduleService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = moduleRef.get(ScheduleService);
  });

  describe('create', () => {
    const input = {
      objective: 'Checkup',
      customerId: customer.id,
      doctorId: doctor.id,
      scheduledAt,
    };

    it('throws not found when the customer does not exist', async () => {
      prisma.customer.findUnique.mockResolvedValue(null);
      prisma.doctor.findUnique.mockResolvedValue(doctor);

      await expect(service.create(input)).rejects.toThrow(NotFoundException);
    });

    it('throws not found when the doctor does not exist', async () => {
      prisma.customer.findUnique.mockResolvedValue(customer);
      prisma.doctor.findUnique.mockResolvedValue(null);

      await expect(service.create(input)).rejects.toThrow(NotFoundException);
    });

    it('throws a conflict error when the doctor already has a schedule at that time', async () => {
      prisma.customer.findUnique.mockResolvedValue(customer);
      prisma.doctor.findUnique.mockResolvedValue(doctor);
      prisma.schedule.findUnique.mockResolvedValue(existingSchedule);

      await expect(service.create(input)).rejects.toThrow(ConflictException);
      expect(prisma.schedule.create).not.toHaveBeenCalled();
    });

    it('converts a race-condition unique constraint error into a conflict error', async () => {
      prisma.customer.findUnique.mockResolvedValue(customer);
      prisma.doctor.findUnique.mockResolvedValue(doctor);
      prisma.schedule.findUnique.mockResolvedValue(null);
      prisma.schedule.create.mockRejectedValue(
        new Prisma.PrismaClientKnownRequestError('Unique constraint failed', {
          code: 'P2002',
          clientVersion: 'test',
        }),
      );

      await expect(service.create(input)).rejects.toThrow(ConflictException);
    });

    it('creates the schedule when everything is valid', async () => {
      prisma.customer.findUnique.mockResolvedValue(customer);
      prisma.doctor.findUnique.mockResolvedValue(doctor);
      prisma.schedule.findUnique.mockResolvedValue(null);
      prisma.schedule.create.mockResolvedValue(existingSchedule);

      const result = await service.create(input);

      expect(result).toEqual(existingSchedule);
    });
  });

  describe('findAll', () => {
    it('builds a filtered, paginated query', async () => {
      prisma.schedule.findMany.mockResolvedValue([existingSchedule]);
      prisma.schedule.count.mockResolvedValue(1);

      const result = await service.findAll({
        page: 1,
        limit: 10,
        doctorId: doctor.id,
      });

      expect(prisma.schedule.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { doctorId: doctor.id } }),
      );
      expect(result.total).toBe(1);
    });
  });

  describe('findOne', () => {
    it('throws not found for a missing schedule', async () => {
      prisma.schedule.findUnique.mockResolvedValue(null);

      await expect(service.findOne('missing-id')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('remove', () => {
    it('throws not found when the schedule does not exist', async () => {
      prisma.schedule.findUnique.mockResolvedValue(null);

      await expect(service.remove('missing-id')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('deletes the schedule when it exists', async () => {
      prisma.schedule.findUnique.mockResolvedValue(existingSchedule);
      prisma.schedule.delete.mockResolvedValue(existingSchedule);

      const result = await service.remove(existingSchedule.id);

      expect(result).toEqual(existingSchedule);
    });
  });
});
