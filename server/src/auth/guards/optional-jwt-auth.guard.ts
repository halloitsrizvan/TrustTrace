import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class OptionalJwtAuthGuard extends AuthGuard('jwt') {
  override handleRequest<TUser>(
    _error: unknown,
    user: TUser | false | null,
  ): TUser | null {
    return user || null;
  }
}
