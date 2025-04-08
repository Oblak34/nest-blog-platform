import { ValidationError } from '@nestjs/common';
import { ErrorExtension } from '../exception/domain-exception';

export const errorFormatter = (errors: ValidationError[], errorMessage?: any,): ErrorExtension[] => {
  const errorsForResponse = errorMessage || [];
  for (const error of errors) {

    if (!error?.constraints && error?.children?.length) {
      errorFormatter(error.children, errorsForResponse);
    } else if (error?.constraints) {
      const constrainKeys = Object.keys(error.constraints);

      for (const key of constrainKeys) {
        errorsForResponse.push({
          message: error.constraints[key] ? `${error.constraints[key]}; Received value: ${error?.value}`: '',
          field: error.property,
        });
      }
    }
  }

  return errorsForResponse;
};