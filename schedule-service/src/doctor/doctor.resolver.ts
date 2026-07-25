import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { DoctorService } from './doctor.service';
import { DoctorModel } from './models/doctor.model';
import { PaginatedDoctor } from './models/paginated-doctor.model';
import { CreateDoctorInput } from './dto/create-doctor.input';
import { UpdateDoctorInput } from './dto/update-doctor.input';
import { PaginationArgs } from '../common/pagination.args';

@Resolver(() => DoctorModel)
export class DoctorResolver {
  constructor(private readonly doctorService: DoctorService) {}

  @Mutation(() => DoctorModel, { description: 'Create a new doctor.' })
  createDoctor(@Args('input') input: CreateDoctorInput) {
    return this.doctorService.create(input);
  }

  @Mutation(() => DoctorModel, { description: 'Update an existing doctor.' })
  updateDoctor(
    @Args('id') id: string,
    @Args('input') input: UpdateDoctorInput,
  ) {
    return this.doctorService.update(id, input);
  }

  @Query(() => PaginatedDoctor, { description: 'List all doctors, paginated.' })
  doctors(@Args() pagination: PaginationArgs) {
    return this.doctorService.findAll(pagination);
  }

  @Query(() => DoctorModel, { description: 'Get a doctor by id.' })
  doctor(@Args('id') id: string) {
    return this.doctorService.findOne(id);
  }

  @Mutation(() => DoctorModel, { description: 'Delete a doctor by id.' })
  deleteDoctor(@Args('id') id: string) {
    return this.doctorService.remove(id);
  }
}
