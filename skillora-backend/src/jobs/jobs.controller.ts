import { Controller, Post, Body, Req, UseGuards } from '@nestjs/common';
import { JobsService } from './jobs.service';
import { JwtAuthGuard } from '../auth/jwt.auth.guard';
import { Inject } from '@nestjs/common';
import { DATABASE_POOL } from '../database/database.module';
import { Pool } from 'pg';

@Controller('jobs')
@UseGuards(JwtAuthGuard)
export class JobsController {
  constructor(
    private readonly jobsService: JobsService,
    @Inject(DATABASE_POOL) private pool: Pool,
  ) {}

  @Post('match')
  async matchJob(@Body() body: { role: string }, @Req() req: any) {
    const userId = req.user.userId;

    // Get user's skills from DB
    const result = await this.pool.query(
      'SELECT name FROM skills WHERE user_id = $1',
      [userId]
    );
    const skills = result.rows.map((r: any) => r.name.toLowerCase());

    const match = await this.jobsService.matchJob(skills, body.role);

    return {
      role: match?.role,
      matchScore: match?.match_score,
      matchedSkills: match?.matched_skills,
      missingSkills: match?.missing_skills,
    };
  }
}