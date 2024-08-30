import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Box, Typography, Button, CircularProgress, Alert, TextField, Snackbar } from '@mui/material';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../services/firebase';

interface Session {
  surveyId: string;
  status: 'waiting' | 'active' | 'completed';
  currentQuestionIndex: number;
}

interface Survey {
  title: string;
  questions: Question[];
}

interface Question {
  text: string;
  type: string;
  options?: string[];
}

const ManageSession: React.FC = () => {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();
  const [session, setSession] = useState<Session | null>(null);
  const [survey, setSurvey] = useState<Survey | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [snackbarOpen, setSnackbarOpen] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      if (!sessionId) {
        setError('セッションIDを入力してください。');
        setLoading(false);
        return;
      }

      try {
        const sessionDoc = await getDoc(doc(db, 'sessions', sessionId));
        if (sessionDoc.exists()) {
          const sessionData = sessionDoc.data() as Session;
          setSession(sessionData);

          const surveyDoc = await getDoc(doc(db, 'surveys', sessionData.surveyId));
          if (surveyDoc.exists()) {
            setSurvey(surveyDoc.data() as Survey);
          } else {
            setError('アンケートが見つかりません。');
          }
        } else {
          setError('セッションが見つかりません。');
        }
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('セッションデータの同期に失敗しました。');
      }

      setLoading(false);
    };

    fetchData();
  }, [sessionId]);

  const startSession = async () => {
    if (!sessionId) return;
    try {
      await updateDoc(doc(db, 'sessions', sessionId), {
        status: 'active',
        currentQuestionIndex: 0
      });
      setSession(prev => prev ? { ...prev, status: 'active', currentQuestionIndex: 0 } : null);
    } catch (err) {
      console.error('Error starting session:', err);
      setError('セッションの開始に失敗しました。');
    }
  };

  const handleNextQuestion = async () => {
    if (!session || !survey || !sessionId) return;

    const nextIndex = session.currentQuestionIndex + 1;
    try {
      if (nextIndex < survey.questions.length) {
        await updateDoc(doc(db, 'sessions', sessionId), {
          currentQuestionIndex: nextIndex
        });
        setSession(prev => prev ? { ...prev, currentQuestionIndex: nextIndex } : null);
      } else {
        await updateDoc(doc(db, 'sessions', sessionId), {
          status: 'completed'
        });
        setSession(prev => prev ? { ...prev, status: 'completed' } : null);
        navigate(`/session-results/${sessionId}`);
      }
    } catch (err) {
      console.error('Error updating session:', err);
      setError('セッションの更新に失敗しました。');
    }
  };

  const handleViewPreviousResults = () => {
    if (!session || !sessionId) return;
    const prevQuestionIndex = session.currentQuestionIndex - 1;
    if (prevQuestionIndex >= 0) {
      window.open(`/question-results/${sessionId}/${prevQuestionIndex}`, '_blank');
    }
  };

  const copyInviteLink = () => {
    const inviteUrl = `${sessionId}`; //回答画面は別サーバーにて行う
    navigator.clipboard.writeText(inviteUrl).then(() => {
      setSnackbarOpen(true);
    }, (err) => {
      console.error('Could not copy text: ', err);
    });
  };

  if (loading) return <CircularProgress />;
  if (error) return <Alert severity="error">{error}</Alert>;
  if (!session || !survey) return <Alert severity="warning">No data available</Alert>;

  const currentQuestion = session.currentQuestionIndex >= 0 && session.currentQuestionIndex < survey.questions.length
    ? survey.questions[session.currentQuestionIndex]
    : null;

  const inviteUrl = `${sessionId}`;

  return (
    <Box sx={{ maxWidth: 600, margin: 'auto', padding: 2 }}>
      <Typography variant="h4" gutterBottom>{survey.title}</Typography>
      {session.status === 'waiting' ? (
        <>
          <Button variant="contained" color="primary" onClick={startSession} sx={{ mb: 2 }}>
            Start Session
          </Button>
          <Box sx={{ mt: 2 }}>
            <Typography variant="subtitle1" gutterBottom>アンケート参加者を招待:</Typography>
            <TextField
              fullWidth
              variant="outlined"
              value={inviteUrl}
              InputProps={{
                readOnly: true,
              }}
              sx={{ mb: 1 }}
            />
            <Button variant="outlined" onClick={copyInviteLink}>
              Copy Session ID
            </Button>
          </Box>
        </>
      ) : session.status === 'active' ? (
        <>
          <Typography variant="h5" gutterBottom>
            Question {session.currentQuestionIndex + 1} of {survey.questions.length}
          </Typography>
          {currentQuestion && (
            <Typography variant="h6" gutterBottom>{currentQuestion.text}</Typography>
          )}
          <Box sx={{ mt: 2, display: 'flex', justifyContent: 'space-between' }}>
            <Button
              variant="contained"
              color="primary"
              onClick={handleNextQuestion}
            >
              {session.currentQuestionIndex + 1 < survey.questions.length ? "Next Question" : "End Survey"}
            </Button>
            {session.currentQuestionIndex > 0 && (
              <Button
                variant="outlined"
                color="secondary"
                onClick={handleViewPreviousResults}
              >
                View Previous Question Results
              </Button>
            )}
          </Box>
        </>
      ) : (
        <Typography>Session completed</Typography>
      )}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={3000}
        onClose={() => setSnackbarOpen(false)}
        message="Session ID copied to clipboard"
      />
    </Box>
  );
};

export default ManageSession;