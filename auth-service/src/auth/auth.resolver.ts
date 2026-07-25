import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { AuthService } from './auth.service';
import { RegisterInput } from './dto/register.input';
import { LoginInput } from './dto/login.input';
import { ValidateTokenInput } from './dto/validate-token.input';
import { UserModel } from './models/user.model';
import { AuthPayload } from './models/auth-payload.model';
import { ValidateTokenResult } from './models/validate-token-result.model';

@Resolver()
export class AuthResolver {
  constructor(private readonly authService: AuthService) {}

  @Mutation(() => UserModel, {
    description: 'Register a new user with an email and password.',
  })
  register(@Args('input') input: RegisterInput) {
    return this.authService.register(input);
  }

  @Mutation(() => AuthPayload, {
    description: 'Log in with email and password and receive a JWT access token.',
  })
  login(@Args('input') input: LoginInput) {
    return this.authService.login(input);
  }

  @Query(() => ValidateTokenResult, {
    description:
      'Validate a JWT access token and return the associated user info. Called by other services.',
  })
  validateToken(@Args('input') input: ValidateTokenInput) {
    return this.authService.validateToken(input.token);
  }
}
