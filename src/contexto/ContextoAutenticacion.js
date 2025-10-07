import { jwtDecode } from 'jwt-decode'; // Cambio: Usamos exportación nombrada

import { createContext, useState, useContext, useEffect } from 'react';

const ContextoAutenticacion = createContext();

export const ProveedorAutenticacion = ({ children }) => {
  const [usuario, setUsuario] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) setUsuario(jwtDecode(token));
  }, []);

  const iniciarSesion = (token) => {
    localStorage.setItem('token', token);
    setUsuario(jwtDecode(token));
  };

  const cerrarSesion = () => {
    localStorage.removeItem('token');
    setUsuario(null);
  };

  return (
    <ContextoAutenticacion.Provider value={{ usuario, iniciarSesion, cerrarSesion }}>
      {children}
    </ContextoAutenticacion.Provider>
  );
};

export const useAutenticacion = () => useContext(ContextoAutenticacion);