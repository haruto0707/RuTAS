import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ThemeProvider, createTheme, CssBaseline } from '@mui/material';
import Navigation from './components/Navigation';
import Home from './pages/Home';
import CreateSurvey from './pages/CreateSurvey';
import EditSurvey from './pages/EditSurvey';
import JoinSession from './pages/JoinSession';
import ManageSession from './pages/ManageSession';
import ParticipateSession from './pages/ParticipateSession';
import SurveyResults from './pages/SurveyResults';
import QuestionResults from './pages/QuestionResults';
import SessionResults from './pages/SessionResults';
import Login from './components/Login';
import Register from './components/Register';
import PrivateRoute from './components/PrivateRoute';

const theme = createTheme();

const App: React.FC = () => {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <BrowserRouter>
        <Navigation />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/create" element={<PrivateRoute><CreateSurvey /></PrivateRoute>} />
          <Route path="/edit/:id" element={<PrivateRoute><EditSurvey /></PrivateRoute>} />
          <Route path="/join" element={<JoinSession />} />
          <Route path="/manage/:sessionId" element={<PrivateRoute><ManageSession /></PrivateRoute>} />
          <Route path="/participate/:sessionId" element={<ParticipateSession />} />
          <Route path="/results/:id" element={<PrivateRoute><SurveyResults /></PrivateRoute>} />
          <Route path="/question-results/:sessionId/:questionIndex" element={<PrivateRoute><QuestionResults /></PrivateRoute>} />
          <Route path="/session-results/:sessionId" element={<PrivateRoute><SessionResults /></PrivateRoute>} />
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  );
};

export default App;