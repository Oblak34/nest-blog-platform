import { configModule } from './dynamic-config-module';
import { Module} from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UserAccountsModule } from './features/user-accounts/user-accounts.module';
import { MongooseModule } from '@nestjs/mongoose';
import { BloggersPlatformModule } from './features/bloggers-platform/bloggers-platform.module'



@Module({
  imports: [
    configModule,
    MongooseModule.forRoot(process.env.MONGODB_URI as string),
    UserAccountsModule,
    BloggersPlatformModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})


// export class AppModule implements NestModule {
//   configure(consumer: MiddlewareConsumer) {
//     consumer
//       .apply(MyMiddleware)
//       .forRoutes({ path: 'blogs', method: RequestMethod.POST });
//   }
// }

export class AppModule {}
