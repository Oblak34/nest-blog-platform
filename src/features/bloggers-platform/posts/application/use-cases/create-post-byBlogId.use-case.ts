import { PostCreateAndBlogId } from '../../api/input/create-post-blogId.dto';
import { PostCreateDto } from '../../api/input/create-post.dto';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { InjectModel } from '@nestjs/mongoose';
import { Post, PostDocument, PostModelType } from '../../domain/post.entity';
import { BlogRepository } from '../../../blogs/infrastructure/blog.repository';
import { PostRepository } from '../../infrastructure/post.repository';
import { BlogDocument } from '../../../blogs/domain/blog.entity';

export class CreatePostByBlogdIdUseCaseCommand {
  constructor(public id: string, public dto: PostCreateDto) {
  }
}

@CommandHandler(CreatePostByBlogdIdUseCaseCommand)
export class CreatePostByBlogIdUseCase implements ICommandHandler<CreatePostByBlogdIdUseCaseCommand> {
  constructor(@InjectModel(Post.name) private PostModel: PostModelType,
              private blogRepository: BlogRepository,
              private postRepository: PostRepository,) {
  }

  async execute(command: CreatePostByBlogdIdUseCaseCommand): Promise<PostDocument | null>{
    const blog: BlogDocument | null = await this.blogRepository.findById(command.id)
    if(!blog) return null
    const dto: PostCreateAndBlogId = {
      ...command.dto,
      blogId: blog._id.toString()
    }
    const post = await this.PostModel.createInstanse(dto, blog.name)
    await this.postRepository.save(post);
    return post
  }

}