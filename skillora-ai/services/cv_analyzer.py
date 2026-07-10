from fastapi import APIRouter
from pydantic import BaseModel
from typing import List
import spacy

router = APIRouter()
nlp = spacy.load("en_core_web_sm")

# Skill categories for proficiency scoring
SKILL_CATEGORIES = {
    "Full Stack Development": [
        "react", "next.js", "vue", "angular", "node.js", "express", "nestjs",
        "html", "css", "tailwind", "javascript", "typescript", "redux"
    ],
    "Backend Development": [
        "python", "java", "c++", "c#", "php", "ruby", "rust",
        "fastapi", "django", "flask", "spring", "laravel"
    ],
    "AI & Machine Learning": [
        "machine learning", "deep learning", "nlp", "tensorflow", "pytorch",
        "scikit-learn", "hugging face", "ollama", "langchain", "computer vision",
        "neural network", "python"
    ],
    "Database Management": [
        "postgresql", "mysql", "mongodb", "redis", "sqlite", "firebase",
        "supabase", "dynamodb", "pgvector", "sql", "nosql"
    ],
    "DevOps & Cloud": [
        "docker", "kubernetes", "aws", "azure", "gcp", "git", "github",
        "gitlab", "ci/cd", "linux", "nginx", "terraform"
    ],
    "Soft Skills": [
        "leadership", "communication", "teamwork", "problem solving",
        "project management", "agile", "scrum", "critical thinking"
    ]
}

class AnalyzeRequest(BaseModel):
    skills: List[str]
    raw_text: str = ""

class CategoryScore(BaseModel):
    category: str
    score: float
    matched_skills: List[str]

class ProfileMetrics(BaseModel):
    ai_confidence: float
    market_sync: float
    profile_stability: float

class AnalyzeResponse(BaseModel):
    category_scores: List[CategoryScore]
    profile_metrics: ProfileMetrics
    total_skills: int

@router.post("/analyze", response_model=AnalyzeResponse)
def analyze_cv(request: AnalyzeRequest):
    print("SKILLS RECEIVED BY AI:", request.skills)
    skills_lower = [s.lower().strip() for s in request.skills]
    total = len(skills_lower)

    if total == 0:
        return AnalyzeResponse(
            category_scores=[],
            profile_metrics=ProfileMetrics(
                ai_confidence=0,
                market_sync=0,
                profile_stability=0
            ),
            total_skills=0
        )

    category_scores = []

    for category, keywords in SKILL_CATEGORIES.items():
        matched = []
        for kw in keywords:
            kw_lower = kw.lower().strip()
            if kw_lower in skills_lower:
                matched.append(kw)

        score = round((len(matched) / len(keywords)) * 100) if keywords else 0
        category_scores.append(CategoryScore(
            category=category,
            score=min(score * 4.5, 100),
            matched_skills=matched
        ))

    category_scores.sort(key=lambda x: x.score, reverse=True)

    top_scores = [c.score for c in category_scores if c.score > 0]
    avg_score = sum(top_scores) / len(top_scores) if top_scores else 0

    categories_covered = len([c for c in category_scores if c.score > 0])
    total_categories = len(SKILL_CATEGORIES)

    # Check AI skills
    ai_category = next(
        (c for c in category_scores if "ai" in c.category.lower() or "machine" in c.category.lower()),
        None
    )
    has_ai_skills = ai_category is not None and ai_category.score > 0

    # Realistic scaling metrics
    # More skills = higher confidence, scales to 98% with ~20 skills
    ai_confidence = min(round(avg_score * 1 + total * 6), 98) if has_ai_skills else 0
    market_sync = min(round(avg_score * 1 + total * 4.5), 95)
    profile_stability = min(round((categories_covered / total_categories) * 90 + total * 6), 95)

    return AnalyzeResponse(
        category_scores=category_scores,
        profile_metrics=ProfileMetrics(
            ai_confidence=ai_confidence,
            market_sync=market_sync,
            profile_stability=profile_stability
        ),
        total_skills=total
    )