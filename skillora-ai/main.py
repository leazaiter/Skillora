from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
import os

load_dotenv()

app = FastAPI(title="Skillora AI Service")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:3001"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

from services.cv_analyzer import router as cv_router
from services.job_matcher import router as job_router
from services.role_suggester import router as role_router
from services.cover_letter import router as cover_letter_router
from services.interviewer import router as interview_router
from services.questions_generator import router as questions_router
from services.recommendations import router as recommendations_router
from services.embeddings import router as embeddings_router

app.include_router(embeddings_router, prefix="/api/embeddings", tags=["Embeddings"])
app.include_router(recommendations_router, prefix="/api/recommendations", tags=["Recommendations"])
app.include_router(questions_router, prefix="/api/questions", tags=["Questions Generator"])
app.include_router(interview_router, prefix="/api/interview", tags=["Interview"])
app.include_router(cover_letter_router, prefix="/api/cover-letter", tags=["Cover Letter"])
app.include_router(cv_router, prefix="/api/cv", tags=["CV Analysis"])
app.include_router(job_router, prefix="/api/jobs", tags=["Job Matching"])
app.include_router(role_router, prefix="/api/roles", tags=["Role Suggestions"])

@app.get("/")
def health_check():
    return {"status": "Skillora AI Service is running"}