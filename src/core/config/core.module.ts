import { Global, Module } from '@nestjs/common';
import { CoreConfig } from './core.config';

Global()
@Module({
  imports: [],
  providers: [CoreConfig],
  exports: [CoreConfig],
})
export class CoreModule {}