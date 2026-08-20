import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';

const LoginForm = () => {
  const { login, register } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
    } catch (err) {
      setError(err.message || 'Ошибка входа');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async () => {
    setError('');
    setLoading(true);
    try {
      await register(email, password);
    } catch (err) {
      setError(err.message || 'Ошибка регистрации');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container">
      <h2>Войти в систему</h2>
      <div className="login-section">
        {!showForm ? (
          <div>
            <p>Для входа используйте учетную запись:</p>
            <p>Email: admin@example.com</p>
            <p>Пароль: admin123</p>
            <button onClick={() => setShowForm(true)}>Войти</button>
          </div>
        ) : (
          <div>
            {error && <div className="error-message">{error}</div>}
            <form onSubmit={handleLogin}>
              <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="login-input"
              />
              <input
                type="password"
                placeholder="Пароль"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="login-input"
              />
              <button type="submit" disabled={loading}>
                {loading ? 'Загрузка...' : 'Войти'}
              </button>
            </form>
            <p>
              Нет аккаунта?{' '}
              <button onClick={handleRegister} disabled={loading}>
                Зарегистрироваться
              </button>
            </p>
            <button onClick={() => setShowForm(false)}>Назад</button>
          </div>
        )}
      </div>
    </div>
  );
};

export default LoginForm;
