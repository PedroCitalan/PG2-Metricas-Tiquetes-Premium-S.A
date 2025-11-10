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

      const { success, token, role, message } = response.data || {};
      if (!success || !token || !role) {
        throw new Error(message || 'Usuario o contraseña incorrectos');
      }

      localStorage.setItem('token', token);
      localStorage.setItem('role', role);
      onLogin && onLogin();
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
  );
};

export default InicioSesion;
