# Frontend de Fourteam

Este frontend usa React con Vite. Instalá las dependencias del backend una vez desde `back` con `npm install`. Después, desde `front`:

```powershell
npm install
npm run dev
```

Vite abre la página en el navegador y muestra la URL exacta en la terminal. Si el puerto 5173 está ocupado, usa otro automáticamente. No abras `index.html` con Live Server: ese servidor no transforma los archivos JSX ni procesa las importaciones del proyecto.

`npm run dev` inicia el frontend y el backend juntos. El login usa `http://localhost:3000` y la base local está en `back/fourteam.db`. En una base recién creada, los usuarios iniciales se generan con la contraseña `123456`, salvo que se defina `INITIAL_PASSWORD` en el entorno.

Si querés iniciar solo el frontend porque ya tenés el backend corriendo, usá `npm run dev:front`.
