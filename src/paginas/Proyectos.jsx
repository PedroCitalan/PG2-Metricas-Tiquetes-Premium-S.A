import React, { useState, useEffect } from 'react';
import { Card, CardContent, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Box, Button, Dialog, DialogTitle, DialogContent, DialogActions, Select, MenuItem, FormControl, InputLabel, TextField } from '@mui/material';
import '../Estilos/Proyectos.css';

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
  const tecnicosPermitidos = ['Jose Castro [jose.castro]', 'Jos Morales [jose.morales]', 'Rolando Lopez [rolando.lopez]', 'Fernando Velasquez +50254892327 [fernando.velasquez]', 'Byron Borrayo +50254287799 [Byron.Borrayo]', 'Juan Jose Gomez +50242105695 [Juanj.gomez]', 'Saul Recinos [saul.recinos]'];
  
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

// Función para obtener tickets no resueltos ordenados por antigüedad
const obtenerTop10TicketsNoResueltos = (tickets) => {
  const ticketsNoResueltos = tickets.filter(ticket => {
    const status = ticket.Status;
    return status !== 'Cerrado' && status !== 'Resuelto' && status !== 'Cancelado';
  });
  
  // Ordenar por fecha de apertura (más antiguos primero)
  const ticketsOrdenados = ticketsNoResueltos.sort((a, b) => {
    const fechaA = new Date(a.Date);
    const fechaB = new Date(b.Date);
    return fechaA - fechaB; // Ascendente (más antiguos primero)
  });
  
  // Tomar solo los primeros 10
  return ticketsOrdenados.slice(0, 10);
};

// Función para calcular días transcurridos desde la apertura
const calcularDiasTranscurridos = (fechaApertura) => {
  const fechaActual = new Date();
  const fecha = new Date(fechaApertura);
  const diferenciaTiempo = fechaActual.getTime() - fecha.getTime();
  const diasTranscurridos = Math.ceil(diferenciaTiempo / (1000 * 3600 * 24));
  return diasTranscurridos;
};

// Función para determinar el motivo de no resolución basado en el estado
const determinarMotivoNoResolucion = (ticket) => {
  const status = ticket.Status;
  
  // Motivos basados en el estado
  switch (status) {
    case 'Abierto':
      return 'Ticket abierto - En espera de asignación o inicio de trabajo';
    case 'En Progreso':
      return 'Trabajo en progreso - Requiere tiempo adicional para completarse';
    case 'Pendiente':
      return 'Pendiente de información - Esperando respuesta del cliente';
    case 'En Espera':
      return 'En espera de recursos - Dependiente de hardware, software o permisos';
    case 'Escalado':
      return 'Escalado a nivel superior - Requiere intervención especializada';
    case 'Revisión':
      return 'En revisión - Pendiente de validación o aprobación';
    case 'Bloqueado':
      return 'Bloqueado por dependencias externas - Requiere resolución previa';
    default:
      return `Estado: ${status} - Requiere seguimiento adicional`;
  }
};

