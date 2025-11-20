from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select
from typing import List, Dict, Any
from pydantic import BaseModel
from database import get_session
from models import ChatMessage, JournalEntry, Character
from services.game_engine import GameEngine

router = APIRouter(
    prefix="/sessions/{session_id}",
    tags=["game"],
    responses={404: {"description": "Not found"}},
)

class ActionRequest(BaseModel):
    action: str

class ActionResponse(BaseModel):
    response: str

@router.post("/action", response_model=ActionResponse)
def send_action(session_id: int, request: ActionRequest, db: Session = Depends(get_session)):
    """Process a user action in the game."""
    engine = GameEngine(db)
    try:
        response_text = engine.process_action(session_id, request.action)
        return ActionResponse(response=response_text)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/history", response_model=List[ChatMessage])
def get_history(session_id: int, db: Session = Depends(get_session)):
    """Get chat history for the session."""
    messages = db.exec(
        select(ChatMessage)
        .where(ChatMessage.session_id == session_id)
        .order_by(ChatMessage.timestamp)
    ).all()
    return messages

@router.get("/journal", response_model=List[JournalEntry])
def get_journal(session_id: int, db: Session = Depends(get_session)):
    """Get journal entries for the session."""
    entries = db.exec(
        select(JournalEntry)
        .where(JournalEntry.session_id == session_id)
    ).all()
    return entries

@router.get("/characters", response_model=List[Character])
def get_characters(session_id: int, db: Session = Depends(get_session)):
    """Get characters for the session."""
    chars = db.exec(
        select(Character)
        .where(Character.session_id == session_id)
    ).all()
    return chars
