import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { InjectModel } from '@nestjs/mongoose';
import { Post, PostModelType } from '../../domain/post.entity';
import { LikePostDocument, LikesModelType, LikesPost, Status } from '../../domain/likes-post.entity';
import { PaginatedViewDto } from '../../../../../core/dto/base.paginated.view-dto';
import { GetPostsQueryParams } from '../../api/input/get-posts-query-params.input-dto';

export class GetPostsByBlogIdUseCaseCommand {
  constructor(public query: GetPostsQueryParams, public blogId: string, public userId: string | undefined) {
  }
}

@QueryHandler(GetPostsByBlogIdUseCaseCommand)
export class GetPostsByBlogIdUseCase implements IQueryHandler<GetPostsByBlogIdUseCaseCommand> {
  constructor(@InjectModel(Post.name) private PostModel: PostModelType,
              @InjectModel(LikesPost.name) private LikesModel: LikesModelType) {
  }

  async execute(command: GetPostsByBlogIdUseCaseCommand){
    const { query, blogId, userId} = command
    const posts = await this.PostModel.find({blogId: blogId, deletedAt: null})
      .sort({[query.sortBy]: query.sortDirection})
      .skip(query.calculateSkip())
      .limit(query.pageSize)

    const totalCount: number = await this.PostModel.countDocuments({blogId: blogId})
    const postIds: string[] = posts.map(p => p.id.toString())
    const myStatus = await this.LikesModel.find({userId: userId, postId: {$in: postIds}}).lean()
    const dict: Record<string, LikePostDocument> = myStatus.reduce((acc, myStatus) => {
      acc[myStatus.postId] = {...myStatus}
      return acc
    }, {})

    const likes = await  this.LikesModel.find({postId: postIds, status: Status.Like})
      .sort({createdAt: -1}).lean()


    console.log('likes  ', likes)

    const ddict: Record<string, {
      addedAt: string;
      userId: string;
      login: string;
    }[]> = likes.reduce((acc, like) => {
      if(!acc[like.postId.toString()]){
        acc[like.postId.toString()] = []
      }

      if(acc[like.postId.toString()].length < 3){
        const mapLike = {
          addedAt: like.createdAt,
          userId: like.userId,
          login: like.login
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
      page: query.pageNumber,
      size: query.pageSize,
    });
  }
}