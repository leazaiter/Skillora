import { Module } from '@nestjs/common';
import { QuestionsController } from './questions.controller';
import { DatabaseModule } from '../database/database.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [DatabaseModule, AuthModule],
  controllers: [QuestionsController],
})
export class QuestionsModule {}