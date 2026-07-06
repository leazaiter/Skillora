import { Module } from '@nestjs/common';
import { InterviewsController } from './interviews.controller';
import { DatabaseModule } from '../database/database.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [DatabaseModule, AuthModule],
  controllers: [InterviewsController],
})
export class InterviewsModule {}