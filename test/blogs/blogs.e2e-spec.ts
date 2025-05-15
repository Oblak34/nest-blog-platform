import { HttpStatus, INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { AppModule } from '../../src/app.module';
import { MailService } from '../../src/mail/mail.service';
import { MockMailService } from '../auth/registration.e2e-spec';
import { appSetup } from '../../src/setup/app.setup';
import { deleteAllData } from '../helpers/delete-all-data';
import { BlogsTestManager } from './blogsTestManager';
import { blogInstance, blogsArray, incorrect_blogInstance } from './blogs-dto';
import request from 'supertest';
import { BlogCreateDto } from '../../src/features/bloggers-platform/blogs/api/input/create-blog.dto';
import { GLOBAL_PREFIX } from '../../src/setup/global-prefix.setup';
import { incorrectPostInstance, postInstance, postInstance1, postInstance2 } from '../posts/posts-dto';
import { PostTestModel } from '../../src/features/bloggers-platform/posts/domain/postTestModel';

describe('/blogs', () => {
  let app: INestApplication;
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
    blogsTestManager = new BlogsTestManager(app)
  })
  beforeEach(async () => {
    await deleteAllData(app);
  });
  afterAll(async () => {
    await app.close()
  })

  describe('GET /blogs', () => {
    it('200 get all blogs with filter searchName', async () => {
      await blogsTestManager.createManyBlogs(blogsArray)

      const allMaria = blogsArray.filter(item => item.name == 'Maria')

      const testAllMaria = allMaria.map(el => {
        return { name: el.name }
      })

      const response = await request(app.getHttpServer())
        .get(`/blogs/?searchNameTerm=Maria`)
        .expect(HttpStatus.OK)

      const test: BlogCreateDto[] = response.body.items
      const testing = test.map(el => {
        return {
          name: el.name,
        }
      })
      expect(testing).toEqual(testAllMaria)
    })
    it('200 get all blogs with sortBy createdAt, method ascending', async () => {
      const sorted = await blogsArray.sort((user1, user2) => user1['description'] > user2['description'] ? 1 : -1)

      await blogsTestManager.createManyBlogs(blogsArray)
      const response = await request(app.getHttpServer())
        .get(`/blogs?sortBy=description&sortDirection=asc`)
        .expect(HttpStatus.OK)

      const test = response.body.items
      const testing = test.map(el => {
        return {
          name: el.name,
          description: el.description,
          websiteUrl: el.websiteUrl
        }
      })
      expect(testing).toEqual(sorted)
    })
  })
  describe('POST /blogs', () => {
    it('401 not authorization when creating a blog', async () => {
      await request(app.getHttpServer())
        .post(`/blogs`)
        .send(blogInstance)
        .expect(HttpStatus.UNAUTHORIZED)
    })
    it('400 bad request when creating a blog', async () => {
      await request(app.getHttpServer())
        .post(`/blogs`)
        .auth('admin', 'qwerty')
        .send(incorrect_blogInstance)
        .expect(HttpStatus.BAD_REQUEST, {
          errorsMessages: [
            { message: 'Must be a string!; Received value: 1234', field: 'description' },
            {
              message: 'websiteUrl must be a URL address; Received value: htt1hUkHMdVxa8fcshCjjZ3g93tN4com',
              field: 'websiteUrl'
            },
          ]
        })
    })
    it('200 create new blog', async () => {
      const response = await request(app.getHttpServer())
        .post(`/blogs`)
        .auth('admin', 'qwerty')
        .send(blogInstance)
        .expect(HttpStatus.CREATED)

      const test = {
        name: response.body.name,
        description: response.body.description,
        websiteUrl: response.body.websiteUrl
      }
      expect(test).toEqual(blogInstance)
    })
  })
  describe('GET /blogs/{blogId}/posts', () => {
    it('200 get posts by blodId', async () => {
      const response = await blogsTestManager.createBlog(blogInstance)

      await blogsTestManager.createPostById(response.id, postInstance)
      await blogsTestManager.createPostById(response.id, postInstance1)
      await blogsTestManager.createPostById(response.id, postInstance2)

      const responseGetPosts = await request(app.getHttpServer())
        .get(`/blogs/` + response.id + '/posts')
        .expect(HttpStatus.OK)

      expect(responseGetPosts.body.items.length).toBe(3)
    })
    it('200 get posts by blodId with sortBy of title', async () => {
      const response = await blogsTestManager.createBlog(blogInstance)
      await blogsTestManager.createPostById(response.id, postInstance)
      await blogsTestManager.createPostById(response.id, postInstance1)
      await blogsTestManager.createPostById(response.id, postInstance2)

      const posts = [ postInstance, postInstance1, postInstance2 ]
        .sort((user1, user2) => user1['title'] > user2['title'] ? -1 : 1)

      const responseGetPosts = await request(app.getHttpServer())
        .get(`/blogs/` + response.id + '/posts?sortBy=title&sortDirection=desc')
        .expect(HttpStatus.OK)

      const test: PostTestModel[] = responseGetPosts.body.items
      const testing = test.map(el => {
        return {
          title: el.title,
          shortDescription: el.shortDescription,
          content: el.content
        }
      })

      expect(posts).toEqual(testing)
    })
  })
  describe('POST /{blogId}/posts', () => {
    it('400 bad request, when creating a post', async () => {
      const blog = await blogsTestManager.createBlog(blogInstance)
      await request(app.getHttpServer())
        .post(`/blogs/` + blog.id + '/posts')
        .auth('admin', 'qwerty')
        .send(incorrectPostInstance)
        .expect(HttpStatus.BAD_REQUEST)
    })
    it('401 not authorization, when creating a post', async () => {
      const createdBlog = await blogsTestManager.createBlog(blogInstance)
      await request(app.getHttpServer())
        .post(`/blogs/`+createdBlog.id+'/posts')
        .send(postInstance)
        .expect(HttpStatus.UNAUTHORIZED)
    })
    it('404 If specified blog doesn\'t exists', async () => {
      await request(app.getHttpServer())
        .post(`/blogs/677d60a2aa20e34c2f4a03d7/posts`)
        .auth('admin', 'qwerty')
        .send(postInstance)
        .expect(HttpStatus.NOT_FOUND)
    })
    it('201 when creating a post', async () => {
      const createdBlog = await blogsTestManager.createBlog(blogInstance)
      await request(app.getHttpServer())
        .post(`/blogs/`+createdBlog.id+'/posts')
        .auth('admin', 'qwerty')
        .send(postInstance)
        .expect(HttpStatus.CREATED)
    })
  })
  describe('GET /blog/:id', () => {
    it('200 get blog by id', async () => {
      const createdBlog = await blogsTestManager.createBlog(blogInstance)
      await request(app.getHttpServer())
        .get(`/blogs/`+ createdBlog.id)
        .expect(HttpStatus.OK)
    })
    it('404 Not Found', async () => {
      const createdBlog = await blogsTestManager.createBlog(blogInstance)
      await request(app.getHttpServer())
        .get(`/blogs/67f76b9a2c4992c0b9033969`)
        .expect(HttpStatus.NOT_FOUND)
    })
  })
  describe('PUT /blogs/:id', () => {
    it('404 not found, update not exisisting blog', async () => {
      await request(app.getHttpServer())
        .put(`/blogs/67f76b9a2c4992c0b9033969`)
        .auth('admin', 'qwerty')
        .send(blogInstance)
        .expect(HttpStatus.NOT_FOUND)
    })
    it('400 bad request, when updating a blog', async () => {
      const createdBlog = await blogsTestManager.createBlog(blogInstance)
      await request(app.getHttpServer())
        .put(`/blogs/` + createdBlog._id)
        .auth('admin', 'qwerty')
        .send({
          name: 'Marina',
          description: 'Farm',
          websiteUrl: 'https://www.asiaeuropekdkdkpkokdokokdockdoekdeoriwieutwiooeoeoieujofjocjvojdojdeidoewjfeowfjeofjdofjfoewijdwefeofjewojfoewjfeovnovnrvfroefneonveovnovneroigjjvifovjroivjroivormoiv.com/',
        })
        .expect(HttpStatus.BAD_REQUEST)
    })
    it('401 not authorization, when updating a blog', async () => {
      const createdBlog = await blogsTestManager.createBlog(blogInstance)
      await request(app.getHttpServer())
        .put(`/blogs/`+ createdBlog.id)
        .send({
          name: 'Marina',
          description: 'Farm',
          websiteUrl: 'https://www.asiaeurope.com'
        })
        .expect(HttpStatus.UNAUTHORIZED)
    })
    it('204 no content, when updating a blog', async () => {
      const createdBlog = await blogsTestManager.createBlog(blogInstance)
      await request(app.getHttpServer())
        .put(`/blogs/` + createdBlog.id)
        .auth('admin', 'qwerty')
        .send({
          name: 'Marina',
          description: 'Farm',
          websiteUrl: 'https://www.asiaeurope.com'
        })
        .expect(HttpStatus.NO_CONTENT)

      const updateBlog = await request(app.getHttpServer())
        .get(`/blogs/${createdBlog.id}`)
        .expect(HttpStatus.OK)

      expect(updateBlog.body.name).toBe('Marina')

    })
  })
  describe('DELETE /blogs/:id', () => {
    it('204 No Content delete blog by id', async () => {
      const blog = await blogsTestManager.createBlog(blogInstance)

      await request(app.getHttpServer())
        .get(`/blogs/` + blog.id)
        .expect(HttpStatus.OK)

      await request(app.getHttpServer())
        .delete(`/blogs/` + blog.id)
        .auth('admin', 'qwerty')
        .expect(HttpStatus.NO_CONTENT)

      await request(app.getHttpServer())
        .get(`/blogs/` + blog.id)
        .expect(HttpStatus.NOT_FOUND)
    })
    it('401 No Authorization', async () => {
      const blog = await blogsTestManager.createBlog(blogInstance)
      await request(app.getHttpServer())
        .get(`/blogs/` + blog.id)
        .expect(HttpStatus.OK)

      await request(app.getHttpServer())
        .delete(`/blogs/` + blog.id)
        .expect(HttpStatus.UNAUTHORIZED)

      await request(app.getHttpServer())
        .get(`/blogs/` + blog.id)
        .expect(HttpStatus.OK)
    })
    it('404 No Found', async () => {
      await request(app.getHttpServer())
        .delete(`/blogs/677d60a2aa20e34c2f4a03d7`)
        .auth('admin', 'qwerty')
        .expect(HttpStatus.NOT_FOUND)
    })
  })
})