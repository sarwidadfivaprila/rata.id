import { ObjectType } from '@nestjs/graphql';
import { Paginated } from '../../common/paginated';
import { ScheduleModel } from './schedule.model';

@ObjectType({ description: 'A paginated list of schedules.' })
export class PaginatedSchedule extends Paginated(ScheduleModel) {}
