import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GraphQLClient, gql } from 'graphql-request';

interface ValidateTokenResponse {
  validateToken: {
    valid: boolean;
    userId?: string;
    email?: string;
  };
}

export interface ValidatedUser {
  userId: string;
  email: string;
}

const VALIDATE_TOKEN_QUERY = gql`
  query ValidateToken($token: String!) {
    validateToken(input: { token: $token }) {
      valid
      userId
      email
    }
  }
`;

@Injectable()
export class AuthClientService {
  private readonly client: GraphQLClient;

  constructor(config: ConfigService) {
    this.client = new GraphQLClient(
      config.get<string>('AUTH_SERVICE_URL', 'http://localhost:3001/graphql'),
    );
  }

  async validateToken(token: string): Promise<ValidatedUser | null> {
    try {
      const response = await this.client.request<ValidateTokenResponse>(
        VALIDATE_TOKEN_QUERY,
        { token },
      );
      if (!response.validateToken.valid || !response.validateToken.userId) {
        return null;
      }
      return {
        userId: response.validateToken.userId,
        email: response.validateToken.email ?? '',
      };
    } catch {
      return null;
    }
  }
}
