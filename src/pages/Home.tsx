import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Typography, Button, Box, List, ListItem, ListItemText, ListItemSecondaryAction, IconButton, TextField, Container, Grid, Paper, Pagination } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import { collection, getDocs, query, orderBy, limit, startAfter, getCountFromServer } from 'firebase/firestore';
import { db } from '../services/firebase';
import EditIcon from '@mui/icons-material/Edit';
import BarChartIcon from '@mui/icons-material/BarChart';

interface Survey {
  id: string;
  title: string;
  createdAt: Date;
}

const ITEMS_PER_PAGE = 10;

const Home: React.FC = () => {
  const [surveys, setSurveys] = useState<Survey[]>([]);
  const [sessionId, setSessionId] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [lastVisible, setLastVisible] = useState<any>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchSurveys = async () => {
      const surveysCollection = collection(db, 'surveys');
      let q = query(surveysCollection, orderBy('createdAt', 'desc'), limit(ITEMS_PER_PAGE));
      if (page !== 1 && lastVisible) {
        q = query(surveysCollection, orderBy('createdAt', 'desc'), startAfter(lastVisible), limit(ITEMS_PER_PAGE));
      }

      const surveySnapshot = await getDocs(q);
      const surveyList = surveySnapshot.docs.map(doc => ({
        id: doc.id,
        title: doc.data().title,
        createdAt: doc.data().createdAt.toDate(),
      }));

      setSurveys(surveyList);
      setLastVisible(surveySnapshot.docs[surveySnapshot.docs.length - 1]);

      // Get total count for pagination
      const snapshot = await getCountFromServer(collection(db, 'surveys'));
      const totalSurveys = snapshot.data().count;
      setTotalPages(Math.ceil(totalSurveys / ITEMS_PER_PAGE));
    };

    fetchSurveys();
  }, [page]);

  const handleJoin = () => {
    if (sessionId.trim()) {
      navigate(`/participate/${sessionId}`);
    }
  };

  const handlePageChange = (_event: React.ChangeEvent<unknown>, value: number) => {
    setPage(value);
  };

  const handleResultsClick = (surveyId: string) => {
    navigate(`/session-results/${surveyId}`);
  };

  return (
    <Container maxWidth="md" sx={{ mt: 8, mb: 4 }}>
      <Typography variant="h2" component="h1" gutterBottom align="center" sx={{ mb: 4 }}>
        Welcome to RuTAS
      </Typography>
      <Typography variant="subtitle1" gutterBottom align="center" sx={{ mb: 4 }}>
        より効率的なアンケートをサポートします。
      </Typography>
      
      <Box sx={{ display: 'flex', justifyContent: 'center', mb: 6 }}>
        <Button
          variant="contained"
          color="primary"
          component={RouterLink}
          to="/create"
          size="large"
          sx={{ fontSize: '1.2rem', py: 1, px: 4 }}
        >
          CREATE NEW SURVEY
        </Button>
      </Box>

      <Paper elevation={3} sx={{ p: 4, mb: 6 }}>
        <Typography variant="h5" gutterBottom align="center" sx={{ mb: 3 }}>
          Join Existing Session
        </Typography>
        <Grid container spacing={2} alignItems="flex-end">
          <Grid item xs>
            <TextField
              fullWidth
              placeholder="Enter Session ID"
              value={sessionId}
              onChange={(e) => setSessionId(e.target.value)}
              variant="outlined"
            />
          </Grid>
          <Grid item>
            <Button
              variant="contained"
              color="secondary"
              onClick={handleJoin}
              size="large"
              sx={{ py: 1, px: 3 }}
            >
              JOIN SESSION
            </Button>
          </Grid>
        </Grid>
      </Paper>

      <Typography variant="h4" sx={{ mb: 3 }} align="center">
        Available Surveys
      </Typography>
      <List sx={{ bgcolor: 'background.paper', mb: 3 }}>
        {surveys.map((survey) => (
          <ListItem key={survey.id} divider>
            <ListItemText 
              primary={survey.title} 
              secondary={`Created: ${survey.createdAt.toLocaleDateString()}`}
            />
            <ListItemSecondaryAction>
              <IconButton edge="end" aria-label="edit" component={RouterLink} to={`/edit/${survey.id}`}>
                <EditIcon />
              </IconButton>
              <IconButton edge="end" aria-label="results" onClick={() => handleResultsClick(survey.id)}>
                <BarChartIcon />
              </IconButton>
            </ListItemSecondaryAction>
          </ListItem>
        ))}
      </List>
      <Box sx={{ display: 'flex', justifyContent: 'center' }}>
        <Pagination
          count={totalPages}
          page={page}
          onChange={handlePageChange}
          color="primary"
          size="large"
        />
      </Box>
    </Container>
  );
};

export default Home;