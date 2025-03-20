import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { BlogCreateDto } from './create-blog.dto';

@Injectable()
export class MyMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    const body: BlogCreateDto = req.body
    console.log(body.name)
    next();
  }
}