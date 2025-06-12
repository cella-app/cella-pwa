'use client';

import { Button, Typography, Container } from '@mui/material';

export default function Home() {
  return (
    <Container>
      <Typography variant="h4" gutterBottom>Hello from MUI + Next.js!</Typography>
      <Button variant="contained" color="primary">Click me</Button>
    </Container>
  );
}
