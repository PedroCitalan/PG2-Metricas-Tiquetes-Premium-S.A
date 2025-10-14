import React, { useState, useEffect } from 'react';
import { Card, CardContent, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Box, TextField, Button } from '@mui/material';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import '../Estilos/MetricasEncargados.css';

// Mapeo de alias para mostrar nombres de técnicos
const aliasTecnicos = {
  'Jose Castro [jose.castro]': 'José Castro',
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

// Función para calcular métricas de encargados
const calcularMetricasEncargados = (tickets) => {
    const encargados = {};
    const fechaActual = new Date();
    const mesActual = fechaActual.getMonth() + 1;
    const añoActual = fechaActual.getFullYear();
    
    // Fechas para el mes actual
    const inicioMesActual = new Date(añoActual, mesActual - 1, 1);
    const finMesActual = new Date(añoActual, mesActual, 0);
    
    // Fechas para el mes anterior
    const inicioMesAnterior = new Date(añoActual, mesActual - 2, 1);
    const finMesAnterior = new Date(añoActual, mesActual - 1, 0);
    
    tickets.forEach((ticket) => {
      const tecnicoOriginal = ticket['Tech'];
      const tecnicosPermitidos = ['Jose Castro [jose.castro]', 'Jos� Morales [jose.morales]', 'Rolando Lopez [rolando.lopez]', 'Fernando Velasquez +50254892327 [fernando.velasquez]', 'Byron Borrayo +50254287799 [Byron.Borrayo]', 'Juan Jose Gomez +50242105695 [Juanj.gomez]', 'Saul Recinos [saul.recinos]'];
      // Función para verificar si el técnico está permitido (coincidencia exacta o parcial estricta)
      const esTecnicoPermitido = (nombre) => {
        if (!nombre) return false;
        
        // Primero verificar coincidencia exacta
        if (tecnicosPermitidos.includes(nombre)) return true;
        
        // Luego verificar si el nombre contiene alguno de los técnicos permitidos completos
        return tecnicosPermitidos.some(permitido => {
          // Extraer solo el nombre y apellido del técnico permitido (sin teléfono y usuario)
          const nombrePermitido = permitido.split(' +')[0]; // Quita el teléfono
          const nombrePermitidoSinUsuario = nombrePermitido.split(' [')[0]; // Quita el usuario
          
          // Verificar si el nombre del CSV contiene el nombre permitido completo
          return nombre.includes(nombrePermitidoSinUsuario);
        });
      };
      
      if (!tecnicoOriginal || !esTecnicoPermitido(tecnicoOriginal)) return;
      const aliasTecnico = obtenerAlias(tecnicoOriginal);
      
      if (!encargados[tecnicoOriginal]) {
        encargados[tecnicoOriginal] = {
          nombre: aliasTecnico,
          nombreOriginal: tecnicoOriginal,
          tiquetesAsignados: 0,
          tiquetesResueltos: 0,
          encuestasRespondidas: 0,
          promedioDiario: 0,
          notaActual: 0,
          notaMesAnterior: 0,
          porcentajeEncuestas: 0,
          encuestasDetalle: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
          encuestasDetalleAnterior: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
        };
      }

      const fechaTicket = new Date(ticket.Date);
      
      // Verificar si el ticket está en el mes actual
      if (fechaTicket >= inicioMesActual && fechaTicket <= finMesActual) {
        encargados[tecnicoOriginal].tiquetesAsignados++;
        
        if (ticket.Status === 'Cerrado') {
          encargados[tecnicoOriginal].tiquetesResueltos++;
        }
        
        if (ticket.Encuesta && !isNaN(parseInt(ticket.Encuesta))) {
          const calificacion = parseInt(ticket.Encuesta);
          if (calificacion >= 1 && calificacion <= 5) {
            encargados[tecnicoOriginal].encuestasRespondidas++;
            encargados[tecnicoOriginal].encuestasDetalle[calificacion]++;
          }
        }
      }
      
      // Verificar si el ticket está en el mes anterior
      if (fechaTicket >= inicioMesAnterior && fechaTicket <= finMesAnterior) {
        if (ticket.Encuesta && !isNaN(parseInt(ticket.Encuesta))) {
          const calificacion = parseInt(ticket.Encuesta);
          if (calificacion >= 1 && calificacion <= 5) {
            encargados[tecnicoOriginal].encuestasDetalleAnterior[calificacion]++;
          }
        }
      }
    });

    // Calcular métricas adicionales
    Object.values(encargados).forEach(encargado => {
      // Promedio diario (tiquetes asignados / 5 días laborales por semana)
      encargado.promedioDiario = (encargado.tiquetesAsignados / 5).toFixed(0);
      
      // Nota actual
      const totalEncuestas = Object.values(encargado.encuestasDetalle).reduce((sum, val) => sum + val, 0);
      if (totalEncuestas > 0) {
        const valorTotal = Object.entries(encargado.encuestasDetalle)
          .reduce((sum, [calif, cant]) => sum + (parseInt(calif) * cant), 0);
        encargado.notaActual = (valorTotal / totalEncuestas).toFixed(2);
      }
      
      // Nota del mes anterior
      const totalEncuestasAnterior = Object.values(encargado.encuestasDetalleAnterior).reduce((sum, val) => sum + val, 0);
      if (totalEncuestasAnterior > 0) {
        const valorTotalAnterior = Object.entries(encargado.encuestasDetalleAnterior)
          .reduce((sum, [calif, cant]) => sum + (parseInt(calif) * cant), 0);
        encargado.notaMesAnterior = (valorTotalAnterior / totalEncuestasAnterior).toFixed(2);
      }
      
      // Porcentaje de encuestas respondidas/tiquetes resueltos
      if (encargado.tiquetesResueltos > 0) {
        encargado.porcentajeEncuestas = ((encargado.encuestasRespondidas / encargado.tiquetesResueltos) * 100).toFixed(2);
      }
    });

    return Object.values(encargados);
  };

// Semanas fijas por mes (Lunes-Domingo) para Ago/Sep/Oct 2025
const obtenerSemanasFijas = (mesSeleccionado) => {
  const semanasPorMes = {
    '2025-08': [
      { inicio: new Date(2025, 6, 28), fin: new Date(2025, 7, 3) },   // 28 Jul - 3 Ago
      { inicio: new Date(2025, 7, 4),  fin: new Date(2025, 7, 10) },  // 4 Ago - 10 Ago
      { inicio: new Date(2025, 7, 11), fin: new Date(2025, 7, 17) },  // 11 Ago - 17 Ago
      { inicio: new Date(2025, 7, 18), fin: new Date(2025, 7, 24) },  // 18 Ago - 24 Ago
      { inicio: new Date(2025, 7, 25), fin: new Date(2025, 7, 31) },  // 25 Ago - 31 Ago
    ],
    '2025-09': [
      { inicio: new Date(2025, 8, 1),  fin: new Date(2025, 8, 7) },   // 1 Sep - 7 Sep
      { inicio: new Date(2025, 8, 8),  fin: new Date(2025, 8, 14) },  // 8 Sep - 14 Sep
      { inicio: new Date(2025, 8, 15), fin: new Date(2025, 8, 21) },  // 15 Sep - 21 Sep
      { inicio: new Date(2025, 8, 22), fin: new Date(2025, 8, 28) },  // 22 Sep - 28 Sep
    ],
    '2025-10': [
      { inicio: new Date(2025, 8, 29), fin: new Date(2025, 9, 5) },   // 29 Sep - 5 Oct
      { inicio: new Date(2025, 9, 6),  fin: new Date(2025, 9, 12) },  // 6 Oct - 12 Oct
      { inicio: new Date(2025, 9, 13), fin: new Date(2025, 9, 19) },  // 13 Oct - 19 Oct
      { inicio: new Date(2025, 9, 20), fin: new Date(2025, 9, 26) },  // 20 Oct - 26 Oct
      { inicio: new Date(2025, 9, 27), fin: new Date(2025, 10, 2) },  // 27 Oct - 2 Nov
    ],
  };
  return semanasPorMes[mesSeleccionado] || [];
};

const formatearFechaCorta = (fecha) => {
  const dia = fecha.getDate().toString().padStart(2, '0');
  const mes = (fecha.getMonth() + 1).toString().padStart(2, '0');
  return `${dia}/${mes}`;
};

// Función para calcular métricas semanales
const calcularMetricasSemanales = (tickets, mesSeleccionado = '2025-10') => {
  const encargados = {};
  const semanas = obtenerSemanasFijas(mesSeleccionado);

  const tecnicosPermitidos = ['Jose Castro [jose.castro]', 'Jos� Morales [jose.morales]', 'Rolando Lopez [rolando.lopez]', 'Fernando Velasquez +50254892327 [fernando.velasquez]', 'Byron Borrayo +50254287799 [Byron.Borrayo]', 'Juan Jose Gomez +50242105695 [Juanj.gomez]', 'Saul Recinos [saul.recinos]'];
  
  tickets.forEach((ticket) => {
    const tecnicoOriginal = ticket['Tech'];
    
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
    
    if (!tecnicoOriginal || !esTecnicoPermitido(tecnicoOriginal)) return;
    
    const aliasTecnico = obtenerAlias(tecnicoOriginal);
    
    if (!encargados[tecnicoOriginal]) {
      // Crear estructura dinámica de semanas
      const semanasEstructura = {};
      semanas.forEach((_, index) => {
        semanasEstructura[`semana${index + 1}`] = { 
          nota: 0, 
          encuestado: 0, 
          totalEncuestas: 0, 
          totalTiquetes: 0, 
          totalTiquetesResueltos: 0, 
          encuestasDetalle: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 } 
        };
      });
      
      encargados[tecnicoOriginal] = {
        nombre: aliasTecnico,
        nombreOriginal: tecnicoOriginal,
        tiquetesAsignados: 0,
        tiquetesResueltos: 0,
        encuestasRespondidas: 0,
        promedioDiario: 0,
        semanas: semanasEstructura
      };
    }

    const fechaTicket = new Date(ticket.Date);
    
    // Determinar a qué semana del mes pertenece el ticket (según rangos fijos L-D)
    let semanaActual = null;
    semanas.forEach((semana, index) => {
      if (fechaTicket >= semana.inicio && fechaTicket <= semana.fin) {
        semanaActual = `semana${index + 1}`;
      }
    });
    
    if (semanaActual) {
      encargados[tecnicoOriginal].tiquetesAsignados++;
      encargados[tecnicoOriginal].semanas[semanaActual].totalTiquetes++;
      
      if (ticket.Status === 'Cerrado') {
        encargados[tecnicoOriginal].tiquetesResueltos++;
        encargados[tecnicoOriginal].semanas[semanaActual].totalTiquetesResueltos++;
      }
      
      if (ticket.Encuesta && !isNaN(parseInt(ticket.Encuesta))) {
        const calificacion = parseInt(ticket.Encuesta);
        if (calificacion >= 1 && calificacion <= 5) {
          encargados[tecnicoOriginal].encuestasRespondidas++;
          encargados[tecnicoOriginal].semanas[semanaActual].totalEncuestas++;
          encargados[tecnicoOriginal].semanas[semanaActual].encuestasDetalle[calificacion]++;
        }
      }
    }
  });

  // Calcular métricas semanales
  Object.values(encargados).forEach(encargado => {
    encargado.promedioDiario = Math.round(encargado.tiquetesAsignados / 5);
    
    Object.keys(encargado.semanas).forEach(semana => {
      const datosSemana = encargado.semanas[semana];
      
      // Calcular nota de la semana usando el método correcto
      const totalEncuestas = Object.values(datosSemana.encuestasDetalle).reduce((sum, val) => sum + val, 0);
      if (totalEncuestas > 0) {
        const valorTotal = Object.entries(datosSemana.encuestasDetalle)
          .reduce((sum, [calif, cant]) => sum + (parseInt(calif) * cant), 0);
        datosSemana.nota = (valorTotal / totalEncuestas).toFixed(2);
      } else {
        datosSemana.nota = '0.00';
      }
      
      // Calcular porcentaje de encuestados (Encuestas Respondidas / Tickets Resueltos)
      if (datosSemana.totalTiquetesResueltos > 0) {
        datosSemana.encuestado = ((datosSemana.totalEncuestas / datosSemana.totalTiquetesResueltos) * 100).toFixed(2);
      } else {
        datosSemana.encuestado = '0.00';
      }
    });
  });

  return Object.values(encargados);
};

