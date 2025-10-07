export const iniciarSesionUsuario = async (credenciales) => {
    if (credenciales.email === 'admin@correo.com') {
      return { token: 'admin.jwt.token', rol: 'admin' };
    }
    return { token: 'usuario.jwt.token', rol: 'miembro' };
  };
  
  export const obtenerProyectos = async () => [
    { id: 1, nombre: 'Proyecto 1' },
    { id: 2, nombre: 'Proyecto 2' },
  ];