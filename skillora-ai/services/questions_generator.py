from fastapi import APIRouter
from pydantic import BaseModel
from typing import List
import json
import urllib.request
import os

router = APIRouter()

OLLAMA_URL = os.getenv("OLLAMA_URL", "http://localhost:11434")
OLLAMA_MODEL = os.getenv("OLLAMA_MODEL", "llama3")

class QuestionsRequest(BaseModel):
    skills: List[str]
    target_role: str

class Question(BaseModel):
    category: str
    question: str
    difficulty: str

class QuestionsResponse(BaseModel):
    questions: List[Question]
    role: str

@router.post("/generate", response_model=QuestionsResponse)
def generate_questions(request: QuestionsRequest):
    role = request.target_role or "Software Developer"
    skills = ", ".join(request.skills[:8]) if request.skills else "general programming"

    prompt = f"""You are a technical interviewer. Generate exactly 10 interview questions for a {role} position.
The candidate has these skills: {skills}.

Generate a mix of:
- 3 Technical questions (specific to their skills)
- 3 Behavioral questions (STAR method)
- 2 Problem-solving questions
- 2 Role-specific questions

Respond ONLY with a valid JSON array, no other text:
[
  {{"category": "Technical", "question": "...", "difficulty": "Medium"}},
  {{"category": "Behavioral", "question": "...", "difficulty": "Easy"}},
  ...
]

Difficulties must be: Easy, Medium, or Hard."""

    try:
        payload = json.dumps({
            "model": OLLAMA_MODEL,
            "messages": [{"role": "user", "content": prompt}],
            "stream": False
        }).encode("utf-8")

        req = urllib.request.Request(
            f"{OLLAMA_URL}/api/chat",
            data=payload,
            headers={"Content-Type": "application/json"},
            method="POST"
        )

        with urllib.request.urlopen(req, timeout=60) as response:
            result = json.loads(response.read())
            content = result["message"]["content"]

            # Extract JSON from response
            start = content.find("[")
            end = content.rfind("]") + 1
            if start != -1 and end > start:
                questions_data = json.loads(content[start:end])
                questions = [Question(**q) for q in questions_data]
            else:
                raise ValueError("No JSON found")

    except Exception as e:
        print(f"Ollama error: {e}")
        # Fallback questions if Ollama fails
        questions = [
            Question(category="Technical", question=f"Explain your experience with {request.skills[0] if request.skills else 'programming'}.", difficulty="Easy"),
            Question(category="Behavioral", question="Tell me about a challenging project and how you handled it.", difficulty="Medium"),
            Question(category="Problem-solving", question=f"How would you approach building a scalable {role} system?", difficulty="Hard"),
            Question(category="Role-specific", question=f"What do you consider the most important skill for a {role}?", difficulty="Easy"),
        ]

    return QuestionsResponse(questions=questions, role=role)