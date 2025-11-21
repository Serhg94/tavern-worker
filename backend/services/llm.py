import json
import logging
from abc import ABC, abstractmethod
from typing import Any

import requests

from config import settings
from prompts import get_prompt

logger = logging.getLogger(__name__)

class LLMProvider(ABC):
    @abstractmethod
    def generate(self, prompt: str, system: str = "", stream: bool = False, json_format: bool = False) -> str:
        pass

class OllamaService(LLMProvider):
    def __init__(self, base_url: str = settings.OLLAMA_BASE_URL, model: str = settings.OLLAMA_MODEL):
        self.base_url = base_url
        self.model = model

    def generate(self, prompt: str, system: str = "", stream: bool = False, json_format: bool = False) -> str:
        """Generic method to call Ollama generate API."""
        url = f"{self.base_url}/api/generate"
        payload = {
            "model": self.model,
            "prompt": prompt,
            "system": system,
            "stream": stream,
            "format": "json" if json_format else None
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

    def generate_response(
        self, 
        player_action: str, 
        world_state: str, 
        conversation_history: str, 
        language: str = "en"
    ) -> str:
        """Generates a response for the game."""
        system_prompt = get_prompt("game_master", language)
        
        full_prompt = (
            f"<world_state>\n{world_state}\n</world_state>\n\n"
            f"<conversation_history>\n{conversation_history}\n</conversation_history>\n\n"
            f"<player_action>\n{player_action}\n</player_action>"
        )
        
        return self.generate(full_prompt, system=system_prompt)

    def summarize_context(self, text: str, previous_summary: str | None = None, language: str = "en") -> str:
        """Summarizes the given text to save context window."""
        system_prompt = get_prompt("summarizer", language)
        
        if previous_summary:
            full_text = f"<previous_summary>\n{previous_summary}\n</previous_summary>\n\n<recent_events>\n{text}\n</recent_events>"
        else:
            full_text = text
            
        return self.generate(full_text, system=system_prompt)

    def extract_journal_updates(
        self, 
        user_input: str, 
        ai_response_text: str, 
        serialized_state: dict[str, Any], 
        language: str = "en"
    ) -> dict[str, Any]:
        """
        Analyzes the last turn to extract updates for the journal (quests, characters, etc.).
        Returns a JSON object.
        
        Args:
            user_input: User's input text
            ai_response_text: AI's response text
            serialized_state: Already serialized game state (dict with summary, quests, lore, characters)
            language: Language for prompts
        """
        system_prompt_template = get_prompt("journal_extractor", language)
        
        # Format the prompt with data
        prompt = system_prompt_template.format(
            existing_state=json.dumps(serialized_state, ensure_ascii=False, indent=2),
            user_request=user_input,
            game_master_response=ai_response_text
        )
        
        try:
            response = self.generate(prompt, system="", json_format=True)
            return json.loads(response)
        except json.JSONDecodeError:
            logger.warning(f"Failed to parse JSON from LLM: {response}")
            return {}

# Singleton instance or factory can be used
ollama_service = OllamaService()
