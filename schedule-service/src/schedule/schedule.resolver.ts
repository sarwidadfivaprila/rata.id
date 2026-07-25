import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { ScheduleService } from './schedule.service';
import { ScheduleModel } from './models/schedule.model';
import { PaginatedSchedule } from './models/paginated-schedule.model';
import { CreateScheduleInput } from './dto/create-schedule.input';
import { ScheduleFilterArgs } from './dto/schedule-filter.args';

@Resolver(() => ScheduleModel)
export class ScheduleResolver {
  constructor(private readonly scheduleService: ScheduleService) {}

  @Mutation(() => ScheduleModel, { description: 'Create a new schedule.' })
  createSchedule(@Args('input') input: CreateScheduleInput) {
    return this.scheduleService.create(input);
  }

  @Query(() => PaginatedSchedule, {
    description: 'List all schedules, with optional filters and pagination.',
  })
  schedules(@Args() filter: ScheduleFilterArgs) {
    return this.scheduleService.findAll(filter);
  }

  @Query(() => ScheduleModel, { description: 'Get a schedule by id.' })
  schedule(@Args('id') id: string) {
    return this.scheduleService.findOne(id);
  }

  @Mutation(() => ScheduleModel, { description: 'Delete a schedule by id.' })
  deleteSchedule(@Args('id') id: string) {
    return this.scheduleService.remove(id);
  }
}
