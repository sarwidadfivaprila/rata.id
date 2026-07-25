import { Type } from '@nestjs/common';
import { Field, Int, ObjectType } from '@nestjs/graphql';

export interface IPaginated<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}

export function Paginated<T>(classRef: Type<T>): Type<IPaginated<T>> {
  @ObjectType(`Paginated${classRef.name}`, { isAbstract: true })
  abstract class PaginatedType implements IPaginated<T> {
    @Field(() => [classRef], { description: 'Items in the current page.' })
    data: T[];

    @Field(() => Int, { description: 'Total number of items across all pages.' })
    total: number;

    @Field(() => Int, { description: 'Current page number.' })
    page: number;

    @Field(() => Int, { description: 'Number of items per page.' })
    limit: number;
  }

  return PaginatedType as Type<IPaginated<T>>;
}
