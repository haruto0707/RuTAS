import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Box, Typography, CircularProgress, Paper } from '@mui/material';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../services/firebase';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

interface Question {
  text: string;
  options: string[];
}

interface Response {
  answers: string[];
  submittedAt: Date;
}

interface Survey {
  id: string;
  title: string;
  questions: Question[];
  responses: Response[];
}

const SurveyResults: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [survey, setSurvey] = useState<Survey | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSurvey = async () => {
      if (!id) return;
      const surveyDoc = await getDoc(doc(db, 'surveys', id));
      if (surveyDoc.exists()) {
        setSurvey({ id: surveyDoc.id, ...surveyDoc.data() } as Survey);
      } else {
        console.log('No such survey!');
      }
      setLoading(false);
    };
    fetchSurvey();
  }, [id]);

  const getResultsData = (questionIndex: number) => {
    if (!survey) return [];

    const optionCounts = survey.questions[questionIndex].options.reduce(
      (acc, option) => {
        acc[option] = 0;
        return acc;
      },
      {} as Record<string, number>
    );

    survey.responses.forEach((response) => {
      const answer = response.answers[questionIndex];
      if (answer) {
        optionCounts[answer]++;
      }
    });

    return Object.entries(optionCounts).map(([option, count]) => ({
      option,
      count,
    }));
  };

  if (loading) {
    return <CircularProgress />;
  }

  if (!survey) {
    return <Typography>Survey not found.</Typography>;
  }

  return (
    <Box sx={{ maxWidth: 800, margin: 'auto', padding: 2 }}>
      <Typography variant="h4" gutterBottom>
        {survey.title} - Results
      </Typography>
      <Typography variant="h6" gutterBottom>
        Total Responses: {survey.responses.length}
      </Typography>
      {survey.questions.map((question, index) => (
        <Paper key={index} sx={{ mb: 3, p: 2 }}>
          <Typography variant="h6" gutterBottom>
            {question.text}
          </Typography>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={getResultsData(index)}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="option" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="count" fill="#8884d8" />
            </BarChart>
          </ResponsiveContainer>
        </Paper>
      ))}
    </Box>
  );
};

export default SurveyResults;
