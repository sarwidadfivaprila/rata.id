import { Field, ObjectType } from '@nestjs/graphql';

@ObjectType({ description: 'A clinic customer (patient).' })
export class CustomerModel {
  @Field({ description: 'Unique identifier (UUID) of the customer.' })
  id: string;

  @Field({ description: 'Full name of the customer.' })
  name: string;

  @Field({ description: 'Unique email address of the customer.' })
  email: string;

  @Field({ description: 'Timestamp when the customer was created.' })
  createdAt: Date;

  @Field({ description: 'Timestamp when the customer was last updated.' })
  updatedAt: Date;
}
