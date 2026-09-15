
import { Request, Response, NextFunction } from 'express';
import { UserService } from '../../services/user.service.ts';
import { UnitOfWork } from '../../config/unitOfWork.ts';
import { Pbkdf2PasswordHasher } from '../utils/passwordHash.ts';
import { TokenManager } from '../utils/tokenManager.ts';
import { ApiErrorCode } from '../../enum/ErrorCodes.enum.ts';
import { ErrorFactory } from '../factory/error-factory.ts';

const userService = new UserService(new UnitOfWork(), new Pbkdf2PasswordHasher(), new TokenManager());

export async function refreshTokenMiddleware(req: Request, res: Response, next: NextFunction) {
  const refreshToken = req.cookies['refresh_token'];

  try {
    // Verify the refresh token and generate a new access token
    const isValid = await userService.validateCurrentRefreshToken(refreshToken as string, req.user?.id);
    if (isValid) next();
    else throw ErrorFactory.build(ApiErrorCode.UNAUTHORIZED, 'Invalid refresh token');
  } catch (error) {
    throw ErrorFactory.build(ApiErrorCode.UNAUTHORIZED, error instanceof Error ? error.message : String(error));
  }
}