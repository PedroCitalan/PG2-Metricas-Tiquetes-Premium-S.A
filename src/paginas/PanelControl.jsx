import React, { useState, useEffect } from 'react';
import { Select, MenuItem, FormControl, InputLabel, Card, CardContent, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, TextField, Button } from '@mui/material';
import { PieChart, Pie, Cell, Tooltip, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid, LineChart, Line, ResponsiveContainer } from 'recharts';
import '../Estilos/PanelControl.css';

// Mapeo de alias para mostrar nombres de técnicos (igual que en MetricasEncargados)
const aliasTecnicos = {
  'Jose Castro [jose.castro]': 'Jose Castro',
  'José Morales [jose.morales]': 'José Morales', 
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
  const tecnicosPermitidos = ['Jose Castro [jose.castro]', 'José Morales [jose.morales]', 'Rolando Lopez [rolando.lopez]', 'Fernando Velasquez +50254892327 [fernando.velasquez]', 'Byron Borrayo +50254287799 [Byron.Borrayo]', 'Juan Jose Gomez +50242105695 [Juanj.gomez]', 'Saul Recinos [saul.recinos]'];
  
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

function PanelControl() {
  const [tickets, setTickets] = useState([]);
  const [filters, setFilters] = useState({ status: '', tech: '', techSearch: '' });

  useEffect(() => {
    const fetchData = () => {
      fetch('http://localhost:3001/api/tickets', { cache: "no-store" })
        .then(response => response.json())
        .then(data => {
          if (Array.isArray(data)) {
            setTickets(data);
          } else {
            console.error('Error: Datos incorrectos', data);
          }
        })
        .catch(error => console.error('Error al obtener los tickets:', error));
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

  // Filtrar tickets por encargados permitidos
  const ticketsEncargados = filtrarTicketsEncargados(tickets);

  // Función para leer el estado de cada ticket (solo encargados permitidos)
  function getMetrics() {
    // Se declaran variables para que haga un filtro por estado, buscando por la palabra exacta como Abierto, Cerrado, etc.
    const openTickets = ticketsEncargados.filter(ticket => ticket.Status === 'Abierto');
    const closedTickets = ticketsEncargados.filter(ticket => ticket.Status === 'Cerrado' || ticket.Status === 'Resuelto');
    const pendingTickets = ticketsEncargados.filter(ticket => !["Abierto", "Cerrado", "Resuelto", "Cancelado"].includes(ticket.Status));
    const canceledTickets = ticketsEncargados.filter(ticket => ticket.Status === 'Cancelado');
    return {
      // 
      totalTickets: openTickets.length + closedTickets.length + pendingTickets.length + canceledTickets.length,
      totalOpen: openTickets.length,
      totalClosed: closedTickets.length,
      totalPending: pendingTickets.length,
      totalCanceled: canceledTickets.length,
      oldestOpen: openTickets.sort((a, b) => new Date(a.Date) - new Date(b.Date))[0],
    };
  }

  const filteredTickets = ticketsEncargados.filter(ticket => {
    return (
      (!filters.status || ticket.Status === filters.status) &&
      (!filters.tech || ticket.Tech === filters.tech) &&
      (!filters.techSearch || buscarTecnico(ticket, filters.techSearch))
    );
  });

  const metrics = getMetrics();

  const chartData = [
    { name: 'Tiquetes: ' + metrics.totalTickets, value: metrics.totalTickets }
  ];

  const barChartData = [
    { name: '(1) Cerrados', Cantidad: metrics.totalClosed, fill: "#40A315" },
    { name: '(2) Pendientes', Cantidad: metrics.totalPending },
    { name: '(3) Cancelados', Cantidad: metrics.totalCanceled, fill: "#FFC300" },
  ].sort((b, a) => b.name.localeCompare(a.name));

  const ticketsByMonth = ticketsEncargados.reduce((acc, ticket) => {
    const month = new Date(ticket.Date).toLocaleString('default', { month: 'short', year: 'numeric' }).toUpperCase();
    if (!acc[month]) {
      acc[month] = 0;
    }
    acc[month] += 1;
    return acc;
  }, {});

  const ticketsByWeek = ticketsEncargados.reduce((acc, ticket) => {
    if (ticket.Date) {
      const date = new Date(ticket.Date);
      const week = Math.ceil(
        (date.getDate() - date.getDay() + 1) / 7
      ); // Calcular la semana del mes
      const year = date.getFullYear();
      const key = `${year} - S${week + 1}`;

      if (!acc[key]) {
        acc[key] = 0;
      }
      acc[key] += 1;
    }
    return acc;
  }, {});

  const ticketsByDaysOfWeek = ticketsEncargados.reduce((acc, ticket) => {
    if (ticket.Date) {
      const day = new Date(ticket.Date).getDay();
      const daysMap = ['DOM', 'LUN', 'MAR', 'MIÉ', 'JUE', 'VIE', 'SÁB'];
      const dayName = daysMap[day];

      if (!acc[dayName]) {
        acc[dayName] = 0;
      }
      acc[dayName] += 1;
    }
    return acc;
  }, {});

  const daysofWeekOrder = ['LUN', 'MAR', 'MIÉ', 'JUE', 'VIE', 'SÁB', 'DOM'];
  const ticketsByDayData = daysofWeekOrder.map((day) => ({
    name: day,
    Cantidad: ticketsByDaysOfWeek[day] || 0,
  }));

  const ticketsByMonthandStatus = ticketsEncargados.reduce((acc, ticket) => {
    if (ticket.Date && ticket.Status) {
      const month = new Date(ticket.Date).toLocaleString("es-ES", { month: "short" }).toUpperCase();
      const year = new Date(ticket.Date).getFullYear();
      const key = `${month} ${year}`;

      let status;
      if (ticket.Status === "Abierto") {
        status = "(4) Abierto";
      }
      else if (ticket.Status === "Cerrado" || ticket.Status === "Resuelto") {
        status = "(1) Cerrado";
      }
      else if (ticket.Status === "Cancelado") {
        status = "(2) Cancelado";
      }
      else {
        status = "(3) Pendiente";
      }

      if (!acc[key]) {
        acc[key] = {};
      }

      if (!acc[key][status]) {
        acc[key][status] = 0;
      }
      acc[key][status] += 1;
    }
    return acc;
  }, {});

  const statusColors = {
    "(4) Abierto": "#1E90FF",
    "(1) Cerrado": "#40A315",
    "(2) Cancelado": "#FFC300",
    "(3) Pendiente": "#FF0000",
  };

  const ticketsByMonthandStatusData = Object.entries(ticketsByMonthandStatus).map(([month, states]) => ({
    month,
    data: Object.entries(states).map(([status, count]) => ({ name: status, Cantidad: count, fill: statusColors[status] || "#808080" })).sort((b, a) => b.name.localeCompare(a.name)),
  }));

  const COLORS = ['#0036FF', '#00C49F'];
  const monthlyData = Object.entries(ticketsByMonth).map(([key, value]) => ({
    name: key,
    Cantidad: value,
  }));
  const weeklyData = Object.entries(ticketsByWeek).map(([key, value]) => ({
    name: key,
    Cantidad: value,
  })).sort((a, b) => b.name.localeCompare(a.name));

  const StatusFilter = Array.from(
    new Set(
      ticketsEncargados.map((ticket) => {
        return ticket.Status;
      })
    )
  );

  const TechFilter = Array.from(
    new Set(
      ticketsEncargados.map((ticket) => {
        return ticket.Tech;
      })
    )
  );

  return (
    <div className="p-6 font-sans">
      <Typography variant="h3" component="h1" gutterBottom>
        Métricas Web Help Desk Soporte Sistemas - Encargados Técnicos
      </Typography>
      
      {filters.techSearch && (
        <Typography variant="body2" color="text.secondary" gutterBottom>
          Mostrando {filteredTickets.length} de {ticketsEncargados.length} tickets de encargados que coinciden con "{filters.techSearch}"
        </Typography>
      )}

      <div className="flex flex-row gap-6">
        <Card>
          <CardContent>
            <Typography variant="h5" component="div">
              {metrics.totalTickets}
            </Typography>
            <Typography color="text.secondary">Tickets</Typography>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <Typography variant="h5" component="div">
              {metrics.totalOpen}
            </Typography>
            <Typography color="text.secondary">Abiertos</Typography>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <Typography variant="h5" component="div">
              {metrics.totalClosed}
            </Typography>
            <Typography color="text.secondary">Cerrados</Typography>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <Typography variant="h5" component="div">
              {metrics.totalPending}
            </Typography>
            <Typography color="text.secondary">Pendientes</Typography>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <Typography variant="h5" component="div">
              {metrics.totalCanceled}
            </Typography>
            <Typography color="text.secondary">Cancelados</Typography>
          </CardContent>
        </Card>
        {metrics.oldestOpen && (
          <Card>
            <CardContent>
              <Typography variant="h5" component="div">
                #{metrics.oldestOpen['No.']}
              </Typography>
              <Typography color="text.secondary">
                Ticket más antiguo abierto
              </Typography>
              <Typography variant="body2">
                Fecha: {metrics.oldestOpen.Date}
              </Typography>
            </CardContent>
          </Card>
        )}
      </div>

      <div className="flex flex-row gap-6">
        <div className="flex-1">
          <Typography variant="h6" component="div" gutterBottom>
            Resumen de Tickets
          </Typography>
          <PieChart width={400} height={300}>
            <Pie
              data={chartData}
              cx={200}
              cy={150}
              innerRadius={60}
              outerRadius={100}
              fill="#8884d8"
              paddingAngle={5}
              dataKey="value"
            >
              {chartData.map((_entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Legend />
          </PieChart>
        </div>

        <div className="flex-1">
          <Typography variant="h6" component="div" gutterBottom>
            Tickets por Estado
          </Typography>
          <BarChart
            width={500}
            height={300}
            data={barChartData}
            margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="Cantidad" fill="#FF0000" />
          </BarChart>
        </div>
      </div>

      <div className="grid mb-6">
        <Typography variant="h6" component="h2" gutterBottom>
          Estados de Tickets por Mes
        </Typography>
        <div className="flex flex-row gap-4">
          {ticketsByMonthandStatusData.map(({ month, data }) => (
            <div key={month}>
              <Typography variant="h6" component="h3" gutterBottom>
                {month}
              </Typography>
              <ResponsiveContainer width="105%" height={300}>
                <BarChart data={data} margin={{ top: 5, right: 20, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="Cantidad" fill={data[0].fill} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ))}
        </div>
      </div>

      <div className="grid mb-6">
        <div className="flex-1">
          <Typography variant="h6" component="h2" gutterBottom>
            Tickets por Mes
          </Typography>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={monthlyData}>
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="Cantidad" stroke="#FF0000" dot={{ fill: "red", r: 5 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="flex-1">
          <Typography variant="h6" component="h2" gutterBottom>
            Tickets por Semana
          </Typography>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={weeklyData}>
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="Cantidad" stroke="#FF0000" dot={{ fill: "red", r: 5 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>


        <div className="flex-1">
          <Typography variant="h6" component="h2" gutterBottom>
            Tickets por Día de la Semana
          </Typography>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={ticketsByDayData}>
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="Cantidad" fill="#FF0000" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid mb-6">
        <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-end', marginBottom: '20px' }}>
          <TextField
            fullWidth
            label="Buscar técnico"
            value={filters.techSearch}
            onChange={(e) => setFilters({ ...filters, techSearch: e.target.value })}
            placeholder="Escriba parte del nombre, teléfono o use * como comodín"
            helperText="Busca en nombres completos de encargados permitidos."
          />
          <Button 
            variant="outlined" 
            onClick={() => setFilters({ ...filters, techSearch: '' })}
            style={{ minWidth: '120px' }}
          >
            Mostrar Todos
          </Button>
        </div>

        <FormControl fullWidth>
          <InputLabel>Filtrar por estado</InputLabel>
          <Select
            value={filters.status}
            onChange={(e) => setFilters({ ...filters, status: e.target.value })}
          >
            <MenuItem value="">Ninguno</MenuItem>
            {StatusFilter.map((status) => (
              <MenuItem key={status} value={status}>
                {status}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <FormControl fullWidth>
          <InputLabel>Filtrar por técnico</InputLabel>
          <Select
            value={filters.tech}
            onChange={(e) => setFilters({ ...filters, tech: e.target.value })}
          >
            <MenuItem value="">Ninguno</MenuItem>
            {TechFilter.map((tech) => (
              <MenuItem key={tech} value={tech}>
                {obtenerAlias(tech)}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </div>

      <TableContainer component={Paper} className="mb-6">
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Tipo de solicitud</TableCell>
              <TableCell>Ubicación</TableCell>
              <TableCell>No.</TableCell>
              <TableCell>Técnico a cargo</TableCell>
              <TableCell>Fecha</TableCell>
              <TableCell>Estado</TableCell>
              <TableCell>Asunto</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredTickets.map((ticket, index) => (
              <TableRow key={index}>
                <TableCell>{ticket['Request Type']}</TableCell>
                <TableCell>{ticket.Location}</TableCell>
                <TableCell>{ticket['No.']}</TableCell>
                <TableCell style={{ fontWeight: 'bold' }}>{obtenerAlias(ticket.Tech)}</TableCell>
                <TableCell>{ticket.Date}</TableCell>
                <TableCell>{ticket.Status}</TableCell>
                <TableCell>{ticket.Subject}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </div>
  );
}

export default PanelControl;
