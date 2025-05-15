import { Controller, Delete, HttpCode, HttpStatus, Param } from '@nestjs/common';
import { TestRepository } from './test.repository';
import { SkipThrottle } from '@nestjs/throttler';

@SkipThrottle()
@Controller('testing')
export class TestingController {
  constructor(private testRepository: TestRepository){}
  @Delete(':all-data')
  @HttpCode(HttpStatus.NO_CONTENT)
  async clearAllCollections(@Param('all-data') allData){
    await this.testRepository.deleteAll()
  }
}
