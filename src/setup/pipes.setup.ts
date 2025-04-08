import { INestApplication, ValidationPipe } from '@nestjs/common';
import { BadRequestDomainException } from '../core/exception/domain-exception';
import { errorFormatter } from '../core/validation/pipes.errors-rormatter';

export function pipesSetup(app: INestApplication) {
  app.useGlobalPipes(
    new ValidationPipe({
      //class-transformer создает экземпляр dto
      //соответственно применятся значения по-умолчанию
      //и методы классов dto
      transform: true,
      stopAtFirstError: true,
      exceptionFactory: (errors) => {
        const formattedErrors = errorFormatter(errors);
        throw new BadRequestDomainException(formattedErrors);
      }

    })
  )
}