// Función para calcular métricas mensuales
const calcularMetricasMensuales = (tickets) => {
  const encargados = {};
  
  // Definir los meses: Octubre, Septiembre, Agosto
  const octubre = { inicio: new Date(2025, 9, 1), fin: new Date(2025, 9, 31) };
  const septiembre = { inicio: new Date(2025, 8, 1), fin: new Date(2025, 8, 30) };
  const agosto = { inicio: new Date(2025, 7, 1), fin: new Date(2025, 7, 31) };

  const tecnicosPermitidos = ['Jose Castro [jose.castro]', 'Jos� Morales [jose.morales]', 'Rolando Lopez [rolando.lopez]', 'Fernando Velasquez +50254892327 [fernando.velasquez]', 'Byron Borrayo +50254287799 [Byron.Borrayo]', 'Juan Jose Gomez +50242105695 [Juanj.gomez]', 'Saul Recinos [saul.recinos]'];
  
  tickets.forEach((ticket) => {
    const tecnicoOriginal = ticket['Tech'];
    
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
    
    if (!tecnicoOriginal || !esTecnicoPermitido(tecnicoOriginal)) return;
    
    const aliasTecnico = obtenerAlias(tecnicoOriginal);
    
    if (!encargados[tecnicoOriginal]) {
      encargados[tecnicoOriginal] = {
        nombre: aliasTecnico,
        nombreOriginal: tecnicoOriginal,
        tiquetesAsignados: 0,
        tiquetesResueltos: 0,
        encuestasRespondidas: 0,
        promedioDiario: 0,
        meses: {
          octubre: { nota: 0, encuestado: 0, totalEncuestas: 0, totalTiquetes: 0, totalTiquetesResueltos: 0, encuestasDetalle: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 } },
          septiembre: { nota: 0, encuestado: 0, totalEncuestas: 0, totalTiquetes: 0, totalTiquetesResueltos: 0, encuestasDetalle: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 } },
          agosto: { nota: 0, encuestado: 0, totalEncuestas: 0, totalTiquetes: 0, totalTiquetesResueltos: 0, encuestasDetalle: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 } }
        }
      };
    }

    const fechaTicket = new Date(ticket.Date);
    
    // Determinar a qué mes pertenece el ticket
    let mesActual = null;
    if (fechaTicket >= octubre.inicio && fechaTicket <= octubre.fin) {
      mesActual = 'octubre';
    } else if (fechaTicket >= septiembre.inicio && fechaTicket <= septiembre.fin) {
      mesActual = 'septiembre';
    } else if (fechaTicket >= agosto.inicio && fechaTicket <= agosto.fin) {
      mesActual = 'agosto';
    }
    
    if (mesActual) {
      // Solo contar tickets de octubre para los campos principales
      if (mesActual === 'octubre') {
        encargados[tecnicoOriginal].tiquetesAsignados++;
        if (ticket.Status === 'Cerrado') {
          encargados[tecnicoOriginal].tiquetesResueltos++;
        }
        if (ticket.Encuesta && !isNaN(parseInt(ticket.Encuesta))) {
          const calificacion = parseInt(ticket.Encuesta);
          if (calificacion >= 1 && calificacion <= 5) {
            encargados[tecnicoOriginal].encuestasRespondidas++;
          }
        }
      }
      
      // Contar para cada mes específico
      encargados[tecnicoOriginal].meses[mesActual].totalTiquetes++;
      
      if (ticket.Status === 'Cerrado') {
        encargados[tecnicoOriginal].meses[mesActual].totalTiquetesResueltos++;
      }
      
      if (ticket.Encuesta && !isNaN(parseInt(ticket.Encuesta))) {
        const calificacion = parseInt(ticket.Encuesta);
        if (calificacion >= 1 && calificacion <= 5) {
          encargados[tecnicoOriginal].meses[mesActual].totalEncuestas++;
          encargados[tecnicoOriginal].meses[mesActual].encuestasDetalle[calificacion]++;
        }
      }
    }
  });

  // Calcular métricas mensuales
  Object.values(encargados).forEach(encargado => {
    encargado.promedioDiario = Math.round(encargado.tiquetesAsignados / 5);
    
    Object.keys(encargado.meses).forEach(mes => {
      const datosMes = encargado.meses[mes];
      
      // Calcular nota del mes usando el método correcto
      const totalEncuestas = Object.values(datosMes.encuestasDetalle).reduce((sum, val) => sum + val, 0);
      if (totalEncuestas > 0) {
        const valorTotal = Object.entries(datosMes.encuestasDetalle)
          .reduce((sum, [calif, cant]) => sum + (parseInt(calif) * cant), 0);
        datosMes.nota = (valorTotal / totalEncuestas).toFixed(2);
      } else {
        datosMes.nota = '0.00';
      }
      
      // Calcular porcentaje de encuestados (Encuestas Respondidas / Tickets Resueltos)
      if (datosMes.totalTiquetesResueltos > 0) {
        datosMes.encuestado = ((datosMes.totalEncuestas / datosMes.totalTiquetesResueltos) * 100).toFixed(2);
      } else {
        datosMes.encuestado = '0.00';
      }
    });
  });

  return Object.values(encargados);
};

