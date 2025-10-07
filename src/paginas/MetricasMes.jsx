import React, { useState, useEffect } from 'react';
import { Card, CardContent, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Box, TextField, Button } from '@mui/material';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import '../Estilos/PanelControl.css';

// Mapeo de alias para mostrar nombres de técnicos (igual que en MetricasEncargados)
const aliasTecnicos = {
  'Jose Castro [jose.castro]': 'Jose Castro',
  'Jos� Morales [jose.morales]': 'José Morales', 
  'Rolando Lopez [rolando.lopez]': 'Rolando López',
  'Fernando Velasquez +50254892327 [fernando.velasquez]': 'Fernando Velásquez',
  'Byron Borrayo +50254287799 [Byron.Borrayo]': 'Byron Borrayo',
  'Juan Jose Gomez +50242105695 [Juanj.gomez]': 'Juan José Gomez',
  'Saul Recinos [saul.recinos]': 'Saúl Recinos'
};

// Función para obtener el alias de un técnico
const obtenerAlias = (nombreOriginal) => {
  // Buscar coincidencia exacta primero
  if (aliasTecnicos[nombreOriginal]) {
    return aliasTecnicos[nombreOriginal];
  }
  
  // Si no hay coincidencia exacta, buscar coincidencia parcial
  for (const [clave, alias] of Object.entries(aliasTecnicos)) {
    if (nombreOriginal.includes(clave.split(' +')[0].split(' [')[0])) {
      return alias;
    }
  }
  
  return nombreOriginal;
};

// Función para filtrar tickets de encargados permitidos
const filtrarTicketsEncargados = (tickets) => {
  const tecnicosPermitidos = ['Jose Castro [jose.castro]', 'Jos� Morales [jose.morales]', 'Rolando Lopez [rolando.lopez]', 'Fernando Velasquez +50254892327 [fernando.velasquez]', 'Byron Borrayo +50254287799 [Byron.Borrayo]', 'Juan Jose Gomez +50242105695 [Juanj.gomez]', 'Saul Recinos [saul.recinos]'];
  
  // Función para verificar si el técnico está permitido
  const esTecnicoPermitido = (nombre) => {
    if (!nombre) return false;
    if (tecnicosPermitidos.includes(nombre)) return true;
    return tecnicosPermitidos.some(permitido => {
      const nombrePermitido = permitido.split(' +')[0];
      const nombrePermitidoSinUsuario = nombrePermitido.split(' [')[0];
      return nombre.includes(nombrePermitidoSinUsuario);
    });
  };
  
  return tickets.filter(ticket => esTecnicoPermitido(ticket.Tech));
};

// Función para obtener tickets del mes de octubre 2025
const obtenerTicketsOctubre2025 = (tickets) => {
  const octubre2025 = { 
    inicio: new Date(2025, 9, 1), // 1 de octubre 2025
    fin: new Date(2025, 9, 31)    // 31 de octubre 2025
  };
  
  return tickets.filter(ticket => {
    const fechaTicket = new Date(ticket.Date);
    return fechaTicket >= octubre2025.inicio && fechaTicket <= octubre2025.fin;
  });
};

// Función para calcular estadísticas de estados
const calcularEstadisticasEstados = (tickets) => {
  const estadisticas = {
    resueltos: 0,
    cancelados: 0,
    pendientes: 0,
    total: tickets.length
  };
  
  tickets.forEach(ticket => {
    const status = ticket.Status;
    if (status === 'Cerrado' || status === 'Resuelto') {
      estadisticas.resueltos++;
    } else if (status === 'Cancelado') {
      estadisticas.cancelados++;
    } else {
      estadisticas.pendientes++;
    }
  });
  
  return estadisticas;
};

// Función para calcular estadísticas de encuestas
const calcularEstadisticasEncuestas = (tickets) => {
  const estadisticas = {
    conEncuesta: 0,
    sinEncuesta: 0,
    total: tickets.length
  };
  
  tickets.forEach(ticket => {
    const tieneEncuesta = ticket.Encuesta && !isNaN(parseInt(ticket.Encuesta)) && parseInt(ticket.Encuesta) >= 1 && parseInt(ticket.Encuesta) <= 5;
    if (tieneEncuesta) {
      estadisticas.conEncuesta++;
    } else {
      estadisticas.sinEncuesta++;
    }
  });
  
  return estadisticas;
};

