import { ArgsType, Field } from '@nestjs/graphql';
import { IsDate, IsOptional, IsUUID } from 'class-validator';
import { Type } from 'class-transformer';
import { PaginationArgs } from '../../common/pagination.args';

@ArgsType()
export class ScheduleFilterArgs extends PaginationArgs {
  @Field({ nullable: true, description: 'Filter by customer id.' })
  @IsOptional()
  @IsUUID()
  customerId?: string;

  @Field({ nullable: true, description: 'Filter by doctor id.' })
  @IsOptional()
  @IsUUID()
  doctorId?: string;

  @Field({ nullable: true, description: 'Only include schedules at or after this date/time.' })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  scheduledFrom?: Date;

  @Field({ nullable: true, description: 'Only include schedules at or before this date/time.' })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  scheduledTo?: Date;
}
