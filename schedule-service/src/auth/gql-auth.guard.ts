import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';
import { AuthClientService } from './auth-client.service';

@Injectable()
export class GqlAuthGuard implements CanActivate {
  constructor(private readonly authClient: AuthClientService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = GqlExecutionContext.create(context).getContext().req;
    const authHeader: string | undefined = request?.headers?.authorization;

    if (!authHeader?.startsWith('Bearer ')) {
      throw new UnauthorizedException('Missing bearer token');
    }

    const token = authHeader.slice('Bearer '.length);
    const user = await this.authClient.validateToken(token);

    if (!user) {
      throw new UnauthorizedException('Invalid or expired token');
    }

    request.user = user;
    return true;
  }
}
