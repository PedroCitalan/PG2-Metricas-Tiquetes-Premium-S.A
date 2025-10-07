import React, { useState, useEffect } from 'react';
import { Card, CardContent, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Box, TextField, Button, Dialog, DialogTitle, DialogContent, DialogActions } from '@mui/material';
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

// Función para determinar el motivo de no resolución
const determinarMotivoNoResolucion = (ticket) => {
  const subject = (ticket.Subject || '').toLowerCase();
  const requestDetail = (ticket['Request Detail'] || '').toLowerCase();
  const notes = (ticket.Notes || '').toLowerCase();
  const requestType = (ticket['Request Type'] || '').toLowerCase();
  
  const textoCompleto = `${subject} ${requestDetail} ${notes} ${requestType}`;
  
  // Palabras clave para diferentes motivos
  if (textoCompleto.includes('compra') || textoCompleto.includes('purchase') || textoCompleto.includes('cotización') || textoCompleto.includes('presupuesto')) {
    return 'Proceso de compra pendiente - Requiere aprobación presupuestaria';
  }
  
  if (textoCompleto.includes('hardware') || textoCompleto.includes('equipo') || textoCompleto.includes('dispositivo') || textoCompleto.includes('servidor')) {
    return 'Esperando entrega de hardware - Dependiente de proveedor';
  }
  
  if (textoCompleto.includes('software') || textoCompleto.includes('licencia') || textoCompleto.includes('instalación')) {
    return 'Instalación de software pendiente - Requiere licencias o permisos';
  }
  
  if (textoCompleto.includes('red') || textoCompleto.includes('conexión') || textoCompleto.includes('internet') || textoCompleto.includes('wifi')) {
    return 'Problema de conectividad - Requiere intervención de red';
  }
  
  if (textoCompleto.includes('usuario') || textoCompleto.includes('acceso') || textoCompleto.includes('permisos') || textoCompleto.includes('credenciales')) {
    return 'Gestión de usuarios - Requiere configuración de permisos';
  }
  
  if (textoCompleto.includes('cancelar') || textoCompleto.includes('cancel') || textoCompleto.includes('descartar')) {
    return 'Ticket marcado para cancelación - Pendiente de confirmación';
  }
  
  if (textoCompleto.includes('esperando') || textoCompleto.includes('waiting') || textoCompleto.includes('pendiente')) {
    return 'Esperando respuesta del cliente - Información adicional requerida';
  }
  
  // Motivo por defecto
  return 'Análisis en progreso - Requiere investigación adicional';
};

const Proyectos = () => {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ tech: '' });
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

  // Obtener top 10 tickets no resueltos
  const top10TicketsNoResueltos = obtenerTop10TicketsNoResueltos(ticketsFiltrados);

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
                  <TableCell style={{ color: '#fff', fontWeight: 'bold' }}>No.</TableCell>
                  <TableCell style={{ color: '#fff', fontWeight: 'bold' }}>Fecha Apertura</TableCell>
                  <TableCell style={{ color: '#fff', fontWeight: 'bold' }}>Días Abierto</TableCell>
                  <TableCell style={{ color: '#fff', fontWeight: 'bold' }}>Estado</TableCell>
                  <TableCell style={{ color: '#fff', fontWeight: 'bold' }}>Técnico</TableCell>
                  <TableCell style={{ color: '#fff', fontWeight: 'bold' }}>Cliente</TableCell>
                  <TableCell style={{ color: '#fff', fontWeight: 'bold' }}>Asunto</TableCell>
                  <TableCell style={{ color: '#fff', fontWeight: 'bold' }}>Motivo No Resolución</TableCell>
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
                      <TableCell style={{ fontWeight: 'bold' }}>{ticket['No.'] || index + 1}</TableCell>
                      <TableCell>{new Date(ticket.Date).toLocaleDateString()}</TableCell>
                      <TableCell align="center" style={{ 
                        color: esUrgente ? 'red' : 'inherit',
                        fontWeight: 'bold'
                      }}>
                        {diasTranscurridos} días
                      </TableCell>
                      <TableCell>{ticket.Status}</TableCell>
                      <TableCell style={{ fontWeight: 'bold' }}>{aliasTecnico}</TableCell>
                      <TableCell>{ticket.Client}</TableCell>
                      <TableCell>{ticket.Subject}</TableCell>
                      <TableCell style={{ 
                        color: esUrgente ? 'red' : 'inherit',
                        fontWeight: esUrgente ? 'bold' : 'normal'
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
                <Typography><strong>Cliente:</strong> {selectedTicket.Client}</Typography>
                <Typography><strong>Técnico:</strong> {obtenerAlias(selectedTicket.Tech)}</Typography>
                <Typography><strong>Estado:</strong> {selectedTicket.Status}</Typography>
                <Typography><strong>Tipo de Solicitud:</strong> {selectedTicket['Request Type']}</Typography>
              </Box>

              <Box style={{ marginBottom: '20px' }}>
                <Typography variant="subtitle1" style={{ fontWeight: 'bold' }}>
                  Fechas Importantes:
                </Typography>
                <Typography><strong>Fecha de Apertura:</strong> {new Date(selectedTicket.Date).toLocaleDateString()}</Typography>
                <Typography><strong>Última Actualización:</strong> {new Date(selectedTicket.Updated).toLocaleDateString()}</Typography>
                <Typography><strong>Días Transcurridos:</strong> {calcularDiasTranscurridos(selectedTicket.Date)} días</Typography>
              </Box>

              <Box style={{ marginBottom: '20px' }}>
                <Typography variant="subtitle1" style={{ fontWeight: 'bold' }}>
                  Descripción del Problema:
                </Typography>
                <Typography style={{ whiteSpace: 'pre-wrap' }}>
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
                  borderRadius: '4px'
                }}>
                  {determinarMotivoNoResolucion(selectedTicket)}
                </Typography>
              </Box>

              {selectedTicket.Notes && (
                <Box style={{ marginBottom: '20px' }}>
                  <Typography variant="subtitle1" style={{ fontWeight: 'bold' }}>
                    Notas Adicionales:
                  </Typography>
                  <Typography style={{ whiteSpace: 'pre-wrap' }}>
                    {selectedTicket.Notes}
                  </Typography>
                </Box>
              )}

              <Box>
                <Typography variant="subtitle1" style={{ fontWeight: 'bold' }}>
                  Información Técnica:
                </Typography>
                <Typography><strong>Ubicación:</strong> {selectedTicket.Location || 'No especificada'}</Typography>
                <Typography><strong>Grupo Técnico:</strong> {selectedTicket['Tech Group'] || 'No especificado'}</Typography>
                <Typography><strong>Tiempo de Trabajo:</strong> {selectedTicket['Work Time'] || 'No registrado'}</Typography>
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