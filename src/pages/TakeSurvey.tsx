import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Box, Typography, RadioGroup, FormControlLabel, Radio, Button, CircularProgress } from '@mui/material';
import { doc, getDoc, updateDoc, arrayUnion } from 'firebase/firestore';
import { db } from '../services/firebase';

interface Question {
  text: string;
  options: string[];
}

interface Survey {
  id: string;
  title: string;
  questions: Question[];
}

const TakeSurvey: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [survey, setSurvey] = useState<Survey | null>(null);
  const [answers, setAnswers] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSurvey = async () => {
      if (!id) return;
      const surveyDoc = await getDoc(doc(db, 'surveys', id));
      if (surveyDoc.exists()) {
        setSurvey({ id: surveyDoc.id, ...surveyDoc.data() } as Survey);
        setAnswers(new Array(surveyDoc.data().questions.length).fill(''));
      } else {
        console.log('No such survey!');
        navigate('/');
      }
      setLoading(false);
    };
    fetchSurvey();
  }, [id, navigate]);

  const handleAnswerChange = (questionIndex: number, value: string) => {
    const newAnswers = [...answers];
    newAnswers[questionIndex] = value;
    setAnswers(newAnswers);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!survey) return;

    try {
      await updateDoc(doc(db, 'surveys', survey.id), {
        responses: arrayUnion({
          answers,
          submittedAt: new Date()
        })
      });
      alert('Thank you for your response!');
      navigate('/');
    } catch (error) {
      console.error('Error submitting response: ', error);
      alert('Error submitting response. Please try again.');
    }
  };

  if (loading) {
    return <CircularProgress />;
  }

  if (!survey) {
    return <Typography>Survey not found.</Typography>;
  }

  return (
    <Box component="form" onSubmit={handleSubmit} sx={{ maxWidth: 600, margin: 'auto', padding: 2 }}>
      <Typography variant="h4" gutterBottom>{survey.title}</Typography>
      {survey.questions.map((question, index) => (
        <Box key={index} sx={{ mb: 3 }}>
          <Typography variant="h6">{question.text}</Typography>
          <RadioGroup
            value={answers[index]}
            onChange={(e) => handleAnswerChange(index, e.target.value)}
          >
            {question.options.map((option, optionIndex) => (
              <FormControlLabel
                key={optionIndex}
                value={option}
                control={<Radio />}
                label={option}
              />
            ))}
          </RadioGroup>
        </Box>
      ))}
      <Button type="submit" variant="contained" color="primary">
        Submit Answers
      </Button>
    </Box>
  );
};

export default TakeSurvey;