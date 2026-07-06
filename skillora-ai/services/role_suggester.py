from fastapi import APIRouter
from pydantic import BaseModel
from typing import List
from services.job_matcher import JOB_ROLES

router = APIRouter()

class SuggestRequest(BaseModel):
    skills: List[str]

class RoleSuggestion(BaseModel):
    role: str
    match_score: float
    matched_skills: List[str]
    missing_skills: List[str]

class SuggestResponse(BaseModel):
    suggestions: List[RoleSuggestion]

@router.post("/suggest", response_model=SuggestResponse)
def suggest_roles(request: SuggestRequest):
    skills_lower = [s.lower().strip() for s in request.skills]
    suggestions = []

    for role, skill_sets in JOB_ROLES.items():
        core_skills = skill_sets["core"]
        matched = [s for s in core_skills if s in skills_lower]
        missing = [s for s in core_skills if s not in matched]
        score = round((len(matched) / len(core_skills)) * 100)

        if len(matched) > 0:
            suggestions.append(RoleSuggestion(
                role=role,
                match_score=score,
                matched_skills=matched,
                missing_skills=missing
            ))

    suggestions.sort(key=lambda x: x.match_score, reverse=True)
    return SuggestResponse(suggestions=suggestions[:5])