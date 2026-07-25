import { Field, InputType } from '@nestjs/graphql';
import { IsEmail, IsNotEmpty, IsOptional } from 'class-validator';

@InputType({ description: 'Payload to update an existing customer.' })
export class UpdateCustomerInput {
  @Field({ nullable: true, description: 'Updated full name of the customer.' })
  @IsOptional()
  @IsNotEmpty()
  name?: string;

  @Field({ nullable: true, description: 'Updated unique email address of the customer.' })
  @IsOptional()
  @IsEmail()
  email?: string;
}
