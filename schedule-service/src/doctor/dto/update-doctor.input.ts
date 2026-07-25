import { Field, InputType } from '@nestjs/graphql';
import { IsNotEmpty } from 'class-validator';

@InputType({ description: 'Payload to update an existing doctor.' })
export class UpdateDoctorInput {
  @Field({ description: 'Updated full name of the doctor.' })
  @IsNotEmpty()
  name: string;
}
