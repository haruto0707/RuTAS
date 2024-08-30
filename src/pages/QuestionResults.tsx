import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Box, Typography, CircularProgress, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Alert } from '@mui/material';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../services/firebase';
import { Question } from '../types/QuestionTypes';

interface Survey {
  title: string;
  questions: Question[];
}

interface Answer {
  [option: string]: number;
}

const QuestionResults: React.FC = () => {
  const { sessionId, questionIndex } = useParams<{ sessionId: string; questionIndex: string }>();
  const [survey, setSurvey] = useState<Survey | null>(null);
  const [question, setQuestion] = useState<Question | null>(null);
  const [answers, setAnswers] = useState<Answer | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      if (!sessionId || !questionIndex) {
        setError('Invalid session ID or question index');
        setLoading(false);
        return;
      }

      try {
        const sessionDoc = await getDoc(doc(db, 'sessions', sessionId));
        if (!sessionDoc.exists()) {
          setError('セッションが見つかりません。');
          setLoading(false);
          return;
        }

        const surveyId = sessionDoc.data().surveyId;
        const surveyDoc = await getDoc(doc(db, 'surveys', surveyId));
        if (!surveyDoc.exists()) {
          setError('アンケートが見つかりません。');
          setLoading(false);
          return;
        }

        const surveyData = surveyDoc.data() as Survey;
        setSurvey(surveyData);

        const questionData = surveyData.questions[parseInt(questionIndex)];
        if (!questionData) {
          setError('質問が見つかりません。');
          setLoading(false);
          return;
        }
        setQuestion(questionData);

        const answerDoc = await getDoc(doc(db, 'sessions', sessionId, 'answers', `question_${questionIndex}`));
        if (answerDoc.exists()) {
          setAnswers(answerDoc.data() as Answer);
        } else {
          setAnswers({});
        }

        setLoading(false);
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('結果データの同期に失敗しました。');
        setLoading(false);
      }
    };

    fetchData();
  }, [sessionId, questionIndex]);

  const renderQuestionResults = () => {
    if (!question || !answers) return null;

    const totalVotes = Object.values(answers).reduce((sum, count) => sum + count, 0);

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
                {question.options?.map((option) => {
                  const votes = answers[option] || 0;
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
        const values = Object.entries(answers).flatMap(([value, count]) => Array(count).fill(Number(value)));
        const average = values.length > 0 ? values.reduce((a, b) => a + b, 0) / values.length : 0;
        return (
          <Box>
            <Typography>Average: {average.toFixed(2)}</Typography>
            <Typography>Min: {Math.min(...values)}</Typography>
            <Typography>Max: {Math.max(...values)}</Typography>
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
                {Object.entries(answers).map(([answer, count], index) => (
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
        return null;
    }
  };

  if (loading) return <CircularProgress />;
  if (error) return <Alert severity="error">{error}</Alert>;
  if (!question || !answers) return <Alert severity="warning">No data available</Alert>;

  return (
    <Box sx={{ maxWidth: 800, margin: 'auto', padding: 2 }}>
      <Typography variant="h4" gutterBottom>{survey?.title}</Typography>
      <Typography variant="h5" gutterBottom>Question {parseInt(questionIndex!) + 1}</Typography>
      <Typography variant="h6" gutterBottom>{question.text}</Typography>
      {renderQuestionResults()}
    </Box>
  );
};

export default QuestionResults;