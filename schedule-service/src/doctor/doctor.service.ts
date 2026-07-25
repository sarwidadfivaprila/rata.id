import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../cache/redis.service';
import { CreateDoctorInput } from './dto/create-doctor.input';
import { UpdateDoctorInput } from './dto/update-doctor.input';
import { PaginationArgs } from '../common/pagination.args';
import { IPaginated } from '../common/paginated';
import { DoctorModel } from './models/doctor.model';

const LIST_CACHE_PREFIX = 'doctors:list:';

@Injectable()
export class DoctorService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {}

  async create(input: CreateDoctorInput): Promise<DoctorModel> {
    const doctor = await this.prisma.doctor.create({ data: input });
    await this.redis.invalidatePrefix(LIST_CACHE_PREFIX);
    return doctor;
  }

  async update(id: string, input: UpdateDoctorInput): Promise<DoctorModel> {
    await this.findByIdOrThrow(id);
    const doctor = await this.prisma.doctor.update({ where: { id }, data: input });
    await this.redis.invalidatePrefix(LIST_CACHE_PREFIX);
    return doctor;
  }

  async findAll(pagination: PaginationArgs): Promise<IPaginated<DoctorModel>> {
    const cacheKey = `${LIST_CACHE_PREFIX}${JSON.stringify(pagination)}`;
    const cached = await this.redis.get<IPaginated<DoctorModel>>(cacheKey);
    if (cached) {
      return cached;
    }

    const { page, limit } = pagination;
    const [data, total] = await Promise.all([
      this.prisma.doctor.findMany({
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.doctor.count(),
    ]);

    const result = { data, total, page, limit };
    await this.redis.set(cacheKey, result);
    return result;
  }

  findOne(id: string): Promise<DoctorModel> {
    return this.findByIdOrThrow(id);
  }

  async remove(id: string): Promise<DoctorModel> {
    await this.findByIdOrThrow(id);

    let doctor: DoctorModel;
    try {
      doctor = await this.prisma.doctor.delete({ where: { id } });
    } catch {
      throw new ConflictException(
        'Cannot delete a doctor that has existing schedules',
      );
    }

    await this.redis.invalidatePrefix(LIST_CACHE_PREFIX);
    return doctor;
  }

  private async findByIdOrThrow(id: string) {
    const doctor = await this.prisma.doctor.findUnique({ where: { id } });
    if (!doctor) {
      throw new NotFoundException(`Doctor ${id} not found`);
    }
    return doctor;
  }
}
