import React, { useState, useEffect } from 'react';
import { Card, CardContent, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Box, TextField, Button, Select, MenuItem, FormControl, InputLabel, Checkbox, ListItemText } from '@mui/material';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
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
const calcularTicketsResueltosMes = (tickets, mesSeleccionado = null) => {
  let inicioMes, finMes;
  
  if (mesSeleccionado) {
    const [año, mes] = mesSeleccionado.split('-');
    inicioMes = new Date(parseInt(año), parseInt(mes) - 1, 1);
    finMes = new Date(parseInt(año), parseInt(mes), 0);
  } else {
    const fechaActual = new Date();
    const mesActual = fechaActual.getMonth() + 1;
    const añoActual = fechaActual.getFullYear();
    
    // Fechas para el mes actual
    inicioMes = new Date(añoActual, mesActual - 1, 1);
    finMes = new Date(añoActual, mesActual, 0);
  }
  
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
      fechaTicket >= inicioMes && 
      fechaTicket <= finMes && 
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
  const [filters, setFilters] = useState({ tech: '', calificaciones: [], fechaInicio: '', fechaFin: '', mes: '', tienda: '', marca: '' });
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });

  useEffect(() => {
    const fetchData = () => {
      fetch('https://metricastiquetespremiumbackend-production.up.railway.app/api/encargados', { cache: "no-store" })
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


  // Filtrar tickets por técnico seleccionado, calificaciones y fechas
  const ticketsEncargados = filtrarTicketsEncargados(tickets);
  
  const ticketsFiltrados = ticketsEncargados.filter(ticket => {
    // Filtro por técnico (exact match)
    const matchTech = !filters.tech || ticket.Tech === filters.tech;
    
    // Filtro por calificaciones
    const tieneEncuesta = ticket.Encuesta && !isNaN(parseInt(ticket.Encuesta)) && parseInt(ticket.Encuesta) >= 1 && parseInt(ticket.Encuesta) <= 5;
    const calificacion = tieneEncuesta ? parseInt(ticket.Encuesta) : 'Sin encuesta';
    const matchCalificacion = filters.calificaciones.length === 0 || filters.calificaciones.includes(calificacion);
    
    // Filtro por fechas
    const fechaTicket = new Date(ticket.Date);
    const matchFechaInicio = !filters.fechaInicio || fechaTicket >= new Date(filters.fechaInicio);
    const matchFechaFin = !filters.fechaFin || fechaTicket <= new Date(filters.fechaFin);
    
    // Filtro por tienda
    const matchTienda = !filters.tienda || (ticket.Location && ticket.Location.toLowerCase().includes(filters.tienda.toLowerCase()));
    
    // Filtro por marca
    const matchMarca = !filters.marca || (ticket.Client && ticket.Client.toLowerCase().includes(filters.marca.toLowerCase()));
    
    return matchTech && matchCalificacion && matchFechaInicio && matchFechaFin && matchTienda && matchMarca;
  });

  // Calcular tickets resueltos del mes
  const ticketsResueltosMes = calcularTicketsResueltosMes(tickets, filters.mes);

  // Generar opciones de meses disponibles
  const mesesDisponibles = Array.from(
    new Set(
      ticketsEncargados.map(ticket => {
        const fecha = new Date(ticket.Date);
        return `${fecha.getFullYear()}-${(fecha.getMonth() + 1).toString().padStart(2, '0')}`;
      })
    )
  ).sort();

  // Función para ordenar
  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  // Aplicar ordenamiento
  const sortedTickets = [...ticketsFiltrados].sort((a, b) => {
    if (!sortConfig.key) return 0;
    
    let aValue = a[sortConfig.key];
    let bValue = b[sortConfig.key];
    
    // Manejar fechas
    if (sortConfig.key === 'Date') {
      aValue = new Date(aValue);
      bValue = new Date(bValue);
    }
    
    // Manejar números
    if (sortConfig.key === 'No.') {
      aValue = parseInt(aValue) || 0;
      bValue = parseInt(bValue) || 0;
    }
    
    if (aValue < bValue) {
      return sortConfig.direction === 'asc' ? -1 : 1;
    }
    if (aValue > bValue) {
      return sortConfig.direction === 'asc' ? 1 : -1;
    }
    return 0;
  });

  // Calcular tickets pendientes/abiertos
  const ticketsPendientes = ticketsFiltrados.filter(ticket => 
    ticket.Status !== 'Cerrado' && ticket.Status !== 'Resuelto'
  ).length;

  // Datos para la gráfica de pie
  const pieChartData = [
    { name: 'Tiquetes Resueltos', value: ticketsResueltosMes, color: "#40A315" },
    { name: 'Tiquetes Pendientes', value: ticketsPendientes, color: "#FF5722" }
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
      
      {(filters.tech || filters.calificaciones.length > 0 || filters.fechaInicio || filters.fechaFin) && (
        <Typography variant="body2" color="text.secondary" gutterBottom>
          Mostrando {ticketsFiltrados.length} de {ticketsEncargados.length} tickets con filtros aplicados
        </Typography>
      )}
      
      {/* Gráfica de Tickets Resueltos del Mes */}
      <Card style={{ marginBottom: '20px' }}>
        <CardContent>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <Typography variant="h6" component="h2" style={{ fontWeight: 'bold' }}>
              Tiquetes Resueltos vs Pendientes
            </Typography>
            <FormControl style={{ minWidth: '200px' }}>
              <InputLabel>Mes</InputLabel>
              <Select
                value={filters.mes}
                onChange={(e) => setFilters({ ...filters, mes: e.target.value })}
                label="Mes"
                size="small"
              >
                <MenuItem value="">Mes actual</MenuItem>
                {mesesDisponibles.map(mes => {
                  const [año, mesNum] = mes.split('-');
                  const fecha = new Date(parseInt(año), parseInt(mesNum) - 1);
                  const nombreMes = fecha.toLocaleString('es-ES', { month: 'long', year: 'numeric' });
                  return (
                    <MenuItem key={mes} value={mes}>
                      {nombreMes}
                    </MenuItem>
                  );
                })}
              </Select>
            </FormControl>
          </div>
          <div style={{ position: 'relative', textAlign: 'center' }}>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={pieChartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={120}
                  paddingAngle={5}
                  dataKey="value"
                  label={({ name, value, percent }) => `${name}: ${value} (${(percent * 100).toFixed(0)}%)`}
                  labelLine={true}
                >
                  {pieChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value, name) => [`${value}`, name]} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
            <div style={{ 
              position: 'absolute', 
              top: '50%', 
              left: '50%', 
              transform: 'translate(-50%, -50%)',
              fontSize: '24px',
              fontWeight: 'bold',
              color: '#000'
            }}>
              {ticketsResueltosMes}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Filtros */}
      <div style={{ marginBottom: '20px', display: 'flex', gap: '10px', alignItems: 'flex-end', flexWrap: 'wrap' }}>
        <FormControl style={{ minWidth: '200px' }}>
          <InputLabel>Técnico</InputLabel>
          <Select
            value={filters.tech}
            onChange={(e) => setFilters({ ...filters, tech: e.target.value })}
            label="Técnico"
          >
            <MenuItem value="">Todos los técnicos</MenuItem>
            {['Jose Castro [jose.castro]', 'Jos� Morales [jose.morales]', 'Rolando Lopez [rolando.lopez]', 'Fernando Velasquez +50254892327 [fernando.velasquez]', 'Byron Borrayo +50254287799 [Byron.Borrayo]', 'Juan Jose Gomez +50242105695 [Juanj.gomez]', 'Saul Recinos [saul.recinos]'].map(tech => (
              <MenuItem key={tech} value={tech}>
                {obtenerAlias(tech)}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        
        <TextField
          label="Tienda"
          value={filters.tienda}
          onChange={(e) => setFilters({ ...filters, tienda: e.target.value })}
          placeholder="Buscar por tienda"
          style={{ minWidth: '150px' }}
        />
        
        <TextField
          label="Marca"
          value={filters.marca}
          onChange={(e) => setFilters({ ...filters, marca: e.target.value })}
          placeholder="Buscar por marca"
          style={{ minWidth: '150px' }}
        />
        
        <FormControl style={{ minWidth: '200px' }}>
          <InputLabel>Calificaciones</InputLabel>
          <Select
            multiple
            value={filters.calificaciones}
            onChange={(e) => setFilters({ ...filters, calificaciones: e.target.value })}
            label="Calificaciones"
            renderValue={(selected) => `${selected.length} calificación(es) seleccionada(s)`}
          >
            {['Sin encuesta', 1, 2, 3, 4, 5].map(calif => (
              <MenuItem key={calif} value={calif}>
                <Checkbox checked={filters.calificaciones.indexOf(calif) > -1} />
                <ListItemText primary={calif === 'Sin encuesta' ? 'Sin encuesta' : `${calif} ⭐`} />
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        
        <TextField
          type="date"
          label="Fecha inicio"
          value={filters.fechaInicio}
          onChange={(e) => setFilters({ ...filters, fechaInicio: e.target.value })}
          InputLabelProps={{ shrink: true }}
          style={{ minWidth: '150px' }}
        />
        
        <TextField
          type="date"
          label="Fecha fin"
          value={filters.fechaFin}
          onChange={(e) => setFilters({ ...filters, fechaFin: e.target.value })}
          InputLabelProps={{ shrink: true }}
          style={{ minWidth: '150px' }}
        />
        
        <Button 
          variant="outlined" 
          onClick={() => setFilters({ tech: '', calificaciones: [], fechaInicio: '', fechaFin: '', mes: '', tienda: '', marca: '' })}
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
                  <TableCell 
                    style={{ color: '#fff', fontWeight: 'bold', border: '1px solid #ddd', cursor: 'pointer' }}
                    onClick={() => handleSort('No.')}
                  >
                    No. {sortConfig.key === 'No.' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                  </TableCell>
                  <TableCell 
                    style={{ color: '#fff', fontWeight: 'bold', border: '1px solid #ddd', cursor: 'pointer' }}
                    onClick={() => handleSort('Date')}
                  >
                    Fecha {sortConfig.key === 'Date' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                  </TableCell>
                  <TableCell 
                    style={{ color: '#fff', fontWeight: 'bold', border: '1px solid #ddd', cursor: 'pointer' }}
                    onClick={() => handleSort('Status')}
                  >
                    Estado {sortConfig.key === 'Status' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                  </TableCell>
                  <TableCell 
                    style={{ color: '#fff', fontWeight: 'bold', border: '1px solid #ddd', cursor: 'pointer' }}
                    onClick={() => handleSort('Tech')}
                  >
                    Técnico {sortConfig.key === 'Tech' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                  </TableCell>
                  <TableCell 
                    style={{ color: '#fff', fontWeight: 'bold', border: '1px solid #ddd', cursor: 'pointer' }}
                    onClick={() => handleSort('Client')}
                  >
                    Cliente {sortConfig.key === 'Client' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                  </TableCell>
                  <TableCell style={{ color: '#fff', fontWeight: 'bold', border: '1px solid #ddd' }}>Request Type</TableCell>
                  <TableCell 
                    style={{ color: '#fff', fontWeight: 'bold', border: '1px solid #ddd', cursor: 'pointer' }}
                    onClick={() => handleSort('Subject')}
                  >
                    Asunto {sortConfig.key === 'Subject' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                  </TableCell>
                  <TableCell style={{ color: '#fff', fontWeight: 'bold', border: '1px solid #ddd' }}>Calificación Encuesta</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {sortedTickets.map((ticket, index) => {
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
                      <TableCell style={{ border: '1px solid #ddd' }}>{ticket['No.'] || index + 1}</TableCell>
                      <TableCell style={{ border: '1px solid #ddd' }}>{new Date(ticket.Date).toLocaleDateString()}</TableCell>
                      <TableCell style={{ border: '1px solid #ddd' }}>{ticket.Status}</TableCell>
                      <TableCell style={{ fontWeight: 'bold', border: '1px solid #ddd' }}>{aliasTecnico}</TableCell>
                      <TableCell style={{ border: '1px solid #ddd' }}>{ticket.Client}</TableCell>
                      <TableCell style={{ border: '1px solid #ddd' }}>{ticket['Request Type'] || 'N/A'}</TableCell>
                      <TableCell style={{ border: '1px solid #ddd' }}>{ticket.Subject}</TableCell>
                      <TableCell align="center" style={{ border: '1px solid #ddd' }}>
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