import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';
import { GqlAuthGuard } from './gql-auth.guard';
import { AuthClientService } from './auth-client.service';

describe('GqlAuthGuard', () => {
  let guard: GqlAuthGuard;
  let authClient: { validateToken: jest.Mock };

  const createContextWithHeader = (authorization?: string) => {
    const req: { headers: Record<string, string>; user?: unknown } = {
      headers: authorization ? { authorization } : {},
    };
    jest
      .spyOn(GqlExecutionContext, 'create')
      .mockReturnValue({
        getContext: () => ({ req }),
      } as unknown as GqlExecutionContext);
    return { executionContext: {} as ExecutionContext, req };
  };

  beforeEach(() => {
    authClient = { validateToken: jest.fn() };
    guard = new GqlAuthGuard(authClient as unknown as AuthClientService);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('throws unauthorized when there is no bearer header', async () => {
    const { executionContext } = createContextWithHeader(undefined);

    await expect(guard.canActivate(executionContext)).rejects.toThrow(
      UnauthorizedException,
    );
    expect(authClient.validateToken).not.toHaveBeenCalled();
  });

  it('throws unauthorized when the token is rejected by the Auth Service', async () => {
    const { executionContext } = createContextWithHeader('Bearer bad-token');
    authClient.validateToken.mockResolvedValue(null);

    await expect(guard.canActivate(executionContext)).rejects.toThrow(
      UnauthorizedException,
    );
    expect(authClient.validateToken).toHaveBeenCalledWith('bad-token');
  });

  it('allows the request and attaches the user when the token is valid', async () => {
    const { executionContext, req } = createContextWithHeader(
      'Bearer good-token',
    );
    authClient.validateToken.mockResolvedValue({
      userId: 'user-1',
      email: 'jane@example.com',
    });

    const result = await guard.canActivate(executionContext);

    expect(result).toBe(true);
    expect(req.user).toEqual({ userId: 'user-1', email: 'jane@example.com' });
  });
});
