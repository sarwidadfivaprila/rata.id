import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { CustomerService } from './customer.service';
import { CustomerModel } from './models/customer.model';
import { PaginatedCustomer } from './models/paginated-customer.model';
import { CreateCustomerInput } from './dto/create-customer.input';
import { UpdateCustomerInput } from './dto/update-customer.input';
import { PaginationArgs } from '../common/pagination.args';

@Resolver(() => CustomerModel)
export class CustomerResolver {
  constructor(private readonly customerService: CustomerService) {}

  @Mutation(() => CustomerModel, { description: 'Create a new customer.' })
  createCustomer(@Args('input') input: CreateCustomerInput) {
    return this.customerService.create(input);
  }

  @Mutation(() => CustomerModel, { description: 'Update an existing customer.' })
  updateCustomer(
    @Args('id') id: string,
    @Args('input') input: UpdateCustomerInput,
  ) {
    return this.customerService.update(id, input);
  }

  @Query(() => PaginatedCustomer, { description: 'List all customers, paginated.' })
  customers(@Args() pagination: PaginationArgs) {
    return this.customerService.findAll(pagination);
  }

  @Query(() => CustomerModel, { description: 'Get a customer by id.' })
  customer(@Args('id') id: string) {
    return this.customerService.findOne(id);
  }

  @Mutation(() => CustomerModel, { description: 'Delete a customer by id.' })
  deleteCustomer(@Args('id') id: string) {
    return this.customerService.remove(id);
  }
}
