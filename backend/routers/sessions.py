
from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select

from database import get_session
from models import GameSession

router = APIRouter(
    prefix="/sessions",
    tags=["sessions"],
    responses={404: {"description": "Not found"}},
)

@router.post("/", response_model=GameSession)
def create_session(session_data: GameSession, db: Session = Depends(get_session)):
    """Create a new game session."""
    db.add(session_data)
    db.commit()
    db.refresh(session_data)
    return session_data

@router.get("/", response_model=list[GameSession])
def read_sessions(skip: int = 0, limit: int = 100, db: Session = Depends(get_session)):
    """List all game sessions."""
    sessions = db.exec(select(GameSession).offset(skip).limit(limit)).all()
    return sessions

@router.get("/{session_id}", response_model=GameSession)
def read_session(session_id: int, db: Session = Depends(get_session)):
    """Get a specific game session by ID."""
    session = db.get(GameSession, session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    return session

@router.delete("/{session_id}")
def delete_session(session_id: int, db: Session = Depends(get_session)):
    """Delete a game session."""
    session = db.get(GameSession, session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    # Cascade delete should be handled by database relationships if configured, 
    # but SQLModel/SQLAlchemy might need explicit deletion if not set up with cascade.
    # For now, we'll just delete the session and let the DB handle constraints or errors.
    # Ideally, we should delete related messages/characters/journal entries first or use CASCADE in models.
    
    db.delete(session)
    db.commit()
    return {"ok": True}
