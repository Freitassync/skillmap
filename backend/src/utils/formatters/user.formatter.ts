import type { User } from '@prisma/client';

export interface ApiUser {
  id: string;
  name: string;
  email: string;
  current_xp: number;
  creation_date: Date;
}

export interface AuthResponse {
  success: boolean;
  data: {
    token: string;
    user: ApiUser;
  };
}

export class UserFormatter {
  static toApi(user: User): ApiUser {
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      current_xp: user.currentXp,
      creation_date: user.creationDate,
    };
  }

  static toAuthResponse(user: User, token: string): AuthResponse {
    return {
      success: true,
      data: {
        token,
        user: this.toApi(user),
      },
    };
  }
}
