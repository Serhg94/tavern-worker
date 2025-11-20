import React, { useState } from 'react';
import {
    Box,
    Tabs,
    Tab,
    Card,
    CardContent,
    Typography,
    Chip,
    Stack,
} from '@mui/material';
import {
    Article as ScrollIcon,
    Groups as PeopleIcon,
    MenuBook as BookIcon,
} from '@mui/icons-material';

const Journal = ({ journalEntries, characters }) => {
    const [activeTab, setActiveTab] = useState(0);

    const quests = journalEntries.filter((e) => e.entry_type === 'quest');
    const lore = journalEntries.filter((e) => e.entry_type === 'lore');

    const handleTabChange = (event, newValue) => {
        setActiveTab(newValue);
    };

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            <Tabs
                value={activeTab}
                onChange={handleTabChange}
                variant="fullWidth"
                sx={{
                    borderBottom: 1,
                    borderColor: 'divider',
                    bgcolor: 'background.paper',
                }}
            >
                <Tab icon={<ScrollIcon fontSize="small" />} label="Quests" iconPosition="start" />
                <Tab icon={<PeopleIcon fontSize="small" />} label="Characters" iconPosition="start" />
                <Tab icon={<BookIcon fontSize="small" />} label="Lore" iconPosition="start" />
            </Tabs>

            <Box sx={{ flexGrow: 1, overflowY: 'auto', p: 2 }}>
                {activeTab === 0 && (
                    <Stack spacing={2}>
                        {quests.length === 0 ? (
                            <Box sx={{ textAlign: 'center', py: 4 }}>
                                <Typography variant="body2" color="text.secondary">
                                    No active quests.
                                </Typography>
                            </Box>
                        ) : (
                            quests.map((quest) => (
                                <Card
                                    key={quest.id}
                                    elevation={0}
                                    sx={{
                                        border: 1,
                                        borderColor: 'divider',
                                        bgcolor: 'background.paper',
                                    }}
                                >
                                    <CardContent>
                                        <Typography
                                            variant="h6"
                                            gutterBottom
                                            sx={{ color: 'primary.light', fontWeight: 600 }}
                                        >
                                            {quest.title}
                                        </Typography>
                                        <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.6 }}>
                                            {quest.content}
                                        </Typography>
                                    </CardContent>
                                </Card>
                            ))
                        )}
                    </Stack>
                )}

                {activeTab === 1 && (
                    <Stack spacing={2}>
                        {characters.length === 0 ? (
                            <Box sx={{ textAlign: 'center', py: 4 }}>
                                <Typography variant="body2" color="text.secondary">
                                    No known characters.
                                </Typography>
                            </Box>
                        ) : (
                            characters.map((char) => (
                                <Card
                                    key={char.id}
                                    elevation={0}
                                    sx={{
                                        border: 1,
                                        borderColor: 'divider',
                                        bgcolor: 'background.paper',
                                    }}
                                >
                                    <CardContent>
                                        <Typography
                                            variant="h6"
                                            gutterBottom
                                            sx={{ color: 'secondary.light', fontWeight: 600 }}
                                        >
                                            {char.name}
                                        </Typography>
                                        <Typography variant="body2" color="text.secondary" sx={{ mb: 2, lineHeight: 1.6 }}>
                                            {char.description}
                                        </Typography>
                                        {char.stats && Object.keys(char.stats).length > 0 && (
                                            <Box sx={{ pt: 1, borderTop: 1, borderColor: 'divider' }}>
                                                <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                                                    {Object.entries(char.stats).map(([key, val]) => (
                                                        <Chip
                                                            key={key}
                                                            label={`${key.toUpperCase()}: ${val}`}
                                                            size="small"
                                                            variant="outlined"
                                                        />
                                                    ))}
                                                </Stack>
                                            </Box>
                                        )}
                                    </CardContent>
                                </Card>
                            ))
                        )}
                    </Stack>
                )}

                {activeTab === 2 && (
                    <Stack spacing={2}>
                        {lore.length === 0 ? (
                            <Box sx={{ textAlign: 'center', py: 4 }}>
                                <Typography variant="body2" color="text.secondary">
                                    No lore entries.
                                </Typography>
                            </Box>
                        ) : (
                            lore.map((entry) => (
                                <Card
                                    key={entry.id}
                                    elevation={0}
                                    sx={{
                                        border: 1,
                                        borderColor: 'divider',
                                        bgcolor: 'background.paper',
                                    }}
                                >
                                    <CardContent>
                                        <Typography
                                            variant="h6"
                                            gutterBottom
                                            sx={{ color: 'warning.main', fontWeight: 600 }}
                                        >
                                            {entry.title}
                                        </Typography>
                                        <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.6 }}>
                                            {entry.content}
                                        </Typography>
                                    </CardContent>
                                </Card>
                            ))
                        )}
                    </Stack>
                )}
            </Box>
        </Box>
    );
};

export default Journal;
