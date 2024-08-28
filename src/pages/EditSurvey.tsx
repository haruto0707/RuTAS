import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { TextField, Button, Typography, Box, IconButton } from '@mui/material';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../services/firebase';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';

interface Question {
  text: string;
  options: string[];
}

interface Survey {
  id: string;
  title: string;
  questions: Question[];
}

const EditSurvey: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [survey, setSurvey] = useState<Survey | null>(null);

  useEffect(() => {
    const fetchSurvey = async () => {
      if (!id) return;
      const surveyDoc = await getDoc(doc(db, 'surveys', id));
      if (surveyDoc.exists()) {
        setSurvey({ id: surveyDoc.id, ...surveyDoc.data() } as Survey);
      } else {
        console.log('No such survey!');
        navigate('/');
      }
    };
    fetchSurvey();
  }, [id, navigate]);

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (survey) {
      setSurvey({ ...survey, title: e.target.value });
    }
  };

  const handleQuestionChange = (index: number, value: string) => {
    if (survey) {
      const newQuestions = [...survey.questions];
      newQuestions[index].text = value;
      setSurvey({ ...survey, questions: newQuestions });
    }
  };

  const handleOptionChange = (questionIndex: number, optionIndex: number, value: string) => {
    if (survey) {
      const newQuestions = [...survey.questions];
      newQuestions[questionIndex].options[optionIndex] = value;
      setSurvey({ ...survey, questions: newQuestions });
    }
  };

  const handleAddQuestion = () => {
    if (survey) {
      setSurvey({
        ...survey,
        questions: [...survey.questions, { text: '', options: [''] }]
      });
    }
  };

  const handleAddOption = (questionIndex: number) => {
    if (survey) {
      const newQuestions = [...survey.questions];
      newQuestions[questionIndex].options.push('');
      setSurvey({ ...survey, questions: newQuestions });
    }
  };

  const handleRemoveQuestion = (index: number) => {
    if (survey) {
      const newQuestions = survey.questions.filter((_, i) => i !== index);
      setSurvey({ ...survey, questions: newQuestions });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!survey || !id) return;

    try {
      await updateDoc(doc(db, 'surveys', id), {
        title: survey.title,
        questions: survey.questions
      });
      alert('Survey updated successfully!');
      navigate('/');
    } catch (error) {
      console.error('Error updating survey: ', error);
      alert('Error updating survey. Please try again.');
    }
  };

  if (!survey) {
    return <Typography>Loading...</Typography>;
  }

  return (
    <Box component="form" onSubmit={handleSubmit} sx={{ maxWidth: 600, margin: 'auto', padding: 2 }}>
      <Typography variant="h4" gutterBottom>
        Edit Survey
      </Typography>
      <TextField
        fullWidth
        label="Survey Title"
        value={survey.title}
        onChange={handleTitleChange}
        margin="normal"
        required
      />
      {survey.questions.map((question, questionIndex) => (
        <Box key={questionIndex} sx={{ mt: 2, mb: 2 }}>
          <TextField
            fullWidth
            label={`Question ${questionIndex + 1}`}
            value={question.text}
            onChange={(e) => handleQuestionChange(questionIndex, e.target.value)}
            margin="normal"
            required
          />
          {question.options.map((option, optionIndex) => (
            <TextField
              key={optionIndex}
              fullWidth
              label={`Option ${optionIndex + 1}`}
              value={option}
              onChange={(e) => handleOptionChange(questionIndex, optionIndex, e.target.value)}
              margin="normal"
              required
            />
          ))}
          <Button startIcon={<AddIcon />} onClick={() => handleAddOption(questionIndex)}>
            Add Option
          </Button>
          <IconButton onClick={() => handleRemoveQuestion(questionIndex)} color="error">
            <DeleteIcon />
          </IconButton>
        </Box>
      ))}
      <Button startIcon={<AddIcon />} onClick={handleAddQuestion} sx={{ mt: 2 }}>
        Add Question
      </Button>
      <Button type="submit" variant="contained" color="primary" sx={{ mt: 2 }}>
        Update Survey
      </Button>
    </Box>
  );
};

export default EditSurvey;