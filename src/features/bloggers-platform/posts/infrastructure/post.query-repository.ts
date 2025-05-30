import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Post, PostDocument, PostModelType } from '../domain/post.entity';
import { GetPostsQueryParams } from '../api/input/get-posts-query-params.input-dto';
import { LikePostDocument, LikesModelType, LikesPost, Status } from '../domain/likes-post.entity';
import { PaginatedViewDto } from '../../../../core/dto/base.paginated.view-dto';
import { NotFoundDomainException } from '../../../../core/exception/domain-exception';

@Injectable()
export class PostQueryRepository {
  constructor(@InjectModel(Post.name) private PostModel: PostModelType,
              @InjectModel(LikesPost.name) private LikesModel: LikesModelType) {}
  async findById(id: string, user_id?: string){
    const post: PostDocument | null = await this.PostModel.findOne({_id: id, deletedAt: null})
    if (!post) {
      throw NotFoundDomainException.create('Post this is id no exist', 'Post id')
    }
    const myStatuses = await this.LikesModel.find({userId: user_id, postId: id}).lean()
    const dict: Record<string, LikePostDocument> = myStatuses.reduce((acc, myStatus) => {
      acc[myStatus.postId] = { ...myStatus }
      return acc
    }, {} )

    const postsLikes =  await this.LikesModel.find({postId: id, status: Status.Like})
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
  async getAllPosts(query: GetPostsQueryParams, user_id?: string){
    const posts = await this.PostModel.find({deletedAt: null})
      .sort({[query.sortBy]: query.sortDirection})
      .skip(query.calculateSkip())
      .limit(query.pageSize)

    const totalCount: number = await this.PostModel.countDocuments()
    const postIds: string[] = posts.map(p => p.id.toString())
    const myStatus = await this.LikesModel.find({userId: user_id, postId: {$in: postIds}}).lean()

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
      page: query.pageNumber,
      size: query.pageSize,
    });
  }
  async getAllPostsByBlogId(query: GetPostsQueryParams, blogId: string, user_id?: string){
    const posts = await this.PostModel.find({blogId: blogId, deletedAt: null})
      .sort({[query.sortBy]: query.sortDirection})
      .skip(query.calculateSkip())
      .limit(query.pageSize)

    const totalCount: number = await this.PostModel.countDocuments({blogId: blogId})
    const postIds: string[] = posts.map(p => p.id.toString())
    const myStatus = await this.LikesModel.find({userId: user_id, postId: {$in: postIds}}).lean()
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
