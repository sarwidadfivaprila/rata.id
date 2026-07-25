import { Field, ObjectType } from '@nestjs/graphql';

@ObjectType({ description: 'A doctor providing consultations.' })
export class DoctorModel {
  @Field({ description: 'Unique identifier (UUID) of the doctor.' })
  id: string;

  @Field({ description: 'Full name of the doctor.' })
  name: string;

  @Field({ description: 'Timestamp when the doctor was created.' })
  createdAt: Date;

  @Field({ description: 'Timestamp when the doctor was last updated.' })
  updatedAt: Date;
}
