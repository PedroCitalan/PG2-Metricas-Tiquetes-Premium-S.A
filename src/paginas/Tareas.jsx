import React, { useState, useEffect } from 'react';
import { Card, CardContent, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Box, TextField, Button } from '@mui/material';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import '../Estilos/Tareas.css';

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

// Función para calcular tickets resueltos del mes
const calcularTicketsResueltosMes = (tickets) => {
  const fechaActual = new Date();
  const mesActual = fechaActual.getMonth() + 1;
  const añoActual = fechaActual.getFullYear();
  
  // Fechas para el mes actual
  const inicioMesActual = new Date(añoActual, mesActual - 1, 1);
  const finMesActual = new Date(añoActual, mesActual, 0);
  
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
  
  const ticketsResueltos = tickets.filter(ticket => {
    const fechaTicket = new Date(ticket.Date);
    return (
      fechaTicket >= inicioMesActual && 
      fechaTicket <= finMesActual && 
      (ticket.Status === 'Cerrado' || ticket.Status === 'Resuelto') &&
      esTecnicoPermitido(ticket.Tech)
    );
  });
  
  return ticketsResueltos.length;
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

const Tareas = () => {
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

  // Calcular tickets resueltos del mes
  const ticketsResueltosMes = calcularTicketsResueltosMes(tickets);

  // Datos para la gráfica de barras
  const barChartData = [
    { name: 'Tiquetes Resueltos del Mes', Cantidad: ticketsResueltosMes, fill: "#40A315" }
  ];

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <Typography>Cargando métricas de tiquetes resueltos...</Typography>
      </Box>
    );
  }

  return (
    <div className="tareas">
      <Typography variant="h4" component="h1" gutterBottom>
        Métricas de Tiquetes Resueltos
      </Typography>
      
      {filters.tech && (
        <Typography variant="body2" color="text.secondary" gutterBottom>
          Mostrando {ticketsFiltrados.length} de {filtrarTicketsEncargados(tickets).length} tickets que coinciden con "{filters.tech}"
        </Typography>
      )}
      
      {/* Barra de Tickets Resueltos del Mes */}
      <Card style={{ marginBottom: '20px' }}>
        <CardContent>
          <Typography variant="h6" component="h2" gutterBottom style={{ textAlign: 'center', fontWeight: 'bold' }}>
            Tiquetes Resueltos del Mes
          </Typography>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={barChartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="Cantidad" fill="#40A315" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

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

      {/* Tabla de Tiquetes */}
      <Card>
        <CardContent>
          <Typography variant="h5" component="h2" gutterBottom style={{ textAlign: 'center', fontWeight: 'bold' }}>
            Tiquetes de Encargados con Calificaciones de Encuestas
          </Typography>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow style={{ backgroundColor: '#000', color: '#fff' }}>
                  <TableCell style={{ color: '#fff', fontWeight: 'bold' }}>No.</TableCell>
                  <TableCell style={{ color: '#fff', fontWeight: 'bold' }}>Fecha</TableCell>
                  <TableCell style={{ color: '#fff', fontWeight: 'bold' }}>Estado</TableCell>
                  <TableCell style={{ color: '#fff', fontWeight: 'bold' }}>Técnico</TableCell>
                  <TableCell style={{ color: '#fff', fontWeight: 'bold' }}>Cliente</TableCell>
                  <TableCell style={{ color: '#fff', fontWeight: 'bold' }}>Asunto</TableCell>
                  <TableCell style={{ color: '#fff', fontWeight: 'bold' }}>Calificación Encuesta</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {ticketsFiltrados.map((ticket, index) => {
                  const aliasTecnico = obtenerAlias(ticket.Tech);
                  const tieneEncuesta = ticket.Encuesta && !isNaN(parseInt(ticket.Encuesta)) && parseInt(ticket.Encuesta) >= 1 && parseInt(ticket.Encuesta) <= 5;
                  const calificacion = tieneEncuesta ? parseInt(ticket.Encuesta) : null;
                  
                  return (
                    <TableRow 
                      key={index} 
                      style={{ 
                        backgroundColor: !tieneEncuesta ? '#ffebee' : (index % 2 === 0 ? '#fff' : '#f9f9f9')
                      }}
                    >
                      <TableCell>{ticket['No.'] || index + 1}</TableCell>
                      <TableCell>{new Date(ticket.Date).toLocaleDateString()}</TableCell>
                      <TableCell>{ticket.Status}</TableCell>
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
};

export default Tareas;