// App.js
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import { useState } from 'react';
import InicioSesion from './paginas/InicioSesion';
import Registro from './paginas/Registro';
import PanelControl from './paginas/PanelControl';
import Tareas from './paginas/Tareas';
import Proyectos from './paginas/Proyectos';
import MetricasMes from './paginas/MetricasMes'
import MetricasEncargados from './paginas/MetricasEncargados'
import BarraNavegacion from './componentes/BarraNavegacion';
import './index.css';

const App = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return !!localStorage.getItem('token');
  });

  const handleLogin = () => {
    setIsAuthenticated(true);
    localStorage.setItem('token', 'usuario-ingreso');
  };

  const handleLogout = async () => {
    setIsAuthenticated(false);
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    await fetch('https://metricastiquetespremiumbackend.onrender.com/api/logout', { method: 'POST' });
  };

  return (
    <Router>
      {/* Mostrar la barra de navegación solo si el usuario está autenticado */}
      {isAuthenticated && <BarraNavegacion onLogout={handleLogout} />}

      <Routes>
        <Route path="/" element={
          isAuthenticated
            ? <Navigate to="/panel-control" />
            : <Navigate to="/iniciar-sesion" />
        }
        />
        <Route path="/iniciar-sesion" element={<InicioSesion onLogin={handleLogin} />} />
        <Route path="/registro" element={<Registro />} />

        { }
        {isAuthenticated ? (
          <>
            <Route path="/panel-control" element={<PanelControl />} />
            <Route path="/tareas" element={<Tareas />} />
            <Route path="/proyectos" element={<Proyectos />} />
            <Route path="/metricasmes" element={<MetricasMes />} />
            <Route path="/metricasencargados" element={<MetricasEncargados/>} />
          </>
        ) : (
          <Route path="*" element={<Navigate to="/iniciar-sesion" />} />
        )}
      </Routes>
    </Router>
  );
};

export default App;
