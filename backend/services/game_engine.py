import logging
from datetime import datetime

from sqlmodel import Session, select

from config import settings
from models import ChatMessage, GameSession, JournalEntry, StateChangeLog
from services.context_builder import ContextBuilder
from services.journal_manager import JournalManager
from services.llm import ollama_service

logger = logging.getLogger(__name__)

class GameEngine:
    def __init__(self, db: Session):
        self.db = db
        self.context_builder = ContextBuilder(db)
        self.journal_manager = JournalManager(db)

    def process_action(self, session_id: int, user_input: str, language: str = "en") -> str:
        """
        Main game loop:
        1. Get session and context.
        2. Append user message to DB.
        3. Construct prompt.
        4. Get LLM response.
        5. Parse response for journal updates.
        6. Append AI message to DB.
        7. Check for summarization.
        """
        session = self.db.get(GameSession, session_id)
        if not session:
            raise ValueError("Session not found")

        # 1. Save User Message
        user_msg = ChatMessage(session_id=session_id, role="user", content=user_input)
        self.db.add(user_msg)
        self.db.commit()

        # 2. Build Context
        context = self.context_builder.build_context(session)

        # 3. Generate Response
        ai_response_text = ollama_service.generate_response(
            player_action=user_input,
            world_state=context["world_state"],
            conversation_history=context["conversation_history"],
            language=language
        )

        # 4. Save AI Message
        ai_msg = ChatMessage(session_id=session_id, role="assistant", content=ai_response_text)
        self.db.add(ai_msg)
        self.db.commit()

        # 5. Update Journal/World State (Async or Sync)
        self.journal_manager.update_world_state(session, user_input, ai_response_text, ai_msg, language=language)

        # 6. Check for Summarization
        self._check_summarization(session, language=language)

        return ai_response_text

    def _check_summarization(self, session: GameSession, language: str = "en"):
        """Checks if we need to summarize the history."""
        # Simple logic: Summarize every N messages
        # Or check token count (more complex)
        
        count = self.db.exec(
            select(ChatMessage).where(ChatMessage.session_id == session.id)
        ).all()
        
        if len(count) > 0 and len(count) % settings.SUMMARY_THRESHOLD == 0:
            # Trigger summarization
            # Get the last N messages to add to summary
            recent_msgs = count[-settings.SUMMARY_THRESHOLD:]
            recent_text = "\n".join([f"{m.role}: {m.content}" for m in recent_msgs])
            
            # Replace old summary with new consolidated one that includes previous summary + recent events
            new_summary = ollama_service.summarize_context(
                recent_text, 
                previous_summary=session.summary,
                language=language
            )
            
            session.summary = new_summary
            
            self.db.add(session)
            self.db.commit()

    def undo_last_move(self, session_id: int):
        """
        Undoes the last move by deleting the last user message and all subsequent messages.
        Note: This does not currently revert Journal/Character changes.
        """
        # Find the last user message
        last_user_msg = self.db.exec(
            select(ChatMessage)
            .where(ChatMessage.session_id == session_id)
            .where(ChatMessage.role == "user")
            .order_by(ChatMessage.timestamp.desc())  # type: ignore[attr-defined]
            .limit(1)
        ).first()

        if not last_user_msg:
            return False

        # Delete this message and all subsequent messages
        msgs_to_delete = self.db.exec(
            select(ChatMessage)
            .where(ChatMessage.session_id == session_id)
            .where(ChatMessage.timestamp >= last_user_msg.timestamp)
        ).all()

        # Collect IDs of messages to be deleted
        msg_ids = [m.id for m in msgs_to_delete]

        # Fetch StateChangeLogs for these messages
        logs = self.db.exec(
            select(StateChangeLog)
            .where(StateChangeLog.message_id.in_(msg_ids))  # type: ignore[attr-defined]
            .order_by(StateChangeLog.id.desc())  # type: ignore[attr-defined, union-attr]
        ).all()

        # Revert changes
        for log in logs:
            if log.operation == "create":
                # Undo create -> delete
                entity = self.db.get(JournalEntry, log.entity_id)
                if entity:
                    self.db.delete(entity)
            
            elif log.operation == "update":
                # Undo update -> restore previous state
                entity = self.db.get(JournalEntry, log.entity_id)
                if entity and log.previous_state:
                    for key, value in log.previous_state.items():
                        if key == "created_at":
                            value = datetime.fromisoformat(value)
                        setattr(entity, key, value)
                    self.db.add(entity)
            
            elif log.operation == "delete":
                # Undo delete -> recreate
                if log.previous_state:
                    # Add session_id back as it might not be in previous_state
                    data = log.previous_state.copy()
                    data["session_id"] = session_id
                    if "created_at" in data:
                        data["created_at"] = datetime.fromisoformat(data["created_at"])
                    
                    new_entry = JournalEntry(**data)
                    self.db.add(new_entry)
            
            # Delete the log entry
            self.db.delete(log)

        for msg in msgs_to_delete:
            self.db.delete(msg)
        
        self.db.commit()
        return True
