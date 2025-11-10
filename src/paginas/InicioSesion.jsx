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

      // Validar estrictamente la respuesta del backend
      const { token, role, valid } = response.data || {};
      if (!token || !role || valid === false) {
        throw new Error(response?.data?.message || 'Credenciales inválidas');
      }

      // Autenticación exitosa: persistir y redirigir
      localStorage.setItem('token', token);
      localStorage.setItem('role', role);
      onLogin?.();
      navigate('/panel-control');
    } catch (error) {
      const status = error?.response?.status;
      const apiMsg = error?.response?.data?.message;
      const errorMessage =
        status === 401 || status === 403
          ? (apiMsg || 'Usuario o contraseña incorrectos')
          : (apiMsg || error.message || 'No se pudo iniciar sesión');
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
