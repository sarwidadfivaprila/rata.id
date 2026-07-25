import { Field, ObjectType } from '@nestjs/graphql';
import { UserModel } from './user.model';

@ObjectType({ description: 'Result returned after a successful login, containing the access token.' })
export class AuthPayload {
  @Field({ description: 'JWT access token to use as "Authorization: Bearer <token>" on other services.' })
  accessToken: string;

  @Field(() => UserModel, { description: 'The authenticated user.' })
  user: UserModel;
}
