import { Controller, Post, Req, UseGuards, Inject } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt.auth.guard';
import { DATABASE_POOL } from '../database/database.module';
import { Pool } from 'pg';

@Controller('recommendations')
@UseGuards(JwtAuthGuard)
export class RecommendationsController {
  constructor(@Inject(DATABASE_POOL) private pool: Pool) {}

  @Post('generate')
  async generate(@Req() req: any) {
    const userId = req.user.userId;

    const skillsResult = await this.pool.query(
      'SELECT name FROM skills WHERE user_id = $1', [userId]
    );
    const skills = skillsResult.rows.map((r: any) => r.name);

    const prefsResult = await this.pool.query(
      'SELECT selected_role FROM user_preferences WHERE user_id = $1', [userId]
    );
    const targetRole = prefsResult.rows[0]?.selected_role || 'Software Developer';

    // Get missing skills from job match
    const res = await fetch('http://localhost:8000/api/jobs/match', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        skills: skills.map((s: string) => s.toLowerCase()),
        target_role: targetRole,
      }),
    });
    const matchData = await res.json();

    // Call recommendations AI
    const recRes = await fetch('http://localhost:8000/api/recommendations/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        skills,
        target_role: targetRole,
        missing_skills: matchData.missing_skills || [],
        match_score: matchData.match_score || 0,
      }),
    });

    const data = await recRes.json();
    return data;
  }
}