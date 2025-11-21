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
import { useLanguage } from '../lib/LanguageContext';

const Journal = ({ journalEntries }) => {
    const [activeTab, setActiveTab] = useState(0);
    const { t } = useLanguage();

    const quests = journalEntries.filter((e) => e.entry_type === 'quest');
    const lore = journalEntries.filter((e) => e.entry_type === 'lore');
    const characters = journalEntries.filter((e) => e.entry_type === 'character');


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
                <Tab icon={<ScrollIcon fontSize="small" />} label={t('tab_quests')} iconPosition="start" />
                <Tab icon={<PeopleIcon fontSize="small" />} label={t('tab_characters')} iconPosition="start" />
                <Tab icon={<BookIcon fontSize="small" />} label={t('tab_lore')} iconPosition="start" />
            </Tabs>

            <Box sx={{ flexGrow: 1, overflowY: 'auto', p: 2 }}>
                {activeTab === 0 && (
                    <Stack spacing={2}>
                        {quests.length === 0 ? (
                            <Box sx={{ textAlign: 'center', py: 4 }}>
                                <Typography variant="body2" color="text.secondary">
                                    {t('no_active_quests')}
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
                                    {t('no_known_characters')}
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
                                            {char.title}
                                        </Typography>
                                        <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.6 }}>
                                            {char.content}
                                        </Typography>
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
                                    {t('no_lore_entries')}
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
