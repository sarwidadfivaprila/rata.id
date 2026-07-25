import { ArgsType, Field, Int } from '@nestjs/graphql';
import { Max, Min } from 'class-validator';
import { Type } from 'class-transformer';

@ArgsType()
export class PaginationArgs {
  @Field(() => Int, {
    defaultValue: 1,
    description: 'Page number, starting at 1.',
  })
  @Type(() => Number)
  @Min(1)
  page: number = 1;

  @Field(() => Int, {
    defaultValue: 10,
    description: 'Number of items per page (max 100).',
  })
  @Type(() => Number)
  @Min(1)
  @Max(100)
  limit: number = 10;
}
