import { Field, InputType } from '@nestjs/graphql';
import { IsEmail, IsNotEmpty } from 'class-validator';

@InputType({ description: 'Payload required to create a new customer.' })
export class CreateCustomerInput {
  @Field({ description: 'Full name of the customer.' })
  @IsNotEmpty()
  name: string;

  @Field({ description: 'Unique email address of the customer.' })
  @IsEmail()
  email: string;
}
