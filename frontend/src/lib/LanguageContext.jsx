import React, { createContext, useState, useContext } from 'react';

const LanguageContext = createContext();

const translations = {
    en: {
        // Game.jsx
        loading_adventure: "Loading adventure...",
        adventure_begins: "The adventure begins...",
        undo_last_move: "Undo last move",
        undo_confirm: "Are you sure you want to undo the last move?",
        undo_failed: "Failed to undo move",

        // ChatInterface.jsx
        game_master_thinking: "The Game Master is thinking...",
        what_do_you_do: "What do you do?",

        // Journal.jsx
        tab_quests: "Quests",
        tab_characters: "Characters",
        tab_lore: "Lore",
        no_active_quests: "No active quests.",
        no_known_characters: "No known characters.",
        no_lore_entries: "No lore entries.",
    },
    ru: {
        // Game.jsx
        loading_adventure: "Загрузка приключения...",
        adventure_begins: "Приключение начинается...",
        undo_last_move: "Отменить последний ход",
        undo_confirm: "Вы уверены, что хотите отменить последний ход?",
        undo_failed: "Не удалось отменить ход",

        // ChatInterface.jsx
        game_master_thinking: "Мастер Игры размышляет...",
        what_do_you_do: "Что вы будете делать?",

        // Journal.jsx
        tab_quests: "Квесты",
        tab_characters: "Персонажи",
        tab_lore: "Лор",
        no_active_quests: "Нет активных квестов.",
        no_known_characters: "Нет известных персонажей.",
        no_lore_entries: "Нет записей в лоре.",
    }
};

export const LanguageProvider = ({ children }) => {
    const [language, setLanguageState] = useState(() => {
        return localStorage.getItem('language') || 'en';
    });

    const setLanguage = (lang) => {
        setLanguageState(lang);
        localStorage.setItem('language', lang);
    };

    const t = (key) => {
        return translations[language][key] || key;
    };

    return (
        <LanguageContext.Provider value={{ language, setLanguage, t }}>
            {children}
        </LanguageContext.Provider>
    );
};

export const useLanguage = () => useContext(LanguageContext);
