from typing import Optional, List
from datetime import datetime
from sqlmodel import Field, SQLModel, Relationship, JSON

class GameSession(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    name: str
    start_prompt: str
    summary: Optional[str] = Field(default=None)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    
    messages: List["ChatMessage"] = Relationship(back_populates="session", cascade_delete=True)
    characters: List["Character"] = Relationship(back_populates="session", cascade_delete=True)
    journal_entries: List["JournalEntry"] = Relationship(back_populates="session", cascade_delete=True)

class ChatMessage(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    session_id: int = Field(foreign_key="gamesession.id")
    role: str # user, assistant, system
    content: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    
    session: GameSession = Relationship(back_populates="messages")

class Character(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    session_id: int = Field(foreign_key="gamesession.id")
    name: str
    description: Optional[str] = None
    stats: dict = Field(default={}, sa_type=JSON)
    
    session: GameSession = Relationship(back_populates="characters")

class JournalEntry(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    session_id: int = Field(foreign_key="gamesession.id")
    title: str
    content: str
    entry_type: str # quest, lore, note
    created_at: datetime = Field(default_factory=datetime.utcnow)
    
    session: GameSession = Relationship(back_populates="journal_entries")
