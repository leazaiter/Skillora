from fastapi import APIRouter
from pydantic import BaseModel
from typing import List
import urllib.request
import json
import os

router = APIRouter()

OLLAMA_URL = os.getenv("OLLAMA_URL", "http://localhost:11434")
OLLAMA_MODEL = os.getenv("OLLAMA_MODEL", "llama3")

SYSTEM_PROMPT = """You are Alex, a professional technical interviewer conducting a real job interview.
You are interviewing a candidate for the role of {role}.
The candidate has these skills: {skills}.

Rules:
- Ask ONE question at a time
- Start with a warm introduction and your first question
- Ask technical questions relevant to their skills and role
- Ask behavioral questions using STAR method
- React naturally to their answers and follow up when needed
- After 6-8 exchanges, wrap up the interview professionally
- Be encouraging but professional
- Keep responses concise (2-4 sentences max)
- Do NOT say you are an AI. You are Alex, a human interviewer."""

class Message(BaseModel):
    role: str
    content: str

class InterviewRequest(BaseModel):
    messages: List[Message]
    skills: List[str]
    target_role: str
    user_name: str = "Candidate"

class InterviewResponse(BaseModel):
    reply: str
    is_complete: bool

@router.post("/chat", response_model=InterviewResponse)
def interview_chat(request: InterviewRequest):
    role = request.target_role or "Software Developer"
    skills = ", ".join(request.skills[:6]) if request.skills else "general programming"

    system = SYSTEM_PROMPT.format(role=role, skills=skills)

    # Build conversation history
    messages = []
    for m in request.messages:
        messages.append({
            "role": "user" if m.role == "user" else "assistant",
            "content": m.content
        })

    # If no messages yet, start the interview
    if not messages:
        messages = [{"role": "user", "content": "Please start the interview now."}]

    # Call Ollama API
    payload = json.dumps({
        "model": OLLAMA_MODEL,
        "messages": [{"role": "system", "content": system}] + messages,
        "stream": False
    }).encode("utf-8")

    try:
        req = urllib.request.Request(
            f"{OLLAMA_URL}/api/chat",
            data=payload,
            headers={"Content-Type": "application/json"},
            method="POST"
        )
        with urllib.request.urlopen(req, timeout=60) as response:
            result = json.loads(response.read())
            reply = result["message"]["content"]
    except Exception as e:
        print(f"Ollama error: {e}")
        reply = "I apologize, I'm having a connection issue. Could you please repeat your answer?"

    is_complete = len(request.messages) >= 14

    return InterviewResponse(reply=reply, is_complete=is_complete)