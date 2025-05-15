import { configModule } from './dynamic-config-module';
import { DynamicModule, Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UserAccountsModule } from './features/user-accounts/user-accounts.module';
import { MongooseModule } from '@nestjs/mongoose';
import { BloggersPlatformModule } from './features/bloggers-platform/bloggers-platform.module'
import { CoreModule } from './core/config/core.module';
import { CoreConfig } from './core/config/core.config';
import { TestingModule } from './features/testing/testing.module';


@Module({
  imports: [
    configModule,
    CoreModule,
    MongooseModule.forRootAsync({
      imports: [CoreModule],
      useFactory: ( coreConfig: CoreConfig ) => {
        return {
          uri: coreConfig.mongoURI
        }
      },
      inject: [CoreConfig]
    }),
    UserAccountsModule,
    BloggersPlatformModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {
  static async forRoot(coreConfig: CoreConfig): Promise<DynamicModule> {
    const testingModule: any[] = [];
    if (coreConfig.includeTestingModule) {
      testingModule.push(TestingModule);
    }
    return {
      module: AppModule,
      imports: testingModule     // Add dynamic module here
    };
  }
}


// export class AppModule implements NestModule {
//   configure(consumer: MiddlewareConsumer) {
//     consumer
//       .apply(MyMiddleware)
//       .forRoutes({ path: 'blogs', method: RequestMethod.POST });
//   }
// }
