import { HttpStatus, INestApplication, Module } from '@nestjs/common';
import { PostTestManager } from '../posts/postsTestManager';
import { BlogsTestManager } from '../blogs/blogsTestManager';
import { Test } from '@nestjs/testing';
import { AppModule } from '../../src/app.module';
import { MailService } from '../../src/mail/mail.service';
import { MockMailService } from '../auth/registration.e2e-spec';
import { appSetup } from '../../src/setup/app.setup';
import { deleteAllData } from '../helpers/delete-all-data';
import { blogInstance } from '../blogs/blogs-dto';
import { postInstance } from '../posts/posts-dto';
import request from 'supertest';
import { GLOBAL_PREFIX } from '../../src/setup/global-prefix.setup';
import { CreateUserDto } from '../../src/features/user-accounts/users/api/input/create-user.dto';
import { user1, user2, user3, UsersTestManager } from '../helpers/users-test-manager';
import { CommentTestManager } from './commentTestManager';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';

const mockThrottlerGuard = {
  canActivate: jest.fn(() => true),
}
describe('/comments', () => {
  let app: INestApplication;
  let postTestManager: PostTestManager
  let blogsTestManager: BlogsTestManager
  let userTestManager: UsersTestManager
  let commentTestManager: CommentTestManager

  beforeAll(async () => {
    const moduleFixture = await Test.createTestingModule({
      imports: [AppModule]
    }).overrideProvider(MailService).useClass(MockMailService)
      .overrideGuard(ThrottlerGuard).useValue(mockThrottlerGuard)
      .compile()

    app = moduleFixture.createNestApplication()
    appSetup(app);
    await app.init()
    await deleteAllData(app);
    postTestManager = new PostTestManager(app)
    blogsTestManager = new BlogsTestManager(app)
    userTestManager = new UsersTestManager(app)
    commentTestManager = new CommentTestManager(app, blogsTestManager, userTestManager, postTestManager )
  })
  beforeEach(async () => {
    await deleteAllData(app);
  });
  afterAll(async () => {
    await app.close()
  })

  describe('POST /post{id}/comments', () => {
    it('201 create comment by post id', async () => {
      const createdBlog = await blogsTestManager.createBlog(blogInstance)
      const createdPost = await postTestManager.createPost(postInstance, createdBlog.id)
      const body: CreateUserDto = {
        login: 'Mary',
        password: 'qwerty',
        email: 'gmail@gmail.com',
      };
      await userTestManager.registrationUser(body)
      const response = await request(app.getHttpServer())
        .post(`/auth/login`)
        .set('User-Agent', 'Chrome')
        .send({
          loginOrEmail: body.login,
          password: body.password
        })
        .expect(HttpStatus.OK)

      const token = response.body.accessToken
      const createdComment = await request(app.getHttpServer())
        .post(`/posts/` + createdPost.id + '/comments')
        .set('Authorization', `Bearer ${token}`)
        .send({
          content: 'ij jijofij oj fo jfoj rfoj  jroj rj rfoir pok rp rfpkk p'
        })
        .expect(HttpStatus.CREATED)
    })
    it('400 If the inputModel has incorrect values', async () => {
      const createdBlog = await blogsTestManager.createBlog(blogInstance)
      const createdPost = await postTestManager.createPost(postInstance, createdBlog.id)
      const body: CreateUserDto = {
        login: 'Mary',
        password: 'qwerty',
        email: 'gmail@gmail.com',
      };
      await userTestManager.registrationUser(body)
      const response = await request(app.getHttpServer())
        .post(`/auth/login`)
        .set('User-Agent', 'Chrome')
        .send({
          loginOrEmail: body.login,
          password: body.password
        })
        .expect(HttpStatus.OK)

      const token = response.body.accessToken
      await request(app.getHttpServer())
        .post(`/posts/` + createdPost.id + '/comments')
        .set('Authorization', `Bearer ${token}`)
        .send({
          content: 'hello'   // мало символов
        })
        .expect(HttpStatus.BAD_REQUEST)
    })
    it('404 If post with specified postId doesn\'t exists', async () => {
      const createdBlog = await blogsTestManager.createBlog(blogInstance)
      await postTestManager.createPost(postInstance, createdBlog.id)
      const body: CreateUserDto = {
        login: 'Mary',
        password: 'qwerty',
        email: 'gmail@gmail.com',
      };
      await userTestManager.registrationUser(body)
      const response = await request(app.getHttpServer())
        .post(`/auth/login`)
        .set('User-Agent', 'Chrome')
        .send({
          loginOrEmail: body.login,
          password: body.password
        })
        .expect(HttpStatus.OK)

      const token = response.body.accessToken
      await request(app.getHttpServer())
        .post(`/posts/67ff85e1025044776b90b071/comments`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          content: 'helloj90 j iodjojodsij oj o jj oeij odj jo jdhe3fyedhwquidqhdgqwyg  hiuh iueei'
        })
        .expect(HttpStatus.NOT_FOUND)
    })
  })
  describe('GET /post{id}/comments', () => {
    it('200 get all comments by post id with sorted by content and sortDirection desc', async () => {
      const createdBlog = await blogsTestManager.createBlog(blogInstance)
      const createdPost = await postTestManager.createPost(postInstance, createdBlog.id)

      const text = 'Center father teaches mathematics, and my mother is a nurse at a big hospital'
      await userTestManager.registrationUser(user1)
      const loggined = await request(app.getHttpServer())
        .post(`/auth/login`)
        .set('User-Agent', 'Chrome')
        .send({
          loginOrEmail: user1.login,
          password: user1.password
        })
        .expect(HttpStatus.OK)

      const token = loggined.body.accessToken
      const createdComment = await request(app.getHttpServer())
        .post(`/posts/` + createdPost.id + '/comments')
        .set('Authorization', `Bearer ${token}`)
        .send({
          content: text
        })
        .expect(HttpStatus.CREATED)

      const text2 = 'Automobile two brothers and one sister, and I was born last.'
      await commentTestManager.registationAndLoginAndNewComment(user2, createdPost.id, text2)

      const text3 = 'Baraban have two brothers and one sister, and I was born last.'
      await commentTestManager.registationAndLoginAndNewComment(user3, createdPost.id, text3)

      const response = await request(app.getHttpServer())
        .get(`/posts/` + createdPost.id +  '/comments?sortBy=content&sortDirection=asc')
        .expect(HttpStatus.OK)

      expect(response.body.items.length).toBe(3)

      const array = response.body.items
      const test = array.map(el => {
        return el.content
      })
      const arrayText = [text, text2, text3].sort()

      expect(test).toEqual(arrayText)
    })
    it('400 If post for passed postId doesn\'t exist', async () => {
      const createdBlog = await blogsTestManager.createBlog(blogInstance)
      const createdPost = await postTestManager.createPost(postInstance, createdBlog.id)

      const text = 'Center father teaches mathematics, and my mother is a nurse at a big hospital'
      await userTestManager.registrationUser(user1)
      const loggined = await request(app.getHttpServer())
        .post(`/auth/login`)
        .set('User-Agent', 'Chrome')
        .send({
          loginOrEmail: user1.login,
          password: user1.password
        })
        .expect(HttpStatus.OK)

      const token = loggined.body.accessToken
      const createdComment = await request(app.getHttpServer())
        .post(`/posts/` + createdPost.id + '/comments')
        .set('Authorization', `Bearer ${token}`)
        .send({
          content: text
        })
        .expect(HttpStatus.CREATED)

      const text2 = 'Automobile two brothers and one sister, and I was born last.'
      await commentTestManager.registationAndLoginAndNewComment(user2, createdPost.id, text2)

      const response = await request(app.getHttpServer())
        .get(`/posts/67ff85e1025044776b90b077/comments?sortBy=content&sortDirection=asc`)
        .expect(HttpStatus.NOT_FOUND)
    })
  })
  describe('GET /comments/comments{id} ', () => {
    it('200 get comment by id success', async () => {
      const createdBlog = await blogsTestManager.createBlog(blogInstance)
      const createdPost = await postTestManager.createPost(postInstance, createdBlog.id)
      const body: CreateUserDto = {
        login: 'Mary',
        password: 'qwerty',
        email: 'gmail@gmail.com',
      };
      await userTestManager.registrationUser(body)
      const response = await request(app.getHttpServer())
        .post(`/auth/login`)
        .set('User-Agent', 'Chrome')
        .send({
          loginOrEmail: body.login,
          password: body.password
        })
        .expect(HttpStatus.OK)

      const token = response.body.accessToken
      const createdComment = await request(app.getHttpServer())
        .post(`/posts/` + createdPost.id + '/comments')
        .set('Authorization', `Bearer ${token}`)
        .send({
          content: 'ij jijofij oj fo jfoj rfoj  jroj rj rfoir pok rp rfpkk p'
        })
        .expect(HttpStatus.CREATED)

      const getCreatedCommentById = await request(app.getHttpServer())
        .get(`/comments/` + createdComment.body.id)
        .expect(HttpStatus.OK)

      expect(body.login).toBe(getCreatedCommentById.body.commentatorInfo.userLogin)
    })
    it('404 Not Found', async () => {
      const createdBlog = await blogsTestManager.createBlog(blogInstance)
      const createdPost = await postTestManager.createPost(postInstance, createdBlog.id)
      const body: CreateUserDto = {
        login: 'Mary',
        password: 'qwerty',
        email: 'gmail@gmail.com',
      };
      await userTestManager.registrationUser(body)
      const response = await request(app.getHttpServer())
        .post(`/auth/login`)
        .set('User-Agent', 'Chrome')
        .send({
          loginOrEmail: body.login,
          password: body.password
        })
        .expect(HttpStatus.OK)

      const token = response.body.accessToken
      const createdComment = await request(app.getHttpServer())
        .post(`/posts/` + createdPost.id + '/comments')
        .set('Authorization', `Bearer ${token}`)
        .send({
          content: 'ij jijofij oj fo jfoj rfoj  jroj rj rfoir pok rp rfpkk p'
        })
        .expect(HttpStatus.CREATED)

      const getCreatedCommentById = await request(app.getHttpServer())
        .get(`/comments/677d60a2aa20e34c2f4a03d7`)
        .expect(HttpStatus.NOT_FOUND)
    })
  })
  describe('PUT /comments/comments{id} ', () => {
    it('204 update comment success', async () => {
      const createdBlog = await blogsTestManager.createBlog(blogInstance)
      const createdPost = await postTestManager.createPost(postInstance, createdBlog.id)
      const body: CreateUserDto = {
        login: 'Mary',
        password: 'qwerty',
        email: 'gmail@gmail.com',
      };
      await userTestManager.registrationUser(body)
      const response = await request(app.getHttpServer())
        .post(`/auth/login`)
        .set('User-Agent', 'Chrome')
        .send({
          loginOrEmail: body.login,
          password: body.password
        })
        .expect(HttpStatus.OK)

      const token = response.body.accessToken
      const createdComment = await request(app.getHttpServer())
        .post(`/posts/` + createdPost.id + '/comments')
        .set('Authorization', `Bearer ${token}`)
        .send({
          content: 'ij jijofij oj fo jfoj rfoj  jroj rj rfoir pok rp rfpkk p'
        })
        .expect(HttpStatus.CREATED)

      const updatedText = 'Luck ain\'t enough, you\'ve got to make your own breaks'
      await request(app.getHttpServer())
        .put(`/comments/` + createdComment.body.id)
        .set('Authorization', `Bearer ${token}`)
        .send({
          content: updatedText
        })
        .expect(HttpStatus.NO_CONTENT)

      const updatedComment = await request(app.getHttpServer())
        .get(`/comments/` + createdComment.body.id)
        .expect(HttpStatus.OK)

      expect(updatedText).toBe(updatedComment.body.content)
    })
    it('400 If the inputModel has incorrect values', async () => {
        const createdBlog = await blogsTestManager.createBlog(blogInstance)
        const createdPost = await postTestManager.createPost(postInstance, createdBlog.id)
        const body: CreateUserDto = {
          login: 'Mary',
          password: 'qwerty',
          email: 'gmail@gmail.com',
        };
        await userTestManager.registrationUser(body)
        const response = await request(app.getHttpServer())
          .post(`/auth/login`)
          .set('User-Agent', 'Chrome')
          .send({
            loginOrEmail: body.login,
            password: body.password
          })
          .expect(HttpStatus.OK)

        const token = response.body.accessToken
        const createdComment = await request(app.getHttpServer())
          .post(`/posts/` + createdPost.id + '/comments')
          .set('Authorization', `Bearer ${token}`)
          .send({
            content: 'ij jijofij oj fo jfoj rfoj  jroj rj rfoir pok rp rfpkk p'
          })
          .expect(HttpStatus.CREATED)

        const updatedText = 'Luck ain\'t '  // в строке мало символов
        await request(app.getHttpServer())
          .put(`/comments/` + createdComment.body.id)
          .set('Authorization', `Bearer ${token}`)
          .send({
            content: updatedText
          })
          .expect(HttpStatus.BAD_REQUEST)
    })
    it('401 Unauthorized', async () => {
      const createdBlog = await blogsTestManager.createBlog(blogInstance)
      const createdPost = await postTestManager.createPost(postInstance, createdBlog.id)
      const body: CreateUserDto = {
        login: 'Mary',
        password: 'qwerty',
        email: 'gmail@gmail.com',
      };
      await userTestManager.registrationUser(body)
      const response = await request(app.getHttpServer())
        .post(`/auth/login`)
        .set('User-Agent', 'Chrome')
        .send({
          loginOrEmail: body.login,
          password: body.password
        })
        .expect(HttpStatus.OK)

      const token = response.body.accessToken
      const createdComment = await request(app.getHttpServer())
        .post(`/posts/` + createdPost.id + '/comments')
        .set('Authorization', `Bearer ${token}`)
        .send({
          content: 'ij jijofij oj fo jfoj rfoj  jroj rj rfoir pok rp rfpkk p'
        })
        .expect(HttpStatus.CREATED)

      const updatedText = 'Luck ain\'t '  // в строке мало символов
      await request(app.getHttpServer())
        .put(`/comments/` + createdComment.body.id)
        .set('Authorization', ``)   // empty token
        .send({
          content: updatedText
        })
        .expect(HttpStatus.UNAUTHORIZED)
    })
    it('403 If try edit the comment that is not your own', async () => {
      const createdBlog = await blogsTestManager.createBlog(blogInstance)
      const createdPost = await postTestManager.createPost(postInstance, createdBlog.id)
      const body: CreateUserDto = {
        login: 'Mary',
        password: 'qwerty',
        email: 'gmail@gmail.com',
      };
      await userTestManager.registrationUser(body)
      const response = await request(app.getHttpServer())
        .post(`/auth/login`)
        .set('User-Agent', 'Chrome')
        .send({
          loginOrEmail: body.login,
          password: body.password
        })
        .expect(HttpStatus.OK)

      const token = response.body.accessToken
      const createdComment = await request(app.getHttpServer())
        .post(`/posts/` + createdPost.id + '/comments')
        .set('Authorization', `Bearer ${token}`)
        .send({
          content: 'ij jijofij oj fo jfoj rfoj  jroj rj rfoir pok rp rfpkk p'
        })
        .expect(HttpStatus.CREATED)

      const body2: CreateUserDto = {
        login: 'John',
        password: 'qwerty',
        email: 'john111@gmail.com',
      };
      await userTestManager.registrationUser(body2)
      const response2 = await request(app.getHttpServer())
        .post(`/auth/login`)
        .set('User-Agent', 'Chrome')
        .send({
          loginOrEmail: body2.login,
          password: body2.password
        })
        .expect(HttpStatus.OK)

      const token2 = response2.body.accessToken

      const updatedText = 'Luck ain\'t enough, you\'ve got to make your own breaks'
      await request(app.getHttpServer())
        .put(`/comments/` + createdComment.body.id)
        .set('Authorization', `Bearer ${token2}`)   // отправляем токен другого юзера
        .send({
          content: updatedText
        })
        .expect(HttpStatus.FORBIDDEN)
    })
    it('404 Not Found', async () => {
      const createdBlog = await blogsTestManager.createBlog(blogInstance)
      const createdPost = await postTestManager.createPost(postInstance, createdBlog.id)
      const body: CreateUserDto = {
        login: 'Mary',
        password: 'qwerty',
        email: 'gmail@gmail.com',
      };
      await userTestManager.registrationUser(body)
      const response = await request(app.getHttpServer())
        .post(`/auth/login`)
        .set('User-Agent', 'Chrome')
        .send({
          loginOrEmail: body.login,
          password: body.password
        })
        .expect(HttpStatus.OK)

      const token = response.body.accessToken
      const createdComment = await request(app.getHttpServer())
        .post(`/posts/` + createdPost.id + '/comments')
        .set('Authorization', `Bearer ${token}`)
        .send({
          content: 'ij jijofij oj fo jfoj rfoj  jroj rj rfoir pok rp rfpkk p'
        })
        .expect(HttpStatus.CREATED)

      const updatedText = 'Luck ain\'t enough, you\'ve got to make your own breaks'
      await request(app.getHttpServer())
        .put(`/comments/677d60a2aa20e34c2f4a03d7`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          content: updatedText
        })
        .expect(HttpStatus.NOT_FOUND)
    })
  })
  describe('DELETE /comments/comments{id} ', () => {
    it('204 delete comment by id success', async () => {
      const createdBlog = await blogsTestManager.createBlog(blogInstance)
      const createdPost = await postTestManager.createPost(postInstance, createdBlog.id)
      const body: CreateUserDto = {
        login: 'Mary',
        password: 'qwerty',
        email: 'gmail@gmail.com',
      };
      await userTestManager.registrationUser(body)
      const response = await request(app.getHttpServer())
        .post(`/auth/login`)
        .set('User-Agent', 'Chrome')
        .send({
          loginOrEmail: body.login,
          password: body.password
        })
        .expect(HttpStatus.OK)

      const token = response.body.accessToken
      const createdComment = await request(app.getHttpServer())
        .post(`/posts/` + createdPost.id + '/comments')
        .set('Authorization', `Bearer ${token}`)
        .send({
          content: 'ij jijofij oj fo jfoj rfoj  jroj rj rfoir pok rp rfpkk p'
        })
        .expect(HttpStatus.CREATED)

      const getCreatedCommentById = await request(app.getHttpServer())
        .get(`/comments/` + createdComment.body.id)
        .expect(HttpStatus.OK)

      expect(body.login).toBe(getCreatedCommentById.body.commentatorInfo.userLogin)

      await request(app.getHttpServer())
        .delete(`/comments/` + createdComment.body.id)
        .set('Authorization', `Bearer ${token}`)
        .expect(HttpStatus.NO_CONTENT)

      await request(app.getHttpServer())
        .get(`/comments/` + createdComment.body.id)
        .expect(HttpStatus.NOT_FOUND)
    })
    it('401 Unauthorized', async () => {
      const createdBlog = await blogsTestManager.createBlog(blogInstance)
      const createdPost = await postTestManager.createPost(postInstance, createdBlog.id)
      const body: CreateUserDto = {
        login: 'Mary',
        password: 'qwerty',
        email: 'gmail@gmail.com',
      };
      await userTestManager.registrationUser(body)
      const response = await request(app.getHttpServer())
        .post(`/auth/login`)
        .set('User-Agent', 'Chrome')
        .send({
          loginOrEmail: body.login,
          password: body.password
        })
        .expect(HttpStatus.OK)

      const token = response.body.accessToken
      const createdComment = await request(app.getHttpServer())
        .post(`/posts/` + createdPost.id + '/comments')
        .set('Authorization', `Bearer ${token}`)
        .send({
          content: 'ij jijofij oj fo jfoj rfoj  jroj rj rfoir pok rp rfpkk p'
        })
        .expect(HttpStatus.CREATED)

      const getCreatedCommentById = await request(app.getHttpServer())
        .get(`/comments/` + createdComment.body.id)
        .expect(HttpStatus.OK)

      expect(body.login).toBe(getCreatedCommentById.body.commentatorInfo.userLogin)

      await request(app.getHttpServer())
        .delete(`/comments/` + createdComment.body.id)
        .set('Authorization', ``)
        .expect(HttpStatus.UNAUTHORIZED)
    })
    it('403 If try delete the comment that is not your own', async () => {
      const createdBlog = await blogsTestManager.createBlog(blogInstance)
      const createdPost = await postTestManager.createPost(postInstance, createdBlog.id)
      const body: CreateUserDto = {
        login: 'Mary',
        password: 'qwerty',
        email: 'gmail@gmail.com',
      };
      await userTestManager.registrationUser(body)
      const response = await request(app.getHttpServer())
        .post(`/auth/login`)
        .set('User-Agent', 'Chrome')
        .send({
          loginOrEmail: body.login,
          password: body.password
        })
        .expect(HttpStatus.OK)

      const token = response.body.accessToken
      const createdComment = await request(app.getHttpServer())
        .post(`/posts/` + createdPost.id + '/comments')
        .set('Authorization', `Bearer ${token}`)
        .send({
          content: 'ij jijofij oj fo jfoj rfoj  jroj rj rfoir pok rp rfpkk p'
        })
        .expect(HttpStatus.CREATED)

      const getCreatedCommentById = await request(app.getHttpServer())
        .get(`/comments/` + createdComment.body.id)
        .expect(HttpStatus.OK)

      expect(body.login).toBe(getCreatedCommentById.body.commentatorInfo.userLogin)

      const body1: CreateUserDto = {
        login: 'Denis',
        password: 'qwerty',
        email: 'denis@gmail.com',
      };
      await userTestManager.registrationUser(body1)
      const response1 = await request(app.getHttpServer())
        .post(`/auth/login`)
        .set('User-Agent', 'Chrome')
        .send({
          loginOrEmail: body1.login,
          password: body1.password
        })
        .expect(HttpStatus.OK)

      const token1 = response1.body.accessToken
      await request(app.getHttpServer())
        .delete(`/comments/` + createdComment.body.id)
        .set('Authorization', `Bearer ${token1}`)
        .expect(HttpStatus.FORBIDDEN)

    })
    it('404 Not Found', async () => {
      const createdBlog = await blogsTestManager.createBlog(blogInstance)
      const createdPost = await postTestManager.createPost(postInstance, createdBlog.id)
      const body: CreateUserDto = {
        login: 'Mary',
        password: 'qwerty',
        email: 'gmail@gmail.com',
      };
      await userTestManager.registrationUser(body)
      const response = await request(app.getHttpServer())
        .post(`/auth/login`)
        .set('User-Agent', 'Chrome')
        .send({
          loginOrEmail: body.login,
          password: body.password
        })
        .expect(HttpStatus.OK)

      const token = response.body.accessToken
      const createdComment = await request(app.getHttpServer())
        .post(`/posts/` + createdPost.id + '/comments')
        .set('Authorization', `Bearer ${token}`)
        .send({
          content: 'ij jijofij oj fo jfoj rfoj  jroj rj rfoir pok rp rfpkk p'
        })
        .expect(HttpStatus.CREATED)

      const getCreatedCommentById = await request(app.getHttpServer())
        .get(`/comments/` + createdComment.body.id)
        .expect(HttpStatus.OK)

      expect(body.login).toBe(getCreatedCommentById.body.commentatorInfo.userLogin)

      await request(app.getHttpServer())
        .delete(`/comments/` + createdComment.body.id)
        .set('Authorization', `Bearer ${token}`)
        .expect(HttpStatus.NO_CONTENT)

      await request(app.getHttpServer())
        .delete(`/comments/` + createdComment.body.id)
        .set('Authorization', `Bearer ${token}`)
        .expect(HttpStatus.NOT_FOUND)
    })
  })
})