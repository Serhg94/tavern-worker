import React, { useState, useRef, useEffect } from 'react';
import {
    Box,
    TextField,
    IconButton,
    Paper,
    Avatar,
    Typography,
    CircularProgress,
    InputAdornment,
} from '@mui/material';
import {
    Send as SendIcon,
    Person as PersonIcon,
    SmartToy as BotIcon,
} from '@mui/icons-material';
import { Virtuoso } from 'react-virtuoso';
import { useLanguage } from '../lib/LanguageContext';

const ChatInterface = ({ messages, onSendMessage, isLoading, onLoadMore, hasMore }) => {
    const [input, setInput] = useState('');
    const virtuosoRef = useRef(null);
    const { t } = useLanguage();

    const lastMessageIdRef = useRef(null);

    // Auto-scroll to bottom when loading state changes or new messages arrive
    useEffect(() => {
        const lastMessage = messages[messages.length - 1];
        const isNewMessage = lastMessage && lastMessage.id !== lastMessageIdRef.current;

        if (isLoading || isNewMessage) {
            // Update ref if it's a new message
            if (isNewMessage) {
                lastMessageIdRef.current = lastMessage.id;
            }

            // Use a small timeout to ensure DOM is updated
            setTimeout(() => {
                virtuosoRef.current?.scrollToIndex({ index: messages.length - 1, align: 'end', behavior: 'smooth' });
            }, 100);
        }
    }, [isLoading, messages]);

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!input.trim() || isLoading) return;
        onSendMessage(input);
        setInput('');
    };

    const itemContent = (index, msg) => {
        if (!msg) return null; // Guard against undefined messages
        return (
            <Box
                sx={{
                    display: 'flex',
                    gap: 1.5,
                    flexDirection: msg.role === 'user' ? 'row-reverse' : 'row',
                    alignItems: 'flex-start',
                    mb: 2, // Margin bottom for spacing
                    px: 2, // Horizontal padding
                }}
            >
                <Avatar
                    sx={{
                        bgcolor: msg.role === 'user' ? 'primary.main' : 'secondary.main',
                        width: 36,
                        height: 36,
                    }}
                >
                    {msg.role === 'user' ? <PersonIcon fontSize="small" /> : <BotIcon fontSize="small" />}
                </Avatar>
                <Paper
                    elevation={0}
                    sx={{
                        maxWidth: '75%',
                        px: 2.5,
                        py: 1.5,
                        bgcolor: msg.role === 'user' ? 'primary.dark' : 'background.paper',
                        borderRadius: 2,
                        borderTopLeftRadius: msg.role === 'user' ? 2 : 0,
                        borderTopRightRadius: msg.role === 'user' ? 0 : 2,
                        border: 1,
                        borderColor: msg.role === 'user' ? 'primary.main' : 'divider',
                    }}
                >
                    <Typography
                        variant="body1"
                        sx={{ whiteSpace: 'pre-wrap', lineHeight: 1.6 }}
                    >
                        {msg.content}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                        {new Date(msg.timestamp).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                        })}
                    </Typography>
                </Paper>
            </Box>
        );
    };

    const Footer = () => {
        if (!isLoading) return null;
        return (
            <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'flex-start', px: 2, mb: 2 }}>
                <Avatar sx={{ bgcolor: 'secondary.main', width: 36, height: 36 }}>
                    <BotIcon fontSize="small" />
                </Avatar>
                <Paper
                    elevation={0}
                    sx={{
                        px: 2.5,
                        py: 1.5,
                        bgcolor: 'background.paper',
                        borderRadius: 2,
                        borderTopLeftRadius: 0,
                        border: 1,
                        borderColor: 'divider',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1.5,
                    }}
                >
                    <CircularProgress size={16} />
                    <Typography variant="body2" color="text.secondary">
                        {t('game_master_thinking')}
                    </Typography>
                </Paper>
            </Box>
        );
    };

    const Header = () => {
        return hasMore ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
                <CircularProgress size={20} />
            </Box>
        ) : null;
    };

    return (
        <Box
            sx={{
                display: 'flex',
                flexDirection: 'column',
                height: '100%',
                bgcolor: 'background.default',
            }}
        >
            <Box sx={{ flex: 1, minHeight: 0 }}>
                <Virtuoso
                    style={{ height: '100%' }}
                    ref={virtuosoRef}
                    data={messages}
                    startReached={onLoadMore}
                    initialTopMostItemIndex={messages.length - 1}
                    itemContent={itemContent}
                    components={{
                        Header: Header,
                        Footer: Footer,
                    }}
                    followOutput={'smooth'}
                    alignToBottom={true} // Important for chat interfaces
                />
            </Box>

            <Box
                sx={{
                    p: 2,
                    bgcolor: 'background.paper',
                    borderTop: 1,
                    borderColor: 'divider',
                }}
            >
                <form onSubmit={handleSubmit}>
                    <TextField
                        fullWidth
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder={t('what_do_you_do')}
                        disabled={isLoading}
                        variant="outlined"
                        size="medium"
                        InputProps={{
                            endAdornment: (
                                <InputAdornment position="end">
                                    <IconButton
                                        type="submit"
                                        disabled={!input.trim() || isLoading}
                                        color="primary"
                                        sx={{
                                            bgcolor: 'primary.main',
                                            color: 'white',
                                            '&:hover': { bgcolor: 'primary.dark' },
                                            '&.Mui-disabled': {
                                                bgcolor: 'action.disabledBackground',
                                            },
                                        }}
                                    >
                                        <SendIcon />
                                    </IconButton>
                                </InputAdornment>
                            ),
                        }}
                    />
                </form>
            </Box>
        </Box>
    );
};

export default ChatInterface;
