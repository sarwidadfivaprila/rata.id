import { Field, ObjectType } from '@nestjs/graphql';

@ObjectType({ description: 'Result of validating an access token.' })
export class ValidateTokenResult {
  @Field({ description: 'Whether the provided token is valid and not expired.' })
  valid: boolean;

  @Field({ nullable: true, description: 'Id of the user the token belongs to, when valid.' })
  userId?: string;

  @Field({ nullable: true, description: 'Email of the user the token belongs to, when valid.' })
  email?: string;
}
