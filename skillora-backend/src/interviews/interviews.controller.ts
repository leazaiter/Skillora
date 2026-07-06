import { Controller, Post, Body, Req, UseGuards, Inject } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt.auth.guard';
import { DATABASE_POOL } from '../database/database.module';
import { Pool } from 'pg';

@Controller('interviews')
@UseGuards(JwtAuthGuard)
export class InterviewsController {
  constructor(@Inject(DATABASE_POOL) private pool: Pool) {}

  @Post('chat')
  async chat(@Body() body: { messages: any[], targetRole?: string }, @Req() req: any) {
    const userId = req.user.userId;

    const userResult = await this.pool.query(
      'SELECT name FROM users WHERE id = $1', [userId]
    );
    const userName = userResult.rows[0]?.name || 'Candidate';

    const skillsResult = await this.pool.query(
      'SELECT name FROM skills WHERE user_id = $1', [userId]
    );
    const skills = skillsResult.rows.map((r: any) => r.name);

    const prefsResult = await this.pool.query(
      'SELECT selected_role FROM user_preferences WHERE user_id = $1', [userId]
    );
    const targetRole = body.targetRole || prefsResult.rows[0]?.selected_role || 'Software Developer';

    const res = await fetch('http://localhost:8000/api/interview/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: body.messages,
        skills,
        target_role: targetRole,
        user_name: userName,
      }),
    });

    const data = await res.json();
    return data;
  }
}