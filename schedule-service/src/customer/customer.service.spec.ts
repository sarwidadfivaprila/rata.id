import { Test } from '@nestjs/testing';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { CustomerService } from './customer.service';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../cache/redis.service';

describe('CustomerService', () => {
  let service: CustomerService;
  let prisma: {
    customer: {
      findUnique: jest.Mock;
      findMany: jest.Mock;
      count: jest.Mock;
      create: jest.Mock;
      update: jest.Mock;
      delete: jest.Mock;
    };
  };
  let redis: { get: jest.Mock; set: jest.Mock; invalidatePrefix: jest.Mock };

  const existingCustomer = {
    id: 'cust-1',
    name: 'Jane Doe',
    email: 'jane@example.com',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    prisma = {
      customer: {
        findUnique: jest.fn(),
        findMany: jest.fn(),
        count: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
    };

    redis = {
      get: jest.fn().mockResolvedValue(null),
      set: jest.fn(),
      invalidatePrefix: jest.fn(),
    };

    const moduleRef = await Test.createTestingModule({
      providers: [
        CustomerService,
        { provide: PrismaService, useValue: prisma },
        { provide: RedisService, useValue: redis },
      ],
    }).compile();

    service = moduleRef.get(CustomerService);
  });

  describe('create', () => {
    it('creates the customer when the email is free', async () => {
      prisma.customer.findUnique.mockResolvedValue(null);
      prisma.customer.create.mockResolvedValue(existingCustomer);

      const result = await service.create({
        name: 'Jane Doe',
        email: 'jane@example.com',
      });

      expect(result).toEqual(existingCustomer);
    });

    it('throws a conflict error when the email is already used', async () => {
      prisma.customer.findUnique.mockResolvedValue(existingCustomer);

      await expect(
        service.create({ name: 'Jane', email: existingCustomer.email }),
      ).rejects.toThrow(ConflictException);
      expect(prisma.customer.create).not.toHaveBeenCalled();
    });
  });

  describe('update', () => {
    it('throws not found when the customer does not exist', async () => {
      prisma.customer.findUnique.mockResolvedValue(null);

      await expect(
        service.update('missing-id', { name: 'New Name' }),
      ).rejects.toThrow(NotFoundException);
    });

    it('throws a conflict error when updating to an email used by another customer', async () => {
      prisma.customer.findUnique
        .mockResolvedValueOnce(existingCustomer) // findByIdOrThrow
        .mockResolvedValueOnce({ ...existingCustomer, id: 'other-id' }); // email check

      await expect(
        service.update(existingCustomer.id, { email: 'taken@example.com' }),
      ).rejects.toThrow(ConflictException);
    });

    it('updates the customer when data is valid', async () => {
      prisma.customer.findUnique
        .mockResolvedValueOnce(existingCustomer)
        .mockResolvedValueOnce(null);
      prisma.customer.update.mockResolvedValue({
        ...existingCustomer,
        name: 'Updated',
      });

      const result = await service.update(existingCustomer.id, {
        name: 'Updated',
      });

      expect(result.name).toBe('Updated');
    });
  });

  describe('findAll', () => {
    it('paginates results', async () => {
      prisma.customer.findMany.mockResolvedValue([existingCustomer]);
      prisma.customer.count.mockResolvedValue(1);

      const result = await service.findAll({ page: 2, limit: 5 });

      expect(prisma.customer.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ skip: 5, take: 5 }),
      );
      expect(result).toEqual({
        data: [existingCustomer],
        total: 1,
        page: 2,
        limit: 5,
      });
    });
  });

  describe('findOne', () => {
    it('throws not found for a missing customer', async () => {
      prisma.customer.findUnique.mockResolvedValue(null);

      await expect(service.findOne('missing-id')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('remove', () => {
    it('throws not found when the customer does not exist', async () => {
      prisma.customer.findUnique.mockResolvedValue(null);

      await expect(service.remove('missing-id')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('throws a conflict error when the customer has existing schedules', async () => {
      prisma.customer.findUnique.mockResolvedValue(existingCustomer);
      prisma.customer.delete.mockRejectedValue(new Error('FK violation'));

      await expect(service.remove(existingCustomer.id)).rejects.toThrow(
        ConflictException,
      );
    });

    it('deletes the customer when there are no dependent schedules', async () => {
      prisma.customer.findUnique.mockResolvedValue(existingCustomer);
      prisma.customer.delete.mockResolvedValue(existingCustomer);

      const result = await service.remove(existingCustomer.id);

      expect(result).toEqual(existingCustomer);
    });
  });
});
