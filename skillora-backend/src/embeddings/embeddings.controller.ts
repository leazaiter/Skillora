import { Controller, Post, Get, Req, UseGuards, Inject } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt.auth.guard';
import { DATABASE_POOL } from '../database/database.module';
import { Pool } from 'pg';

@Controller('embeddings')
@UseGuards(JwtAuthGuard)
export class EmbeddingsController {
  constructor(@Inject(DATABASE_POOL) private pool: Pool) {}

  @Post('embed')
  async embedSkills(@Req() req: any) {
    const userId = req.user.userId;

    const skillsResult = await this.pool.query(
      'SELECT name FROM skills WHERE user_id = $1', [userId]
    );
    const skills = skillsResult.rows.map((r: any) => r.name);

    const res = await fetch('http://localhost:8000/api/embeddings/embed-skills', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: userId, skills }),
    });

    return await res.json();
  }

  @Post('semantic-match')
  async semanticMatch(@Req() req: any) {
    const userId = req.user.userId;

    const skillsResult = await this.pool.query(
      'SELECT name FROM skills WHERE user_id = $1', [userId]
    );
    const skills = skillsResult.rows.map((r: any) => r.name);

    const prefsResult = await this.pool.query(
      'SELECT selected_role FROM user_preferences WHERE user_id = $1', [userId]
    );
    const targetRole = prefsResult.rows[0]?.selected_role || 'Software Developer';

    const res = await fetch('http://localhost:8000/api/embeddings/semantic-match', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ skills, target_role: targetRole }),
    });

    return await res.json();
  }
}