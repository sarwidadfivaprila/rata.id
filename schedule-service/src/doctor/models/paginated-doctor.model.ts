import { ObjectType } from '@nestjs/graphql';
import { Paginated } from '../../common/paginated';
import { DoctorModel } from './doctor.model';

@ObjectType({ description: 'A paginated list of doctors.' })
export class PaginatedDoctor extends Paginated(DoctorModel) {}
