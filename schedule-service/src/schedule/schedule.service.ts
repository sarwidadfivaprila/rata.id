import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateScheduleInput } from './dto/create-schedule.input';
import { ScheduleFilterArgs } from './dto/schedule-filter.args';
import { IPaginated } from '../common/paginated';
import { ScheduleModel } from './models/schedule.model';

const PRISMA_UNIQUE_CONSTRAINT_ERROR = 'P2002';

@Injectable()
export class ScheduleService {
  constructor(private readonly prisma: PrismaService) {}

  async create(input: CreateScheduleInput): Promise<ScheduleModel> {
    const [customer, doctor] = await Promise.all([
      this.prisma.customer.findUnique({ where: { id: input.customerId } }),
      this.prisma.doctor.findUnique({ where: { id: input.doctorId } }),
    ]);
    if (!customer) {
      throw new NotFoundException(`Customer ${input.customerId} not found`);
    }
    if (!doctor) {
      throw new NotFoundException(`Doctor ${input.doctorId} not found`);
    }

    const conflict = await this.prisma.schedule.findUnique({
      where: {
        doctorId_scheduledAt: {
          doctorId: input.doctorId,
          scheduledAt: input.scheduledAt,
        },
      },
    });
    if (conflict) {
      throw new ConflictException(
        'This doctor already has a schedule at the requested time',
      );
    }

    try {
      return await this.prisma.schedule.create({
        data: input,
        include: { customer: true, doctor: true },
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === PRISMA_UNIQUE_CONSTRAINT_ERROR
      ) {
        throw new ConflictException(
          'This doctor already has a schedule at the requested time',
        );
      }
      throw error;
    }
  }

  async findAll(filter: ScheduleFilterArgs): Promise<IPaginated<ScheduleModel>> {
    const { page, limit, customerId, doctorId, scheduledFrom, scheduledTo } =
      filter;

    const where: Prisma.ScheduleWhereInput = {
      ...(customerId && { customerId }),
      ...(doctorId && { doctorId }),
      ...((scheduledFrom || scheduledTo) && {
        scheduledAt: {
          ...(scheduledFrom && { gte: scheduledFrom }),
          ...(scheduledTo && { lte: scheduledTo }),
        },
      }),
    };

    const [data, total] = await Promise.all([
      this.prisma.schedule.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { scheduledAt: 'asc' },
        include: { customer: true, doctor: true },
      }),
      this.prisma.schedule.count({ where }),
    ]);

    return { data, total, page, limit };
  }

  async findOne(id: string): Promise<ScheduleModel> {
    const schedule = await this.prisma.schedule.findUnique({
      where: { id },
      include: { customer: true, doctor: true },
    });
    if (!schedule) {
      throw new NotFoundException(`Schedule ${id} not found`);
    }
    return schedule;
  }

  async remove(id: string): Promise<ScheduleModel> {
    const schedule = await this.prisma.schedule.findUnique({ where: { id } });
    if (!schedule) {
      throw new NotFoundException(`Schedule ${id} not found`);
    }
    return this.prisma.schedule.delete({
      where: { id },
      include: { customer: true, doctor: true },
    });
  }
}
