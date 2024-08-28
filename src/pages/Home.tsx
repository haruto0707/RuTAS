import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Typography, Button, Box, List, ListItem, ListItemText, ListItemSecondaryAction, IconButton, TextField, Container, Grid, Paper,Toolbar, Pagination } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import { collection, getDocs, query, orderBy, limit, startAfter } from 'firebase/firestore';
import { db } from '../services/firebase';
import EditIcon from '@mui/icons-material/Edit';
import PollIcon from '@mui/icons-material/Poll';
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
      let q;
      
      if (page === 1) {
        q = query(surveysCollection, orderBy('createdAt', 'desc'), limit(ITEMS_PER_PAGE));
      } else {
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

      // Get total number of surveys for pagination
      const totalSurveysSnapshot = await getDocs(collection(db, 'surveys'));
      setTotalPages(Math.ceil(totalSurveysSnapshot.size / ITEMS_PER_PAGE));
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

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Toolbar />
      <Container maxWidth="md" sx={{ mt: 4, mb: 4, px: 3 }}>
        <Typography variant="h3" component="h1" gutterBottom sx={{ fontSize: '2.5rem', fontWeight: 'normal', mb: 1 }}>
          Welcome to RuTAS
        </Typography>
        <Typography variant="subtitle1" gutterBottom sx={{ color: 'text.secondary', mb: 3 }}>
          より効率的なアンケートをサポートします。
        </Typography>
        <Box sx={{ display: 'flex', justifyContent: 'center', mb: 4 }}>
          <Button
            variant="contained"
            color="primary"
            component={RouterLink}
            to="/create"
            size="large"
            sx={{ textTransform: 'uppercase', px: 3, py: 1 }}
          >
            Create New Survey
          </Button>
        </Box>
        <Box sx={{ display: 'flex', justifyContent: 'center', mb: 4 }}>
          <Paper elevation={3} sx={{ p: 3, maxWidth: '500px', width: '100%' }}>
            <Typography variant="h5" gutterBottom sx={{ mb: 2, fontWeight: 'normal', textAlign: 'center' }}>
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
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: 1 } }}
                />
              </Grid>
              <Grid item>
                <Button
                  variant="contained"
                  color="secondary"
                  onClick={handleJoin}
                  size="large"
                  sx={{ textTransform: 'uppercase', px: 3, py: 1, bgcolor: '#9c27b0' }}
                >
                  Join Session
                </Button>
              </Grid>
            </Grid>
          </Paper>
        </Box>
        <Typography variant="h4" sx={{ mb: 2, fontWeight: 'normal' }}>
          Available Surveys
        </Typography>
        <List sx={{ bgcolor: 'background.paper' }}>
          {surveys.map((survey) => (
            <ListItem key={survey.id} divider>
              <ListItemText 
                primary={survey.title} 
                secondary={`Created: ${survey.createdAt.toLocaleDateString()}`}
              />
              <ListItemSecondaryAction>
                <IconButton
                  edge="end"
                  aria-label="take survey"
                  component={RouterLink}
                  to={`/survey/${survey.id}`}
                >
                  <PollIcon />
                </IconButton>
                <IconButton
                  edge="end"
                  aria-label="edit"
                  component={RouterLink}
                  to={`/edit/${survey.id}`}
                >
                  <EditIcon />
                </IconButton>
                <IconButton
                  edge="end"
                  aria-label="results"
                  component={RouterLink}
                  to={`/results/${survey.id}`}
                >
                  <BarChartIcon />
                </IconButton>
              </ListItemSecondaryAction>
            </ListItem>
          ))}
        </List>
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
          <Pagination
            count={totalPages}
            page={page}
            onChange={handlePageChange}
            color="primary"
          />
        </Box>
      </Container>
    </Box>
  );
};

export default Home;