import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Box, Typography, CircularProgress, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow } from '@mui/material';
import { doc, getDoc, collection, getDocs } from 'firebase/firestore';
import { db } from '../services/firebase';
import { Question } from '../types/QuestionTypes';

interface Survey {
  title: string;
  questions: Question[];
}

interface Answer {
  [option: string]: number;
}

const SessionResults: React.FC = () => {
  const { sessionId } = useParams<{ sessionId: string }>();
  const [survey, setSurvey] = useState<Survey | null>(null);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      if (!sessionId) {
        setError('Invalid session ID');
        setLoading(false);
        return;
      }

      try {
        const sessionDoc = await getDoc(doc(db, 'sessions', sessionId));
        if (!sessionDoc.exists()) {
          setError('Session not found');
          setLoading(false);
          return;
        }

        const surveyId = sessionDoc.data().surveyId;
        const surveyDoc = await getDoc(doc(db, 'surveys', surveyId));
        if (!surveyDoc.exists()) {
          setError('Survey not found');
          setLoading(false);
          return;
        }

        const surveyData = surveyDoc.data() as Survey;
        setSurvey(surveyData);

        const answersCollection = collection(db, 'sessions', sessionId, 'answers');
        const answersSnapshot = await getDocs(answersCollection);
        const answersData = answersSnapshot.docs.map(doc => doc.data() as Answer);
        
        // Ensure answers array has the same length as questions array
        const paddedAnswers = surveyData.questions.map((_, index) => answersData[index] || {});
        setAnswers(paddedAnswers);

        setLoading(false);
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Failed to fetch results');
        setLoading(false);
      }
    };

    fetchData();
  }, [sessionId]);

  const renderQuestionResults = (question: Question, questionAnswers: Answer) => {
    const totalVotes = Object.values(questionAnswers).reduce((sum, count) => sum + count, 0);

    switch (question.type) {
      case 'singleChoice':
      case 'multipleChoice':
      case 'ranking':
        return (
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Option</TableCell>
                  <TableCell align="right">Votes</TableCell>
                  <TableCell align="right">Percentage</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {question.options && question.options.map((option) => {
                  const votes = questionAnswers[option] || 0;
                  const percentage = totalVotes > 0 ? (votes / totalVotes * 100).toFixed(2) : '0.00';
                  return (
                    <TableRow key={option}>
                      <TableCell component="th" scope="row">{option}</TableCell>
                      <TableCell align="right">{votes}</TableCell>
                      <TableCell align="right">{percentage}%</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        );
      case 'rating':
      case 'slider':
        const values = Object.entries(questionAnswers).flatMap(([value, count]) => Array(count).fill(Number(value)));
        const average = values.length > 0 ? values.reduce((a, b) => a + b, 0) / values.length : 0;
        return (
          <Box>
            <Typography>Average: {average.toFixed(2)}</Typography>
            <Typography>Min: {Math.min(...values, 0)}</Typography>
            <Typography>Max: {Math.max(...values, 0)}</Typography>
            <Typography>Total Votes: {totalVotes}</Typography>
          </Box>
        );
      case 'freeText':
        return (
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Answer</TableCell>
                  <TableCell align="right">Count</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {Object.entries(questionAnswers).map(([answer, count], index) => (
                  <TableRow key={index}>
                    <TableCell component="th" scope="row">{answer}</TableCell>
                    <TableCell align="right">{count}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        );
      default:
        return <Typography>Unsupported question type</Typography>;
    }
  };

  if (loading) return <CircularProgress />;
  if (error) return <Typography color="error">{error}</Typography>;
  if (!survey || answers.length === 0) return <Typography>No data available</Typography>;

  return (
    <Box sx={{ maxWidth: 800, margin: 'auto', padding: 2 }}>
      <Typography variant="h4" gutterBottom>{survey.title} - Final Results</Typography>
      {survey.questions.map((question, index) => (
        <Paper key={index} sx={{ padding: 2, marginTop: 2 }}>
          <Typography variant="h6" gutterBottom>{question.text}</Typography>
          {renderQuestionResults(question, answers[index] || {})}
        </Paper>
      ))}
    </Box>
  );
};

export default SessionResults;