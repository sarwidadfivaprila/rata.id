import { Field, InputType } from '@nestjs/graphql';
import { IsEmail, MinLength } from 'class-validator';

@InputType({ description: 'Payload required to register a new user account.' })
export class RegisterInput {
  @Field({ description: 'Unique email address used as the login identifier.' })
  @IsEmail()
  email: string;

  @Field({ description: 'Plain-text password; it is hashed with bcrypt before storage.' })
  @MinLength(8)
  password: string;
}
