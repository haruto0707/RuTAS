import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { 
  Box, 
  Typography, 
  Button, 
  CircularProgress, 
  RadioGroup, 
  FormControlLabel, 
  Radio, 
  Checkbox, 
  TextField, 
  Slider, 
  FormGroup, 
  Alert, 
  List, 
  ListItem, 
  ListItemText 
} from '@mui/material';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { doc, getDoc, setDoc, updateDoc, increment, onSnapshot } from 'firebase/firestore';
import { db } from '../services/firebase';
import { Question } from '../types/QuestionTypes';

interface Session {
  surveyId: string;
  status: 'waiting' | 'active' | 'completed';
  currentQuestionIndex: number;
}

interface Survey {
  title: string;
  questions: Question[];
}

const ParticipateSession: React.FC = () => {
  const { sessionId } = useParams<{ sessionId: string }>();
  const [session, setSession] = useState<Session | null>(null);
  const [survey, setSurvey] = useState<Survey | null>(null);
  const [answer, setAnswer] = useState<string | string[] | number>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [rankingOrder, setRankingOrder] = useState<string[]>([]);

  useEffect(() => {
    if (!sessionId) {
      setError('No session ID provided');
      setLoading(false);
      return;
    }

    const sessionRef = doc(db, 'sessions', sessionId);
    const unsubscribe = onSnapshot(sessionRef, async (docSnapshot) => {
      if (docSnapshot.exists()) {
        const sessionData = docSnapshot.data() as Session;
        setSession(sessionData);

        // セッションの状態に関わらず、サーベイデータを取得
        const surveyDoc = await getDoc(doc(db, 'surveys', sessionData.surveyId));
        if (surveyDoc.exists()) {
          const surveyData = surveyDoc.data() as Survey;
          setSurvey(surveyData);
          if (surveyData.questions[sessionData.currentQuestionIndex]?.type === 'ranking') {
            setRankingOrder(surveyData.questions[sessionData.currentQuestionIndex].options);
          }
        } else {
          setError('Survey not found');
        }
      } else {
        setError('Session not found');
      }
      setLoading(false);
    }, (err) => {
      console.error('Error fetching session:', err);
      setError('Failed to fetch session data');
      setLoading(false);
    });

    return () => unsubscribe();
  }, [sessionId]);

  const renderQuestionInput = (question: Question) => {
    switch (question.type) {
      case 'singleChoice':
        return (
          <RadioGroup value={answer} onChange={(e) => setAnswer(e.target.value)}>
            {question.options.map((option, index) => (
              <FormControlLabel key={index} value={option} control={<Radio />} label={option} />
            ))}
          </RadioGroup>
        );
      case 'multipleChoice':
        return (
          <FormGroup>
            {question.options.map((option, index) => (
              <FormControlLabel
                key={index}
                control={
                  <Checkbox
                    checked={Array.isArray(answer) && answer.includes(option)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setAnswer([...(Array.isArray(answer) ? answer : []), option]);
                      } else {
                        setAnswer((Array.isArray(answer) ? answer : []).filter(a => a !== option));
                      }
                    }}
                  />
                }
                label={option}
              />
            ))}
          </FormGroup>
        );
      case 'rating':
      case 'slider':
        return (
          <Slider
            value={typeof answer === 'number' ? answer : question.min}
            onChange={(_, value) => setAnswer(value as number)}
            min={question.min}
            max={question.max}
            step={question.type === 'slider' ? question.step : 1}
            marks
            valueLabelDisplay="auto"
          />
        );
      case 'freeText':
        return (
          <TextField
            fullWidth
            multiline
            rows={4}
            value={answer as string}
            onChange={(e) => setAnswer(e.target.value)}
          />
        );
      case 'ranking':
        return (
          <DragDropContext onDragEnd={(result) => {
            if (!result.destination) return;
            const items = Array.from(rankingOrder);
            const [reorderedItem] = items.splice(result.source.index, 1);
            items.splice(result.destination.index, 0, reorderedItem);
            setRankingOrder(items);
            setAnswer(items);
          }}>
            <Droppable droppableId="ranking">
              {(provided) => (
                <List {...provided.droppableProps} ref={provided.innerRef}>
                  {rankingOrder.map((option, index) => (
                    <Draggable key={option} draggableId={option} index={index}>
                      {(provided) => (
                        <ListItem
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          {...provided.dragHandleProps}
                        >
                          <DragIndicatorIcon />
                          <ListItemText primary={option} />
                        </ListItem>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </List>
              )}
            </Droppable>
          </DragDropContext>
        );
      default:
        return null;
    }
  };

  const submitAnswer = async () => {
    if (!sessionId || !session || !survey || answer === '') return;
    
    try {
      const questionRef = doc(db, 'sessions', sessionId, 'answers', `question_${session.currentQuestionIndex}`);
      const questionDoc = await getDoc(questionRef);

      if (!questionDoc.exists()) {
        // ドキュメントが存在しない場合、新しく作成
        if (typeof answer === 'string') {
          await setDoc(questionRef, { [answer]: 1 });
        } else if (Array.isArray(answer)) {
          const initialData = answer.reduce((acc, option) => {
            acc[option] = 1;
            return acc;
          }, {} as { [key: string]: number });
          await setDoc(questionRef, initialData);
        } else if (typeof answer === 'number') {
          await setDoc(questionRef, { values: 1, sum: answer });
        }
      } else {
        // ドキュメントが存在する場合、更新
        if (typeof answer === 'string') {
          await updateDoc(questionRef, {
            [answer]: increment(1)
          });
        } else if (Array.isArray(answer)) {
          const updateObject = answer.reduce((acc, option) => {
            acc[option] = increment(1);
            return acc;
          }, {} as { [key: string]: any });
          await updateDoc(questionRef, updateObject);
        } else if (typeof answer === 'number') {
          await updateDoc(questionRef, {
            values: increment(1),
            sum: increment(answer)
          });
        }
      }
      setAnswer('');
    } catch (err) {
      console.error('Error submitting answer:', err);
      setError('Failed to submit answer');
    }
  };

  if (loading) return <CircularProgress />;
  if (error) return <Alert severity="error">{error}</Alert>;
  if (!session || !survey) return <Alert severity="warning">Session or survey data not available</Alert>;

  if (session.status === 'waiting') {
    return (
      <Box sx={{ maxWidth: 600, margin: 'auto', padding: 2, textAlign: 'center' }}>
        <Typography variant="h5" gutterBottom>
          Waiting for the session to start...
        </Typography>
        <CircularProgress />
      </Box>
    );
  }

  if (session.status === 'completed') {
    return (
      <Box sx={{ maxWidth: 600, margin: 'auto', padding: 2, textAlign: 'center' }}>
        <Typography variant="h5" gutterBottom>
          This session has ended. Thank you for participating!
        </Typography>
      </Box>
    );
  }

  const currentQuestion = survey.questions[session.currentQuestionIndex];

  return (
    <Box sx={{ maxWidth: 600, margin: 'auto', padding: 2 }}>
      <Typography variant="h5" gutterBottom>
        {currentQuestion.text}
      </Typography>
      {renderQuestionInput(currentQuestion)}
      <Button 
        variant="contained" 
        color="primary" 
        onClick={submitAnswer} 
        disabled={!answer}
        sx={{ mt: 2 }}
      >
        Submit Answer
      </Button>
    </Box>
  );
};

export default ParticipateSession;