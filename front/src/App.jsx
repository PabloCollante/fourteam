import { useState } from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination } from 'swiper/modules';
import sprite from './assets/sprite.svg';
import foto1 from './assets/images/foto 1.webp';
import foto2 from './assets/images/foto 2.webp';
import foto3 from './assets/images/foto 3.webp';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
const fotos = [foto1, foto2, foto3];

function Icono({ nombre, size = 24 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <use href={`${sprite}#${nombre}`} />
    </svg>
  );
}

function Galeria() {
  return (
    <Swiper
      className="mySwiper w-full max-w-5xl mx-auto py-8 px-4"
      modules={[Navigation, Pagination]}
      slidesPerView="auto"
      spaceBetween={20}
      navigation
      pagination={{ type: 'progressbar' }}
    >
      {fotos.map((foto, indice) => (
        <SwiperSlide className="h-72 md:h-96 lg:h-[500px]" key={foto}>
          <img className="w-full h-full object-cover rounded-xl shadow-xl" src={foto} alt={`Fourteam, foto ${indice + 1}`} />
        </SwiperSlide>
      ))}
    </Swiper>
  );
}

function LoginModal({ abierto, cerrar, iniciarSesion }) {
  const [error, setError] = useState('');
  const [enviando, setEnviando] = useState(false);

  if (!abierto) return null;

  async function enviar(evento) {
    evento.preventDefault();
    setError('');
    setEnviando(true);

    const datos = new FormData(evento.currentTarget);
    const nombre = String(datos.get('nombre') || '').trim();
    const password = String(datos.get('password') || '');

    try {
      const respuesta = await fetch(`${API_URL}/api/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nombre, password }),
      });
      const data = await respuesta.json();

      if (!respuesta.ok || !data.exito) {
        setError(data.mensaje || 'No se pudo iniciar sesión.');
        return;
      }

      iniciarSesion(data.usuario.nombre);
      cerrar();
      window.alert(`Sos Boludo, ${data.usuario.nombre}?`);
    } catch {
      setError('El servidor está apagado (Error de conexión).');
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center backdrop-blur-sm bg-black/60 transition-opacity"
      onClick={(evento) => { if (evento.target === evento.currentTarget) cerrar(); }}
    >
      <div className="bg-slate-800 p-8 rounded-2xl shadow-2xl w-full max-w-sm border border-slate-700 relative transform transition-all">
        <button type="button" onClick={cerrar} aria-label="Cerrar acceso" className="absolute top-4 right-4 text-zinc-400 hover:text-white transition-colors">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-zinc-200 mb-1">Acceso</h2>
          <p className="text-zinc-400 text-sm">Solo Para Miembros del Fourteamxd</p>
        </div>

        <form onSubmit={enviar} className="space-y-5">
          <div>
            <label htmlFor="nombre" className="block text-sm font-medium text-zinc-400 mb-1">Usuario</label>
            <input type="text" id="nombre" name="nombre" placeholder="Ej: Gero" required className="w-full bg-slate-900 border border-slate-600 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-green-600 focus:ring-1 focus:ring-green-600 transition-colors" />
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-zinc-400 mb-1">Contraseña</label>
            <input type="password" id="password" name="password" placeholder="••••••" required className="w-full bg-slate-900 border border-slate-600 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-green-600 focus:ring-1 focus:ring-green-600 transition-colors" />
          </div>
          {error && <p role="alert" className="text-red-400 text-sm text-center">{error}</p>}
          <div className="flex justify-center w-full">
            <button type="submit" disabled={enviando} className="bg-green-700 hover:bg-green-600 disabled:opacity-60 text-white font-bold py-3 px-6 rounded-lg transition-colors shadow-lg shadow-green-900/50">Ingresar</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function App() {
  const [menuAbierto, setMenuAbierto] = useState(false);
  const [loginAbierto, setLoginAbierto] = useState(false);
  const [usuario, setUsuario] = useState(null);

  return (
    <>
      <div className={`w-full transition-transform duration-300 min-h-screen flex flex-col ${menuAbierto ? 'translate-x-64' : ''}`}>
        <header className="backdrop-blur-md bg-slate-900/50 text-zinc-400 p-4 sticky top-0 z-50 flex justify-between items-center">
          <button type="button" onClick={() => setMenuAbierto((abierto) => !abierto)} aria-label="Abrir menú" className="flex items-center justify-center p-2 rounded-full hover:bg-slate-900 transition-colors focus:outline-none">
            <Icono nombre="menu" />
          </button>
          <a href="/">
            <h1 className="text-2xl font-bold tracking-tight hover:text-zinc-200 transition-colors duration-100">Fourteam xd</h1>
          </a>
          <button type="button" onClick={() => setLoginAbierto(true)} aria-label={usuario ? `Usuario ${usuario}` : 'Ingresar'} className="flex items-center justify-center border-2 border-green-800 hover:bg-slate-900 py-2 px-4 rounded transition-colors">
            {usuario ? <span className="font-bold text-green-500">{usuario}</span> : <Icono nombre="login" />}
          </button>
        </header>

        <main className="grow p-4">
          <Galeria />
        </main>

        <footer className="backdrop-blur-md bg-slate-900/50 text-white p-4 text-center relative z-40">
          <p className="text-lg font-semibold">Fourteam &copy; 2026</p>
        </footer>
      </div>

      <aside className={`text-center backdrop-blur-md bg-slate-900/50 fixed top-0 left-0 w-64 h-full text-white p-4 transform transition-transform duration-300 z-50 ${menuAbierto ? '' : '-translate-x-full'}`}>
        <h2 className="text-2xl font-bold mb-8 text-zinc-400 tracking-tight">Menú</h2>
        <ul className="space-y-4">
          <li><a href="/" className="text-zinc-400 hover:text-zinc-300">Miembros</a></li>
          <li><a href="/about.html" className="text-zinc-400 hover:text-zinc-300">Galeria</a></li>
          <li><a href="/contact.html" className="text-zinc-400 hover:text-zinc-300">Info</a></li>
        </ul>
      </aside>

      <LoginModal abierto={loginAbierto} cerrar={() => setLoginAbierto(false)} iniciarSesion={setUsuario} />
    </>
  );
}
