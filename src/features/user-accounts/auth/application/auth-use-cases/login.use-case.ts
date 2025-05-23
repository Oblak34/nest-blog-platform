import { Command, CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { JwtService } from '@nestjs/jwt';
import {v4 as uuidv4} from "uuid";
import jwt from "jsonwebtoken"
import { UserContextDto } from '../../../guards/dto/user-context.dto';
import { AuthSession, AuthSessionType } from '../../../sessions/domain/session.entity';
import { InjectModel } from '@nestjs/mongoose';
import { Inject } from '@nestjs/common';
import {
  ACCESS_TOKEN_STRATEGY_INJECT_TOKEN,
  REFRESH_TOKEN_STRATEGY_INJECT_TOKEN,
} from '../../../constants/auth-tokens.inject-constans';

export class LoginUseCaseCommand{
  constructor(public dto: UserContextDto) {
  }
}

@CommandHandler(LoginUseCaseCommand)
export class LoginUseCase implements ICommandHandler<LoginUseCaseCommand> {
  constructor(private jwtService: JwtService,
              @InjectModel (AuthSession.name) private authSessionModel: AuthSessionType,
              @Inject(ACCESS_TOKEN_STRATEGY_INJECT_TOKEN) private accessTokenContext: JwtService,
              @Inject(REFRESH_TOKEN_STRATEGY_INJECT_TOKEN) private refreshTokenContext: JwtService,) {
  }

  async execute(command: LoginUseCaseCommand): Promise<{ accessToken: string, refreshToken: string }>{
    const { userId, ip, device } = command.dto;

    const accessToken: string = await this.accessTokenContext.sign({ userId: userId })

    const deviceId = uuidv4()
    const refreshToken: string = await this.refreshTokenContext.sign({ userId: userId, deviceId: deviceId })


    const payload = jwt.verify(refreshToken, 'jwt-secret') as {userId: string, deviceId: string, iat: number, exp: number}
    const iat_Date = new Date(payload.iat * 1000).toISOString()
    const exp_Date = new Date(payload.exp * 1000).toISOString()

    const sessionDto = {
      user_id: payload.userId,
      ip: ip,
      iat: iat_Date,
      exp: exp_Date,
      device: device,
      device_id: payload.deviceId
    }

    const session = new AuthSession(sessionDto)
    const ses = await this.authSessionModel.create(session)
    await ses.save()

    return {
      accessToken,
      refreshToken
    };
  }
}

























//
// Received:
// {
//   "pagesCount":1,
//   "page":1,
//   "pageSize":10,
//   "totalCount":6,
//   "items":
//   [
//     {
//       "id":"681b5427586d64f0f1ed3945",
//       "title":"post title",
//       "shortDescription":"description",
//       "content":"new post content",
//       "blogId":"681b5423586d64f0f1ed3923",
//       "blogName":"new blog",
//       "createdAt":"2025-05-07T12:37:59.271Z",
//       "extendedLikesInfo":
//         {
//           "likesCount":1,
//           "dislikesCount":1,
//           "myStatus":"Like",
//           "newestLikes":
//             [
//               {
//                 "addedAt":"2025-05-07T12:38:07.724Z",
//                 "userId":"681b540c586d64f0f1ed3896",
//                 "login":"747lg"
//               }
//             ]
//         }
//         },
//
//     {
//       "id":"681b5426586d64f0f1ed393f",
//       "title":"post title",
//       "shortDescription":"description",
//       "content":"new post content",
//       "blogId":"681b5423586d64f0f1ed3923",
//       "blogName":"new blog",
//       "createdAt":"2025-05-07T12:37:58.590Z",
//       "extendedLikesInfo":
//         {
//           "likesCount":1,
//           "dislikesCount":1,
//           "myStatus":"None",
//           "newestLikes":
//             [
//               {
//                 "addedAt":"2025-05-07T12:38:06.341Z",
//                 "userId":"681b540d586d64f0f1ed389a",
//                 "login":"748lg"
//               }
//             ]
//         }
//         },
//
//     {
//       "id":"681b5425586d64f0f1ed3939",
//       "title":"post title",
//       "shortDescription":"description",
//       "content":"new post content",
//       "blogId":"681b5423586d64f0f1ed3923",
//       "blogName":"new blog",
//       "createdAt":"2025-05-07T12:37:57.912Z",
//       "extendedLikesInfo":
//         {
//           "likesCount":4,
//           "dislikesCount":0,
//           "myStatus":"Like",
//           "newestLikes":
//             [
//               {
//                 "addedAt":"2025-05-07T12:38:05.655Z",
//                 "userId":"681b540e586d64f0f1ed389e",
//                 "login":"749lg"
//               }
//             ]
//         }
//     },
//
//     {
//       "id":"681b5425586d64f0f1ed3933",
//       "title":"post title",
//       "shortDescription":"description",
//       "content":"new post content",
//       "blogId":"681b5423586d64f0f1ed3923",
//       "blogName":"new blog",
//       "createdAt":"2025-05-07T12:37:57.225Z",
//       "extendedLikesInfo":
//         {
//           "likesCount":0,
//           "dislikesCount":1,
//           "myStatus":"Dislike",
//           "newestLikes":[]
//         }
//     },
//
//     {
//       "id":"681b5424586d64f0f1ed392d",
//       "title":"post title",
//       "shortDescription":"description",
//       "content":"new post content",
//       "blogId":"681b5423586d64f0f1ed3923",
//       "blogName":"new blog",
//       "createdAt":"2025-05-07T12:37:56.533Z",
//       "extendedLikesInfo":
//         {
//           "likesCount":2,
//           "dislikesCount":0,
//           "myStatus":"None",
//           "newestLikes":[]
//         }
//     },
//
//     {
//       "id":"681b5423586d64f0f1ed3927",
//       "title":"post title",
//       "shortDescription":"description",
//       "content":"new post content",
//       "blogId":"681b5423586d64f0f1ed3923",
//       "blogName":"new blog",
//       "createdAt":"2025-05-07T12:37:55.854Z",
//       "extendedLikesInfo":
//         {
//           "likesCount":2,
//           "dislikesCount":0,
//           "myStatus":"Like",
//           "newestLikes":[]
//         }
//     }
//   ]
// }
//

