function MetricasMes() {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ tech: '' });

  useEffect(() => {
    const fetchData = () => {
      fetch('http://localhost:3001/api/encargados', { cache: "no-store" })
        .then(response => response.json())
        .then(data => {
          if (Array.isArray(data)) {
            setTickets(data);
          } else {
            console.error('Error: Datos incorrectos', data);
          }
          setLoading(false);
        })
        .catch(error => {
          console.error('Error al obtener los tickets:', error);
          setLoading(false);
        });
    };
    fetchData();
    const interval = setInterval(fetchData, 120000);

    return () => clearInterval(interval);
  }, []);

  // Función para búsqueda parcial como Excel (igual que en MetricasEncargados)
  const buscarTecnico = (ticket, busqueda) => {
    if (!busqueda) return true;
    
    const tecnicoOriginal = ticket.Tech;
    const aliasTecnico = obtenerAlias(tecnicoOriginal);
    
    // Convertir a minúsculas para búsqueda insensible a mayúsculas
    const termino = busqueda.toLowerCase();
    
    // Si el término contiene asteriscos, tratarlo como comodín
    if (termino.includes('*')) {
      // Convertir patrón de Excel a regex
      const patron = termino
        .replace(/\*/g, '.*') // * se convierte en .* (cualquier carácter)
        .replace(/\./g, '\\.'); // Escapar puntos literales
      
      const regex = new RegExp(`^${patron}$`, 'i');
      return regex.test(tecnicoOriginal) || regex.test(aliasTecnico);
    } else {
      // Búsqueda parcial simple (contiene el término)
      return tecnicoOriginal.toLowerCase().includes(termino) || 
             aliasTecnico.toLowerCase().includes(termino);
    }
  };

  // Filtrar tickets por técnico seleccionado
  const ticketsFiltrados = filtrarTicketsEncargados(tickets).filter(ticket => {
    return buscarTecnico(ticket, filters.tech);
  });

  // Obtener tickets de octubre 2025
  const ticketsOctubre2025 = obtenerTicketsOctubre2025(ticketsFiltrados);

  // Calcular estadísticas
  const estadisticasEstados = calcularEstadisticasEstados(ticketsOctubre2025);
  const estadisticasEncuestas = calcularEstadisticasEncuestas(ticketsOctubre2025);

  // Datos para las gráficas
  const datosEstados = [
    { name: 'Resueltos', value: estadisticasEstados.resueltos, color: '#4CAF50' },
    { name: 'Pendientes', value: estadisticasEstados.pendientes, color: '#FF9800' },
    { name: 'Cancelados', value: estadisticasEstados.cancelados, color: '#F44336' }
  ];

  const datosEncuestas = [
    { name: 'Con Encuesta', value: estadisticasEncuestas.conEncuesta, color: '#2196F3' },
    { name: 'Sin Encuesta', value: estadisticasEncuestas.sinEncuesta, color: '#FF5722' }
  ];

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <Typography>Cargando métricas del mes...</Typography>
      </Box>
    );
  }

  return (
    <div className="metricas-mes">
      <Typography variant="h4" component="h1" gutterBottom>
        Métricas del Mes - Octubre 2025
      </Typography>
      
      {filters.tech && (
        <Typography variant="body2" color="text.secondary" gutterBottom>
          Mostrando {ticketsOctubre2025.length} de {obtenerTicketsOctubre2025(filtrarTicketsEncargados(tickets)).length} tickets de octubre 2025 que coinciden con "{filters.tech}"
        </Typography>
      )}

      {/* Filtro de Técnicos */}
      <div style={{ marginBottom: '20px', display: 'flex', gap: '10px', alignItems: 'flex-end' }}>
        <TextField
          fullWidth
          label="Buscar técnico"
          value={filters.tech}
          onChange={(e) => setFilters({ ...filters, tech: e.target.value })}
          placeholder="Escriba parte del nombre, teléfono o use * como comodín"
          helperText="Busca en nombres completos."
        />
        <Button 
          variant="outlined" 
          onClick={() => setFilters({ ...filters, tech: '' })}
          style={{ minWidth: '120px' }}
        >
          Mostrar Todos
        </Button>
      </div>

      {/* Gráficas de Estadísticas */}
      <div style={{ display: 'flex', gap: '20px', marginBottom: '20px' }}>
        {/* Gráfica de Estados */}
        <Card style={{ flex: 1 }}>
          <CardContent>
            <Typography variant="h6" component="h3" gutterBottom style={{ textAlign: 'center', fontWeight: 'bold' }}>
              Estados de Tiquetes - Octubre 2025
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={datosEstados}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={120}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {datosEstados.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
            <Box style={{ textAlign: 'center', marginTop: '10px' }}>
              <Typography variant="h6" style={{ fontWeight: 'bold' }}>
                Total: {estadisticasEstados.total} tiquetes
              </Typography>
            </Box>
          </CardContent>
        </Card>

        {/* Gráfica de Encuestas */}
        <Card style={{ flex: 1 }}>
          <CardContent>
            <Typography variant="h6" component="h3" gutterBottom style={{ textAlign: 'center', fontWeight: 'bold' }}>
              Encuestas Respondidas - Octubre 2025
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={datosEncuestas}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={120}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {datosEncuestas.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
            <Box style={{ textAlign: 'center', marginTop: '10px' }}>
              <Typography variant="h6" style={{ fontWeight: 'bold' }}>
                Total: {estadisticasEncuestas.total} tiquetes
              </Typography>
            </Box>
          </CardContent>
        </Card>
      </div>

      {/* Tabla Detallada de Tickets */}
      <Card>
        <CardContent>
          <Typography variant="h5" component="h2" gutterBottom style={{ textAlign: 'center', fontWeight: 'bold' }}>
            Detalle de Tiquetes - Octubre 2025
          </Typography>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow style={{ backgroundColor: '#000', color: '#fff' }}>
                  <TableCell style={{ color: '#fff', fontWeight: 'bold' }}>No.</TableCell>
                  <TableCell style={{ color: '#fff', fontWeight: 'bold' }}>Fecha</TableCell>
                  <TableCell style={{ color: '#fff', fontWeight: 'bold' }}>Estado</TableCell>
                  <TableCell style={{ color: '#fff', fontWeight: 'bold' }}>Técnico Responsable</TableCell>
                  <TableCell style={{ color: '#fff', fontWeight: 'bold' }}>Cliente</TableCell>
                  <TableCell style={{ color: '#fff', fontWeight: 'bold' }}>Asunto</TableCell>
                  <TableCell style={{ color: '#fff', fontWeight: 'bold' }}>Encuesta</TableCell>
                  <TableCell style={{ color: '#fff', fontWeight: 'bold' }}>Última Actualización</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {ticketsOctubre2025.map((ticket, index) => {
                  const aliasTecnico = obtenerAlias(ticket.Tech);
                  const tieneEncuesta = ticket.Encuesta && !isNaN(parseInt(ticket.Encuesta)) && parseInt(ticket.Encuesta) >= 1 && parseInt(ticket.Encuesta) <= 5;
                  const calificacion = tieneEncuesta ? parseInt(ticket.Encuesta) : null;
                  const status = ticket.Status;
                  
                  // Determinar color de fondo basado en estado
                  let backgroundColor = index % 2 === 0 ? '#fff' : '#f9f9f9';
                  if (status === 'Cerrado' || status === 'Resuelto') {
                    backgroundColor = index % 2 === 0 ? '#e8f5e8' : '#f0f8f0';
                  } else if (status === 'Cancelado') {
                    backgroundColor = index % 2 === 0 ? '#ffeaea' : '#fff0f0';
                  } else {
                    backgroundColor = index % 2 === 0 ? '#fff8e1' : '#fffbf0';
                  }
                  
                  return (
                    <TableRow 
                      key={index} 
                      style={{ backgroundColor }}
                    >
                      <TableCell style={{ fontWeight: 'bold' }}>{ticket['No.'] || index + 1}</TableCell>
                      <TableCell>{new Date(ticket.Date).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <span style={{ 
                          color: status === 'Cerrado' || status === 'Resuelto' ? 'green' : 
                                status === 'Cancelado' ? 'red' : 'orange',
                          fontWeight: 'bold'
                        }}>
                          {status}
                        </span>
                      </TableCell>
                      <TableCell style={{ fontWeight: 'bold' }}>{aliasTecnico}</TableCell>
                      <TableCell>{ticket.Client}</TableCell>
                      <TableCell>{ticket.Subject}</TableCell>
                      <TableCell align="center">
                        {tieneEncuesta ? (
                          <span style={{ 
                            color: calificacion >= 4 ? 'green' : calificacion >= 3 ? 'orange' : 'red',
                            fontWeight: 'bold',
                            fontSize: '16px'
                          }}>
                            {calificacion} ⭐
                          </span>
                        ) : (
                          <span style={{ 
                            color: 'red',
                            fontWeight: 'bold'
                          }}>
                            Sin encuesta
                          </span>
                        )}
                      </TableCell>
                      <TableCell>{new Date(ticket.Updated).toLocaleDateString()}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>
    </div>
  );
}

export default MetricasMes;