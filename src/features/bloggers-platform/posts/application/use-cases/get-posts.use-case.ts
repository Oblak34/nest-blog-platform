import { GetPostsQueryParams } from '../../api/input/get-posts-query-params.input-dto';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { InjectModel } from '@nestjs/mongoose';
import { Post, PostModelType } from '../../domain/post.entity';
import { LikePostDocument, LikesModelType, LikesPost, Status } from '../../domain/likes-post.entity';
import { PaginatedViewDto } from '../../../../../core/dto/base.paginated.view-dto';

export class GetAllPostsUseCaseCommand {
  constructor(public query: GetPostsQueryParams, public userId: string | undefined) {
  }
}

@QueryHandler(GetAllPostsUseCaseCommand)
export class GetAllPostsUseCase implements IQueryHandler<GetAllPostsUseCaseCommand> {
  constructor(@InjectModel(Post.name) private PostModel: PostModelType,
              @InjectModel(LikesPost.name) private LikesModel: LikesModelType) {
  }

  async execute(command: GetAllPostsUseCaseCommand){
    const posts = await this.PostModel.find({deletedAt: null})
      .sort({[command.query.sortBy]: command.query.sortDirection})
      .skip(command.query.calculateSkip())
      .limit(command.query.pageSize)

    const totalCount: number = await this.PostModel.countDocuments()
    const postIds: string[] = posts.map(p => p.id.toString())
    const myStatus = await this.LikesModel.find({userId: command.userId, postId: {$in: postIds}}).lean()

    const dict: Record<string, LikePostDocument> = myStatus.reduce((acc, myStatus) => {
      acc[myStatus.postId] = {...myStatus}
      return acc
    }, {})

    const likes = await  this.LikesModel.find({postId: postIds, status: Status.Like})
      .sort({createdAt: -1}).lean()

    const ddict: Record<string, {
      login: string;
      userId: string;
      addedAt: string;
    }[]> = likes.reduce((acc, like) => {

      if(!acc[ like.postId.toString() ]) {
        acc[like.postId.toString()] = []
      }

      if(acc[like.postId.toString()].length < 3){
        const mapLike = {
          addedAt: like.createdAt,
          userId: like.userId,
          login: like.login,
        }

        acc[like.postId.toString()].push(mapLike)
      }
      return acc
    }, {})

    const items = posts.map(post => {
      const status = dict[post._id.toString()]
      const likesArr = ddict[post._id.toString()] ?? []

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
          newestLikes: likesArr
        }
      }
    })

    return PaginatedViewDto.mapToView({
      items,
      totalCount,
      page: command.query.pageNumber,
      size: command.query.pageSize,
    });
  }
}