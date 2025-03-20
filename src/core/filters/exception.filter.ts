import { ArgumentsHost, Catch, ExceptionFilter, HttpStatus } from '@nestjs/common';
import { Request, Response } from 'express';
import { DomainException, ErrorExtension } from '../exception/domain-exception';
import { DomainExceptionCode } from '../exception/domain-exception-codes';

export type HttpResponseBody = {
  errorsMessages: ErrorExtension[];
};

@Catch(DomainException)
export class DomainHttpExceptionFilter implements ExceptionFilter {
  catch(exception: DomainException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const status = this.getStatus(exception)
    const responseBody = this.getResponseBody(exception)

    response.status(status).json(responseBody)
  }

  getStatus(exception: DomainException): number {
    switch(exception.code) {
      case DomainExceptionCode.BadRequest:
        return HttpStatus.BAD_REQUEST;
      case DomainExceptionCode.Forbidden:
        return HttpStatus.FORBIDDEN;
      case DomainExceptionCode.NotFound:
        return HttpStatus.NOT_FOUND;
      case DomainExceptionCode.Unauthorized:
        return HttpStatus.UNAUTHORIZED;
      default:
        return HttpStatus.I_AM_A_TEAPOT
    }
  }

  getResponseBody(exception: DomainException) {
    return {
        errorMessages: exception.extensions
    }
  }
}


// response.status(401).json({
//   statusCode: status,
//   timestamp: new Date().toISOString(),
//   path: request.url,
//   message: exception
// });