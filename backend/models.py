from datetime import datetime

from sqlmodel import JSON, Field, Relationship, SQLModel


class GameSession(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)
    name: str
    start_prompt: str
    summary: str | None = Field(default=None)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    
    messages: list["ChatMessage"] = Relationship(back_populates="session", cascade_delete=True)
    journal_entries: list["JournalEntry"] = Relationship(back_populates="session", cascade_delete=True)

class ChatMessage(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)
    session_id: int = Field(foreign_key="gamesession.id")
    role: str # user, assistant, system
    content: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    
    session: GameSession = Relationship(back_populates="messages")

class JournalEntry(SQLModel, table=True):
    # Entity metadata
    entity_type_name: str = "journal_entry"
    name_field: str = "title"
    content_field: str = "content"
    
    id: int | None = Field(default=None, primary_key=True)
    session_id: int = Field(foreign_key="gamesession.id")
    title: str
    content: str
    entry_type: str # quest, lore, character
    created_at: datetime = Field(default_factory=datetime.utcnow)
    
    session: GameSession = Relationship(back_populates="journal_entries")

class StateChangeLog(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)
    session_id: int = Field(foreign_key="gamesession.id")
    message_id: int = Field(foreign_key="chatmessage.id")
    entity_type: str # "journal_entry"
    entity_id: int
    operation: str # "create", "update", "delete"
    previous_state: dict | None = Field(default=None, sa_type=JSON)
    created_at: datetime = Field(default_factory=datetime.utcnow)
