import React, { useState } from 'react';
import { TextField, Button, Box, Select, MenuItem, FormControl, InputLabel, Toolbar, CircularProgress, Snackbar } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { collection, addDoc, doc, setDoc } from 'firebase/firestore';
import { db } from '../services/firebase';
import { Question, QuestionType } from '../types/QuestionTypes';

const CreateSurvey: React.FC = () => {
  const [title, setTitle] = useState('');
  const [questions, setQuestions] = useState<Question[]>([]);
  const [selectedQuestionType, setSelectedQuestionType] = useState<QuestionType | ''>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const navigate = useNavigate();

  const addQuestion = () => {
    if (selectedQuestionType === '') return;

    const newQuestion: Question = {
      id: Date.now().toString(),
      text: '',
      type: selectedQuestionType,
      options: selectedQuestionType === 'singleChoice' || selectedQuestionType === 'multipleChoice' || selectedQuestionType === 'ranking' ? [''] : [],
      min: selectedQuestionType === 'rating' || selectedQuestionType === 'slider' ? 1 : 0,
      max: selectedQuestionType === 'rating' ? 5 : selectedQuestionType === 'slider' ? 100 : 0,
      step: selectedQuestionType === 'slider' ? 1 : 0,
    };
    setQuestions([...questions, newQuestion]);
    setSelectedQuestionType('');
  };

  const updateQuestion = (index: number, field: string, value: any) => {
    const updatedQuestions = [...questions];
    updatedQuestions[index] = { ...updatedQuestions[index], [field]: value };
    setQuestions(updatedQuestions);
  };

  const renderQuestionFields = (question: Question, index: number) => {
    switch (question.type) {
      case 'singleChoice':
      case 'multipleChoice':
      case 'ranking':
        return (
          <Box>
            {question.options.map((option, optionIndex) => (
              <TextField
                key={optionIndex}
                fullWidth
                label={`Option ${optionIndex + 1}`}
                value={option}
                onChange={(e) => {
                  const newOptions = [...question.options];
                  newOptions[optionIndex] = e.target.value;
                  updateQuestion(index, 'options', newOptions);
                }}
                margin="normal"
              />
            ))}
            <Button onClick={() => updateQuestion(index, 'options', [...question.options, ''])}>
              Add Option
            </Button>
          </Box>
        );
      case 'rating':
      case 'slider':
        return (
          <Box>
            <Toolbar />
            <TextField
              label="Minimum"
              type="number"
              value={question.min}
              onChange={(e) => updateQuestion(index, 'min', parseInt(e.target.value) || 0)}
            />
            <TextField
              label="Maximum"
              type="number"
              value={question.max}
              onChange={(e) => updateQuestion(index, 'max', parseInt(e.target.value) || 0)}
            />
            {question.type === 'slider' && (
              <TextField
                label="Step"
                type="number"
                value={question.step}
                onChange={(e) => updateQuestion(index, 'step', parseInt(e.target.value) || 1)}
              />
            )}
          </Box>
        );
      default:
        return null;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Create the survey document
      const surveyRef = await addDoc(collection(db, "surveys"), {
        title,
        questions,
        createdAt: new Date()
      });
      
      // Create a session for this survey
      const sessionRef = await addDoc(collection(db, "sessions"), {
        surveyId: surveyRef.id,
        status: 'waiting',
        currentQuestionIndex: -1,
        participants: 0
      });

      // Update the survey with the sessionId
      await setDoc(doc(db, "surveys", surveyRef.id), { sessionId: sessionRef.id }, { merge: true });
      
      setSnackbarMessage('Survey created successfully!');
      setSnackbarOpen(true);
      setTimeout(() => navigate(`/manage/${sessionRef.id}`), 2000); // Redirect to manage page after 2 seconds
    } catch (error) {
      console.error("Error adding document: ", error);
      setSnackbarMessage('Error creating survey. Please try again.');
      setSnackbarOpen(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Box component="form" onSubmit={handleSubmit} sx={{ maxWidth: 600, margin: 'auto', padding: 2 }}>
      <Toolbar />
      <TextField
        fullWidth
        label="Survey Title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        margin="normal"
        required
      />
      {questions.map((question, index) => (
        <Box key={question.id} mb={2}>
          <TextField
            fullWidth
            label={`Question ${index + 1}`}
            value={question.text}
            onChange={(e) => updateQuestion(index, 'text', e.target.value)}
            margin="normal"
            required
          />
          {renderQuestionFields(question, index)}
        </Box>
      ))}
      <FormControl fullWidth margin="normal">
        <InputLabel>Add Question Type</InputLabel>
        <Select
          value={selectedQuestionType}
          onChange={(e) => setSelectedQuestionType(e.target.value as QuestionType)}
        >
          <MenuItem value="singleChoice">Single Choice</MenuItem>
          <MenuItem value="multipleChoice">Multiple Choice</MenuItem>
          <MenuItem value="rating">Rating (1-100)</MenuItem>
          <MenuItem value="freeText">Free Text</MenuItem>
          <MenuItem value="ranking">Ranking</MenuItem>
          <MenuItem value="slider">Slider</MenuItem>
        </Select>
      </FormControl>
      <Button variant="contained" color="secondary" onClick={addQuestion} disabled={selectedQuestionType === ''} sx={{ mt: 2, mr: 2 }}>
        Add Question
      </Button>
      <Button type="submit" variant="contained" color="primary" disabled={isSubmitting || questions.length === 0} sx={{ mt: 2 }}>
        {isSubmitting ? <CircularProgress size={24} /> : 'Create Survey'}
      </Button>
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={6000}
        onClose={() => setSnackbarOpen(false)}
        message={snackbarMessage}
      />
    </Box>
  );
};

export default CreateSurvey;