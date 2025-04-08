import { Test, TestingModuleBuilder } from '@nestjs/testing';
import { AppModule } from '../../src/app.module';
import { IMailService, MailService } from '../../src/mail/mail.service';
import { EmailServiceMock } from '../mock/email-service-mock';
import { appSetup } from '../../src/setup/app.setup';
import { Connection } from 'mongoose';
import { getConnectionToken, MongooseModule } from '@nestjs/mongoose';
import { UsersTestManager } from './users-test-manager';
import { AuthConfig } from '../../src/features/user-accounts/config/auth.config';
import { UserRepository } from '../../src/features/user-accounts/infrastructure/user.repository';
import { User, UserSchema } from '../../src/features/user-accounts/domain/user.entity';



// export const initSettings = async(
//   addSettingsToModuleBuilder?: (moduleBuilder: TestingModuleBuilder) => void) => {
//
//   const testingModuleBuilder: TestingModuleBuilder = Test.createTestingModule({
//     imports: [
//       AppModule,
//       MongooseModule.forFeature([{ name: User.name, schema: UserSchema }])
//     ],
//     providers: [UserRepository]
//   })
//     .overrideProvider(MailService)
//     .useClass(MockMailService)
//     .overrideProvider(AuthConfig)
//     .useValue({skipPasswordCheck: false })
//
//   if(addSettingsToModuleBuilder) {
//     addSettingsToModuleBuilder(testingModuleBuilder)
//   }
//
//   const testingAppModule = await testingModuleBuilder.compile();
//   const app = testingAppModule.createNestApplication();
//
//   appSetup((app))
//
//   await app.init();
//
//   const databaseConnection = app.get<Connection>(getConnectionToken())
//   const httpServer = app.getHttpServer()
//   const userTestManager = new UsersTestManager(app)
//
//   return {
//     app,
//     databaseConnection,
//     httpServer,
//     userTestManager
//   }
// }