import { Controller, Post, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt.auth.guard';
import { Inject } from '@nestjs/common';
import { DATABASE_POOL } from '../database/database.module';
import { Pool } from 'pg';

@Controller('cover-letter')
@UseGuards(JwtAuthGuard)
export class CoverLetterController {
  constructor(@Inject(DATABASE_POOL) private pool: Pool) {}

  @Post('generate')
  async generate(@Req() req: any) {
    const userId = req.user.userId;

    // Get user info
    const userResult = await this.pool.query(
      'SELECT name FROM users WHERE id = $1',
      [userId]
    );
    const name = userResult.rows[0]?.name || 'Applicant';

    // Get user skills
    const skillsResult = await this.pool.query(
      'SELECT name FROM skills WHERE user_id = $1',
      [userId]
    );
    const skills = skillsResult.rows.map((r: any) => r.name);

    // Get saved role
    const prefsResult = await this.pool.query(
      'SELECT selected_role FROM user_preferences WHERE user_id = $1',
      [userId]
    );
    const targetRole = prefsResult.rows[0]?.selected_role || 'Software Developer';

    // Call AI service
    const res = await fetch('http://localhost:8000/api/cover-letter/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name,
        skills,
        target_role: targetRole,
        matched_skills: skills,
        missing_skills: [],
      }),
    });

    const data = await res.json();
    return { coverLetter: data.cover_letter, role: targetRole };
  }
}