import type { Role } from '../generated/prisma/enums.js';

export interface CurrentUser {
  id: string;
  email: string;
  name: string;
  role: Role;
  trustScore: number;
}

export interface JwtPayload {
  sub: string;
  role: Role;
}
