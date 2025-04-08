import { INestApplication, ValidationPipe } from '@nestjs/common';
import { swaggerSetup } from './swagger.setup';
import { globalPrefixSetup } from './global-prefix.setup';
import { pipesSetup } from './pipes.setup';
import { DomainHttpExceptionFilter } from '../core/filters/exception.filter';
import { AllHttpExceptionsFilter } from '../core/filters/all-exception.filter';
import { validationConstraintSetup } from '../core/validation/validation-constraint.setup';

export function appSetup(app: INestApplication) {
  pipesSetup(app);
  globalPrefixSetup(app);
  swaggerSetup(app);
  app.useGlobalFilters(new AllHttpExceptionsFilter(), new DomainHttpExceptionFilter())
  app.enableCors();
  validationConstraintSetup(app);
}
