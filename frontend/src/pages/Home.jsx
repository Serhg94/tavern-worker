import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Container,
    Box,
    Typography,
    Button,
    Card,
    CardContent,
    CardActions,
    IconButton,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    Grid2 as Grid,
    Chip,
    useTheme,
    useMediaQuery,
} from '@mui/material';
import {
    Add as AddIcon,
    Delete as DeleteIcon,
    PlayArrow as PlayIcon,
    MenuBook as MenuBookIcon,
} from '@mui/icons-material';
import api from '../api/client';

const Home = () => {
    const [sessions, setSessions] = useState([]);
    const [isCreating, setIsCreating] = useState(false);
    const [newSessionName, setNewSessionName] = useState('');
    const [newSessionPrompt, setNewSessionPrompt] = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        fetchSessions();
    }, []);

    const fetchSessions = async () => {
        try {
            const response = await api.get('/sessions/');
            setSessions(response.data);
        } catch (error) {
            console.error('Error fetching sessions:', error);
        }
    };

    const handleCreateSession = async (e) => {
        e.preventDefault();
        try {
            const response = await api.post('/sessions/', {
                name: newSessionName,
                start_prompt: newSessionPrompt,
            });
            setSessions([...sessions, response.data]);
            setIsCreating(false);
            setNewSessionName('');
            setNewSessionPrompt('');
        } catch (error) {
            console.error('Error creating session:', error);
        }
    };

    const handleDeleteSession = async (id) => {
        if (!window.confirm('Are you sure you want to delete this session?')) return;
        try {
            await api.delete(`/sessions/${id}`);
            setSessions(sessions.filter((s) => s.id !== id));
        } catch (error) {
            console.error('Error deleting session:', error);
        }
    };

    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

    return (
        <Container maxWidth="lg" sx={{ py: 4 }}>
            <Box sx={{
                display: 'flex',
                flexDirection: isMobile ? 'column' : 'row',
                justifyContent: 'space-between',
                alignItems: isMobile ? 'stretch' : 'center',
                mb: 4,
                gap: isMobile ? 2 : 0
            }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, justifyContent: isMobile ? 'center' : 'flex-start' }}>
                    <MenuBookIcon sx={{ fontSize: 40, color: 'primary.main' }} />
                    <Typography variant="h3" component="h1" fontWeight="bold" color="primary" sx={{ fontSize: isMobile ? '2rem' : '3rem' }}>
                        TavernWorker RPG
                    </Typography>
                </Box>
                <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={() => setIsCreating(true)}
                    size="large"
                    fullWidth={isMobile}
                >
                    New Adventure
                </Button>
            </Box>

            <Grid container spacing={3}>
                {sessions.length === 0 ? (
                    <Grid size={12}>
                        <Box sx={{ textAlign: 'center', py: 8 }}>
                            <Typography variant="h6" color="text.secondary">
                                No active adventures. Start a new one!
                            </Typography>
                        </Box>
                    </Grid>
                ) : (
                    sessions.map((session) => (
                        <Grid size={{ xs: 12, md: 6 }} key={session.id}>
                            <Card
                                sx={{
                                    height: '100%',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    transition: 'all 0.3s',
                                    '&:hover': {
                                        borderColor: 'primary.main',
                                        transform: 'translateY(-4px)',
                                    },
                                }}
                            >
                                <CardContent sx={{ flexGrow: 1 }}>
                                    <Typography variant="h5" component="h2" gutterBottom fontWeight={600}>
                                        {session.name}
                                    </Typography>
                                    <Typography
                                        variant="body2"
                                        color="text.secondary"
                                        sx={{
                                            mb: 2,
                                            overflow: 'auto',
                                            textOverflow: 'ellipsis',
                                            display: '-webkit-box',
                                            WebkitLineClamp: 2,
                                            WebkitBoxOrient: 'vertical',
                                        }}
                                    >
                                        {session.start_prompt}
                                    </Typography>
                                    <Chip
                                        label={`Created: ${new Date(session.created_at).toLocaleDateString()}`}
                                        size="small"
                                        variant="outlined"
                                    />
                                </CardContent>
                                <CardActions sx={{ justifyContent: 'flex-end', px: 2, pb: 2 }}>
                                    <IconButton
                                        color="primary"
                                        onClick={() => navigate(`/game/${session.id}`)}
                                        sx={{
                                            bgcolor: 'primary.main',
                                            color: 'white',
                                            '&:hover': { bgcolor: 'primary.dark' },
                                        }}
                                    >
                                        <PlayIcon />
                                    </IconButton>
                                    <IconButton
                                        color="error"
                                        onClick={() => handleDeleteSession(session.id)}
                                        sx={{
                                            bgcolor: 'error.main',
                                            color: 'white',
                                            '&:hover': { bgcolor: 'error.dark' },
                                        }}
                                    >
                                        <DeleteIcon />
                                    </IconButton>
                                </CardActions>
                            </Card>
                        </Grid>
                    ))
                )}
            </Grid>

            <Dialog
                open={isCreating}
                onClose={() => setIsCreating(false)}
                maxWidth="sm"
                fullWidth
            >
                <form onSubmit={handleCreateSession}>
                    <DialogTitle>Start a New Adventure</DialogTitle>
                    <DialogContent>
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
                            <TextField
                                label="Adventure Name"
                                value={newSessionName}
                                onChange={(e) => setNewSessionName(e.target.value)}
                                placeholder="e.g. The Lost Mines"
                                required
                                fullWidth
                                autoFocus
                            />
                            <TextField
                                label="Starting Prompt / Setting"
                                value={newSessionPrompt}
                                onChange={(e) => setNewSessionPrompt(e.target.value)}
                                placeholder="Describe the world and your character..."
                                required
                                fullWidth
                                multiline
                                rows={4}
                            />
                        </Box>
                    </DialogContent>
                    <DialogActions sx={{ px: 3, pb: 2 }}>
                        <Button onClick={() => setIsCreating(false)}>Cancel</Button>
                        <Button type="submit" variant="contained">
                            Start Adventure
                        </Button>
                    </DialogActions>
                </form>
            </Dialog>
        </Container>
    );
};

export default Home;
