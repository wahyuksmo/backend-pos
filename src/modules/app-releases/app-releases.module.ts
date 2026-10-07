import { Module } from '@nestjs/common';
import { AppReleasesController } from './app-releases.controller';
import { AppReleasesService } from './app-releases.service';
import { DatabaseModule } from '../../infrastructure/database/database.module';

@Module({
  imports: [DatabaseModule],
  controllers: [AppReleasesController],
  providers: [AppReleasesService],
  exports: [AppReleasesService],
})
export class AppReleasesModule {}
