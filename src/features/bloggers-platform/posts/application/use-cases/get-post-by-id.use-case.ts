import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { InjectModel } from '@nestjs/mongoose';
import { Post, PostDocument, PostModelType } from '../../domain/post.entity';
import { LikePostDocument, LikesModelType, LikesPost, Status } from '../../domain/likes-post.entity';
import { NotFoundDomainException } from '../../../../../core/exception/domain-exception';

export class GetPostByIdUseCaseCommand {
  constructor(public postId: string, public userId: string | undefined) {
  }
}

@QueryHandler(GetPostByIdUseCaseCommand)
export class GetPostByIdUseCase implements IQueryHandler<GetPostByIdUseCaseCommand> {
  constructor(@InjectModel(Post.name) private PostModel: PostModelType,
              @InjectModel(LikesPost.name) private LikesModel: LikesModelType) {
  }

  async execute(command: GetPostByIdUseCaseCommand){
    const post: PostDocument | null = await this.PostModel.findOne({_id: command.postId, deletedAt: null})
    if (!post) {
      throw NotFoundDomainException.create('Post this is id no exist', 'Post id')
    }
    const myStatuses = await this.LikesModel.find({userId: command.userId, postId: command.postId}).lean()
    const dict: Record<string, LikePostDocument> = myStatuses.reduce((acc, myStatus) => {
      acc[myStatus.postId] = { ...myStatus }
      return acc
    }, {} )

    const postsLikes =  await this.LikesModel.find({postId: command.postId, status: Status.Like})
      .sort({createdAt:-1})
      .limit(3)
      .lean()

    const ddict: Record<string, {
      login: string;
      userId: string;
      addedAt: string;
    }[]> =  postsLikes.reduce((acc, like) =>{
      if(!acc[like.postId.toString()]){
        acc[like.postId.toString()] = []
      }

      if(acc[like.postId.toString()].length < 3){
        const mapLike = {
          login: like.login,
          userId: like.userId,
          addedAt: like.createdAt
        }

        acc[like.postId.toString()].push(mapLike)
      }
      return acc
    }, {})

    const status = dict[post._id.toString()]
    const likesArray = ddict[post._id.toString()] ?? []

    return {
      id: post._id.toString(),
      title: post.title,
      shortDescription: post.shortDecription,
      content: post.content,
      blogId: post.blogId,
      blogName: post.blogName,
      createdAt: post.createdAt,
      extendedLikesInfo: {
        likesCount: post.extendedLikesInfo.likesCount,
        dislikesCount: post.extendedLikesInfo.dislikesCount,
        myStatus: status ? status.status : Status.None,
        newestLikes: likesArray
      }
    }
  }
}
