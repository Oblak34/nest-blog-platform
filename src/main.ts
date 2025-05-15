import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { appSetup } from './setup/app.setup';
import { CoreConfig } from './core/config/core.config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { GLOBAL_PREFIX } from './setup/global-prefix.setup';

async function bootstrap() {
  const appContext = await NestFactory.createApplicationContext(AppModule)
  const coreConfig = appContext.get<CoreConfig>(CoreConfig)
  await appContext.close()
  const DynamicAppModule = await AppModule.forRoot(coreConfig)
  const app = await NestFactory.create(DynamicAppModule);

  if(coreConfig.isSwaggerEnabled){
    const config = new DocumentBuilder()
      .setTitle('BLOGGER API')
      .addBearerAuth()
      .addBasicAuth()
      .setVersion('1.0')
      .build();

    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup(GLOBAL_PREFIX, app, document, {
      customSiteTitle: 'Blogger Swagger',
    });
  }
  appSetup(app)
  await app.listen(coreConfig.port);
}

bootstrap();
