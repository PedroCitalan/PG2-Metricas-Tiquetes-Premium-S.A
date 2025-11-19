// BarraNavegacion.jsx
import { Link } from 'react-router-dom';
import '../Estilos/BarraNavegacion.css';

const BarraNavegacion = ({ onLogout }) => {
  return (
    <nav className="nav">
      <div className="left-links">
        <Link to="/panel-control" className='link'>Descripción</Link>
        <Link to="/metricasresueltos" className='link'>Métricas de tiquetes resueltos</Link>
        <Link to="/metricasnoresueltos" className='link'>Métricas de tiquetes no resueltos</Link>
        <Link to="/metricasmes" className='link'>Métricas de tiquetes por mes</Link>
        <Link to="/metricasencargados" className='link'>Top Performance Gestión de servicios</Link>
      </div>
      
      <button className="logout-btn" onClick={onLogout}>
        Cerrar sesión
      </button>
    </nav>
  );
};

export default BarraNavegacion;
