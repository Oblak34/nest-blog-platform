import { HttpStatus, INestApplication } from '@nestjs/common';
import { PostCreateDto } from '../../src/features/bloggers-platform/posts/api/input/create-post.dto';
import request from 'supertest';



export class PostTestManager {
  constructor(private app: INestApplication) {
  }

  async createPost(createPost: PostCreateDto, blogId: string, statusCode: number = HttpStatus.CREATED ){
    const dto = {
      ...createPost,
      blogId
    }
    const response = await request(this.app.getHttpServer())
      .post(`/posts`)
      .send(dto)
      .auth('admin', 'qwerty')
      .expect(statusCode)
    return response.body
  }
  async userSetStatus(post_id: string, token: string, status: string){
    await request(this.app.getHttpServer())
      .put(`/posts/` + post_id + '/like-status')
      .set('Authorization', `Bearer ${token}`)
      .send({ likeStatus: status })
      .expect(HttpStatus.NO_CONTENT)
  }
  async checkStatusByUser(post_id: string, token: string, status: string){
    const statusUser = await request(this.app.getHttpServer())
      .get(`/posts/` + post_id)
      .set('Authorization', `Bearer ${token}`)
      .expect(HttpStatus.OK)
    expect(statusUser.body.extendedLikesInfo.myStatus).toBe(status)
  }
}