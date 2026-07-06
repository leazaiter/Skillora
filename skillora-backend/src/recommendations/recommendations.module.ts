import { Module } from '@nestjs/common';
import { RecommendationsController } from './recommendations.controller';
import { DatabaseModule } from '../database/database.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [DatabaseModule, AuthModule],
  controllers: [RecommendationsController],
})
export class RecommendationsModule {}