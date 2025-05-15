import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { GLOBAL_PREFIX } from '../../src/setup/global-prefix.setup';

export const deleteAllData = async(app: INestApplication) => {
  const res = request(app.getHttpServer()).delete(`/testing/all-data`)

  return res
}