import { JwtService } from '@nestjs/jwt';
import { AuthTokenMiddleware } from './auth-token.middleware';

describe('AuthTokenMiddleware', () => {
  const secret = 'test-user-jwt-secret';
  let jwtService: JwtService;
  let userService: { findOne: jest.Mock };
  let middleware: AuthTokenMiddleware;

  beforeEach(() => {
    jwtService = new JwtService({ secret });
    userService = {
      findOne: jest.fn(),
    };
    middleware = new AuthTokenMiddleware(jwtService, userService as any);
  });

  it('hydrates the current user when the token is valid', async () => {
    const user = {
      _id: 'user-1',
      email: 'user@example.com',
      isEmailVerified: true,
    };
    userService.findOne.mockResolvedValue(user);
    const token = jwtService.sign(
      { _id: user._id, email: user.email },
      { expiresIn: '1h' },
    );
    const req: any = {
      headers: {
        authorization: `Bearer ${token}`,
      },
    };
    const next = jest.fn();

    await middleware.use(req, {} as any, next);

    expect(userService.findOne).toHaveBeenCalledWith({ _id: user._id });
    expect(req.currentUser).toBe(user);
    expect(next).toHaveBeenCalledTimes(1);
  });

  it('rejects a token signed with the wrong secret before user lookup', async () => {
    const forgedToken = new JwtService({ secret: 'wrong-secret' }).sign({
      _id: 'user-1',
    });
    const req: any = {
      headers: {
        authorization: `Bearer ${forgedToken}`,
      },
    };

    await expect(middleware.use(req, {} as any, jest.fn())).rejects.toThrow(
      'Invalid token',
    );
    expect(userService.findOne).not.toHaveBeenCalled();
  });

  it('rejects an expired token before user lookup', async () => {
    const expiredToken = jwtService.sign({
      _id: 'user-1',
      exp: Math.floor(Date.now() / 1000) - 60,
    });
    const req: any = {
      headers: {
        authorization: `Bearer ${expiredToken}`,
      },
    };

    await expect(middleware.use(req, {} as any, jest.fn())).rejects.toThrow(
      'Invalid token',
    );
    expect(userService.findOne).not.toHaveBeenCalled();
  });
});
