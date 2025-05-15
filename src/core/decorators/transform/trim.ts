import { Transform, TransformFnParams } from 'class-transformer';

export const Trim = (): any => {
  return Transform(({ value }: TransformFnParams) => {
   return  typeof value === 'string' ? value.trim() : value
  });
}