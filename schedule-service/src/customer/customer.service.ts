import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../cache/redis.service';
import { CreateCustomerInput } from './dto/create-customer.input';
import { UpdateCustomerInput } from './dto/update-customer.input';
import { PaginationArgs } from '../common/pagination.args';
import { IPaginated } from '../common/paginated';
import { CustomerModel } from './models/customer.model';

const LIST_CACHE_PREFIX = 'customers:list:';

@Injectable()
export class CustomerService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {}

  async create(input: CreateCustomerInput): Promise<CustomerModel> {
    const existing = await this.prisma.customer.findUnique({
      where: { email: input.email },
    });
    if (existing) {
      throw new ConflictException('A customer with this email already exists');
    }

    const customer = await this.prisma.customer.create({ data: input });
    await this.redis.invalidatePrefix(LIST_CACHE_PREFIX);
    return customer;
  }

  async update(id: string, input: UpdateCustomerInput): Promise<CustomerModel> {
    await this.findByIdOrThrow(id);

    if (input.email) {
      const existing = await this.prisma.customer.findUnique({
        where: { email: input.email },
      });
      if (existing && existing.id !== id) {
        throw new ConflictException('A customer with this email already exists');
      }
    }

    const customer = await this.prisma.customer.update({ where: { id }, data: input });
    await this.redis.invalidatePrefix(LIST_CACHE_PREFIX);
    return customer;
  }

  async findAll(pagination: PaginationArgs): Promise<IPaginated<CustomerModel>> {
    const cacheKey = `${LIST_CACHE_PREFIX}${JSON.stringify(pagination)}`;
    const cached = await this.redis.get<IPaginated<CustomerModel>>(cacheKey);
    if (cached) {
      return cached;
    }

    const { page, limit } = pagination;
    const [data, total] = await Promise.all([
      this.prisma.customer.findMany({
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.customer.count(),
    ]);

    const result = { data, total, page, limit };
    await this.redis.set(cacheKey, result);
    return result;
  }

  async findOne(id: string): Promise<CustomerModel> {
    return this.findByIdOrThrow(id);
  }

  async remove(id: string): Promise<CustomerModel> {
    await this.findByIdOrThrow(id);

    let customer: CustomerModel;
    try {
      customer = await this.prisma.customer.delete({ where: { id } });
    } catch {
      throw new ConflictException(
        'Cannot delete a customer that has existing schedules',
      );
    }

    await this.redis.invalidatePrefix(LIST_CACHE_PREFIX);
    return customer;
  }

  private async findByIdOrThrow(id: string) {
    const customer = await this.prisma.customer.findUnique({ where: { id } });
    if (!customer) {
      throw new NotFoundException(`Customer ${id} not found`);
    }
    return customer;
  }
}
