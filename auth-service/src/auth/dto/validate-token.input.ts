import { Field, InputType } from '@nestjs/graphql';
import { IsNotEmpty } from 'class-validator';

@InputType({ description: 'Payload used by other services to validate an access token.' })
export class ValidateTokenInput {
  @Field({ description: 'JWT access token to validate, without the "Bearer " prefix.' })
  @IsNotEmpty()
  token: string;
}
