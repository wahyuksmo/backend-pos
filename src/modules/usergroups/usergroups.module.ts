import { Module } from '@nestjs/common';
import { UsergroupsController } from './usergroups.controller';
import { UsergroupsService } from './usergroups.service';

@Module({
  controllers: [UsergroupsController],
  providers: [UsergroupsService],
  exports: [UsergroupsService],
})
export class UsergroupsModule {}
