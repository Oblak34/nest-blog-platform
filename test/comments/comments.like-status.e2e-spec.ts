import { HttpStatus, INestApplication } from '@nestjs/common';
import { PostTestManager } from '../posts/postsTestManager';
import { BlogsTestManager } from '../blogs/blogsTestManager';
import { user1, user2, UsersTestManager } from '../helpers/users-test-manager';
import { Test } from '@nestjs/testing';
import { AppModule } from '../../src/app.module';
import { MailService } from '../../src/mail/mail.service';
import { MockMailService } from '../auth/registration.e2e-spec';
import { appSetup } from '../../src/setup/app.setup';
import { deleteAllData } from '../helpers/delete-all-data';
import { blogInstance } from '../blogs/blogs-dto';
import { postInstance } from '../posts/posts-dto';
import { CreateUserDto } from '../../src/features/user-accounts/users/api/input/create-user.dto';
import request from 'supertest';
import { GLOBAL_PREFIX } from '../../src/setup/global-prefix.setup';

let user1_token
let user2_token
let post_id
let commentId

describe('/comments', () => {
  let app: INestApplication;
  let postTestManager: PostTestManager
  let blogsTestManager: BlogsTestManager
  let userTestManager: UsersTestManager

  beforeAll(async () => {
    const moduleFixture = await Test.createTestingModule({
      imports: [AppModule]
    }).overrideProvider(MailService).useClass(MockMailService)
      .compile()

    app = moduleFixture.createNestApplication()
    appSetup(app);
    await app.init()
    await deleteAllData(app);
    postTestManager = new PostTestManager(app)
    blogsTestManager = new BlogsTestManager(app)
    userTestManager = new UsersTestManager(app)
  })
  afterAll(async () => {
    await app.close()
  })

  describe('PUT /comments/comments{id}/like-status ', () => {

    //1 создаем пользователя 1 и логиним ( user1_token = login.body.accessToken )
    //2 создаем пользователя 2 и логиним ( user2_token = login.body.accessToken )
    //3 создаем коментарий ( coomentID) пользователем 1 и лайкаем его ( запрашиваем по id 1 => stastus like, id 2 => status none)
    //4  dislike comment user 1 => запрашиваем user 1 ( status dislike, user 2 status none)
    //5 none comment user 1 => user 1 status none, user 2 status none
    //6 dislike comment user 1 и like comment user 2 ( user 1 => status dislike, user 2 => status like )
    //7 запрашиваем комментарий без токена ( status none )

    describe('create user1 and login', () => {
      it('create user1 and login', async () => {
        const createdBlog = await blogsTestManager.createBlog(blogInstance)
        const createdPost = await postTestManager.createPost(postInstance, createdBlog.id)
        post_id = createdPost.id
        const tokenUser1 = await userTestManager.createUserAndLogin(user1)
        user1_token = tokenUser1.accessToken
      })
    })
    describe('create user2 and login', () => {
      it('create user2 and login', async () => {
        const tokenUser2 = await userTestManager.createUserAndLogin(user2)
        user2_token = tokenUser2.accessToken
      })
    })
    describe('create comment by user1 and like it', () => {
      it('create comment by user1', async () => {
        const createdComment = await request(app.getHttpServer())
          .post(`/posts/` + post_id + '/comments')
          .set('Authorization', `Bearer ${user1_token}`)
          .send({
            content: 'ij jijofij oj fo jfoj rfoj  jroj rj rfoir pok rp rfpkk p'
          })
          .expect(HttpStatus.CREATED)

        commentId = createdComment.body.id
      })
      it('user1 liked comment', async () => {
        await request(app.getHttpServer())
          .put(`/comments/` + commentId + '/like-status')
          .set('Authorization', `Bearer ${user1_token}`)
          .send({ likeStatus: 'Like' })
          .expect(HttpStatus.NO_CONTENT)
      })
      it('id 1 => status like, id 2 => status none', async () => {
        const comment = await request(app.getHttpServer())
          .get(`/comments/` + commentId)
          .set('Authorization', `Bearer ${user1_token}`)
          .expect(HttpStatus.OK)
        expect(comment.body.likesInfo.myStatus).toBe('Like')

        const fcomment = await request(app.getHttpServer())
          .get(`/comments/` + commentId)
          .set('Authorization', `Bearer ${user2_token}`)
          .expect(HttpStatus.OK)
        expect(fcomment.body.likesInfo.myStatus).toBe('None')
      })
    })
    describe('dislike  comment user1', () => {
      it('dislike comment user1', async () => {
        await request(app.getHttpServer())
          .put(`/comments/` + commentId + '/like-status')
          .set('Authorization', `Bearer ${user1_token}`)
          .send({ likeStatus: 'Dislike' })
          .expect(HttpStatus.NO_CONTENT)
      })
      it('get status-like user1', async () => {
        const comment = await request(app.getHttpServer())
          .get(`/comments/` + commentId)
          .set('Authorization', `Bearer ${user1_token}`)
          .expect(HttpStatus.OK)
        expect(comment.body.likesInfo.myStatus).toBe('Dislike')
      })
      it('get status-like user2', async () => {
        const comment = await request(app.getHttpServer())
          .get(`/comments/` + commentId)
          .set('Authorization', `Bearer ${user2_token}`)
          .expect(HttpStatus.OK)
        expect(comment.body.likesInfo.myStatus).toBe('None')
      })
    })
    describe('Get none-status comment user1', () => {
      it('none comment user1', async () => {
        await request(app.getHttpServer())
          .put(`/comments/` + commentId + '/like-status')
          .set('Authorization', `Bearer ${user1_token}`)
          .send({ likeStatus: 'None' })
          .expect(HttpStatus.NO_CONTENT)
      })
      it('get status-like user1', async () => {
        const comment = await request(app.getHttpServer())
          .get(`/comments/` + commentId)
          .set('Authorization', `Bearer ${user1_token}`)
          .expect(HttpStatus.OK)
        expect(comment.body.likesInfo.myStatus).toBe('None')
      })
      it('get status-like user2', async () => {
        const comment = await request(app.getHttpServer())
          .get(`/comments/` + commentId)
          .set('Authorization', `Bearer ${user2_token}`)
          .expect(HttpStatus.OK)
        expect(comment.body.likesInfo.myStatus).toBe('None')
      })
    })
    describe('dislike comment user1 и like comment user2', () => {
      it('dislike comment user1', async () => {
        await request(app.getHttpServer())
          .put(`/comments/` + commentId + '/like-status')
          .set('Authorization', `Bearer ${user1_token}`)
          .send({ likeStatus: 'Dislike' })
          .expect(HttpStatus.NO_CONTENT)
      })
      it('like comment user2', async () => {
        await request(app.getHttpServer())
          .put(`/comments/` + commentId + '/like-status')
          .set('Authorization', `Bearer ${user2_token}`)
          .send({ likeStatus: 'Like' })
          .expect(HttpStatus.NO_CONTENT)
      })
      it('get status-like user1', async () => {
        const comment = await request(app.getHttpServer())
          .get(`/comments/` + commentId)
          .set('Authorization', `Bearer ${user1_token}`)
          .expect(HttpStatus.OK)
        expect(comment.body.likesInfo.myStatus).toBe('Dislike')
      })
      it('get status-like user2', async () => {
        const comment = await request(app.getHttpServer())
          .get(`/comments/` + commentId)
          .set('Authorization', `Bearer ${user2_token}`)
          .expect(HttpStatus.OK)
        expect(comment.body.likesInfo.myStatus).toBe('Like')
      })
    })
    describe('requesting a comment without a token, check status-like (status: None)', () => {
      it('requesting a comment without a token', async () => {
        const comment = await request(app.getHttpServer())
          .get(`/comments/` + commentId)
          .expect(HttpStatus.OK)
        expect(comment.body.likesInfo.myStatus).toBe('None')
      })
    })
  })
})