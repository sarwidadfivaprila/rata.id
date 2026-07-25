import { Field, ObjectType } from '@nestjs/graphql';
import { CustomerModel } from '../../customer/models/customer.model';
import { DoctorModel } from '../../doctor/models/doctor.model';

@ObjectType({ description: 'A consultation schedule between a customer and a doctor.' })
export class ScheduleModel {
  @Field({ description: 'Unique identifier (UUID) of the schedule.' })
  id: string;

  @Field({ description: 'Objective/purpose of the consultation.' })
  objective: string;

  @Field({ description: 'Id of the customer this schedule belongs to.' })
  customerId: string;

  @Field({ description: 'Id of the doctor this schedule is with.' })
  doctorId: string;

  @Field({ description: 'Date and time the consultation is scheduled for.' })
  scheduledAt: Date;

  @Field({ description: 'Timestamp when the schedule was created.' })
  createdAt: Date;

  @Field({ description: 'Timestamp when the schedule was last updated.' })
  updatedAt: Date;

  @Field(() => CustomerModel, { description: 'The customer this schedule belongs to.' })
  customer?: CustomerModel;

  @Field(() => DoctorModel, { description: 'The doctor this schedule is with.' })
  doctor?: DoctorModel;
}
