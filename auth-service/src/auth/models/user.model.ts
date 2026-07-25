import { Field, ObjectType } from '@nestjs/graphql';

@ObjectType({ description: 'A registered user account.' })
export class UserModel {
  @Field({ description: 'Unique identifier (UUID) of the user.' })
  id: string;

  @Field({ description: 'Email address of the user.' })
  email: string;

  @Field({ description: 'Timestamp when the user was created.' })
  createdAt: Date;

  @Field({ description: 'Timestamp when the user was last updated.' })
  updatedAt: Date;
}
