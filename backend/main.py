"""
ResumAgent - Backend API
Intelligent Academic Research Paper Summarization Agent
"""

import re
import io
import json
import logging
import os
import uuid
from datetime import datetime
from typing import Optional

import google.generativeai as genai
from fastapi import FastAPI, File, HTTPException, UploadFile, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel
import PyPDF2
from dotenv import load_dotenv

# --- DATABASE SETUP (SQLAlchemy) ---
from sqlalchemy import create_engine, Column, String, Text, DateTime, ForeignKey
from sqlalchemy.orm import declarative_base, sessionmaker, Session

SQLALCHEMY_DATABASE_URL = "sqlite:///./resumagent.db"
engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

class PaperDB(Base):
    __tablename__ = "papers"
    session_id = Column(String, primary_key=True, index=True)
    filename = Column(String)
    raw_text = Column(Text)
    summary_json = Column(Text) 
    created_at = Column(DateTime, default=datetime.utcnow)

class ChatMessageDB(Base):
    __tablename__ = "chat_messages"
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    session_id = Column(String, ForeignKey("papers.session_id"))
    role = Column(String) # 'user' or 'agent'
    content = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)

# Create tables in the SQLite database
Base.metadata.create_all(bind=engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# --- APP CONFIGURATION ---
# --- APP CONFIGURATION ---
load_dotenv()
genai.configure(api_key=os.getenv("GEMINI_API_KEY"))
logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("resumagent")

app = FastAPI(title="ResumAgent API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],          
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

MAX_TOKENS_APPROX = 30_000   
MAX_CHARS = MAX_TOKENS_APPROX * 4
TEMPERATURE = 0.3

REQUIRED_SECTIONS = ["Objective", "Methodology", "Key Findings", "Limitations", "Future Work"]

SYSTEM_PROMPT = """You are an expert academic research analyst. Produce a single, valid JSON object exactly like this:
{
  "Objective": "...",
  "Methodology": "...",
  "Key Findings": "...",
  "Limitations": "...",
  "Future Work": "..."
}
Output ONLY JSON. No markdown, no preamble."""

# --- TOOLKIT ---
def parse_pdf(file_bytes: bytes) -> str:
    reader = PyPDF2.PdfReader(io.BytesIO(file_bytes))
    pages = [page.extract_text() for page in reader.pages if page.extract_text()]
    if not pages:
        raise ValueError("Could not extract any text from the uploaded PDF.")
    return "\n\n".join(pages)

def preprocess_text(raw_text: str) -> str:
    text = re.sub(r"(\w)-\n(\w)", r"\1\2", raw_text)
    text = re.sub(r"^\s*\d+\s*$", "", text, flags=re.MULTILINE)
    text = re.sub(r"https?://\S+", "", text)
    return text.strip()

def call_llm_with_failover(prompt: str, require_json: bool = True):
    # Now we can use the modern, free, and lightning-fast models!
    model_registry = [
        {"name": "gemini-2.5-flash", "supports_json_mode": True},
        {"name": "gemini-2.5-flash-lite", "supports_json_mode": True}
    ]
    
    last_error = None
    
    for model_info in model_registry:
        model_name = model_info["name"]
        
        try:
            logger.info(f"Attempting inference with {model_name}...")
            
            gen_args = {"temperature": TEMPERATURE}
            if require_json:
                gen_args["response_mime_type"] = "application/json"
                
            model = genai.GenerativeModel(
                model_name=model_name,
                generation_config=genai.types.GenerationConfig(**gen_args),
            )
            
            response = model.generate_content(prompt)
            raw = response.text.strip()
            
            if not require_json:
                return raw 
                
            raw = raw.replace("```json", "").replace("```", "").strip()
            return json.loads(raw)
            
        except Exception as exc:
            logger.warning(f"Failed with {model_name}: {exc}")
            last_error = exc
            continue 
            
    print(f"\n{'='*50}\nFATAL GOOGLE ERROR:\n{last_error}\n{'='*50}\n")
    raise RuntimeError(f"All Google models failed. Last error: {last_error}")
# --- REQUEST MODELS ---
class ChatRequest(BaseModel):
    session_id: str
    question: str

# --- ROUTES ---
@app.post("/summarize/pdf")
async def summarize_pdf(file: UploadFile = File(...), db: Session = Depends(get_db)):
    session_key = str(uuid.uuid4())
    file_bytes = await file.read()
    
    clean_text = preprocess_text(parse_pdf(file_bytes))
    prompt = f"{SYSTEM_PROMPT}\n\n=== PAPER ===\n{clean_text}\n=== END ===\nProvide JSON:"
    result = call_llm_with_failover(prompt, require_json=True)

    db_paper = PaperDB(
        session_id=session_key,
        filename=file.filename,
        raw_text=clean_text,
        summary_json=json.dumps(result)
    )
    db.add(db_paper)
    db.commit()

    return JSONResponse(content={"success": True, "source": file.filename, "session_id": session_key, "summary": result})

@app.post("/chat")
async def chat_with_paper(body: ChatRequest, db: Session = Depends(get_db)):
    paper = db.query(PaperDB).filter(PaperDB.session_id == body.session_id).first()
    if not paper:
        raise HTTPException(status_code=404, detail="Paper not found in database.")

    db_msg_user = ChatMessageDB(session_id=body.session_id, role="user", content=body.question)
    db.add(db_msg_user)
    db.commit()

    prompt = (
        f"You are a helpful AI research assistant.\n"
        f"=== RESEARCH PAPER ===\n{paper.raw_text}\n=== END OF PAPER ===\n\n"
        f"User Question: {body.question}\n\n"
        f"Answer clearly and concisely based strictly on the paper. Use markdown for lists if needed."
    )
    answer = call_llm_with_failover(prompt, require_json=False)

    db_msg_agent = ChatMessageDB(session_id=body.session_id, role="agent", content=answer)
    db.add(db_msg_agent)
    db.commit()

    return JSONResponse(content={"answer": answer})

@app.get("/history")
async def get_history(db: Session = Depends(get_db)):
    papers = db.query(PaperDB).order_by(PaperDB.created_at.desc()).all()
    return [{"session_id": p.session_id, "filename": p.filename, "date": p.created_at} for p in papers]

@app.get("/history/{session_id}")
async def get_paper_details(session_id: str, db: Session = Depends(get_db)):
    paper = db.query(PaperDB).filter(PaperDB.session_id == session_id).first()
    if not paper:
        raise HTTPException(status_code=404, detail="Paper not found")
    
    chats = db.query(ChatMessageDB).filter(ChatMessageDB.session_id == session_id).order_by(ChatMessageDB.created_at.asc()).all()
    return {
        "summary": json.loads(paper.summary_json),
        "source": paper.filename,
        "chat_history": [{"role": c.role, "text": c.content} for c in chats]
    }
@app.delete("/history")
async def clear_all_history(db: Session = Depends(get_db)):
    try:
        # Delete chats first to avoid foreign key conflicts, then delete the papers
        db.query(ChatMessageDB).delete()
        db.query(PaperDB).delete()
        db.commit()
        return {"success": True, "message": "All history permanently deleted."}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")