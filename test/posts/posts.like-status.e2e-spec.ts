import { HttpStatus, INestApplication } from '@nestjs/common';
import { PostTestManager } from './postsTestManager';
import { BlogsTestManager } from '../blogs/blogsTestManager';
import { user1, user2, user3, user4, UsersTestManager } from '../helpers/users-test-manager';
import { Test } from '@nestjs/testing';
import { AppModule } from '../../src/app.module';
import { MailService } from '../../src/mail/mail.service';
import { MockMailService } from '../auth/registration.e2e-spec';
import { appSetup } from '../../src/setup/app.setup';
import { deleteAllData } from '../helpers/delete-all-data';
import request from 'supertest';
import { GLOBAL_PREFIX } from '../../src/setup/global-prefix.setup';
import { blogInstance } from '../blogs/blogs-dto';
import { postInstance } from './posts-dto';

let user1_token
let user2_token
let user3_token
let user4_token
let post_id

describe('/posts', () => {
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

  describe('PUT /posts/posts{id}/like-status ', () => {

    //1 создаем user1, user2, user3, user4 и логиним их
    // ( user1_token = login1.body.accessToken )
    // ( user2_token = login2.body.accessToken )
    // ( user3_token = login3.body.accessToken)
    // ( user4_token = login4.body.accessToken)
    //2 создаем  пост и user1 его лайкает( запрашиваем по id 1 => stastus like, остальные users => status none)
    //3 user2 ставит дизлайк (id 1 => status like, newestLikes => 1 like (user1); id 2 => stastus dislike, остальные users => status none)
    //4 user1 убирает лайк (id 2 => stastus dislike, остальные users => status none)
    //5 user3 ставит дизлайк, user2 убирает dislike (id 3 => set dislike, id 2 => set None  остальные users => status none)
    //6 все users ставят like (newestLikes => 3 like (последние 3)) и запрашиваем пост без токена ( mystatus none )

    describe('create users and login', () => {
      it('create users and login', async () => {
        const tokenUser1 = await userTestManager.createUserAndLogin(user1)
        user1_token = tokenUser1.accessToken
        const tokenUser2 = await userTestManager.createUserAndLogin(user2)
        user2_token = tokenUser2.accessToken
        const tokenUser3 = await userTestManager.createUserAndLogin(user3)
        user3_token = tokenUser3.accessToken
        const tokenUser4 = await userTestManager.createUserAndLogin(user4)
        user4_token = tokenUser4.accessToken
      })
    })
    describe('create post and user1 set Like ', () => {
      it('create post and user1 like it', async () => {
        const createdBlog = await blogsTestManager.createBlog(blogInstance)
        const createdPost = await postTestManager.createPost(postInstance, createdBlog.id)
        post_id = createdPost.id
        await postTestManager.userSetStatus(post_id, user1_token, 'Like')
        await postTestManager.checkStatusByUser(post_id, user1_token, 'Like')
      })
    })
    describe('user2 => set DisLike, user1 => Like, other => None', () => {
      it('user1 => Like', async () => {
        await postTestManager.checkStatusByUser(post_id, user1_token, 'Like')
      })
      it('user2 => set Dislike', async () => {
        await postTestManager.userSetStatus(post_id, user2_token, 'Dislike')
        await postTestManager.checkStatusByUser(post_id, user2_token, 'Dislike')
      })
      it('user3 and user4 => None, newestLikes => 1', async () => {
        await postTestManager.checkStatusByUser(post_id, user3_token, 'None')
        await postTestManager.checkStatusByUser(post_id, user4_token, 'None')
        const newestLikes = await request(app.getHttpServer())
          .get(`/posts/` + post_id)
          .expect(HttpStatus.OK)
        expect(newestLikes.body.extendedLikesInfo.newestLikes.length).toBe(1)
      })
    })
    describe('user1 => set None, user2 => Dislike, other => None', () => {
      it('user1 => set None', async () => {
        await postTestManager.userSetStatus(post_id, user1_token, 'None')
        await postTestManager.checkStatusByUser(post_id, user1_token, 'None')
      })
      it('user2 => Dislike', async () => {
        await postTestManager.checkStatusByUser(post_id, user2_token, 'Dislike')
      })
      it('user3 and user4 => None, newestLikes => 0', async () => {
        await postTestManager.checkStatusByUser(post_id, user3_token, 'None')
        await postTestManager.checkStatusByUser(post_id, user4_token, 'None')
        const newestLikes = await request(app.getHttpServer())
          .get(`/posts/` + post_id)
          .set('Authorization', `Bearer ${user4_token}`)
          .expect(HttpStatus.OK)
        expect(newestLikes.body.extendedLikesInfo.newestLikes.length).toBe(0)
      })
    })
    describe('user3 => set Dislike, user2 => set None, other => None', () => {
      it('user3 => set Dislike', async () => {
        await request(app.getHttpServer())
          .put(`/posts/` + post_id + '/like-status')
          .set('Authorization', `Bearer ${user3_token}`)
          .send({ likeStatus: 'Dislike' })
          .expect(HttpStatus.NO_CONTENT)

        const statusUser3 = await request(app.getHttpServer())
          .get(`/posts/` + post_id)
          .set('Authorization', `Bearer ${user3_token}`)
          .expect(HttpStatus.OK)
        expect(statusUser3.body.extendedLikesInfo.myStatus).toBe('Dislike')
      })
      it('user2 => set None', async () => {
        await request(app.getHttpServer())
          .put(`/posts/` + post_id + '/like-status')
          .set('Authorization', `Bearer ${user2_token}`)
          .send({ likeStatus: 'None' })
          .expect(HttpStatus.NO_CONTENT)

        const statusUser2 = await request(app.getHttpServer())
          .get(`/posts/` + post_id)
          .set('Authorization', `Bearer ${user2_token}`)
          .expect(HttpStatus.OK)
        expect(statusUser2.body.extendedLikesInfo.myStatus).toBe('None')
      })
      it('user1, user4 => None', async () => {
        const statusUser1 = await request(app.getHttpServer())
          .get(`/posts/` + post_id)
          .set('Authorization', `Bearer ${user1_token}`)
          .expect(HttpStatus.OK)
        expect(statusUser1.body.extendedLikesInfo.myStatus).toBe('None')

        const statusUser4 = await request(app.getHttpServer())
          .get(`/posts/` + post_id)
          .set('Authorization', `Bearer ${user4_token}`)
          .expect(HttpStatus.OK)
        expect(statusUser4.body.extendedLikesInfo.myStatus).toBe('None')
        expect(statusUser4.body.extendedLikesInfo.newestLikes.length).toBe(0)
      })
    })
    describe('all users set Like, newestLikes => 3 like (last 3)', () => {
      it('all users => set Like', async () => {
        await postTestManager.userSetStatus(post_id, user1_token, 'Like')
        await postTestManager.checkStatusByUser(post_id, user1_token, 'Like')

        await postTestManager.userSetStatus(post_id, user2_token, 'Like')
        await postTestManager.checkStatusByUser(post_id, user2_token, 'Like')

        await postTestManager.userSetStatus(post_id, user3_token, 'Like')
        await postTestManager.checkStatusByUser(post_id, user3_token, 'Like')

        await postTestManager.userSetStatus(post_id, user4_token, 'Like')
        await postTestManager.checkStatusByUser(post_id, user4_token, 'Like')
      })
      it('check newestLikes => 3 like (last 3)', async () => {
        const posts = await request(app.getHttpServer())
          .get(`/posts/` + post_id)
          .expect(HttpStatus.OK)
        expect(posts.body.extendedLikesInfo.myStatus).toBe('None')
        expect(posts.body.extendedLikesInfo.newestLikes.length).toBe(3)

        const array = [user4.login, user3.login, user2.login]
        const test = posts.body.extendedLikesInfo.newestLikes.map(el => {
          return el.login
        })
        expect(array).toEqual(test)
      })
    })
  })
})
