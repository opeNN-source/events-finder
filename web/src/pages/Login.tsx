import { AppProvider } from '@toolpad/core/AppProvider';
import { useTheme } from '@mui/material/styles';
import { useNavigate } from "react-router";
import { AxiosError } from 'axios';
import { useState } from 'react';
import { authAPI } from '../services/api';
import { saveAuthData } from '../services/auth';
import {
  Box,
  Alert,
  Button,
  Typography,
  TextField,
  Paper,
  Container,
  Stack,
  CircularProgress
} from '@mui/material';

export default function Login() {
  const navigate = useNavigate();
  const [error, setError] = useState<string>('');
  const [isSignUp] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');

  const theme = useTheme();

  const handleAuth = async (email: string, password: string) => {
    setIsLoading(true);
    setError('');

    try {
      let response;

      if (isSignUp) {
        response = await authAPI.signup({ email, password });
      } else {
        response = await authAPI.login({ email, password });
      }

      if (response.data) {
        const { access, refresh } = response.data;

        saveAuthData({ access, refresh }, email);

        navigate('/events', { replace: true });
      }
    } catch (err: unknown) {
      const error = err as AxiosError;
      setError(
        // @ts-ignore
        error.response?.data?.message ||
        error.message ||
        `Ошибка при ${isSignUp ? 'регистрации' : 'входе'}`
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !password) {
      setError('Пожалуйста, заполните все поля');
      return;
    }

    if (!/\S+@\S+\.\S+/.test(email)) {
      setError('Введите корректный email адрес');
      return;
    }

    handleAuth(email, password);
  };

  // const resetForm = () => {
  //   setEmail('');
  //   setPassword('');
  //   setError('');
  // };

  return (
    <AppProvider theme={theme}>
      <Container component="main" maxWidth="xs">
        <Box
          sx={{
            marginTop: 8,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
          }}
        >
          <Paper
            elevation={3}
            sx={{
              padding: 4,
              width: '100%',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
            }}
          >
            <Typography component="h1" variant="h5" sx={{ mb: 3 }}>
              {isSignUp ? 'Регистрация' : 'Вход в систему'}
            </Typography>

            {error && (
              <Alert
                severity="error"
                sx={{
                  width: '100%',
                  mb: 2
                }}
                onClose={() => setError('')}
              >
                {error}
              </Alert>
            )}

            <Box
              component="form"
              onSubmit={handleSubmit}
              sx={{
                width: '100%',
                mt: 1
              }}
            >
              <Stack spacing={2}>
                <TextField
                  margin="normal"
                  required
                  fullWidth
                  id="email"
                  label="Email адрес"
                  name="email"
                  autoComplete="email"
                  autoFocus
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isLoading}
                  error={!!error && !email}
                />

                <TextField
                  margin="normal"
                  required
                  fullWidth
                  name="password"
                  label="Пароль"
                  type="password"
                  id="password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoading}
                  error={!!error && !password}
                />

                <Button
                  type="submit"
                  fullWidth
                  variant="contained"
                  disabled={isLoading}
                  sx={{
                    mt: 3,
                    mb: 2,
                    height: 48
                  }}
                >
                  {isLoading ? (
                    <CircularProgress size={24} color="inherit" />
                  ) : (
                    isSignUp ? 'Зарегистрироваться' : 'Войти'
                  )}
                </Button>
              </Stack>
            </Box>

            {/*<Box sx={{ mt: 2, textAlign: 'center' }}>*/}
            {/*  <Button*/}
            {/*    variant="text"*/}
            {/*    onClick={() => {*/}
            {/*      resetForm();*/}
            {/*      setIsSignUp(!isSignUp);*/}
            {/*    }}*/}
            {/*    disabled={isLoading}*/}
            {/*    sx={{ textTransform: 'none' }}*/}
            {/*  >*/}
            {/*    {isSignUp*/}
            {/*      ? 'Уже есть аккаунт? Войти'*/}
            {/*      : 'Нет аккаунта? Зарегистрироваться'*/}
            {/*    }*/}
            {/*  </Button>*/}
            {/*</Box>*/}
          </Paper>
        </Box>
      </Container>
    </AppProvider>
  );
}