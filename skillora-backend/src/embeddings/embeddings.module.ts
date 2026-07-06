import { Module } from '@nestjs/common';
import { EmbeddingsController } from './embeddings.controller';
import { DatabaseModule } from '../database/database.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [DatabaseModule, AuthModule],
  controllers: [EmbeddingsController],
})
export class EmbeddingsModule {}