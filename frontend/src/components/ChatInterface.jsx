import React, { useRef, useEffect, useState } from 'react';
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

const ChatInterface = ({ messages, onSendMessage, isLoading }) => {
    const messagesEndRef = useRef(null);
    const [input, setInput] = useState('');

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!input.trim() || isLoading) return;
        onSendMessage(input);
        setInput('');
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
            <Box
                sx={{
                    flexGrow: 1,
                    overflowY: 'auto',
                    p: 2,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 2,
                }}
            >
                {messages.map((msg, index) => (
                    <Box
                        key={msg.id || index}
                        sx={{
                            display: 'flex',
                            gap: 1.5,
                            flexDirection: msg.role === 'user' ? 'row-reverse' : 'row',
                            alignItems: 'flex-start',
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
                ))}

                {isLoading && (
                    <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'flex-start' }}>
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
                                The Game Master is thinking...
                            </Typography>
                        </Paper>
                    </Box>
                )}

                <div ref={messagesEndRef} />
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
                        placeholder="What do you do?"
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
