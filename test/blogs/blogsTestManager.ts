import { HttpStatus, INestApplication } from '@nestjs/common';
import request from 'supertest';
import { GLOBAL_PREFIX } from '../../src/setup/global-prefix.setup';
import { BlogCreateDto } from '../../src/features/bloggers-platform/blogs/api/input/create-blog.dto';
import { blogsArray } from './blogs-dto';
import { delay } from '../helpers/delay';
import { PostCreateDto } from '../../src/features/bloggers-platform/posts/api/input/create-post.dto';
import { PostModelType } from '../../src/features/bloggers-platform/posts/domain/post.entity';


export class BlogsTestManager {
  constructor(private app: INestApplication) {}

  async createBlog(createBlog: BlogCreateDto, statusCode: number = HttpStatus.CREATED){
    const response = await request(this.app.getHttpServer())
      .post(`/blogs`)
      .send(createBlog)
      .auth('admin', 'qwerty')
      .expect(statusCode)
    return response.body
  }
  async createManyBlogs(array){
    for(let i = 0; i < array.length; i++){
      await delay(50)
      this.createBlog(array[i])
    }
    return Promise.all
  }

  async createPostById(blogId: string, post: PostCreateDto): Promise<PostModelType> {
    const response =  await request(this.app.getHttpServer())
      .post(`/blogs/`+ blogId + '/posts')
      .auth('admin', 'qwerty')
      .send(post)
      .expect(HttpStatus.CREATED)
    return response.body
  }
}