// Función para generar archivo de notas semanales (dinámico según semanas disponibles)
const generarArchivoNotasSemanales = (metricasSemanales) => {
  const datosParaArchivo = metricasSemanales.map(encargado => {
    const salida = {
      nombre: encargado.nombre,
      nombreOriginal: encargado.nombreOriginal,
    };
    // Agregar todas las semanas presentes en la estructura
    Object.keys(encargado.semanas).forEach((semanaKey) => {
      const s = encargado.semanas[semanaKey];
      salida[semanaKey] = {
        nota: s.nota,
        encuestado: s.encuestado,
        totalEncuestas: s.totalEncuestas,
        totalTiquetesResueltos: s.totalTiquetesResueltos,
        encuestasDetalle: s.encuestasDetalle,
      };
    });
    return salida;
  });

  const fechaActual = new Date();
  const nombreArchivo = `metricas_semanales_${fechaActual.getFullYear()}_${(fechaActual.getMonth() + 1).toString().padStart(2, '0')}_${fechaActual.getDate().toString().padStart(2, '0')}.json`;
  console.log('Datos para archivo de notas semanales:', JSON.stringify(datosParaArchivo, null, 2));
  console.log(`Archivo generado: ${nombreArchivo}`);
  return datosParaArchivo;
};

// Función para calcular métricas de SLA y Participación
const calcularMetricasSLA = (tickets) => {
  const encargados = {};
  
  // Definir octubre para el cálculo
  const octubre = { inicio: new Date(2025, 9, 1), fin: new Date(2025, 9, 31) };

  const tecnicosPermitidos = ['Jose Castro [jose.castro]', 'Jos� Morales [jose.morales]', 'Rolando Lopez [rolando.lopez]', 'Fernando Velasquez +50254892327 [fernando.velasquez]', 'Byron Borrayo +50254287799 [Byron.Borrayo]', 'Juan Jose Gomez +50242105695 [Juanj.gomez]', 'Saul Recinos [saul.recinos]'];
  
  tickets.forEach((ticket) => {
    const tecnicoOriginal = ticket['Tech'];
    
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
    
    if (!tecnicoOriginal || !esTecnicoPermitido(tecnicoOriginal)) return;
    
    const aliasTecnico = obtenerAlias(tecnicoOriginal);
    
    if (!encargados[tecnicoOriginal]) {
      encargados[tecnicoOriginal] = {
        nombre: aliasTecnico,
        nombreOriginal: tecnicoOriginal,
        tiquetesAsignadosOctubre: 0
      };
    }

    const fechaTicket = new Date(ticket.Date);
    
    // Solo contar tickets de octubre
    if (fechaTicket >= octubre.inicio && fechaTicket <= octubre.fin) {
      encargados[tecnicoOriginal].tiquetesAsignadosOctubre++;
    }
  });

  // Calcular métricas de SLA y Participación
  const encargadosArray = Object.values(encargados);
  
  // Calcular total de tickets de octubre para todos los técnicos
  const totalTiquetesOctubre = encargadosArray.reduce((sum, encargado) => sum + encargado.tiquetesAsignadosOctubre, 0);
  const promedioIdeal = totalTiquetesOctubre / 7; // Dividir por 8 técnicos
  
  encargadosArray.forEach(encargado => {
    // SLA ideal (70%): Tiquetes asignados / 372
    encargado.slaIdeal = ((encargado.tiquetesAsignadosOctubre / 372) * 100).toFixed(2);
    
    // Participación actual (75%): Tiquetes asignados / (total octubre / 7)
    encargado.participacionActual = ((encargado.tiquetesAsignadosOctubre / promedioIdeal) * 100).toFixed(2);
  });

  // Ordenar por SLA ideal más alto
  return encargadosArray.sort((a, b) => {
    const slaA = parseFloat(a.slaIdeal) || 0;
    const slaB = parseFloat(b.slaIdeal) || 0;
    return slaB - slaA; // Orden descendente (mayor a menor)
  });
};

