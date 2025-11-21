
import logging
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlmodel import Session, select

from database import get_session
from models import ChatMessage, JournalEntry
from services.game_engine import GameEngine

logger = logging.getLogger(__name__)

router = APIRouter(
    prefix="/sessions/{session_id}",
    tags=["game"],
    responses={404: {"description": "Not found"}},
)

class ActionRequest(BaseModel):
    action: str
    language: str = "en"

class ActionResponse(BaseModel):
    response: str

@router.post("/action", response_model=ActionResponse)
def send_action(session_id: int, request: ActionRequest, db: Session = Depends(get_session)):
    """Process a user action in the game."""
    engine = GameEngine(db)
    try:
        response_text = engine.process_action(session_id, request.action, language=request.language)
        return ActionResponse(response=response_text)
    except ValueError as e:
        logger.error(f"ValueError in send_action for session {session_id}: {e}")
        raise HTTPException(status_code=404, detail=str(e)) from e
    except Exception as e:
        logger.exception(f"Unexpected error in send_action for session {session_id}")
        raise HTTPException(status_code=500, detail=str(e)) from e

@router.post("/undo", response_model=dict[str, bool])
def undo_action(session_id: int, db: Session = Depends(get_session)):
    """Undo the last user action."""
    engine = GameEngine(db)
    success = engine.undo_last_move(session_id)
    if not success:
        raise HTTPException(status_code=400, detail="No moves to undo")
    return {"success": True}

@router.get("/history", response_model=list[ChatMessage])
def get_history(
    session_id: int, 
    limit: int = 20, 
    offset: int = 0, 
    db: Session = Depends(get_session)
):
    """Get chat history for the session with pagination."""
    # Get messages ordered by newest first to apply limit/offset correctly from the end
    messages = db.exec(
        select(ChatMessage)
        .where(ChatMessage.session_id == session_id)
        .order_by(ChatMessage.timestamp.desc())  # type: ignore[attr-defined]
        .offset(offset)
        .limit(limit)
    ).all()
    
    # Reverse to return in chronological order (oldest first)
    return list(reversed(messages))

@router.get("/journal", response_model=list[JournalEntry])
def get_journal(session_id: int, db: Session = Depends(get_session)):
    """Get journal entries for the session."""
    entries = db.exec(
        select(JournalEntry)
        .where(JournalEntry.session_id == session_id)
    ).all()
    return entries

@router.get("/characters", response_model=list[JournalEntry])
def get_characters(session_id: int, db: Session = Depends(get_session)):
    """Get characters for the session."""
    chars = db.exec(
        select(JournalEntry)
        .where(JournalEntry.session_id == session_id)
        .where(JournalEntry.entry_type == "character")
    ).all()
    return chars
