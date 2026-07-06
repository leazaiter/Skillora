from fastapi import APIRouter
from pydantic import BaseModel
from typing import List

router = APIRouter()

# Job roles with their required skills
JOB_ROLES = {
    "Full Stack Developer": {
        "core": ["react.js", "node.js", "next.js", "express.js", "postgresql", "mongodb", "git"],
        "nice_to_have": ["typescript", "docker", "graphql", "redis"]
    },
    "Frontend Developer": {
        "core": ["react.js", "next.js", "html", "css", "javascript", "git"],
        "nice_to_have": ["typescript", "tailwind", "redux", "vue", "angular"]
    },
    "Backend Developer": {
        "core": ["node.js", "express.js", "postgresql", "mongodb", "git"],
        "nice_to_have": ["docker", "redis", "nestjs", "fastapi", "django"]
    },
    "AI/ML Engineer": {
        "core": ["python", "machine learning", "deep learning", "tensorflow", "pytorch", "scikit-learn"],
        "nice_to_have": ["nlp", "numpy", "pandas", "hugging face", "docker"]
    },
    "DevOps Engineer": {
        "core": ["docker", "kubernetes", "aws", "linux", "git", "ci/cd"],
        "nice_to_have": ["terraform", "nginx", "azure", "gcp"]
    },
    "Data Scientist": {
        "core": ["python", "machine learning", "pandas", "numpy", "scikit-learn", "postgresql"],
        "nice_to_have": ["tensorflow", "deep learning", "statistics"]
    },
    "Mobile Developer": {
        "core": ["react native", "javascript", "flutter", "git", "firebase"],
        "nice_to_have": ["typescript", "swift", "kotlin", "react.js"]
    },
}

class MatchRequest(BaseModel):
    skills: List[str]
    target_role: str

class MatchResponse(BaseModel):
    role: str
    match_score: float
    matched_skills: List[str]
    missing_skills: List[str]

@router.post("/match", response_model=MatchResponse)
def match_job(request: MatchRequest):
    skills_lower = [s.lower().strip() for s in request.skills]
    role = request.target_role

    best_role = None
    for job_role in JOB_ROLES:
        if role.lower() in job_role.lower() or job_role.lower() in role.lower():
            best_role = job_role
            break

    if not best_role:
        best_role = "Full Stack Developer"

    core_skills = JOB_ROLES[best_role]["core"]
    matched = [s for s in core_skills if s in skills_lower]
    missing = [s for s in core_skills if s not in matched]
    score = round((len(matched) / len(core_skills)) * 100)

    return MatchResponse(
        role=best_role,
        match_score=score,
        matched_skills=matched,
        missing_skills=missing
    )

@router.get("/roles")
def get_available_roles():
    return {"roles": list(JOB_ROLES.keys())}

@router.post("/missing-skills", response_model=MatchResponse)
def get_missing_skills(request: MatchRequest):
    return match_job(request)