const Proyectos = () => {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ tech: '', tienda: '', marca: '' });
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);

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

  // Filtrar tickets por técnico seleccionado (exact match)
  const ticketsFiltrados = filtrarTicketsEncargados(tickets).filter(ticket => {
    const matchTech = !filters.tech || ticket.Tech === filters.tech;
    const matchTienda = !filters.tienda || (ticket.Location && ticket.Location.toLowerCase().includes(filters.tienda.toLowerCase()));
    const matchMarca = !filters.marca || (ticket.Client && ticket.Client.toLowerCase().includes(filters.marca.toLowerCase()));
    
    return matchTech && matchTienda && matchMarca;
  });

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

  // Obtener top 10 tickets no resueltos
  const top10TicketsNoResueltos = obtenerTop10TicketsNoResueltos(sortedTickets);

  // Función para abrir el diálogo de detalles
  const handleTicketClick = (ticket) => {
    setSelectedTicket(ticket);
    setDialogOpen(true);
  };

  // Función para cerrar el diálogo
  const handleCloseDialog = () => {
    setDialogOpen(false);
    setSelectedTicket(null);
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <Typography>Cargando tickets no resueltos...</Typography>
      </Box>
    );
  }

  return (
    <div className="proyectos">
      <Typography variant="h4" component="h1" gutterBottom>
        Top 10 Tiquetes No Resueltos - Encargados Técnicos
      </Typography>
      
      {filters.tech && (
        <Typography variant="body2" color="text.secondary" gutterBottom>
          Mostrando {top10TicketsNoResueltos.length} de {obtenerTop10TicketsNoResueltos(filtrarTicketsEncargados(tickets)).length} tickets no resueltos que coinciden con "{filters.tech}"
        </Typography>
      )}
      
      {/* Filtro de Técnicos */}
      <div style={{ marginBottom: '20px', display: 'flex', gap: '10px', alignItems: 'flex-end' }}>
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
        
        <Button 
          variant="outlined" 
          onClick={() => setFilters({ tech: '', tienda: '', marca: '' })}
          style={{ minWidth: '120px' }}
        >
          Mostrar Todos
        </Button>
      </div>

      {/* Tabla de Tickets No Resueltos */}
      <Card>
        <CardContent>
          <Typography variant="h5" component="h2" gutterBottom style={{ textAlign: 'center', fontWeight: 'bold' }}>
            Top 10 Tiquetes No Resueltos (Ordenados por Antigüedad)
          </Typography>
          <Typography variant="body2" color="text.secondary" gutterBottom style={{ textAlign: 'center', marginBottom: '20px' }}>
            Los primeros 3 tiquetes aparecen en rojo por ser los más urgentes
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
                    Fecha Apertura {sortConfig.key === 'Date' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                  </TableCell>
                  <TableCell style={{ color: '#fff', fontWeight: 'bold', border: '1px solid #ddd' }}>Días Abierto</TableCell>
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
                  <TableCell style={{ color: '#fff', fontWeight: 'bold', border: '1px solid #ddd' }}>Motivo No Resolución</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {top10TicketsNoResueltos.map((ticket, index) => {
                  const aliasTecnico = obtenerAlias(ticket.Tech);
                  const diasTranscurridos = calcularDiasTranscurridos(ticket.Date);
                  const motivoNoResolucion = determinarMotivoNoResolucion(ticket);
                  const esUrgente = index < 3; // Primeros 3 son urgentes
                  
                  return (
                    <TableRow 
                      key={index} 
                      style={{ 
                        backgroundColor: esUrgente ? '#ffebee' : (index % 2 === 0 ? '#fff' : '#f9f9f9'),
                        cursor: 'pointer'
                      }}
                      onClick={() => handleTicketClick(ticket)}
                    >
                      <TableCell style={{ fontWeight: 'bold', border: '1px solid #ddd' }}>{ticket['No.'] || index + 1}</TableCell>
                      <TableCell style={{ border: '1px solid #ddd' }}>{new Date(ticket.Date).toLocaleDateString()}</TableCell>
                      <TableCell align="center" style={{ 
                        color: esUrgente ? 'red' : 'inherit',
                        fontWeight: 'bold',
                        border: '1px solid #ddd'
                      }}>
                        {diasTranscurridos} días
                      </TableCell>
                      <TableCell style={{ border: '1px solid #ddd' }}>{ticket.Status}</TableCell>
                      <TableCell style={{ fontWeight: 'bold', border: '1px solid #ddd' }}>{aliasTecnico}</TableCell>
                      <TableCell style={{ border: '1px solid #ddd' }}>{ticket.Client}</TableCell>
                      <TableCell style={{ border: '1px solid #ddd' }}>{ticket['Request Type'] || 'N/A'}</TableCell>
                      <TableCell style={{ border: '1px solid #ddd' }}>{ticket.Subject}</TableCell>
                      <TableCell style={{ 
                        color: esUrgente ? 'red' : 'inherit',
                        fontWeight: esUrgente ? 'bold' : 'normal',
                        border: '1px solid #ddd'
                      }}>
                        {motivoNoResolucion}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      {/* Diálogo de Detalles del Ticket */}
      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          <Typography variant="h6" component="div">
            Detalles del Ticket #{selectedTicket?.['No.'] || 'N/A'}
          </Typography>
        </DialogTitle>
        <DialogContent>
          {selectedTicket && (
            <Box>
              <Typography variant="h6" gutterBottom>
                {selectedTicket.Subject}
              </Typography>
              
              <Box style={{ marginBottom: '20px' }}>
                <Typography variant="subtitle1" style={{ fontWeight: 'bold' }}>
                  Información General:
                </Typography>
                <Typography style={{ border: '1px solid #ddd', padding: '8px' }}><strong>Cliente:</strong> {selectedTicket.Client}</Typography>
                <Typography style={{ border: '1px solid #ddd', padding: '8px' }}><strong>Técnico:</strong> {obtenerAlias(selectedTicket.Tech)}</Typography>
                <Typography style={{ border: '1px solid #ddd', padding: '8px' }}><strong>Estado:</strong> {selectedTicket.Status}</Typography>
                <Typography style={{ border: '1px solid #ddd', padding: '8px' }}><strong>Tipo de Solicitud:</strong> {selectedTicket['Request Type']}</Typography>
              </Box>

              <Box style={{ marginBottom: '20px' }}>
                <Typography variant="subtitle1" style={{ fontWeight: 'bold' }}>
                  Fechas Importantes:
                </Typography>
                <Typography style={{ border: '1px solid #ddd', padding: '8px' }}><strong>Fecha de Apertura:</strong> {new Date(selectedTicket.Date).toLocaleDateString()}</Typography>
                <Typography style={{ border: '1px solid #ddd', padding: '8px' }}><strong>Última Actualización:</strong> {new Date(selectedTicket.Updated).toLocaleDateString()}</Typography>
                <Typography style={{ border: '1px solid #ddd', padding: '8px' }}><strong>Días Transcurridos:</strong> {calcularDiasTranscurridos(selectedTicket.Date)} días</Typography>
              </Box>

              <Box style={{ marginBottom: '20px' }}>
                <Typography variant="subtitle1" style={{ fontWeight: 'bold' }}>
                  Descripción del Problema:
                </Typography>
                <Typography style={{ whiteSpace: 'pre-wrap', border: '1px solid #ddd', padding: '8px' }}>
                  {selectedTicket['Request Detail'] || 'No hay descripción disponible'}
                </Typography>
              </Box>

              <Box style={{ marginBottom: '20px' }}>
                <Typography variant="subtitle1" style={{ fontWeight: 'bold' }}>
                  Motivo de No Resolución:
                </Typography>
                <Typography style={{ 
                  color: 'red', 
                  fontWeight: 'bold',
                  backgroundColor: '#ffebee',
                  padding: '10px',
                  borderRadius: '4px',
                  border: '1px solid #ddd'
                }}>
                  {determinarMotivoNoResolucion(selectedTicket)}
                </Typography>
              </Box>

              {selectedTicket.Notes && (
                <Box style={{ marginBottom: '20px' }}>
                  <Typography variant="subtitle1" style={{ fontWeight: 'bold' }}>
                    Notas Adicionales:
                  </Typography>
                  <Typography style={{ whiteSpace: 'pre-wrap', border: '1px solid #ddd', padding: '8px' }}>
                    {selectedTicket.Notes}
                  </Typography>
                </Box>
              )}

              <Box>
                <Typography variant="subtitle1" style={{ fontWeight: 'bold' }}>
                  Información Técnica:
                </Typography>
                <Typography style={{ border: '1px solid #ddd', padding: '8px' }}><strong>Ubicación:</strong> {selectedTicket.Location || 'No especificada'}</Typography>
                <Typography style={{ border: '1px solid #ddd', padding: '8px' }}><strong>Grupo Técnico:</strong> {selectedTicket['Tech Group'] || 'No especificado'}</Typography>
                <Typography style={{ border: '1px solid #ddd', padding: '8px' }}><strong>Tiempo de Trabajo:</strong> {selectedTicket['Work Time'] || 'No registrado'}</Typography>
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog} color="primary">
            Cerrar
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

export default Proyectos;