// Función para calcular promedios generales del mes
const calcularPromediosGenerales = (metricasMensuales) => {
  if (metricasMensuales.length === 0) {
    return {
      tiquetesAsignadosPromedio: '0.00',
      notaPromedio: '0.00',
      slaIdealPromedio: '0.00',
      participacionActualPromedio: '0.00'
    };
  }

  // Calcular promedio de tickets asignados
  const totalTiquetesAsignados = metricasMensuales.reduce((sum, encargado) => sum + encargado.tiquetesAsignados, 0);
  const tiquetesAsignadosPromedio = (totalTiquetesAsignados / metricasMensuales.length).toFixed(0);

  // Calcular promedio de nota (suma de notas de octubre / 7)
  const totalNotasOctubre = metricasMensuales.reduce((sum, encargado) => {
    const nota = parseFloat(encargado.meses.octubre.nota) || 0;
    return sum + nota;
  }, 0);
  const notaPromedio = (totalNotasOctubre / 7).toFixed(2);

  // Calcular SLA ideal promedio: (suma total de tickets / (372 * 7)) * 100
  const slaIdealPromedio = ((totalTiquetesAsignados / (372 * 7)) * 100).toFixed(2);

  // Calcular participación actual promedio
  const promedioIdeal = totalTiquetesAsignados / 7; // Suma total / 7
  const participacionActualPromedio = ((totalTiquetesAsignados / promedioIdeal) / 7 * 100).toFixed(2);

  return {
    tiquetesAsignadosPromedio,
    notaPromedio,
    slaIdealPromedio,
    participacionActualPromedio
  };
};

