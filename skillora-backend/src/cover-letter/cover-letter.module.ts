import { Module } from '@nestjs/common';
import { CoverLetterController } from './cover-letter.controller';
import { DatabaseModule } from '../database/database.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [DatabaseModule, AuthModule],
  controllers: [CoverLetterController],
})
export class CoverLetterModule {}