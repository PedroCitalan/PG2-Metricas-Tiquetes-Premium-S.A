import React from 'react';

const TableroKanban = ({ tareas }) => (
  <div className="tablero-kanban">
    {['Pendiente', 'En progreso', 'Completada'].map((estado) => (
      <div key={estado} className="columna-kanban">
        <h2>{estado}</h2>
        {tareas
          .filter((tarea) => tarea.estado === estado)
          .map((tarea) => (
            <div key={tarea.id} className="tarjeta-kanban">
              <h3>{tarea.nombre}</h3>
              <p>{tarea.descripcion}</p>
            </div>
          ))}
      </div>
    ))}
  </div>
);

export default TableroKanban;