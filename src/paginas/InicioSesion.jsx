import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import '../Estilos/InicioSesion.css';

const InicioSesion = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();


  const handleLogin = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      alert('Debe llenar todos los campos');
      return;
    }
    setLoading(true);
    try {
       const response = await axios.post('https://metricastiquetespremiumbackend.onrender.com/api/solarwinds-login', {
        username: email,
        password: password
      });

      const { token, role } = response.data;
      localStorage.setItem('token', token);
      localStorage.setItem('role', role);
      onLogin();
      navigate('/panel-control');
    } catch (error) {
      const errorMessage = error?.response?.data?.message || error.message || 'No se pudo iniciar sesión';
      alert(errorMessage);
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-layout">
      <header className="login-header">
        <div className="login-header-content">
          <div className="login-logo-circle">P</div>
          <span className="login-header-title">Métricas de tiquetes Web Help Desk C.A.</span>
        </div>
      </header>

      <div className="login-page">
        <div className="login-form-container">
          <h1>Iniciar Sesión</h1>
          <form onSubmit={handleLogin} className="login-form">
            <label htmlFor="text">Nombre de usuario</label>
            <input
              type="text"
              id="text"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <label htmlFor="password">Contraseña</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <button type="submit" disabled={loading}>
              {loading ? 'Cargando...' : 'Ingresar'}
            </button>
          </form>
        </div>
      </div>

      <footer className="login-footer">
        <span>Página de métricas de tiquetes de Web Help Desk C.A.</span>
      </footer>
    </div>
  );
};

export default InicioSesion;
