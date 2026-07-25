import { Field, InputType } from '@nestjs/graphql';
import { IsNotEmpty } from 'class-validator';

@InputType({ description: 'Payload required to create a new doctor.' })
export class CreateDoctorInput {
  @Field({ description: 'Full name of the doctor.' })
  @IsNotEmpty()
  name: string;
}
