import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateDoctorInput } from './dto/create-doctor.input';
import { UpdateDoctorInput } from './dto/update-doctor.input';
import { PaginationArgs } from '../common/pagination.args';
import { IPaginated } from '../common/paginated';
import { DoctorModel } from './models/doctor.model';

@Injectable()
export class DoctorService {
  constructor(private readonly prisma: PrismaService) {}

  create(input: CreateDoctorInput): Promise<DoctorModel> {
    return this.prisma.doctor.create({ data: input });
  }

  async update(id: string, input: UpdateDoctorInput): Promise<DoctorModel> {
    await this.findByIdOrThrow(id);
    return this.prisma.doctor.update({ where: { id }, data: input });
  }

  async findAll(pagination: PaginationArgs): Promise<IPaginated<DoctorModel>> {
    const { page, limit } = pagination;
    const [data, total] = await Promise.all([
      this.prisma.doctor.findMany({
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.doctor.count(),
    ]);

    return { data, total, page, limit };
  }

  findOne(id: string): Promise<DoctorModel> {
    return this.findByIdOrThrow(id);
  }

  async remove(id: string): Promise<DoctorModel> {
    await this.findByIdOrThrow(id);

    try {
      return await this.prisma.doctor.delete({ where: { id } });
    } catch {
      throw new ConflictException(
        'Cannot delete a doctor that has existing schedules',
      );
    }
  }

  private async findByIdOrThrow(id: string) {
    const doctor = await this.prisma.doctor.findUnique({ where: { id } });
    if (!doctor) {
      throw new NotFoundException(`Doctor ${id} not found`);
    }
    return doctor;
  }
}
