import { CreateUserDto } from '../../src/features/user-accounts/users/api/input/create-user.dto';
import request from 'supertest';
import { GLOBAL_PREFIX } from '../../src/setup/global-prefix.setup';
import { HttpStatus, INestApplication } from '@nestjs/common';
import { user1, UsersTestManager } from '../helpers/users-test-manager';
import { BlogsTestManager } from '../blogs/blogsTestManager';
import { PostTestManager } from '../posts/postsTestManager';
import { BlogCreateDto } from '../../src/features/bloggers-platform/blogs/api/input/create-blog.dto';
import { PostCreateDto } from '../../src/features/bloggers-platform/posts/api/input/create-post.dto';

export class CommentTestManager {
  constructor(private app: INestApplication,
              protected blogsTestManager: BlogsTestManager,
              protected userTestManager: UsersTestManager,
              protected postTestManager: PostTestManager) {}
  async createComment(blogInstance: BlogCreateDto, postInstance: PostCreateDto, userInstanse: CreateUserDto, text: string){
    const createdBlog = await this.blogsTestManager.createBlog(blogInstance)
    const createdPost = await this.postTestManager.createPost(postInstance, createdBlog.id)

    await this.userTestManager.registrationUser(userInstanse)
    const response = await request(this.app.getHttpServer())
      .post(`/${GLOBAL_PREFIX}/auth/login`)
      .send({
        loginOrEmail: userInstanse.login,
        password: userInstanse.password
      })
      .expect(HttpStatus.OK)

    const token = response.body.accessToken
    const createdComment = await request(this.app.getHttpServer())
      .post(`/${GLOBAL_PREFIX}/posts/` + createdPost.id + '/comments')
      .set('Authorization', `Bearer ${token}`)
      .send({
        content: text
      })
      .expect(HttpStatus.CREATED)

    return createdComment.body
  }
  async registationAndLoginAndNewComment(user: CreateUserDto, postId: string, text: string){
    await this.userTestManager.registrationUser(user)
    const loggined = await request(this.app.getHttpServer())
      .post(`/auth/login`)
      .set('User-Agent', 'Chrome')
      .send({
        loginOrEmail: user1.login,
        password: user1.password
      })
      .expect(HttpStatus.OK)

    const token = loggined.body.accessToken
    const createdComment = await request(this.app.getHttpServer())
      .post(`/posts/` + postId + '/comments')
      .set('Authorization', `Bearer ${token}`)
      .send({
        content: text
      })
      .expect(HttpStatus.CREATED)
  }
}