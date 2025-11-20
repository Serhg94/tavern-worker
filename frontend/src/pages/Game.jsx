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
} from '@mui/icons-material';
import api from '../api/client';
import ChatInterface from '../components/ChatInterface';
import Journal from '../components/Journal';

const Game = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('lg'));

    const [session, setSession] = useState(null);
    const [messages, setMessages] = useState([]);
    const [journalEntries, setJournalEntries] = useState([]);
    const [characters, setCharacters] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [journalOpen, setJournalOpen] = useState(!isMobile);

    useEffect(() => {
        fetchGameState();
    }, [id]);

    const fetchGameState = async () => {
        try {
            const [sessionRes, historyRes, journalRes, charsRes] = await Promise.all([
                api.get(`/sessions/${id}`),
                api.get(`/sessions/${id}/history`),
                api.get(`/sessions/${id}/journal`),
                api.get(`/sessions/${id}/characters`),
            ]);

            setSession(sessionRes.data);
            setMessages(historyRes.data);
            setJournalEntries(journalRes.data);
            setCharacters(charsRes.data);
        } catch (error) {
            console.error('Error fetching game state:', error);
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
            await api.post(`/sessions/${id}/action`, { action: text });
            await fetchGameState();
        } catch (error) {
            console.error('Error sending message:', error);
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
                Loading adventure...
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
                            {session.start_prompt || 'The adventure begins...'}
                        </Typography>
                    </Box>
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
                    <Journal journalEntries={journalEntries} characters={characters} />
                </Drawer>
            </Box>
        </Box>
    );
};

export default Game;
