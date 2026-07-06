import { Injectable, Inject } from '@nestjs/common';
import { Pool } from 'pg';
import { DATABASE_POOL } from '../database/database.module';
import * as fs from 'fs';
import * as path from 'path';

// Full skill keywords list
const SKILL_KEYWORDS = [
  // Languages
  'javascript', 'typescript', 'python', 'java', 'c++', 'c#', 'php', 'ruby', 'swift', 'kotlin', 'rust',
  // Frontend
  'react', 'react.js', 'next.js', 'vue', 'vue.js', 'angular', 'html', 'css', 'tailwind',
  'bootstrap', 'sass', 'redux', 'graphql',
  // Backend
  'node.js', 'express', 'express.js', 'nestjs', 'nest.js', 'fastapi', 'django',
  'flask', 'spring', 'laravel', 'rails',
  // Databases
  'postgresql', 'mysql', 'mongodb', 'redis', 'sqlite', 'firebase',
  'supabase', 'dynamodb', 'pgvector',
  // DevOps
  'docker', 'kubernetes', 'aws', 'azure', 'gcp', 'git', 'github', 'gitlab',
  'ci/cd', 'linux', 'nginx', 'terraform',
  // AI & Data
  'machine learning', 'deep learning', 'nlp', 'tensorflow', 'pytorch',
  'scikit-learn', 'pandas', 'numpy', 'hugging face', 'ollama', 'langchain',
  // Soft skills
  'leadership', 'communication', 'teamwork', 'problem solving',
  'project management', 'agile', 'scrum',
];

@Injectable()
export class CvService {
  constructor(@Inject(DATABASE_POOL) private pool: Pool) {}

   // Extract text from uploaded file (supports PDF and TXT)
  async extractTextFromFile(filePath: string, mimetype: string): Promise<string> {
  const ext = path.extname(filePath).toLowerCase();

  if (ext === '.pdf') {
    return new Promise((resolve, reject) => {
      const PDFParser = require('pdf2json');
      const pdfParser = new PDFParser();
      pdfParser.on('pdfParser_dataError', (err: any) => reject(err));
      pdfParser.on('pdfParser_dataReady', (pdfData: any) => {
        const text = pdfData.Pages.map((page: any) =>
          page.Texts.map((t: any) =>
            decodeURIComponent(t.R.map((r: any) => r.T).join(' '))
          ).join(' ')
        ).join('\n');
        resolve(text);
      });
      pdfParser.loadPDF(filePath);
    });
  }

  if (ext === '.docx') {
    const mammoth = require('mammoth');
    const result = await mammoth.extractRawText({ path: filePath });
    return result.value;
  }

  // .txt fallback
  return fs.readFileSync(filePath, 'utf-8');
}
  // Extract skills from raw text using keyword matching
  extractSkills(text: string): string[] {
  const foundSkills: string[] = [];

  for (const skill of SKILL_KEYWORDS) {
    // Use word boundary regex to avoid partial matches
    const escaped = skill.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`\\b${escaped}\\b`, 'i');
    if (regex.test(text)) {
      foundSkills.push(skill);
    }
  }

  return [...new Set(foundSkills)];
}

  // Save CV and skills to database
  async saveCvProfile(userId: number, fileName: string, rawText: string, skills: string[]) {
    const client = await this.pool.connect();

    try {
      await client.query('BEGIN');

      // Save CV profile
      const cvResult = await client.query(
        `INSERT INTO cv_profiles (user_id, file_name, raw_text)
         VALUES ($1, $2, $3)
         RETURNING id`,
        [userId, fileName, rawText]
      );

      const cvId = cvResult.rows[0].id;

      // Delete old skills for this user
      await client.query(
        'DELETE FROM skills WHERE user_id = $1 AND source = $2',
        [userId, 'cv']
      );

      // Save new skills
      for (const skill of skills) {
        await client.query(
          `INSERT INTO skills (user_id, name, source)
           VALUES ($1, $2, 'cv')`,
          [userId, skill]
        );
      }

      await client.query('COMMIT');
      return { cvId, skills };

    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  // Get all skills for a user
  async getUserSkills(userId: number) {
    const result = await this.pool.query(
      'SELECT * FROM skills WHERE user_id = $1 ORDER BY created_at DESC',
      [userId]
    );
    return result.rows;
  }

  // Get CV profile for a user
  async getUserCv(userId: number) {
    const result = await this.pool.query(
      'SELECT * FROM cv_profiles WHERE user_id = $1 ORDER BY created_at DESC LIMIT 1',
      [userId]
    );
    return result.rows[0] || null;
  }
  // Call Python AI service for analysis
  async analyzeWithAI(skills: string[]) {
  try {
    const normalizedSkills = skills.map(s => s.toLowerCase().trim());
    const response = await fetch('http://localhost:8000/api/cv/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ skills: normalizedSkills, raw_text: '' }),
    });
    if (!response.ok) return null;
    return await response.json();
  } catch (err) {
    console.error('AI service unreachable:', err);
    return null;
  }
}

async suggestRolesWithAI(skills: string[]) {
  try {
    const normalizedSkills = skills.map(s => s.toLowerCase().trim());
    const response = await fetch('http://localhost:8000/api/roles/suggest', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ skills: normalizedSkills }),
    });
    if (!response.ok) return null;
    return await response.json();
  } catch (err) {
    console.error('AI service unreachable:', err);
    return null;
  }
}
}