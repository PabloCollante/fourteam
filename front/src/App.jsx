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
          <img className="w-full h-full object-cover rounded-2xl shadow-lg shadow-zinc-900/10" src={foto} alt={`Fourteam, foto ${indice + 1}`} />
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
      className="fixed inset-0 z-[100] flex items-center justify-center backdrop-blur-sm bg-zinc-950/35 transition-opacity p-4"
      onClick={(evento) => { if (evento.target === evento.currentTarget) cerrar(); }}
    >
      <div className="bg-white p-8 rounded-3xl shadow-2xl shadow-zinc-900/15 w-full max-w-sm border border-zinc-200/80 relative transform transition-all">
        <button type="button" onClick={cerrar} aria-label="Cerrar acceso" className="absolute top-4 right-4 text-zinc-400 hover:text-zinc-900 transition-colors">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <div className="text-center mb-8">
          <h2 className="text-3xl font-semibold tracking-tight text-zinc-900 mb-1">Acceso</h2>
          <p className="text-zinc-500 text-sm">Solo Para Miembros del Fourteamxd</p>
        </div>

        <form onSubmit={enviar} className="space-y-5">
          <div>
            <label htmlFor="nombre" className="block text-sm font-medium text-zinc-700 mb-1">Usuario</label>
            <input type="text" id="nombre" name="nombre" placeholder="Ej: Gero" required className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-3 text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:border-zinc-500 focus:ring-1 focus:ring-zinc-500 transition-colors" />
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-zinc-700 mb-1">Contraseña</label>
            <input type="password" id="password" name="password" placeholder="••••••" required className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-3 text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:border-zinc-500 focus:ring-1 focus:ring-zinc-500 transition-colors" />
          </div>
          {error && <p role="alert" className="text-red-600 text-sm text-center">{error}</p>}
          <div className="flex justify-center w-full">
            <button type="submit" disabled={enviando} className="bg-zinc-900 hover:bg-zinc-700 disabled:opacity-60 text-white font-semibold py-3 px-6 rounded-xl transition-colors">Ingresar</button>
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
        <header className="sticky top-0 z-50 h-14 border-b border-zinc-900/5 bg-white/75 backdrop-blur-xl supports-[backdrop-filter]:bg-white/65">
          <div className="mx-auto flex h-full w-full max-w-6xl items-center justify-between px-4 md:px-8">
            <button type="button" onClick={() => setMenuAbierto((abierto) => !abierto)} aria-label={menuAbierto ? 'Cerrar menú' : 'Abrir menú'} aria-expanded={menuAbierto} className="flex size-9 items-center justify-center rounded-full hover:bg-zinc-900/5 transition-colors focus:outline-none">
              <Icono nombre="menu" size={20} />
            </button>
            <a href="/">
              <h1 className="text-base font-semibold tracking-tight text-zinc-900 hover:text-zinc-600 transition-colors">Fourteam xd</h1>
            </a>
            <button type="button" onClick={() => setLoginAbierto(true)} aria-label={usuario ? `Usuario ${usuario}` : 'Ingresar'} className="flex min-w-9 h-9 items-center justify-center rounded-full border border-zinc-900/10 bg-white/60 px-2.5 hover:bg-white transition-colors">
              {usuario ? <span className="text-sm font-medium text-zinc-800">{usuario}</span> : <Icono nombre="login" size={20} />}
            </button>
          </div>
        </header>

        <main className="grow min-h-[calc(100vh-3.5rem)] p-4">
          <Galeria />
        </main>

        <footer className="border-t border-zinc-900/5 bg-white/65 px-4 py-5 text-center text-zinc-500">
          <p className="text-xs font-medium tracking-wide">Fourteam &copy; 2026</p>
        </footer>
      </div>

      <aside className={`text-center border-r border-zinc-900/5 bg-white/90 backdrop-blur-xl fixed top-0 left-0 w-64 h-full p-4 transform transition-transform duration-300 z-50 ${menuAbierto ? '' : '-translate-x-full'}`}>
        <h2 className="text-lg font-semibold mb-8 text-zinc-900 tracking-tight">Menú</h2>
        <ul className="space-y-4">
          <li><a href="/" className="text-zinc-600 hover:text-zinc-950">Miembros</a></li>
          <li><a href="/about.html" className="text-zinc-600 hover:text-zinc-950">Galeria</a></li>
          <li><a href="/contact.html" className="text-zinc-600 hover:text-zinc-950">Info</a></li>
        </ul>
      </aside>

      <LoginModal abierto={loginAbierto} cerrar={() => setLoginAbierto(false)} iniciarSesion={setUsuario} />
    </>
  );
}
