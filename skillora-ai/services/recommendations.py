from fastapi import APIRouter
from pydantic import BaseModel
from typing import List

router = APIRouter()

class RecommendationRequest(BaseModel):
    skills: List[str]
    target_role: str
    missing_skills: List[str] = []
    match_score: float = 0

class Recommendation(BaseModel):
    type: str
    title: str
    description: str
    priority: str

class RecommendationResponse(BaseModel):
    recommendations: List[Recommendation]

SKILL_RESOURCES = {
    "react": "React Official Docs + freeCodeCamp React course",
    "react.js": "React Official Docs + freeCodeCamp React course",
    "node.js": "Node.js Official Docs + The Odin Project",
    "python": "Python.org tutorials + CS50P (Harvard free)",
    "machine learning": "fast.ai + Coursera ML by Andrew Ng (audit free)",
    "docker": "Docker Official Getting Started + TechWorld with Nana YouTube",
    "postgresql": "PostgreSQL Tutorial + Mode Analytics SQL course",
    "mongodb": "MongoDB University (free courses)",
    "aws": "AWS Free Tier + Cloud Practitioner free prep",
    "typescript": "TypeScript Handbook (official, free)",
    "next.js": "Next.js Official Docs + Vercel tutorials",
    "kubernetes": "Kubernetes.io tutorials + KodeKloud free tier",
    "tensorflow": "TensorFlow official tutorials + Coursera Deep Learning",
    "pytorch": "PyTorch official tutorials + fast.ai",
    "git": "Pro Git book (free online) + GitHub Learning Lab",
    "django": "Django Girls Tutorial + Official Django docs",
    "fastapi": "FastAPI Official Docs (excellent tutorials)",
}

@router.post("/generate", response_model=RecommendationResponse)
def generate_recommendations(request: RecommendationRequest):
    recommendations = []
    skills_lower = [s.lower() for s in request.skills]
    role = request.target_role or "Software Developer"
    score = request.match_score

    # Recommendation 1: Learn missing skills
    if request.missing_skills:
        top_missing = request.missing_skills[:3]
        resources = []
        for skill in top_missing:
            if skill.lower() in SKILL_RESOURCES:
                resources.append(f"{skill}: {SKILL_RESOURCES[skill.lower()]}")
            else:
                resources.append(f"{skill}: Search '{skill} tutorial for beginners'")

        recommendations.append(Recommendation(
            type="skill_gap",
            title=f"Learn {', '.join(top_missing)} to boost your {role} match",
            description="Focus on these missing core skills: " + " | ".join(resources),
            priority="High"
        ))

    # Recommendation 2: Match score based
    if score < 40:
        recommendations.append(Recommendation(
            type="career_path",
            title="Consider starting with a junior or intern role",
            description=f"Your current match score of {round(score)}% suggests building more experience first. Look for junior {role} positions or internships where you can grow while working.",
            priority="High"
        ))
    elif score < 70:
        recommendations.append(Recommendation(
            type="career_path",
            title=f"You are on track for a {role} role",
            description=f"With {round(score)}% match, you qualify for entry-level {role} positions. Complete your roadmap phases to reach 80%+ and unlock senior opportunities.",
            priority="Medium"
        ))
    else:
        recommendations.append(Recommendation(
            type="career_path",
            title=f"Strong match for {role} — apply now!",
            description=f"Your {round(score)}% match score qualifies you for most {role} job postings. Focus on polishing your portfolio and preparing for interviews.",
            priority="Low"
        ))

    # Recommendation 3: Portfolio
    if "git" not in skills_lower and "github" not in skills_lower:
        recommendations.append(Recommendation(
            type="portfolio",
            title="Set up a GitHub profile",
            description="Employers expect to see your code. Create a GitHub account, push your projects, and maintain a professional README. This is free and essential for any tech role.",
            priority="High"
        ))
    else:
        recommendations.append(Recommendation(
            type="portfolio",
            title="Strengthen your GitHub portfolio",
            description=f"Build 2-3 projects that showcase your {role} skills. Pin them on your GitHub profile. Include a live demo link and clear documentation for each project.",
            priority="Medium"
        ))

    # Recommendation 4: Certifications
    cert_map = {
        "aws": "AWS Cloud Practitioner certification (entry level, widely recognized)",
        "docker": "Docker Certified Associate (DCA)",
        "machine learning": "Google ML Professional Certificate (Coursera, audit free)",
        "python": "PCEP Python certification (entry level)",
        "postgresql": "EDB PostgreSQL Associate certification",
    }
    for skill in skills_lower:
        if skill in cert_map:
            recommendations.append(Recommendation(
                type="certification",
                title=f"Get certified in {skill.title()}",
                description=cert_map[skill],
                priority="Medium"
            ))
            break

    # Recommendation 5: Networking
    recommendations.append(Recommendation(
        type="networking",
        title="Build your professional network",
        description=f"Join LinkedIn groups for {role} professionals. Attend local tech meetups or online communities like Dev.to, Hashnode, or Discord servers for your tech stack. Referrals account for 40% of tech hires.",
        priority="Low"
    ))

    return RecommendationResponse(recommendations=recommendations)