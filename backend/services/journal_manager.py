from typing import Any

from sqlmodel import Session, select

from models import ChatMessage, GameSession, JournalEntry, StateChangeLog


class JournalManager:
    def __init__(self, db: Session):
        self.db = db

    def update_world_state(
        self, 
        session: GameSession, 
        user_input: str, 
        ai_response_text: str, 
        ai_msg: ChatMessage, 
        language: str = "en"
    ):
        """Extracts updates and saves them to Journal/Characters."""
        from services.llm import ollama_service
        
        # Serialize current state for LLM
        serialized_state = self._serialize_state(session)

        updates = ollama_service.extract_journal_updates(
            user_input, ai_response_text, serialized_state, language=language
        )
        
        # Process each type - all are JournalEntry now!
        self._process_items(session, ai_msg, updates.get("quests", []), "quest")
        self._process_items(session, ai_msg, updates.get("lore", []), "lore")
        self._process_items(session, ai_msg, updates.get("characters", []), "character")
            
        self.db.commit()

    def _serialize_state(self, session: GameSession) -> dict[str, Any]:
        """Serialize game state for LLM."""
        quests = [j for j in session.journal_entries if j.entry_type == "quest"]
        lore = [j for j in session.journal_entries if j.entry_type == "lore"]
        characters = [j for j in session.journal_entries if j.entry_type == "character"]
        
        return {
            "summary": session.summary or "",
            "quests": [{"name": q.title, "description": q.content} for q in quests],
            "lore": [{"name": l.title, "description": l.content} for l in lore],
            "characters": [{"name": c.title, "description": c.content} for c in characters]
        }

    def _process_items(
        self,
        session: GameSession,
        ai_msg: ChatMessage,
        items: list[dict[str, Any]],
        entry_type: str
    ):
        """Process items - all are JournalEntry with different types."""
        for item in items:
            operation = item.get("operation", "add")
            name = item.get("name", item.get("key"))
            description = item.get("description", item.get("value"))
            
            if not name:
                continue

            existing = self._find_existing(session, name, entry_type)
            
            # Normalize operation
            if existing and operation == "add":
                operation = "update"
            elif not existing and operation == "update":
                operation = "add"

            if operation == "add" and not existing:
                self._create_entry(session, ai_msg, name, description or "", entry_type)
            elif operation == "update" and existing:
                self._update_entry(session, ai_msg, existing, description or "")
            elif operation == "delete" and existing:
                self._delete_entry(ai_msg, existing)

    def _find_existing(
        self,
        session: GameSession,
        name: str,
        entry_type: str
    ) -> JournalEntry | None:
        """Find existing journal entry."""
        return self.db.exec(
            select(JournalEntry)
            .where(JournalEntry.session_id == session.id)
            .where(JournalEntry.title == name)
            .where(JournalEntry.entry_type == entry_type)
        ).first()

    def _create_entry(
        self,
        session: GameSession,
        ai_msg: ChatMessage,
        name: str,
        description: str,
        entry_type: str
    ):
        """Create new journal entry."""
        entry = JournalEntry(
            session_id=session.id,
            title=name,
            content=description,
            entry_type=entry_type
        )
        
        self.db.add(entry)
        self.db.flush()
        
        self._log_change(session.id, ai_msg, entry.id, "create", None)

    def _update_entry(
        self,
        session: GameSession,
        ai_msg: ChatMessage,
        entry: JournalEntry,
        description: str
    ):
        """Update existing journal entry."""
        # Capture previous state using model_dump with JSON mode
        prev_state = entry.model_dump(mode='json', exclude={'session'})
        
        if description:
            entry.content = description
        
        self.db.add(entry)
        self._log_change(
            session.id,
            ai_msg,
            entry.id,  # type: ignore[arg-type]
            "update",
            prev_state
        )

    def _delete_entry(
        self,
        ai_msg: ChatMessage,
        entry: JournalEntry
    ):
        """Delete journal entry."""
        entry_id = entry.id
        session_id = entry.session_id
        
        # Capture previous state using model_dump with JSON mode
        prev_state = entry.model_dump(mode='json', exclude={'session'})
        
        self.db.delete(entry)
        self._log_change(
            session_id,  # type: ignore[arg-type]
            ai_msg, 
            entry_id, 
            "delete", 
            prev_state
        )

    def _log_change(
        self,
        session_id: int,
        ai_msg: ChatMessage,
        entity_id: int | None,
        operation: str,
        previous_state: dict[str, Any] | None
    ):
        """Create state change log."""
        log = StateChangeLog(
            session_id=session_id,
            message_id=ai_msg.id,
            entity_type="journal_entry",
            entity_id=entity_id,
            operation=operation,
            previous_state=previous_state
        )
        self.db.add(log)