// Función para calcular datos de las gráficas
const calcularDatosGraficas = (metricasMensuales) => {
  if (metricasMensuales.length === 0) {
    return {
      datosTiquetes: [],
      datosEncuestados: [],
      porcentajeEncuestados: 0,
      porcentajeResueltos: 0
    };
  }

  // Calcular totales
  const totalTiquetesAsignados = metricasMensuales.reduce((sum, encargado) => sum + encargado.tiquetesAsignadosOctubre, 0);
  const totalTiquetesResueltos = metricasMensuales.reduce((sum, encargado) => sum + encargado.tiquetesResueltos, 0);
  const totalEncuestasRespondidas = metricasMensuales.reduce((sum, encargado) => sum + encargado.encuestasRespondidas, 0);

  // Datos para la gráfica de tickets
  const porcentajeResueltos = totalTiquetesAsignados > 0 ? ((totalTiquetesResueltos / totalTiquetesAsignados) * 100).toFixed(0) : 0;
  const datosTiquetes = [
    { name: 'Tickets resueltos', value: totalTiquetesResueltos, color: '#000000' },
    { name: 'Tickets pendientes', value: totalTiquetesAsignados - totalTiquetesResueltos, color: '#8B0000' }
  ];

  // Datos para la gráfica de encuestados
  const porcentajeEncuestados = totalTiquetesAsignados > 0 ? ((totalEncuestasRespondidas / totalTiquetesAsignados) * 100).toFixed(0) : 0;
  const datosEncuestados = [
    { name: 'Encuestados', value: totalEncuestasRespondidas, color: '#808080' },
    { name: 'No encuestados', value: totalTiquetesAsignados - totalEncuestasRespondidas, color: '#E0E0E0' }
  ];

  return {
    datosTiquetes,
    datosEncuestados,
    porcentajeEncuestados: parseInt(porcentajeEncuestados),
    porcentajeResueltos: parseInt(porcentajeResueltos)
  };
};

