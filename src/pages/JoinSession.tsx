import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { TextField, Button, Box, Typography } from '@mui/material';

const JoinSession: React.FC = () => {
  const [sessionId, setSessionId] = useState('');
  const navigate = useNavigate();

  const handleJoin = () => {
    if (sessionId.trim()) {
      navigate(`/participate/${sessionId}`);
    }
  };

  return (
    <Box sx={{ maxWidth: 400, margin: 'auto', padding: 2 }}>
      <Typography variant="h4" gutterBottom>
        Join Survey Session
      </Typography>
      <TextField
        fullWidth
        label="Session ID"
        value={sessionId}
        onChange={(e) => setSessionId(e.target.value)}
        margin="normal"
      />
      <Button
        fullWidth
        variant="contained"
        color="primary"
        onClick={handleJoin}
        sx={{ mt: 2 }}
      >
        Join Session
      </Button>
    </Box>
  );
};

export default JoinSession;