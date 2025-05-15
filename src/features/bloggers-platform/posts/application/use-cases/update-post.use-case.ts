import { PostCreateAndBlogId } from '../../api/input/create-post-blogId.dto';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { PostDocument } from '../../domain/post.entity';
import { BlogRepository } from '../../../blogs/infrastructure/blog.repository';
import { PostRepository } from '../../infrastructure/post.repository';
import { BadRequestDomainException, NotFoundDomainException } from '../../../../../core/exception/domain-exception';
import { BlogDocument } from '../../../blogs/domain/blog.entity';

export class UpdatePostUseCaseCommand {
  constructor(public id: string, public dto: PostCreateAndBlogId) {
  }
}

@CommandHandler(UpdatePostUseCaseCommand)
export class UpdatePostUseCase implements ICommandHandler<UpdatePostUseCaseCommand> {
  constructor(private blogRepository: BlogRepository,
              private postRepository: PostRepository,) {
  }

  async execute(command: UpdatePostUseCaseCommand) : Promise<true|null>{
    const post: PostDocument | null = await this.postRepository.getById(command.id)
    if(!post){
      throw NotFoundDomainException.create(`post is id ${command.id} no exist`, 'postId')
    }

    const blog: BlogDocument | null = await this.blogRepository.findById(command.dto.blogId)
    if(!blog){
      throw BadRequestDomainException.create("inccorect blod id value", "blogId")
    }
    post.updated(command.dto)
    await this.postRepository.save(post)
    return true
  }
}