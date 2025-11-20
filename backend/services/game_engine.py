from sqlmodel import Session, select
from typing import List, Optional
from models import GameSession, ChatMessage, JournalEntry, Character
from services.llm import ollama_service
import logging

logger = logging.getLogger(__name__)

class GameEngine:
    def __init__(self, db: Session):
        self.db = db

    def process_action(self, session_id: int, user_input: str) -> str:
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
        context = self._build_context(session)

        # 3. Generate Response
        ai_response_text = ollama_service.generate_response(user_input, context)

        # 4. Save AI Message
        ai_msg = ChatMessage(session_id=session_id, role="assistant", content=ai_response_text)
        self.db.add(ai_msg)
        self.db.commit()

        # 5. Update Journal/World State (Async or Sync)
        self._update_world_state(session, user_input, ai_response_text)

        # 6. Check for Summarization
        self._check_summarization(session)

        return ai_response_text

    def _build_context(self, session: GameSession) -> str:
        """Constructs the context string for the LLM."""
        # Start with Session Summary if exists
        context_parts = []
        if session.summary:
            context_parts.append(f"PREVIOUSLY ON:\n{session.summary}")
        
        # Add Character Info
        if session.characters:
            chars_desc = "\n".join([f"- {c.name}: {c.description}" for c in session.characters])
            context_parts.append(f"CHARACTERS:\n{chars_desc}")

        # Add Active Quests (Journal)
        active_quests = [j for j in session.journal_entries if j.entry_type == "quest"]
        if active_quests:
            quests_desc = "\n".join([f"- {q.title}: {q.content}" for q in active_quests])
            context_parts.append(f"ACTIVE QUESTS:\n{quests_desc}")

        # Add Recent Chat History (Limit to last 10-20 messages to fit context)
        # We need to fetch them sorted by time
        recent_messages = self.db.exec(
            select(ChatMessage)
            .where(ChatMessage.session_id == session.id)
            .order_by(ChatMessage.timestamp.desc())
            .limit(20)
        ).all()
        
        # Reverse back to chronological order
        recent_messages = recent_messages[::-1]
        
        history_text = "\n".join([f"{m.role.upper()}: {m.content}" for m in recent_messages])
        context_parts.append(f"RECENT HISTORY:\n{history_text}")

        return "\n\n".join(context_parts)

    def _update_world_state(self, session: GameSession, user_input: str, ai_response_text: str):
        """Extracts updates and saves them to Journal/Characters."""
        # Fetch existing state to pass to LLM
        existing_quests = [j for j in session.journal_entries if j.entry_type == "quest"]
        existing_lore = [j for j in session.journal_entries if j.entry_type == "lore"]
        existing_characters = session.characters
        
        existing_state = {
            "quests": existing_quests,
            "lore": existing_lore,
            "characters": existing_characters
        }

        updates = ollama_service.extract_journal_updates(user_input, ai_response_text, existing_state)
        
        # Helper to process operations
        def process_items(items, model_class, type_filter=None):
            for item in items:
                op = item.get("operation")
                name = item.get("name")
                if not name: continue

                # Find existing
                query = select(model_class).where(model_class.session_id == session.id)
                if model_class == Character:
                    query = query.where(model_class.name == name)
                else:
                    query = query.where(model_class.title == name)
                    if type_filter:
                        query = query.where(model_class.entry_type == type_filter)
                
                existing = self.db.exec(query).first()

                if op == "add":
                    if not existing:
                        if model_class == Character:
                            new_obj = Character(
                                session_id=session.id,
                                name=name,
                                description=item.get("description"),
                                stats=item.get("stats", {})
                            )
                        else:
                            new_obj = JournalEntry(
                                session_id=session.id,
                                title=name,
                                content=item.get("description"),
                                entry_type=type_filter
                            )
                        self.db.add(new_obj)
                
                elif op == "update":
                    if existing:
                        if item.get("description"):
                            if model_class == Character:
                                existing.description = item.get("description")
                            else:
                                existing.content = item.get("description")
                        if model_class == Character and item.get("stats"):
                            existing.stats = item.get("stats")
                        self.db.add(existing)
                
                elif op == "delete":
                    if existing:
                        self.db.delete(existing)

        # Process Quests
        process_items(updates.get("quests", []), JournalEntry, "quest")
        
        # Process Lore
        process_items(updates.get("lore", []), JournalEntry, "lore")
        
        # Process Characters
        process_items(updates.get("characters", []), Character)
            
        self.db.commit()

    def _check_summarization(self, session: GameSession):
        """Checks if we need to summarize the history."""
        # Simple logic: Summarize every 20 messages
        # Or check token count (more complex)
        
        count = self.db.exec(
            select(ChatMessage).where(ChatMessage.session_id == session.id)
        ).all()
        
        if len(count) > 0 and len(count) % 20 == 0:
            # Trigger summarization
            # Get all messages since last summary (or all if no summary)
            # For simplicity, let's just summarize the last 20 messages and append to existing summary
            
            recent_msgs = count[-20:]
            text_to_summarize = "\n".join([f"{m.role}: {m.content}" for m in recent_msgs])
            
            new_summary_chunk = ollama_service.summarize_context(text_to_summarize)
            
            if session.summary:
                session.summary += f"\n\n{new_summary_chunk}"
            else:
                session.summary = new_summary_chunk
            
            self.db.add(session)
            self.db.commit()
