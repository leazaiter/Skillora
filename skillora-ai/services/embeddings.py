from fastapi import APIRouter
from pydantic import BaseModel
from typing import List
from sentence_transformers import SentenceTransformer
import numpy as np
import os

router = APIRouter()

# Load model once at startup
print("Loading sentence transformer model...")
model = SentenceTransformer('all-MiniLM-L6-v2')
print("Model loaded!")

DATABASE_URL = os.getenv("DATABASE_URL")

class EmbedSkillsRequest(BaseModel):
    user_id: str
    skills: List[str]

class SemanticMatchRequest(BaseModel):
    skills: List[str]
    target_role: str

class SemanticMatchResponse(BaseModel):
    role: str
    semantic_score: float
    matched_skills: List[str]
    missing_skills: List[str]

# Pre-defined job role skill descriptions for semantic matching
JOB_DESCRIPTIONS = {
    "Full Stack Developer": "react javascript typescript node.js express postgresql mongodb html css git docker rest api web development frontend backend",
    "Frontend Developer": "react javascript typescript html css tailwind next.js vue angular redux ui ux web design responsive",
    "Backend Developer": "node.js python express nestjs postgresql mongodb redis docker git api microservices server database",
    "AI/ML Engineer": "python machine learning deep learning tensorflow pytorch scikit-learn nlp neural network data science artificial intelligence",
    "DevOps Engineer": "docker kubernetes aws linux ci/cd git nginx terraform azure cloud infrastructure deployment",
    "Data Scientist": "python machine learning pandas numpy scikit-learn tensorflow statistics data analysis visualization sql",
    "Mobile Developer": "react native javascript typescript swift kotlin flutter mobile ios android firebase",
}

@router.post("/semantic-match", response_model=SemanticMatchResponse)
def semantic_match(request: SemanticMatchRequest):
    """Match user skills to job role using semantic similarity"""
    skills_lower = [s.lower().strip() for s in request.skills]
    role = request.target_role

    # Find best matching role
    best_role = role
    for job_role in JOB_DESCRIPTIONS:
        if role.lower() in job_role.lower() or job_role.lower() in role.lower():
            best_role = job_role
            break

    job_description = JOB_DESCRIPTIONS.get(best_role, JOB_DESCRIPTIONS["Full Stack Developer"])

    # Encode user skills combined
    user_text = " ".join(skills_lower)
    user_embedding = model.encode(user_text)
    job_embedding = model.encode(job_description)

    # Cosine similarity
    similarity = float(np.dot(user_embedding, job_embedding) /
                      (np.linalg.norm(user_embedding) * np.linalg.norm(job_embedding)))

    # Scale to percentage (similarity is 0-1, scale to 0-100)
    semantic_score = round(min(similarity * 150, 100), 1)

    # Find semantically matched skills
    job_keywords = job_description.split()
    matched = []
    missing = []

    for keyword in set(job_keywords):
        if len(keyword) < 3:
            continue
        keyword_embedding = model.encode(keyword)
        # Check if any user skill is semantically similar to this keyword
        skill_match = False
        for skill in skills_lower:
            skill_embedding = model.encode(skill)
            sim = float(np.dot(keyword_embedding, skill_embedding) /
                       (np.linalg.norm(keyword_embedding) * np.linalg.norm(skill_embedding)))
            if sim > 0.7:
                skill_match = True
                break
        if skill_match:
            matched.append(keyword)
        else:
            missing.append(keyword)

    return SemanticMatchResponse(
        role=best_role,
        semantic_score=semantic_score,
        matched_skills=matched[:8],
        missing_skills=missing[:5]
    )