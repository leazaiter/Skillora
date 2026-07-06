import {
  Controller, Post, Get, UploadedFile, Body,
  UseInterceptors, Req, BadRequestException, UseGuards, Inject
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { CvService } from './cv.service';
import { JwtAuthGuard } from '../auth/jwt.auth.guard';
import { DATABASE_POOL } from '../database/database.module';
import { Pool } from 'pg';
import * as path from 'path';
import * as fs from 'fs';

const uploadsDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir);

@Controller('cv')
@UseGuards(JwtAuthGuard)
export class CvController {
  constructor(
    private readonly cvService: CvService,
    @Inject(DATABASE_POOL) private pool: Pool,
  ) { }

  @Post('upload')
  @UseInterceptors(FileInterceptor('file', {
    storage: diskStorage({
      destination: './uploads',
      filename: (req, file, cb) => {
        const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
        cb(null, unique + path.extname(file.originalname));
      },
    }),
    fileFilter: (req, file, cb) => {
      const allowed = ['.pdf', '.txt', '.docx'];
      const ext = path.extname(file.originalname).toLowerCase();
      if (!allowed.includes(ext)) {
        return cb(new BadRequestException('Only PDF, TXT, DOCX files allowed'), false);
      }
      cb(null, true);
    },
    limits: { fileSize: 5 * 1024 * 1024 },
  }))
  async uploadCv(@UploadedFile() file: Express.Multer.File, @Req() req: any) {
    if (!file) throw new BadRequestException('No file uploaded');

    const userId = req.user.userId;

    const existing = await this.pool.query(
      'SELECT id FROM cv_profiles WHERE user_id = $1',
      [userId]
    );

    if (existing.rows.length > 0) {
      throw new BadRequestException('You have already uploaded a CV. Each user can only upload one CV.');
    }

    const rawText = await this.cvService.extractTextFromFile(file.path, file.mimetype);
    const skills = this.cvService.extractSkills(rawText);
    console.log('SKILLS EXTRACTED:', skills);

    await this.cvService.saveCvProfile(userId, file.originalname, rawText, skills);

    // After saving CV and getting AI analysis, embed the skills
    const skillNames = skills.map(s => s.toLowerCase());
    fetch('http://localhost:8000/api/embeddings/embed-skills', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: userId, skills: skillNames }),
    }).catch(err => console.log('Embedding failed silently:', err));

    const aiAnalysis = await this.cvService.analyzeWithAI(skills);
    const roleSuggestions = await this.cvService.suggestRolesWithAI(skills);
    console.log('AI ANALYSIS:', JSON.stringify(aiAnalysis));
    console.log('ROLE SUGGESTIONS:', JSON.stringify(roleSuggestions));

    return {
      message: 'CV uploaded and analyzed successfully',
      fileName: file.originalname,
      skillsFound: skills.length,
      skills,
      aiAnalysis,
      roleSuggestions,
    };
  }

  @Post('skills/add')
  async addSkill(@Body() body: { skill: string }, @Req() req: any) {
    const userId = req.user.userId;
    if (!body.skill?.trim()) throw new BadRequestException('Skill is required');

    await this.pool.query(
      `INSERT INTO skills (user_id, name, source)
       VALUES ($1, $2, 'manual')
       ON CONFLICT DO NOTHING`,
      [userId, body.skill.trim().toLowerCase()]
    );

    return { message: 'Skill added successfully' };
  }

  @Post('skills/complete')
  async completeSkill(@Body() body: { skill: string, role: string }, @Req() req: any) {
    const userId = req.user.userId;

    // Mark as completed in roadmap
    await this.pool.query(
      `INSERT INTO roadmap_progress (user_id, skill_name, role, completed, completed_at)
     VALUES ($1, $2, $3, true, NOW())
     ON CONFLICT (user_id, skill_name, role) 
     DO UPDATE SET completed = true, completed_at = NOW()`,
      [userId, body.skill.toLowerCase(), body.role]
    );

    // Add to verified skills
    await this.pool.query(
      `INSERT INTO skills (user_id, name, source)
     VALUES ($1, $2, 'learned')
     ON CONFLICT DO NOTHING`,
      [userId, body.skill.toLowerCase()]
    );

    return { message: 'Skill marked as learned' };
  }

  @Get('skills')
  async getSkills(@Req() req: any) {
    const userId = req.user.userId;
    const skills = await this.cvService.getUserSkills(userId);
    return { skills };
  }

  @Get('profile')
  async getCvProfile(@Req() req: any) {
    const userId = req.user.userId;
    const cv = await this.cvService.getUserCv(userId);
    return { cv };
  }

  @Get('analysis')
  async getAnalysis(@Req() req: any) {
    const userId = req.user.userId;
    const skills = await this.cvService.getUserSkills(userId);
    const skillNames = skills.map((s: any) => s.name);

    const aiAnalysis = await this.cvService.analyzeWithAI(skillNames);
    const roleSuggestions = await this.cvService.suggestRolesWithAI(skillNames);

    return { aiAnalysis, roleSuggestions };
  }

  @Post('preferences')
  async savePreferences(@Body() body: { selectedRole: string, originalMissingSkills?: string[], coverLetter?: string }, @Req() req: any) {
    const userId = req.user.userId;
    await this.pool.query(
      `INSERT INTO user_preferences (user_id, selected_role, original_missing_skills, cover_letter)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (user_id) DO UPDATE SET 
     selected_role = $2,
     original_missing_skills = $3,
     cover_letter = $4,
     updated_at = NOW()`,
      [userId, body.selectedRole, JSON.stringify(body.originalMissingSkills || []), body.coverLetter || null]
    );
    return { message: 'Preferences saved' };
  }

  @Get('preferences')
  async getPreferences(@Req() req: any) {
    const userId = req.user.userId;
    const result = await this.pool.query(
      'SELECT * FROM user_preferences WHERE user_id = $1',
      [userId]
    );
    return { preferences: result.rows[0] || null };
  }
}