import { ObjectType } from '@nestjs/graphql';
import { Paginated } from '../../common/paginated';
import { CustomerModel } from './customer.model';

@ObjectType({ description: 'A paginated list of customers.' })
export class PaginatedCustomer extends Paginated(CustomerModel) {}
