// user.middleware.ts
import { Injectable, NestMiddleware, UnauthorizedException } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { ILoggedInUser } from '../models';
import * as jwt from 'jsonwebtoken';
 // Adjust path as necessary

@Injectable()
export class UserMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader) {
        throw new UnauthorizedException('Authorization header is missing');
      }

      const token = authHeader.split(' ')[1]; // Extract token from "Bearer <token>"
      if (!token) {
        throw new UnauthorizedException('Token is missing');
      }

      // Verify and decode the JWT token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = decoded; // Attach user data to the request object
      console.log(req.user,"middleware")

      next(); // Proceed to the next middleware or route handler
    } catch (error) {
      throw new UnauthorizedException('Invalid token');
    }
  }
}
