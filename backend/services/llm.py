import requests
import json
import logging
from typing import Dict, Any, Optional
from config import settings

logger = logging.getLogger(__name__)

class OllamaService:
    def __init__(self, base_url: str = settings.OLLAMA_BASE_URL, model: str = settings.OLLAMA_MODEL):
        self.base_url = base_url
        self.model = model

    def _generate(self, prompt: str, system: str = "", stream: bool = False) -> str:
        """Generic method to call Ollama generate API."""
        url = f"{self.base_url}/api/generate"
        payload = {
            "model": self.model,
            "prompt": prompt,
            "system": system,
            "stream": stream
        }
        
        try:
            logger.debug('REQUEST: %s', prompt)
            response = requests.post(url, json=payload)
            response.raise_for_status()
            if stream:
                # Handle streaming if needed, for now just return full text
                pass 
            rsp = response.json().get("response", "")
            logger.debug('RESPONSE: %s', rsp)
            return rsp
        except requests.RequestException as e:
            logger.error(f"Error calling Ollama: {e}")
            return f"Error: {str(e)}"

    def generate_response(self, prompt: str, context: str) -> str:
        """Generates a response for the game."""
        system_prompt = (
            "You are an AI Game Master for a role-playing game. "
            "Your goal is to provide immersive descriptions, manage the world state, and respond to player actions. "
            "Keep responses engaging but concise enough for a chat interface. "
            "Use the provided context to maintain continuity."
        )
        full_prompt = f"Context:\n{context}\n\nPlayer Action:\n{prompt}"
        return self._generate(full_prompt, system=system_prompt)

    def summarize_context(self, text: str) -> str:
        """Summarizes the given text to save context window."""
        system_prompt = "Summarize the following game session log into a concise narrative that preserves key events, character status, and active quests."
        return self._generate(text, system=system_prompt)

    def extract_journal_updates(self, user_input: str, ai_response_text: str, existing_state: Dict[str, Any] = None) -> Dict[str, Any]:
        """
        Analyzes the last turn to extract updates for the journal (quests, characters, etc.).
        Returns a JSON object.
        """
        # Serialize existing state for the LLM
        serialized_state = {}
        if existing_state:
            serialized_state["quests"] = [
                {"name": q.title, "description": q.content} 
                for q in existing_state.get("quests", [])
            ]
            serialized_state["lore"] = [
                {"name": l.title, "description": l.content} 
                for l in existing_state.get("lore", [])
            ]
            serialized_state["characters"] = [
                {"name": c.name, "description": c.description, "stats": c.stats} 
                for c in existing_state.get("characters", [])
            ]

        json_data = {
            "user_request": user_input,
            "game_master_response": ai_response_text,
            "existing_state": serialized_state
        }
        system_prompt = (
            "Analyze this data about the last RPG turn in JSON and extract any updates to quests, characters, or world lore in existing_state. "
            "Return ONLY a valid JSON object with keys: 'quests', 'characters', 'lore'. "
            "Each key should contain a list of objects with: "
            "- 'operation': 'add', 'update', or 'delete'. "
            "- 'name': The identifier (title for quests/lore, name for characters). MUST match an existing name exactly for updates/deletes. "
            "- 'description': The new content or description (for add/update). "
            "- 'stats': (Only for characters) A dictionary of stats if mentioned (e.g. {'hp': 10}). "
            "Example: {'quests': [{'operation': 'add', 'name': 'Find the Ring', 'description': '...'}]}. "
            "If nothing new, return empty lists. Return only the JSON object, nothing else.\n\n"
        )
        response = self._generate(json.dumps(json_data), system=system_prompt)
        try:
            # Attempt to clean markdown code blocks if present
            # clean_response = response.replace("```json", "").replace("```", "").strip()
            clean_response = response[response.find('{'):response.rfind('}')+1]
            return json.loads(clean_response)
        except json.JSONDecodeError:
            logger.warning(f"Failed to parse JSON from LLM: {response}")
            return {}

# Singleton instance or factory can be used
ollama_service = OllamaService()
