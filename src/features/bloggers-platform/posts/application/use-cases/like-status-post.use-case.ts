import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { InjectModel } from '@nestjs/mongoose';
import { PostDocument } from '../../domain/post.entity';
import { PostRepository } from '../../infrastructure/post.repository';
import { NotFoundDomainException } from '../../../../../core/exception/domain-exception';
import { LikePostDocument, LikesModelType, LikesPost, Status } from '../../domain/likes-post.entity';
import { UserDocument } from '../../../../user-accounts/users/domain/user.entity';
import { PostLikesDto } from '../../api/input/post-likes.dto';
import { UserRepository } from '../../../../user-accounts/users/infrastructure/user.repository';

export class LikeStatusPostUseCaseCommand {
  constructor(public postId: string, public userId: string, public likeStatus: string) {
  }
}

@CommandHandler(LikeStatusPostUseCaseCommand)
export class LikeStatusPostUseCase implements ICommandHandler<LikeStatusPostUseCaseCommand> {
  constructor(private postRepository: PostRepository,
              @InjectModel(LikesPost.name) private LikesPost: LikesModelType,
              private userRepository: UserRepository) {
  }

  async execute(command: LikeStatusPostUseCaseCommand){
    const {postId, userId, likeStatus} = command
    const post: PostDocument | null = await this.postRepository.getById(postId)
    if(!post){
      throw NotFoundDomainException.create('If post with specified id doesn\'t exists', 'post')
    }

    const status: LikePostDocument | null = await this.LikesPost.findOne({postId: postId, userId: userId})
    if(!status){
      const user: UserDocument | null = await this.userRepository.findById(command.userId)
      if(!user){
        throw NotFoundDomainException.create('If user with specified id doesn\'t exists', 'user')
      }
      const status_dto: PostLikesDto = {
        userId,
        postId,
        status: likeStatus,
        login: user.accountData.login
      }
      const newStatus = new LikesPost(status_dto)
      if(likeStatus == Status.Like){
        post.extendedLikesInfo.likesCount++
        post.markModified('extendedLikesInfo')
        await this.postRepository.save(post)
      }
      if(likeStatus == Status.Dislike){
        post.extendedLikesInfo.dislikesCount++
        post.markModified('extendedLikesInfo')
        await this.postRepository.save(post)
      }
      await this.LikesPost.create(newStatus)
    }
    if(status){
      if(likeStatus == Status.None && status.status == 'Dislike'){
        post.extendedLikesInfo.dislikesCount--
        post.markModified('extendedLikesInfo')
      }
      if(likeStatus == Status.None && status.status == 'Like'){
        post.extendedLikesInfo.likesCount--
        post.markModified('extendedLikesInfo')
      }
      if(likeStatus == Status.Like && status.status == 'Dislike'){
        post.extendedLikesInfo.likesCount++
        post.extendedLikesInfo.dislikesCount--
        post.markModified('extendedLikesInfo')
      }
      if(likeStatus == Status.Dislike && status.status == 'Like'){
        post.extendedLikesInfo.likesCount--
        post.extendedLikesInfo.dislikesCount++
        post.markModified('extendedLikesInfo')
      }
      await this.postRepository.save(post)
      status.status = likeStatus
      await this.postRepository.save(status)
    }
  }

}