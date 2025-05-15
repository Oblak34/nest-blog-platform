import { PostCreateAndBlogId } from '../../api/input/create-post-blogId.dto';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { InjectModel } from '@nestjs/mongoose';
import { BlogDocument } from '../../../blogs/domain/blog.entity';
import { BlogRepository } from '../../../blogs/infrastructure/blog.repository';import { Post, PostDocument, PostModelType } from '../../domain/post.entity';
import { PostRepository } from '../../infrastructure/post.repository';

export class CreatePostUseCaseCommand {
  constructor(public dto: PostCreateAndBlogId) {
  }
}

@CommandHandler(CreatePostUseCaseCommand)
export class CreatePostUseCase implements ICommandHandler<CreatePostUseCaseCommand> {
  constructor(@InjectModel(Post.name) private PostModel: PostModelType,
              private blogRepository: BlogRepository,
              private postRepository: PostRepository,) {
  }
  async execute(command: CreatePostUseCaseCommand): Promise<string | null> {
    const blog: BlogDocument | null = await this.blogRepository.findById(command.dto.blogId)
    if(!blog) return null
    const post: PostDocument = await this.PostModel.createInstanse(command.dto, blog.name);
    await this.postRepository.save(post);
    return post._id.toString();
  }
}