function MetricasEncargados() {
  const [tickets, setTickets] = useState([]);
  const [metricas, setMetricas] = useState([]);
  const [metricasSemanales, setMetricasSemanales] = useState([]);
  const [metricasMensuales, setMetricasMensuales] = useState([]);
  const [metricasSLA, setMetricasSLA] = useState([]);
  const [promediosGenerales, setPromediosGenerales] = useState({});
  const [datosGraficas, setDatosGraficas] = useState({});
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ tech: '', semana: 'todas', mes: '2025-10' });
  const semanasFijas = obtenerSemanasFijas(filters.mes);

  useEffect(() => {
    const fetchData = () => {
      fetch('http://localhost:3001/api/encargados', { cache: "no-store" })
        .then(response => response.json())
        .then(data => {
          if (Array.isArray(data)) {
            setTickets(data);
            const metricasCalculadas = calcularMetricasEncargados(data);
            const metricasSemanalesCalculadas = calcularMetricasSemanales(data, filters.mes);
            const metricasMensualesCalculadas = calcularMetricasMensuales(data);
            const metricasSLACalculadas = calcularMetricasSLA(data);
            const promediosGeneralesCalculados = calcularPromediosGenerales(metricasMensualesCalculadas);
            const datosGraficasCalculados = calcularDatosGraficas(metricasMensualesCalculadas);
            setMetricas(metricasCalculadas);
            setMetricasSemanales(metricasSemanalesCalculadas);
            setMetricasMensuales(metricasMensualesCalculadas);
            setMetricasSLA(metricasSLACalculadas);
            setPromediosGenerales(promediosGeneralesCalculados);
            setDatosGraficas(datosGraficasCalculados);
            
            // Generar archivo de notas semanales
            generarArchivoNotasSemanales(metricasSemanalesCalculadas);
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
  }, [filters.mes]);

  // Recalcular métricas semanales cuando cambie el mes
  useEffect(() => {
    if (tickets.length > 0) {
      const metricasSemanalesCalculadas = calcularMetricasSemanales(tickets, filters.mes);
      setMetricasSemanales(metricasSemanalesCalculadas);
    }
  }, [filters.mes, tickets]);

  // Asegurar que la semana seleccionada exista para el mes actual
  useEffect(() => {
    if (filters.semana !== 'todas') {
      const num = parseInt(filters.semana.replace('semana', ''));
      if (Number.isFinite(num) && num > semanasFijas.length) {
        setFilters((prev) => ({ ...prev, semana: 'todas' }));
      }
    }
  }, [filters.mes, semanasFijas.length, filters.semana]);


  // Función para búsqueda parcial como Excel
  const buscarTecnico = (encargado, busqueda) => {
    if (!busqueda) return true;
    
    // Buscar tanto en el nombre original como en el alias
    const nombreOriginal = encargado.nombreOriginal || encargado.nombre;
    const nombreAlias = encargado.nombre;
    
    // Convertir a minúsculas para búsqueda insensible a mayúsculas
    const termino = busqueda.toLowerCase();
    
    // Si el término contiene asteriscos, tratarlo como comodín
    if (termino.includes('*')) {
      // Convertir patrón de Excel a regex
      const patron = termino
        .replace(/\*/g, '.*') // * se convierte en .* (cualquier carácter)
        .replace(/\./g, '\\.'); // Escapar puntos literales
      
      const regex = new RegExp(`^${patron}$`, 'i');
      return regex.test(nombreOriginal) || regex.test(nombreAlias);
    } else {
      // Búsqueda parcial simple (contiene el término)
      return nombreOriginal.toLowerCase().includes(termino) || 
             nombreAlias.toLowerCase().includes(termino);
    }
  };

  // Filtrar métricas por técnico seleccionado
  const filteredMetricas = metricas.filter(encargado => {
    return !filters.tech || buscarTecnico(encargado, filters.tech);
  });

  // Filtrar métricas semanales por técnico seleccionado y ordenar por nota de semana seleccionada
  const filteredMetricasSemanales = metricasSemanales
    .filter(encargado => {
      return !filters.tech || buscarTecnico(encargado, filters.tech);
    })
    .sort((a, b) => {
      const semanaSeleccionada = (filters.semana === 'todas' || !filters.semana) ? 'semana1' : filters.semana;
      const notaA = parseFloat(a.semanas[semanaSeleccionada]?.nota) || 0;
      const notaB = parseFloat(b.semanas[semanaSeleccionada]?.nota) || 0;
      return notaB - notaA; // Orden descendente (mayor a menor)
    });

  // Filtrar métricas mensuales por técnico seleccionado y ordenar por nota de octubre
  const filteredMetricasMensuales = metricasMensuales
    .filter(encargado => {
      return !filters.tech || buscarTecnico(encargado, filters.tech);
    })
    .sort((a, b) => {
      const notaA = parseFloat(a.meses.octubre.nota) || 0;
      const notaB = parseFloat(b.meses.octubre.nota) || 0;
      return notaB - notaA; // Orden descendente (mayor a menor)
    });

  // Filtrar métricas de SLA por técnico seleccionado (ya viene ordenado por SLA ideal)
  const filteredMetricasSLA = metricasSLA.filter(encargado => {
    return !filters.tech || buscarTecnico(encargado, filters.tech);
  });

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <Typography>Cargando métricas de encargados...</Typography>
      </Box>
    );
  }

  return (
    <div className="metricas-encargados">
      <Typography variant="h4" component="h1" gutterBottom>
        Métricas de Encargados Técnicos
      </Typography>
      
      {filters.tech && (
        <Typography variant="body2" color="text.secondary" gutterBottom>
          Mostrando {filteredMetricas.length} de {metricas.length} técnicos que coinciden con "{filters.tech}"
        </Typography>
      )}
      
      <div style={{ marginBottom: '20px', display: 'flex', gap: '10px', alignItems: 'flex-end' }}>
        <TextField
          fullWidth
          label="Buscar técnico"
          value={filters.tech}
          onChange={(e) => setFilters({ ...filters, tech: e.target.value })}
          placeholder="Escriba parte del nombre, teléfono o use * como comodín"
          helperText="Busca en nombres completos."
        />
        <TextField
          select
          label="Filtrar por mes"
          value={filters.mes}
          onChange={(e) => setFilters({ ...filters, mes: e.target.value })}
          style={{ minWidth: '200px' }}
          SelectProps={{
            native: true,
          }}
        >
          <option value="2025-10">Octubre 2025</option>
          <option value="2025-09">Septiembre 2025</option>
          <option value="2025-08">Agosto 2025</option>
        </TextField>
        <TextField
          select
          label="Filtrar por semana"
          value={filters.semana}
          onChange={(e) => setFilters({ ...filters, semana: e.target.value })}
          style={{ minWidth: '200px' }}
          SelectProps={{
            native: true,
          }}
        >
          <option value="todas">Todas las semanas</option>
          {semanasFijas.map((s, idx) => (
            <option key={`semana-opt-${idx + 1}`} value={`semana${idx + 1}`}>
              {`Semana ${idx + 1}: ${formatearFechaCorta(s.inicio)} - ${formatearFechaCorta(s.fin)}`}
            </option>
          ))}
        </TextField>
        <Button 
          variant="outlined" 
          onClick={() => setFilters({ tech: '', semana: 'todas', mes: '2025-10' })}
          style={{ minWidth: '120px' }}
        >
          Mostrar Todos
        </Button>
      </div>
      
      {/* Tabla de Métricas Semanales */}
      <Card style={{ marginBottom: '20px' }}>
        <CardContent>
          <Typography variant="h5" component="h2" gutterBottom style={{ textAlign: 'center', fontWeight: 'bold' }}>
            {filters.semana === 'todas' ? 'NOTA DE LA SEMANA' : `NOTA DE LA ${filters.semana.toUpperCase().replace('SEMANA', 'SEMANA ')}`}
          </Typography>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow style={{ backgroundColor: '#000', color: '#fff' }}>
                  <TableCell style={{ color: '#fff', border: '1px solid #ddd' }}><strong>Nombre</strong></TableCell>
                  <TableCell align="center" style={{ color: '#fff', border: '1px solid #ddd' }}><strong>Tiquetes Asignados</strong></TableCell>
                  <TableCell align="center" style={{ color: '#fff', border: '1px solid #ddd' }}><strong>Tickets Resueltos</strong></TableCell>
                  <TableCell align="center" style={{ color: '#fff', border: '1px solid #ddd' }}><strong>Encuestas Respondidas</strong></TableCell>
                  <TableCell align="center" style={{ color: '#fff', border: '1px solid #ddd' }}><strong>Promedio Diario</strong></TableCell>
                  {semanasFijas
                    .map((s, idx) => ({ s, idx }))
                    .reverse()
                    .map(({ s, idx }) => (
                      <TableCell key={`hdr-w-${idx}`} align="center" style={{ color: '#fff', border: '1px solid #ddd' }} colSpan={2}>
                        <strong>{`Semana ${idx + 1} (${formatearFechaCorta(s.inicio)} - ${formatearFechaCorta(s.fin)})`}</strong>
                      </TableCell>
                    ))}
                </TableRow>
                <TableRow>
                  <TableCell style={{ border: '1px solid #ddd' }}></TableCell>
                  <TableCell style={{ border: '1px solid #ddd' }}></TableCell>
                  <TableCell style={{ border: '1px solid #ddd' }}></TableCell>
                  <TableCell style={{ border: '1px solid #ddd' }}></TableCell>
                  <TableCell style={{ border: '1px solid #ddd' }}></TableCell>
                  {semanasFijas
                    .map((_, idx) => idx + 1)
                    .reverse()
                    .map((num) => (
                      <React.Fragment key={`subhdr-${num}`}>
                        <TableCell align="center" style={{ border: '1px solid #ddd' }}><strong>{`Nota S${num}`}</strong></TableCell>
                        <TableCell align="center" style={{ border: '1px solid #ddd' }}><strong>{`Encuestado S${num}`}</strong></TableCell>
                      </React.Fragment>
                    ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredMetricasSemanales.map((encargado, index) => (
                  <TableRow key={index}>
                    <TableCell style={{ fontWeight: 'bold', border: '1px solid #ddd' }}>{encargado.nombre}</TableCell>
                    <TableCell align="center" style={{ border: '1px solid #ddd' }}>{encargado.tiquetesAsignados}</TableCell>
                    <TableCell align="center" style={{ border: '1px solid #ddd' }}>{encargado.tiquetesResueltos}</TableCell>
                    <TableCell align="center" style={{ border: '1px solid #ddd' }}>{encargado.encuestasRespondidas}</TableCell>
                    <TableCell align="center" style={{ border: '1px solid #ddd' }}>{encargado.promedioDiario}</TableCell>
                    {semanasFijas
                      .map((_, idx) => idx + 1)
                      .reverse()
                      .map((num) => {
                        const sKey = `semana${num}`;
                        const sData = encargado.semanas[sKey];
                        const notaColor = sData ? (parseFloat(sData.nota) >= 4.6 ? 'green' : 'red') : 'gray';
                        const encColor = sData ? (parseFloat(sData.encuestado) >= 80 ? 'green' : 'red') : 'gray';
                        return (
                          <React.Fragment key={`row-${index}-${num}`}>
                            <TableCell align="center" style={{ color: notaColor, fontWeight: 'bold', border: '1px solid #ddd' }}>
                              {sData ? sData.nota : 'N/A'}
                            </TableCell>
                            <TableCell align="center" style={{ color: encColor, fontWeight: 'bold', border: '1px solid #ddd' }}>
                              {sData ? `${sData.encuestado}%` : 'N/A'}
                            </TableCell>
                          </React.Fragment>
                        );
                      })}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>
      
      {/* Tabla de Métricas Mensuales */}
      <Card style={{ marginBottom: '20px' }}>
        <CardContent>
          <Typography variant="h5" component="h2" gutterBottom style={{ textAlign: 'center', fontWeight: 'bold' }}>
            NOTA DEL MES
          </Typography>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow style={{ backgroundColor: '#000', color: '#fff' }}>
                  <TableCell style={{ color: '#fff', fontWeight: 'bold', border: '1px solid #ddd' }}>Nombre</TableCell>
                  <TableCell align="center" style={{ color: '#fff', fontWeight: 'bold', border: '1px solid #ddd' }}>Tiquetes Asignados</TableCell>
                  <TableCell align="center" style={{ color: '#fff', fontWeight: 'bold', border: '1px solid #ddd' }}>Tiquetes Resueltos</TableCell>
                  <TableCell align="center" style={{ color: '#fff', fontWeight: 'bold', border: '1px solid #ddd' }}>Encuestas Respondidas</TableCell>
                  <TableCell align="center" style={{ color: '#fff', fontWeight: 'bold', border: '1px solid #ddd' }}>Promedio Diario</TableCell>
                  <TableCell align="center" colSpan={2} style={{ color: '#fff', fontWeight: 'bold', border: '1px solid #ddd' }}>Octubre</TableCell>
                  <TableCell align="center" colSpan={2} style={{ color: '#fff', fontWeight: 'bold', border: '1px solid #ddd' }}>Septiembre</TableCell>
                  <TableCell align="center" colSpan={2} style={{ color: '#fff', fontWeight: 'bold', border: '1px solid #ddd' }}>Agosto</TableCell>
                </TableRow>
                <TableRow style={{ backgroundColor: '#f5f5f5' }}>
                  <TableCell></TableCell>
                  <TableCell></TableCell>
                  <TableCell></TableCell>
                  <TableCell></TableCell>
                  <TableCell></TableCell>
                  <TableCell align="center" style={{ fontWeight: 'bold', border: '1px solid #ddd' }}>Nota</TableCell>
                  <TableCell align="center" style={{ fontWeight: 'bold', border: '1px solid #ddd' }}>Encuestado</TableCell>
                  <TableCell align="center" style={{ fontWeight: 'bold', border: '1px solid #ddd' }}>Nota</TableCell>
                  <TableCell align="center" style={{ fontWeight: 'bold', border: '1px solid #ddd' }}>Encuestado</TableCell>
                  <TableCell align="center" style={{ fontWeight: 'bold', border: '1px solid #ddd' }}>Nota</TableCell>
                  <TableCell align="center" style={{ fontWeight: 'bold', border: '1px solid #ddd' }}>Encuestado</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredMetricasMensuales.map((encargado, index) => (
                  <TableRow key={index} style={{ backgroundColor: index % 2 === 0 ? '#fff' : '#f9f9f9' }}>
                    <TableCell style={{ fontWeight: 'bold', border: '1px solid #ddd' }}>{encargado.nombre}</TableCell>
                    <TableCell align="center">{encargado.tiquetesAsignados}</TableCell>
                    <TableCell align="center">{encargado.tiquetesResueltos}</TableCell>
                    <TableCell align="center">{encargado.encuestasRespondidas}</TableCell>
                    <TableCell align="center">{encargado.promedioDiario}</TableCell>
                    <TableCell align="center" style={{ 
                      color: parseFloat(encargado.meses.octubre.nota) >= 4.6 ? 'green' : 'red',
                      fontWeight: 'bold'
                    }}>
                      {encargado.meses.octubre.nota}
                    </TableCell>
                    <TableCell align="center" style={{ 
                      color: parseFloat(encargado.meses.octubre.encuestado) >= 80 ? 'green' : 'red',
                      fontWeight: 'bold'
                    }}>
                      {encargado.meses.octubre.encuestado}%
                    </TableCell>
                    <TableCell align="center" style={{ 
                      color: parseFloat(encargado.meses.septiembre.nota) >= 4.6 ? 'green' : 'red',
                      fontWeight: 'bold'
                    }}>
                      {encargado.meses.septiembre.nota}
                    </TableCell>
                    <TableCell align="center" style={{ 
                      color: parseFloat(encargado.meses.septiembre.encuestado) >= 80 ? 'green' : 'red',
                      fontWeight: 'bold'
                    }}>
                      {encargado.meses.septiembre.encuestado}%
                    </TableCell>
                    <TableCell align="center" style={{ 
                      color: parseFloat(encargado.meses.agosto.nota) >= 4.6 ? 'green' : 'red',
                      fontWeight: 'bold'
                    }}>
                      {encargado.meses.agosto.nota}
                    </TableCell>
                    <TableCell align="center" style={{ 
                      color: parseFloat(encargado.meses.agosto.encuestado) >= 80 ? 'green' : 'red',
                      fontWeight: 'bold'
                    }}>
                      {encargado.meses.agosto.encuestado}%
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>
      
      {/* Tablas de Métricas de SLA y Promedios Generales */}
      <div style={{ display: 'flex', gap: '20px', marginBottom: '20px' }}>
        {/* Tabla de Métricas de SLA y Participación */}
        <Card style={{ flex: 2 }}>
          <CardContent>
            <Typography variant="h5" component="h2" gutterBottom style={{ textAlign: 'center', fontWeight: 'bold' }}>
              NOTA DE SLA DEL MES
            </Typography>
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow style={{ backgroundColor: '#000', color: '#fff' }}>
                    <TableCell style={{ color: '#fff', fontWeight: 'bold', border: '1px solid #ddd' }}>Nombre</TableCell>
                    <TableCell align="center" style={{ color: '#fff', fontWeight: 'bold', border: '1px solid #ddd' }}>SLA Ideal (70%)</TableCell>
                    <TableCell align="center" style={{ color: '#fff', fontWeight: 'bold', border: '1px solid #ddd' }}>Participación Actual (75%)</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredMetricasSLA.map((encargado, index) => (
                    <TableRow key={index} style={{ backgroundColor: index % 2 === 0 ? '#fff' : '#f9f9f9' }}>
                      <TableCell style={{ fontWeight: 'bold', border: '1px solid #ddd' }}>{encargado.nombre}</TableCell>
                      <TableCell align="center" style={{ 
                        color: parseFloat(encargado.slaIdeal) >= 70 ? 'green' : 'red',
                        fontWeight: 'bold'
                      }}>
                        {encargado.slaIdeal}%
                      </TableCell>
                      <TableCell align="center" style={{ 
                        color: parseFloat(encargado.participacionActual) >= 75 ? 'green' : 'red',
                        fontWeight: 'bold'
                      }}>
                        {encargado.participacionActual}%
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>

        {/* Tabla de Promedios Generales */}
        <Card style={{ flex: 1 }}>
          <CardContent>
            <Typography variant="h5" component="h2" gutterBottom style={{ textAlign: 'center', fontWeight: 'bold' }}>
              PROMEDIO GENERAL DEL MES
            </Typography>
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow style={{ backgroundColor: '#000', color: '#fff' }}>
                    <TableCell style={{ color: '#fff', fontWeight: 'bold', border: '1px solid #ddd' }}>Métrica</TableCell>
                    <TableCell align="center" style={{ color: '#fff', fontWeight: 'bold', border: '1px solid #ddd' }}>Valor</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  <TableRow style={{ backgroundColor: '#f9f9f9' }}>
                    <TableCell style={{ fontWeight: 'bold', border: '1px solid #ddd' }}>Tiquetes asignados en promedio</TableCell>
                    <TableCell align="center" style={{ 
                      fontWeight: 'bold'
                    }}>
                      {promediosGenerales.tiquetesAsignadosPromedio}
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell style={{ fontWeight: 'bold', border: '1px solid #ddd' }}>Nota</TableCell>
                    <TableCell align="center" style={{ 
                      color: parseFloat(promediosGenerales.notaPromedio) >= 4.6 ? 'green' : 'red',
                      fontWeight: 'bold'
                    }}>
                      {promediosGenerales.notaPromedio}
                    </TableCell>
                  </TableRow>
                  <TableRow style={{ backgroundColor: '#f9f9f9' }}>
                    <TableCell style={{ fontWeight: 'bold', border: '1px solid #ddd' }}>SLA Ideal (70%)</TableCell>
                    <TableCell align="center" style={{ 
                      color: parseFloat(promediosGenerales.slaIdealPromedio) >= 70 ? 'green' : 'red',
                      fontWeight: 'bold'
                    }}>
                      {promediosGenerales.slaIdealPromedio}%
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell style={{ fontWeight: 'bold', border: '1px solid #ddd' }}>Participación Actual (75%)</TableCell>
                    <TableCell align="center" style={{ 
                      color: parseFloat(promediosGenerales.participacionActualPromedio) >= 75 ? 'green' : 'red',
                      fontWeight: 'bold'
                    }}>
                      {promediosGenerales.participacionActualPromedio}%
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      </div>

      {/* Gráficas de Tickets */}
      <div style={{ display: 'flex', gap: '20px', marginBottom: '20px' }}>
        {/* Gráfica de Tickets */}
        <Card style={{ flex: 1 }}>
          <CardContent>
            <Typography variant="h6" component="h3" gutterBottom style={{ textAlign: 'center', fontWeight: 'bold', marginBottom: '20px' }}>
              Tiquetes
            </Typography>
            <div style={{ position: 'relative', textAlign: 'center' }}>
              <ResponsiveContainer width="100%" height={350}>
                <PieChart>
                  <Pie
                    data={datosGraficas.datosTiquetes}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={120}
                    paddingAngle={5}
                    dataKey="value"
                    label={({ name, value, percent }) => `${name}: ${value} (${(percent * 100).toFixed(0)}%)`}
                    labelLine={true}
                  >
                    {datosGraficas.datosTiquetes.map((entry, index) => (
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
                {datosGraficas.porcentajeResueltos}%
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Gráfica de Tiquetes Encuestados */}
        <Card style={{ flex: 1 }}>
          <CardContent>
            <Typography variant="h6" component="h3" gutterBottom style={{ textAlign: 'center', fontWeight: 'bold', marginBottom: '20px' }}>
              Tiquetes encuestados
            </Typography>
            <div style={{ position: 'relative', textAlign: 'center' }}>
              <ResponsiveContainer width="100%" height={350}>
                <PieChart>
                  <Pie
                    data={datosGraficas.datosEncuestados}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={120}
                    paddingAngle={5}
                    dataKey="value"
                    label={({ name, value, percent }) => `${name}: ${value} (${(percent * 100).toFixed(0)}%)`}
                    labelLine={true}
                  >
                    {datosGraficas.datosEncuestados.map((entry, index) => (
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
                {datosGraficas.porcentajeEncuestados}%
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default MetricasEncargados;