import { HttpStatus, INestApplication } from '@nestjs/common';
import { BlogsTestManager } from '../blogs/blogsTestManager';
import { Test } from '@nestjs/testing';
import { AppModule } from '../../src/app.module';
import { MailService } from '../../src/mail/mail.service';
import { MockMailService } from '../auth/registration.e2e-spec';
import { appSetup } from '../../src/setup/app.setup';
import { deleteAllData } from '../helpers/delete-all-data';
import { blogInstance } from '../blogs/blogs-dto';
import request from 'supertest';
import { postInstance, postInstance1, postInstance2, postInstance3, postInstance4 } from './posts-dto';
import { PostTestManager } from './postsTestManager';

describe('/posts', () => {
  let app: INestApplication;
  let postTestManager: PostTestManager
  let blogsTestManager: BlogsTestManager

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
  })
  beforeEach(async () => {
    await deleteAllData(app);
  });
  afterAll(async () => {
    await app.close()
  })

  describe('POST /posts', () => {
    it('201 created post success', async () => {
      const createdBlog = await blogsTestManager.createBlog(blogInstance)
      await request(app.getHttpServer())
        .post(`/posts`)
        .auth('admin', 'qwerty')
        .send({
          title: "Tigers",
          shortDescription: "Animal of Africa",
          content: "kekekdokdi kokd kio kdio kdo k d ojiojc",
          blogId: createdBlog.id
        })
        .expect(HttpStatus.CREATED)
    })
    it('400 If the inputModel has incorrect values', async () => {
      const createdBlog = await blogsTestManager.createBlog(blogInstance)
      await request(app.getHttpServer())
        .post(`/posts`)
        .auth('admin', 'qwerty')
        .send({
          title: "Animal of AfricaAnimal of AfricaAnimal of AfricaAnimal of Africa",
          shortDescription: "Animal of Africa",
          content: "kekekdokdi kokd kio kdio kdo k d ojiojc",
          blogId: createdBlog.id
        })
        .expect(HttpStatus.BAD_REQUEST)
    })
    it('401 Unauthorized', async () => {
      const createdBlog = await blogsTestManager.createBlog(blogInstance)
      await request(app.getHttpServer())
        .post(`/posts`)
        .send({
          title: "Tigers",
          shortDescription: "Animal of Africa",
          content: "kekekdokdi kokd kio kdio kdo k d ojiojc",
          blogId: createdBlog.id
        })
        .expect(HttpStatus.UNAUTHORIZED)
    })
  })
  describe('GET /posts', () => {
    it('200 return all posts', async () => {
      const createdBlog = await blogsTestManager.createBlog(blogInstance)
      await postTestManager.createPost(postInstance, createdBlog.id)
      await postTestManager.createPost(postInstance1, createdBlog.id)
      await postTestManager.createPost(postInstance2, createdBlog.id)

      const responseGetPosts = await request(app.getHttpServer())
        .get(`/posts`)
        .expect(HttpStatus.OK)

      expect(responseGetPosts.body.items.length).toBe(3)
    })
    it('200 return all posts with sortBy title and sortDirection - ascending', async () => {
      const createdBlog = await blogsTestManager.createBlog(blogInstance)
      await postTestManager.createPost(postInstance, createdBlog.id)
      await postTestManager.createPost(postInstance1, createdBlog.id)
      await postTestManager.createPost(postInstance2, createdBlog.id)
      await postTestManager.createPost(postInstance3, createdBlog.id)
      await postTestManager.createPost(postInstance4, createdBlog.id)

      const array = [ postInstance, postInstance1, postInstance2, postInstance3, postInstance4 ]
      let key = 'title'
      const sortedArray = array.sort((postInstance1, postInstance2) => postInstance1[key] > postInstance2[key] ? 1: -1)

      const response = await request(app.getHttpServer())
        .get(`/posts?sortBy=title&sortDirection=asc`)
        .expect(HttpStatus.OK)

      const test = response.body.items.map(el => {
        return {
          title: el.title,
          shortDescription: el.shortDescription,
          content: el.content
        }
      })
      expect(sortedArray).toEqual(test)
    })
  })
  describe('GET /postsid', () => {
    it('200 return posts by id', async () => {
      const createdBlog = await blogsTestManager.createBlog(blogInstance)
      const createdPost = await postTestManager.createPost(postInstance, createdBlog.id)
      const response = await request(app.getHttpServer())
        .get(`/posts/` + createdPost.id)
        .expect(HttpStatus.OK)
      expect(response.body.title).toBe(postInstance.title)
    })
    it('404 Not Found', async () => {
      const createdBlog = await blogsTestManager.createBlog(blogInstance)
      await postTestManager.createPost(postInstance, createdBlog.id)
      const response = await request(app.getHttpServer())
        .get(`/posts/6822e4f6ae1b7de4c6cdceec`) // не корректный id
        .expect(HttpStatus.NOT_FOUND)
    })
  })
  describe('PUT /postsid', () => {
    it('204 update posts success', async () => {
      const createdBlog = await blogsTestManager.createBlog(blogInstance)
      const createdPost = await request(app.getHttpServer())
        .post(`/posts`)
        .auth('admin', 'qwerty')
        .send({
          title: "Europa",
          shortDescription: "About our planet",
          content: "Drawing comics is not the dmdkem oefkk  k",
          blogId: createdBlog.id
        })
        .expect(HttpStatus.CREATED)

      expect(createdPost.body.title).toBe("Europa")

      await request(app.getHttpServer())
        .put(`/posts/` + createdPost.body.id)
        .auth('admin', 'qwerty')
        .send({
          title: "Africa",
          shortDescription: "About our planet",
          content: "History little lion",
          blogId: createdBlog.id
        })
        .expect(HttpStatus.NO_CONTENT)

      const response = await request(app.getHttpServer())
        .get(`/posts/` + createdPost.body.id)
        .expect(HttpStatus.OK)

      expect(response.body.title).toBe("Africa")
    })
    it('400 If the inputModel has incorrect values', async () => {
      const createdBlog = await blogsTestManager.createBlog(blogInstance)
      const createdPost = await request(app.getHttpServer())
        .post(`/posts`)
        .auth('admin', 'qwerty')
        .send({
          title: "Europa",
          shortDescription: "About our planet",
          content: "Drawing comics is not the dmdkem oefkk  k",
          blogId: createdBlog.id
        })
        .expect(HttpStatus.CREATED)

      expect(createdPost.body.title).toBe("Europa")

      await request(app.getHttpServer())
        .put(`/posts/` + createdPost.body.id)
        .auth('admin', 'qwerty')
        .send({
          title: "Africa",
          shortDescription: "About our planet",
          content: "History little lion",
          blogId: "39047"     // value is not mongo id
        })
        .expect(HttpStatus.BAD_REQUEST)
    })
    it('401 Unauthorized', async () => {
      const createdBlog = await blogsTestManager.createBlog(blogInstance)
      const createdPost = await request(app.getHttpServer())
        .post(`/posts`)
        .auth('admin', 'qwerty')
        .send({
          title: "Europa",
          shortDescription: "About our planet",
          content: "Drawing comics is not the dmdkem oefkk  k",
          blogId: createdBlog.id
        })
        .expect(HttpStatus.CREATED)

      expect(createdPost.body.title).toBe("Europa")

      await request(app.getHttpServer())
        .put(`/posts/` + createdPost.body.id)
        .auth('admin', 'abracadabra')
        .send({
          title: "Africa",
          shortDescription: "About our planet",
          content: "History little lion",
          blogId: createdBlog.id
        })
        .expect(HttpStatus.UNAUTHORIZED)

    })
    it('404 Not Found', async () => {
        const createdBlog = await blogsTestManager.createBlog(blogInstance)
        const createdPost = await request(app.getHttpServer())
          .post(`/posts`)
          .auth('admin', 'qwerty')
          .send({
            title: "Europa",
            shortDescription: "About our planet",
            content: "Drawing comics is not the dmdkem oefkk  k",
            blogId: createdBlog.id
          })
          .expect(HttpStatus.CREATED)

        expect(createdPost.body.title).toBe("Europa")

        await request(app.getHttpServer())
          .put(`/posts/67ff85e1025044776b90b071`)  // post with current id not exist
          .auth('admin', 'qwerty')
          .send({
            title: "Africa",
            shortDescription: "About our planet",
            content: "History little lion",
            blogId: createdBlog.id
          })
          .expect(HttpStatus.NOT_FOUND)

    })
  })
  describe('DELETE /postsid', () => {
    it('204 delete post success', async () => {
      const createdBlog = await blogsTestManager.createBlog(blogInstance)
      const createdPost = await postTestManager.createPost(postInstance, createdBlog.id)
      const response = await request(app.getHttpServer())
        .get(`/posts/` + createdPost.id)
        .expect(HttpStatus.OK)
      expect(response.body.title).toBe(postInstance.title)

      await request(app.getHttpServer())
        .delete(`/posts/` + createdPost.id)
        .auth('admin', 'qwerty')
        .expect(HttpStatus.NO_CONTENT)

      await request(app.getHttpServer())
        .get(`/posts/` + createdPost.id)
        .expect(HttpStatus.NOT_FOUND)
    })
    it('401 Unauthorized', async () => {
      const createdBlog = await blogsTestManager.createBlog(blogInstance)
      const createdPost = await postTestManager.createPost(postInstance, createdBlog.id)
      const response = await request(app.getHttpServer())
        .get(`/posts/` + createdPost.id)
        .expect(HttpStatus.OK)
      expect(response.body.title).toBe(postInstance.title)

      await request(app.getHttpServer())
        .delete(`/posts/` + createdPost.id)
        .auth('', 'qwerty')
        .expect(HttpStatus.UNAUTHORIZED)
    })
    it('404 Not Found', async () => {
      const createdBlog = await blogsTestManager.createBlog(blogInstance)
      const createdPost = await postTestManager.createPost(postInstance, createdBlog.id)
      const response = await request(app.getHttpServer())
        .get(`/posts/` + createdPost.id)
        .expect(HttpStatus.OK)
      expect(response.body.title).toBe(postInstance.title)

      await request(app.getHttpServer())
        .delete(`/posts/` + createdPost.id)
        .auth('admin', 'qwerty')
        .expect(HttpStatus.NO_CONTENT)

      await request(app.getHttpServer())
        .delete(`/posts/` + createdPost.id)
        .auth('admin', 'qwerty')
        .expect(HttpStatus.NOT_FOUND)
    })
  })
})