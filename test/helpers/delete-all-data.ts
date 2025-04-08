import { INestApplication } from '@nestjs/common';
import request from 'supertest';

export const deleteAllData = async(app: INestApplication) => {
  const res = request(app.getHttpServer()).delete(`/api/testing/all-data`)

  return res
}