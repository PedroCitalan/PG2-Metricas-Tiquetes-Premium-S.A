import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Box, Button, Select, MenuItem, FormControl, InputLabel, Checkbox, ListItemText, TextField } from '@mui/material';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import '../Estilos/PanelControl.css';

const SUPERVISORES_PERMITIDOS = ['Otto Hernandez', 'Antonio Rojas', 'Tulio Reyes'];

// Función para filtrar tickets de encargados permitidos por Supervisor y Técnico Asignado
const filtrarTicketsEncargados = (tickets) => {
  return tickets.filter(ticket => {
    const tecnico = ticket['Tecnico Asignado'] || ticket.Tech;
    const supervisor = (ticket.Supervisor || '').trim();
    return tecnico && supervisor && SUPERVISORES_PERMITIDOS.includes(supervisor);
  });
};

// Función para obtener tickets del mes seleccionado
const obtenerTicketsMes = (tickets, mesSeleccionado = '2025-10') => {
  const [año, mes] = mesSeleccionado.split('-');
  const añoNum = parseInt(año);
  const mesNum = parseInt(mes) - 1; // Los meses en JS van de 0-11
  
  const inicioMes = new Date(añoNum, mesNum, 1);
  const finMes = new Date(añoNum, mesNum + 1, 0); // Último día del mes
  
  return tickets.filter(ticket => {
    const fechaTicket = new Date(ticket.Date);
    return fechaTicket >= inicioMes && fechaTicket <= finMes;
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
  const [filters, setFilters] = useState({ tech: '', supervisor: '', calificaciones: [], estado: '', tienda: '', marca: '', mes: '2025-10' });

  const { data: encargadosData, isLoading } = useQuery({
    queryKey: ['encargados'],
    queryFn: () => fetch('https://metricastiquetespremiumbackend-production.up.railway.app/api/encargados', { cache: 'no-store' }).then(r => r.json()),
  });

  useEffect(() => {
    setLoading(isLoading);
  }, [isLoading]);

  useEffect(() => {
    if (Array.isArray(encargadosData)) {
      setTickets(encargadosData);
    }
  }, [encargadosData]);

  // Filtrar tickets por técnico seleccionado, calificaciones y estado
  const ticketsEncargados = filtrarTicketsEncargados(tickets);
  
  const ticketsFiltrados = ticketsEncargados.filter(ticket => {
    const tecnico = ticket['Tecnico Asignado'] || ticket.Tech;
    const supervisor = (ticket.Supervisor || '').trim();
    // Filtro por técnico (exact match)
    const matchTech = !filters.tech || tecnico === filters.tech;
    // Filtro por supervisor
    const matchSupervisor = !filters.supervisor || supervisor === filters.supervisor;
    
    // Filtro por calificaciones
    const tieneEncuesta = ticket.Encuesta && !isNaN(parseInt(ticket.Encuesta)) && parseInt(ticket.Encuesta) >= 1 && parseInt(ticket.Encuesta) <= 5;
    const calificacion = tieneEncuesta ? parseInt(ticket.Encuesta) : 'Sin encuesta';
    const matchCalificacion = filters.calificaciones.length === 0 || filters.calificaciones.includes(calificacion);
    
    // Filtro por estado (mejorado para "Pendiente")
    let matchEstado = true;
    if (filters.estado) {
      if (filters.estado === 'Pendiente') {
        // Mostrar todos los que NO sean Abierto, Cerrado o Cancelado
        matchEstado = !['Abierto', 'Cerrado', 'Cancelado'].includes(ticket.Status);
      } else {
        matchEstado = ticket.Status === filters.estado;
      }
    }
    
    // Filtro por tienda
    const matchTienda = !filters.tienda || (ticket.Location && ticket.Location.toLowerCase().includes(filters.tienda.toLowerCase()));
    
    // Filtro por marca
    const matchMarca = !filters.marca || (ticket.Client && ticket.Client.toLowerCase().includes(filters.marca.toLowerCase()));
    
    return matchTech && matchSupervisor && matchCalificacion && matchEstado && matchTienda && matchMarca;
  });

  // Obtener tickets del mes seleccionado
  const ticketsMesSeleccionado = obtenerTicketsMes(ticketsFiltrados, filters.mes);
  
  // Obtener todos los tickets pendientes (independiente del mes)
  const todosLosTicketsPendientes = ticketsEncargados.filter(ticket => 
    !['Abierto', 'Cerrado', 'Cancelado'].includes(ticket.Status)
  );

  // Calcular estadísticas
  const estadisticasEstados = calcularEstadisticasEstados(ticketsMesSeleccionado);
  const estadisticasEncuestas = calcularEstadisticasEncuestas(ticketsMesSeleccionado);

  // Datos para las gráficas
  const datosEstados = [
    { name: 'Resueltos', value: estadisticasEstados.resueltos, color: '#4CAF50' },
    { name: 'Pendientes', value: todosLosTicketsPendientes.length, color: '#FF9800' }, // Usar pendientes globales
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
        Métricas del Mes - {filters.mes ? new Date(parseInt(filters.mes.split('-')[0]), parseInt(filters.mes.split('-')[1]) - 1).toLocaleString('es-ES', { month: 'long', year: 'numeric' }) : 'Octubre 2025'}
      </Typography>
      
      {(filters.tech || filters.supervisor || filters.calificaciones.length > 0 || filters.estado || filters.tienda || filters.marca) && (
        <Typography variant="body2" color="text.secondary" gutterBottom>
          Mostrando {ticketsMesSeleccionado.length} de {obtenerTicketsMes(ticketsEncargados, filters.mes).length} tickets del mes seleccionado con filtros aplicados
        </Typography>
      )}

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
            {Array.from(new Set(
              ticketsEncargados
                .filter(t => !filters.supervisor || (t.Supervisor || '').trim() === filters.supervisor)
                .map(t => t['Tecnico Asignado'] || t.Tech)
            ))
              .filter(Boolean)
              .map(tech => (
                <MenuItem key={tech} value={tech}>
                  {tech}
                </MenuItem>
              ))}
          </Select>
        </FormControl>
        <FormControl style={{ minWidth: '200px' }}>
          <InputLabel>Supervisor</InputLabel>
          <Select
            value={filters.supervisor}
            onChange={(e) => setFilters({ ...filters, supervisor: e.target.value })}
            label="Supervisor"
          >
            <MenuItem value="">Todos los supervisores</MenuItem>
            {SUPERVISORES_PERMITIDOS.map(s => (
              <MenuItem key={s} value={s}>{s}</MenuItem>
            ))}
          </Select>
        </FormControl>
        
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
          <InputLabel>Mes</InputLabel>
          <Select
            value={filters.mes}
            onChange={(e) => setFilters({ ...filters, mes: e.target.value })}
            label="Mes"
          >
            <MenuItem value="2025-10">Octubre 2025</MenuItem>
            <MenuItem value="2025-09">Septiembre 2025</MenuItem>
            <MenuItem value="2025-08">Agosto 2025</MenuItem>
            <MenuItem value="2025-07">Julio 2025</MenuItem>
            <MenuItem value="2025-06">Junio 2025</MenuItem>
            <MenuItem value="2025-05">Mayo 2025</MenuItem>
            <MenuItem value="2025-04">Abril 2025</MenuItem>
            <MenuItem value="2025-03">Marzo 2025</MenuItem>
            <MenuItem value="2025-02">Febrero 2025</MenuItem>
            <MenuItem value="2025-01">Enero 2025</MenuItem>
            <MenuItem value="2024-12">Diciembre 2024</MenuItem>
            <MenuItem value="2024-11">Noviembre 2024</MenuItem>
            <MenuItem value="2024-10">Octubre 2024</MenuItem>
          </Select>
        </FormControl>
        
        <FormControl style={{ minWidth: '200px' }}>
          <InputLabel>Estado</InputLabel>
          <Select
            value={filters.estado}
            onChange={(e) => setFilters({ ...filters, estado: e.target.value })}
            label="Estado"
          >
            <MenuItem value="">Todos los estados</MenuItem>
            <MenuItem value="Cerrado">Cerrado</MenuItem>
            <MenuItem value="Resuelto">Resuelto</MenuItem>
            <MenuItem value="Pendiente">Pendiente (todos los no resueltos)</MenuItem>
            <MenuItem value="Cancelado">Cancelado</MenuItem>
          </Select>
        </FormControl>
        
        <Button 
          variant="outlined" 
          onClick={() => setFilters({ tech: '', calificaciones: [], estado: '', tienda: '', marca: '', mes: '2025-10' })}
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
            <Typography variant="h6" component="h3" gutterBottom style={{ textAlign: 'center', fontWeight: 'bold', marginBottom: '20px' }}>
              Estados de Tiquetes - {filters.mes ? new Date(parseInt(filters.mes.split('-')[0]), parseInt(filters.mes.split('-')[1]) - 1).toLocaleString('es-ES', { month: 'long', year: 'numeric' }) : 'Octubre 2025'}
            </Typography>
            <ResponsiveContainer width="100%" height={350}>
              <PieChart>
                <Pie
                  data={datosEstados}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={120}
                  paddingAngle={5}
                  dataKey="value"
                  label={({ name, value, percent }) => `${name}: ${value} (${(percent * 100).toFixed(0)}%)`}
                  labelLine={true}
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
            <Typography variant="h6" component="h3" gutterBottom style={{ textAlign: 'center', fontWeight: 'bold', marginBottom: '20px' }}>
              Encuestas Respondidas - {filters.mes ? new Date(parseInt(filters.mes.split('-')[0]), parseInt(filters.mes.split('-')[1]) - 1).toLocaleString('es-ES', { month: 'long', year: 'numeric' }) : 'Octubre 2025'}
            </Typography>
            <ResponsiveContainer width="100%" height={350}>
              <PieChart>
                <Pie
                  data={datosEncuestas}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={120}
                  paddingAngle={5}
                  dataKey="value"
                  label={({ name, value, percent }) => `${name}: ${value} (${(percent * 100).toFixed(0)}%)`}
                  labelLine={true}
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
            Detalle de Tiquetes - {filters.mes ? new Date(parseInt(filters.mes.split('-')[0]), parseInt(filters.mes.split('-')[1]) - 1).toLocaleString('es-ES', { month: 'long', year: 'numeric' }) : 'Octubre 2025'}
          </Typography>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow style={{ backgroundColor: '#000', color: '#fff' }}>
                  <TableCell style={{ color: '#fff', fontWeight: 'bold', border: '1px solid #ddd' }}>No.</TableCell>
                  <TableCell style={{ color: '#fff', fontWeight: 'bold', border: '1px solid #ddd' }}>Fecha</TableCell>
                  <TableCell style={{ color: '#fff', fontWeight: 'bold', border: '1px solid #ddd' }}>Estado</TableCell>
                  <TableCell style={{ color: '#fff', fontWeight: 'bold', border: '1px solid #ddd' }}>Técnico Responsable</TableCell>
                  <TableCell style={{ color: '#fff', fontWeight: 'bold', border: '1px solid #ddd' }}>Cliente</TableCell>
                  <TableCell style={{ color: '#fff', fontWeight: 'bold', border: '1px solid #ddd' }}>Asunto</TableCell>
                  <TableCell style={{ color: '#fff', fontWeight: 'bold', border: '1px solid #ddd' }}>Encuesta</TableCell>
                  <TableCell style={{ color: '#fff', fontWeight: 'bold', border: '1px solid #ddd' }}>Última Actualización</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {ticketsMesSeleccionado.map((ticket, index) => {
                  const tecnico = ticket['Tecnico Asignado'] || ticket.Tech;
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
                      <TableCell style={{ fontWeight: 'bold', border: '1px solid #ddd' }}>{ticket['No.'] || index + 1}</TableCell>
                      <TableCell style={{ border: '1px solid #ddd' }}>{new Date(ticket.Date).toLocaleDateString()}</TableCell>
                      <TableCell style={{ border: '1px solid #ddd' }}>
                        <span style={{ 
                          color: status === 'Cerrado' || status === 'Resuelto' ? 'green' : 
                                status === 'Cancelado' ? 'red' : 'orange',
                          fontWeight: 'bold'
                        }}>
                          {status}
                        </span>
                      </TableCell>
                      <TableCell style={{ fontWeight: 'bold', border: '1px solid #ddd' }}>{tecnico}</TableCell>
                      <TableCell style={{ border: '1px solid #ddd' }}>{ticket.Client}</TableCell>
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
                      <TableCell style={{ border: '1px solid #ddd' }}>{new Date(ticket.Updated).toLocaleDateString()}</TableCell>
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