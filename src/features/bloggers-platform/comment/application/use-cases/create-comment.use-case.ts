import { ContentDto } from '../../../posts/api/input/content.dto';
import { NotFoundDomainException } from '../../../../../core/exception/domain-exception';
import { CreateNewCommentDto } from '../../api/input/create-new-comment.dto';
import { Comment } from '../../domain/comment.entity';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { CommentRepository } from '../../infrastructure/comment.repository';
import { PostRepository } from '../../../posts/infrastructure/post.repository';
import { UserRepository } from '../../../../user-accounts/users/infrastructure/user.repository';
import { PostDocument } from '../../../posts/domain/post.entity';
import { UserDocument } from '../../../../user-accounts/users/domain/user.entity';

export class CreateCommentUseCaseCommand {
  constructor(public content: ContentDto, public postId: string, public userId: string) {
  }
}

@CommandHandler(CreateCommentUseCaseCommand)
export class CreateCommentUseCase implements ICommandHandler<CreateCommentUseCaseCommand>{
  constructor(private commentsRepository: CommentRepository,
              private postsRepository: PostRepository,
              private usersRepository: UserRepository,
              ){}

  async execute(command: CreateCommentUseCaseCommand): Promise<string>{
    const {content, postId, userId} = command
    const post: PostDocument | null = await this.postsRepository.getById(postId);
    if (!post) {
      throw NotFoundDomainException.create('if post with specified postId doesn\'t exists', 'postId')
    }

    const user: UserDocument | null = await this.usersRepository.findById(userId);
    if (!user) {
      throw NotFoundDomainException.create('if post with specified postId doesn\'t exists', 'userId')
    }

    const dto: CreateNewCommentDto = {
      content: content.content,
      userId: userId,
      loginUser: user.accountData.login,
      postId: postId
    }
    const comment = new Comment(dto)
    const commentId = await this.commentsRepository.create(comment)
    return commentId.toString()
  }
}