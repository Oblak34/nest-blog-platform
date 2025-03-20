import { Controller, Delete, HttpCode, HttpStatus, Param } from '@nestjs/common';
import { TestRepository } from './test.repository';


@Controller('testing')
export class TestController {
  constructor(private testRepository: TestRepository){}
  @Delete(':all-data')
  @HttpCode(HttpStatus.NO_CONTENT)
  async clearAllCollections(@Param('all-data') allData){
    await this.testRepository.deleteAll()
  }
}
