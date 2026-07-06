import { Injectable } from '@nestjs/common';

@Injectable()
export class JobsService {
  async matchJob(skills: string[], role: string) {
    try {
      const res = await fetch('http://localhost:8000/api/jobs/match', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ skills, target_role: role }),
      });
      if (!res.ok) return null;
      return await res.json();
    } catch (err) {
      console.error('AI service unreachable:', err);
      return null;
    }
  }
}