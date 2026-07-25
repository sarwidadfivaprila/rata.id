import { Field, InputType } from '@nestjs/graphql';
import { IsDate, IsNotEmpty, IsUUID } from 'class-validator';
import { Type } from 'class-transformer';

@InputType({ description: 'Payload required to create a new schedule.' })
export class CreateScheduleInput {
  @Field({ description: 'Objective/purpose of the consultation.' })
  @IsNotEmpty()
  objective: string;

  @Field({ description: 'Id of the customer this schedule is for.' })
  @IsUUID()
  customerId: string;

  @Field({ description: 'Id of the doctor this schedule is with.' })
  @IsUUID()
  doctorId: string;

  @Field({ description: 'Date and time the consultation is scheduled for.' })
  @Type(() => Date)
  @IsDate()
  scheduledAt: Date;
}
