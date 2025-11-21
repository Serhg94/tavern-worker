from sqlmodel import Session, select

from models import ChatMessage, GameSession


class ContextBuilder:
    def __init__(self, db: Session):
        self.db = db

    def build_context(self, session: GameSession) -> dict:
        """Constructs the context for the LLM as structured data."""
        world_state_parts = []
        
        # Add Session Summary if exists
        if session.summary:
            world_state_parts.append(f"SUMMARY:\n{session.summary}")
        
        # Add Character Info (from journal entries)
        characters = [j for j in session.journal_entries if j.entry_type == "character"]
        if characters:
            chars_desc = "\n".join([f"- {c.title}: {c.content}" for c in characters])
            world_state_parts.append(f"CHARACTERS:\n{chars_desc}")

        # Add Active Quests (Journal)
        active_quests = [j for j in session.journal_entries if j.entry_type == "quest"]
        if active_quests:
            quests_desc = "\n".join([f"- {q.title}: {q.content}" for q in active_quests])
            world_state_parts.append(f"ACTIVE QUESTS:\n{quests_desc}")
        
        # Add Lore
        lore_entries = [j for j in session.journal_entries if j.entry_type == "lore"]
        if lore_entries:
            lore_desc = "\n".join([f"- {lore.title}: {lore.content}" for lore in lore_entries])
            world_state_parts.append(f"WORLD LORE:\n{lore_desc}")

        # Build Recent Chat History (Limit to last 10 messages to fit context)
        recent_messages = self.db.exec(
            select(ChatMessage)
            .where(ChatMessage.session_id == session.id)
            .order_by(ChatMessage.timestamp.desc())  # type: ignore[attr-defined]
            .limit(10)
        ).all()
        
        # Reverse back to chronological order
        recent_messages = recent_messages[::-1]
        
        # Format conversation history
        history_text = "\n".join([f"{m.role.upper()}: {m.content}" for m in recent_messages])

        return {
            "world_state": "\n\n".join(world_state_parts) if world_state_parts else "No world state yet.",
            "conversation_history": history_text if history_text else "This is the start of the game."
        }
