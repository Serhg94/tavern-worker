import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    Box,
    AppBar,
    Toolbar,
    IconButton,
    Typography,
    Drawer,
    useMediaQuery,
    useTheme,
} from '@mui/material';
import {
    ArrowBack as ArrowBackIcon,
    Menu as MenuIcon,
    Language as LanguageIcon,
    Undo as UndoIcon,
} from '@mui/icons-material';
import {
    Menu,
    MenuItem,
} from '@mui/material';
import api from '../api/client';
import ChatInterface from '../components/ChatInterface';
import Journal from '../components/Journal';
import { useLanguage } from '../lib/LanguageContext';

const Game = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('lg'));

    const [session, setSession] = useState(null);
    const [messages, setMessages] = useState([]);
    const [journalEntries, setJournalEntries] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [journalOpen, setJournalOpen] = useState(!isMobile);
    const { language, setLanguage, t } = useLanguage();
    const [anchorEl, setAnchorEl] = useState(null);

    const [hasMore, setHasMore] = useState(true);

    useEffect(() => {
        fetchGameState();
    }, [id]);

    const fetchGameState = async () => {
        try {
            const [sessionRes, historyRes, journalRes] = await Promise.all([
                api.get(`/sessions/${id}`),
                api.get(`/sessions/${id}/history?limit=20&offset=0`),
                api.get(`/sessions/${id}/journal`),
            ]);

            setSession(sessionRes.data);
            setMessages(historyRes.data);
            setHasMore(historyRes.data.length === 20);
            setJournalEntries(journalRes.data);
        } catch (error) {
            console.error('Error fetching game state:', error);
        }
    };

    const handleLoadMore = async () => {
        try {
            const offset = messages.length;
            const response = await api.get(`/sessions/${id}/history?limit=20&offset=${offset}`);
            const olderMessages = response.data;

            if (olderMessages.length < 20) {
                setHasMore(false);
            }

            if (olderMessages.length > 0) {
                setMessages((prev) => [...olderMessages, ...prev]);
            }
            return olderMessages.length;
        } catch (error) {
            console.error('Error loading more messages:', error);
            return 0;
        }
    };

    const handleSendMessage = async (text) => {
        const tempMsg = {
            role: 'user',
            content: text,
            timestamp: new Date().toISOString(),
            id: 'temp-' + Date.now(),
        };
        setMessages((prev) => [...prev, tempMsg]);
        setIsLoading(true);

        try {
            await api.post(`/sessions/${id}/action`, { action: text, language });

            // Refresh everything and get the latest messages
            const [historyRes, journalRes] = await Promise.all([
                api.get(`/sessions/${id}/history?limit=20&offset=0`),
                api.get(`/sessions/${id}/journal`),
            ]);

            // Merge new messages with existing ones
            setMessages((prev) => {
                const newMessages = historyRes.data;
                // Create a map of existing messages by ID
                const existingIds = new Set(prev.map(m => m.id));
                // Filter out duplicates from new messages
                // Append unique new messages to the end (since we are accumulating)
                // Wait, historyRes.data is sorted chronologically (oldest to newest)
                // But we want to ensure we don't duplicate.
                // Actually, simpler: just take the last N messages from response and append?
                // No, safer to de-duplicate.

                // If we just sent a message, we expect it to be at the end.
                // We might have 'temp' messages in 'prev' that we want to replace.
                // The 'temp' message has a different ID.

                // Let's just replace the whole list if it's small, or merge if large.
                // For simplicity and robustness:
                // 1. Remove temp messages from prev
                const realMessages = prev.filter(m => !String(m.id).startsWith('temp-'));

                // 2. Merge with new messages based on ID
                const msgMap = new Map();
                realMessages.forEach(m => msgMap.set(m.id, m));
                newMessages.forEach(m => msgMap.set(m.id, m));

                return Array.from(msgMap.values()).sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
            });

            setJournalEntries(journalRes.data);
        } catch (error) {
            console.error('Error sending message:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleUndo = async () => {
        if (isLoading) return;
        if (!window.confirm(t('undo_confirm'))) return;

        setIsLoading(true);
        try {
            await api.post(`/sessions/${id}/undo`);
            // For undo, we probably want to refresh the view to show the state before the move
            // We can just re-fetch the last batch
            // For undo, we reset to the latest 20 messages to ensure consistency
            const historyRes = await api.get(`/sessions/${id}/history?limit=20&offset=0`);
            setMessages(historyRes.data);
            setHasMore(historyRes.data.length === 20);

            const journalRes = await api.get(`/sessions/${id}/journal`);
            setJournalEntries(journalRes.data);
        } catch (error) {
            console.error('Error undoing move:', error);
            alert(t('undo_failed'));
        } finally {
            setIsLoading(false);
        }
    };

    if (!session) {
        return (
            <Box
                sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    height: '100vh',
                    color: 'text.secondary',
                }}
            >
                {t('loading_adventure')}
            </Box>
        );
    }

    const drawerWidth = 400;

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
            <AppBar position="static" elevation={0} sx={{ borderBottom: 1, borderColor: 'divider' }}>
                <Toolbar>
                    <IconButton
                        edge="start"
                        color="inherit"
                        onClick={() => navigate('/')}
                        sx={{ mr: 2 }}
                    >
                        <ArrowBackIcon />
                    </IconButton>
                    <Box sx={{ flexGrow: 1 }}>
                        <Typography variant="h6" component="div" fontWeight="bold">
                            {session.name}
                        </Typography>
                        <Typography variant="caption" color="text.secondary" noWrap>
                            {session.start_prompt || t('adventure_begins')}
                        </Typography>
                    </Box>
                    <IconButton
                        color="inherit"
                        onClick={handleUndo}
                        disabled={isLoading || messages.length === 0}
                        sx={{ mr: 1 }}
                        title={t('undo_last_move')}
                    >
                        <UndoIcon />
                    </IconButton>
                    <IconButton
                        color="inherit"
                        onClick={(e) => setAnchorEl(e.currentTarget)}
                        sx={{ mr: 1 }}
                    >
                        <LanguageIcon />
                    </IconButton>
                    <Menu
                        anchorEl={anchorEl}
                        open={Boolean(anchorEl)}
                        onClose={() => setAnchorEl(null)}
                    >
                        <MenuItem
                            selected={language === 'en'}
                            onClick={() => { setLanguage('en'); setAnchorEl(null); }}
                        >
                            English
                        </MenuItem>
                        <MenuItem
                            selected={language === 'ru'}
                            onClick={() => { setLanguage('ru'); setAnchorEl(null); }}
                        >
                            Русский
                        </MenuItem>
                    </Menu>
                    {isMobile && (
                        <IconButton
                            color="inherit"
                            onClick={() => setJournalOpen(!journalOpen)}
                        >
                            <MenuIcon />
                        </IconButton>
                    )}
                </Toolbar>
            </AppBar>

            <Box sx={{ display: 'flex', flexGrow: 1, overflow: 'hidden' }}>
                <Box
                    component="main"
                    sx={{
                        flexGrow: 1,
                        width: { lg: `calc(100% - ${drawerWidth}px)` },
                        overflow: 'hidden',
                    }}
                >
                    <ChatInterface
                        messages={messages}
                        onSendMessage={handleSendMessage}
                        isLoading={isLoading}
                        onLoadMore={handleLoadMore}
                        hasMore={hasMore}
                    />
                </Box>

                <Drawer
                    variant={isMobile ? 'temporary' : 'permanent'}
                    anchor="right"
                    open={journalOpen}
                    onClose={() => setJournalOpen(false)}
                    sx={{
                        width: drawerWidth,
                        flexShrink: 0,
                        '& .MuiDrawer-paper': {
                            width: drawerWidth,
                            boxSizing: 'border-box',
                            borderLeft: 1,
                            borderColor: 'divider',
                            position: isMobile ? 'absolute' : 'relative',
                        },
                    }}
                >
                    <Journal journalEntries={journalEntries} />
                </Drawer>
            </Box>
        </Box>
    );
};

export default Game;
