from fastapi import APIRouter
from pydantic import BaseModel
from typing import List

router = APIRouter()

class CoverLetterRequest(BaseModel):
    name: str
    skills: List[str]
    target_role: str
    matched_skills: List[str]
    missing_skills: List[str]

class CoverLetterResponse(BaseModel):
    cover_letter: str

@router.post("/generate", response_model=CoverLetterResponse)
def generate_cover_letter(request: CoverLetterRequest):
    name = request.name or "Applicant"
    role = request.target_role
    skills = ", ".join(request.skills[:8]) if request.skills else "various technical skills"
    matched = ", ".join(request.matched_skills[:5]) if request.matched_skills else skills
    
    cover_letter = f"""Dear Hiring Manager,

I am writing to express my strong interest in the {role} position at your organization. With a solid foundation in {matched}, I am confident in my ability to contribute meaningfully to your team from day one.

Throughout my career, I have developed expertise in {skills}. This technical background has equipped me with the tools necessary to tackle complex challenges and deliver high-quality solutions in fast-paced environments.

What excites me most about the {role} role is the opportunity to apply my skills in a collaborative setting where innovation and continuous learning are valued. I thrive in environments that challenge me to grow, and I am committed to staying current with emerging technologies and best practices in the field.

I am particularly drawn to this opportunity because it aligns perfectly with my career goals and technical strengths. I am eager to bring my dedication, problem-solving mindset, and technical expertise to your team.

Thank you for considering my application. I would welcome the opportunity to discuss how my background and skills align with your needs. I look forward to the possibility of contributing to your organization.

Sincerely,
{name}"""

    return CoverLetterResponse(cover_letter=cover_letter)