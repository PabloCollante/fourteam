# Fourteam

Fourteam es una red social para un grupo de amigos: un lugar para compartir fotos, publicaciones y comentarios, mantener un perfil propio y registrar los partidos del equipo.

El proyecto está en desarrollo. La interfaz usa un estilo claro y translúcido, con modo oscuro y adaptación a pantallas móviles.

## Funciones actuales

- Inicio de sesión y cambio obligatorio de contraseña en el primer acceso.
- Perfiles con foto, nombre, apodo opcional y publicaciones del integrante.
- Publicaciones con texto y/o una foto, y comentarios de las cuentas autenticadas.
- Carrusel del inicio con tres fotos reemplazables desde Ajustes por las cuentas autorizadas.
- Partidos con fecha, rival, resultado y notas.
- Ajustes de contraseña y apariencia; el tema se guarda en el navegador.

Pablo tiene el rol `superadmin` y Leandro el rol `admin`. El backend verifica sus permisos para modificar partidos y fotos del carrusel. Las demás cuentas pueden participar mediante perfiles, publicaciones y comentarios.

## Tecnologías

| Parte | Implementación |
| --- | --- |
| Frontend | React, Vite, Tailwind CSS y Swiper |
| Backend | Node.js y Express |
| Base de datos | SQLite con `better-sqlite3` |
| Subida de imágenes | Multer y archivos en disco |
| Contraseñas | Hash con scrypt |

## Ejecutar en desarrollo

Se necesita Node.js y npm. El desarrollo se ha comprobado con Node.js 22.

Desde la raíz del repositorio:

```powershell
npm --prefix back install
npm --prefix front install
npm --prefix front run dev
```

El último comando inicia el backend y Vite. Vite abre el navegador y muestra la dirección de la página en la terminal; el backend usa por defecto el puerto 3000.

No abrir el proyecto con Live Server: el JSX se procesa mediante Vite. Si el puerto 3000 ya está ocupado, detener la otra instancia antes de iniciar otra.

Si el backend ya está corriendo, iniciar únicamente el frontend:

```powershell
npm --prefix front run dev:front
```

Para iniciar solo el backend desde la raíz:

```powershell
node back/server.js
```

## Configuración y primer acceso

El backend toma las variables del entorno del proceso:

| Variable | Uso |
| --- | --- |
| `PORT` | Puerto del backend; por defecto 3000. |
| `DB_PATH` | Ruta de SQLite; por defecto `back/fourteam.db`. |
| `INITIAL_PASSWORD` | Contraseña inicial usada únicamente al crear usuarios en una base vacía. |

El frontend usa `VITE_API_URL` para la dirección del backend; por defecto apunta a `http://localhost:3000`. Las variables de Vite se incorporan a la aplicación cliente: no colocar secretos en ellas.

Una base nueva crea las cuentas del grupo desde `back/database.js`. No hay registro público de usuarios. Definir una contraseña inicial de forma privada antes de generar una base para compartir y completar el cambio obligatorio de cada cuenta. Cambiar `INITIAL_PASSWORD` después no restablece contraseñas existentes.

Mientras una cuenta conserve una contraseña inicial conocida por terceros, esos terceros podrían entrar y reclamarla. Los roles no sustituyen el uso de contraseñas privadas.

## Datos e imágenes

- La base activa se guarda en `back/fourteam.db`, salvo configuración distinta.
- Las imágenes subidas se guardan en `back/uploads/`.
- Actualmente se admite una imagen JPEG, PNG o WebP por solicitud, de hasta 5 MiB.
- La compresión automática de fotos grandes está **planificada**, no implementada. Ver [PLAN.md](PLAN.md).
- Las sesiones están en memoria: reiniciar el backend obliga a volver a iniciar sesión.
- Las API de contenido requieren sesión; las imágenes de `/uploads` siguen siendo accesibles para quien conozca su enlace directo.

La base, las fotos subidas y las credenciales no se versionan. Para conservar datos hacen falta copias de seguridad de la base y de `back/uploads/`; esas copias también requieren protección.

## Verificación

```powershell
npm --prefix back test
npm --prefix front run build
```

Las pruebas del backend usan bases temporales y comprueban migraciones, autenticación, permisos, publicaciones, comentarios, perfiles y carrusel. El build genera el frontend en `front/dist/`.

## Estructura

```text
Fourteam/
├── back/                 # API, base SQLite, pruebas y archivos subidos
├── front/                # Aplicación React y configuración de Vite
├── PLAN.md               # Metas, decisiones pendientes y tareas por etapas
└── README.md
```

## Publicación en producción

Todavía no se eligió una plataforma. El despliegue debe contemplar almacenamiento persistente para SQLite y las fotos, o migrarlos a servicios externos. Un disco temporal puede perder ambos al reiniciar el servicio.

También se deben configurar la dirección real del backend, HTTPS, credenciales privadas y copias de seguridad. `npm run dev` es el comando de desarrollo; no constituye el despliegue de producción.
