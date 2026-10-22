import { useState, useEffect } from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination } from 'swiper/modules';
import sprite from './assets/sprite.svg';
import foto1 from './assets/images/foto 1.webp';
import foto2 from './assets/images/foto 2.webp';
import foto3 from './assets/images/foto 3.webp';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
const fotos = [foto1, foto2, foto3];

function Icono({ nombre, size = 24, className = '' }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      stroke="currentColor"
      aria-hidden="true"
      className={className}
    >
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
        <SwiperSlide className="w-[85%] sm:w-[70%] md:w-170 h-72 md:h-96 lg:h-125" key={foto}>
          <img
            className="w-full h-full object-cover rounded-2xl shadow-lg shadow-zinc-900/10"
            src={foto}
            alt={`Fourteam, foto ${indice + 1}`}
          />
        </SwiperSlide>
      ))}
    </Swiper>
  );
}

function LoginModal({ abierto, cerrar, iniciarSesion }) {
  const [error, setError] = useState('');
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    if (!abierto) return;

    function handleKeyDown(evento) {
      if (evento.key === 'Escape') {
        cerrar();
      }
    }

    const scrollOriginal = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = scrollOriginal;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [abierto, cerrar]);

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
    } catch {
      setError('El servidor está apagado (Error de conexión).');
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-100 flex items-center justify-center backdrop-blur-sm bg-zinc-950/35 transition-opacity p-4"
      onClick={(evento) => {
        if (evento.target === evento.currentTarget) cerrar();
      }}
    >
      <div className="bg-white p-8 rounded-3xl shadow-2xl shadow-zinc-900/15 w-full max-w-sm border border-zinc-200/80 relative transform transition-all">
        <button
          type="button"
          onClick={cerrar}
          aria-label="Cerrar acceso"
          className="absolute top-4 right-4 text-zinc-400 hover:text-zinc-900 transition-colors"
        >
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            aria-hidden="true"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <div className="text-center mb-8">
          <h2 className="text-3xl font-semibold tracking-tight text-zinc-900 mb-1">Acceso</h2>
          <p className="text-zinc-500 text-sm">Solo Para Miembros del Fourteamxd</p>
        </div>

        <form onSubmit={enviar} className="space-y-5">
          <div>
            <label htmlFor="nombre" className="block text-sm font-medium text-zinc-700 mb-1">
              Usuario
            </label>
            <input
              type="text"
              id="nombre"
              name="nombre"
              placeholder="Ej: Gero"
              required
              autoFocus
              className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-3 text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:border-zinc-500 focus:ring-1 focus:ring-zinc-500 transition-colors"
            />
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-zinc-700 mb-1">
              Contraseña
            </label>
            <input
              type="password"
              id="password"
              name="password"
              placeholder="••••••"
              required
              className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-3 text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:border-zinc-500 focus:ring-1 focus:ring-zinc-500 transition-colors"
            />
          </div>
          {error && <p role="alert" className="text-red-600 text-sm text-center">{error}</p>}
          <div className="flex justify-center w-full">
            <button
              type="submit"
              disabled={enviando}
              className="bg-zinc-900 hover:bg-zinc-700 disabled:opacity-60 text-white font-semibold py-3 px-6 rounded-xl transition-colors"
            >
              Ingresar
            </button>
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
      <div className="w-full min-h-screen flex flex-col">
        <header className="sticky top-0 z-30 h-14 border-b border-zinc-900/5 bg-white/75 backdrop-blur-xl supports-backdrop-filter:bg-white/65">
          <div className="mx-auto flex h-full w-full max-w-6xl items-center justify-between px-4 md:px-8">
            <button
              type="button"
              onClick={() => setMenuAbierto((abierto) => !abierto)}
              aria-label={menuAbierto ? 'Cerrar menú' : 'Abrir menú'}
              aria-expanded={menuAbierto}
              className="flex size-9 items-center justify-center rounded-full hover:bg-zinc-900/5 transition-colors focus:outline-none"
            >
              <Icono nombre="menu" size={20} />
            </button>
            <a href="/">
              <h1 className="text-base font-semibold tracking-tight text-zinc-900 hover:text-zinc-600 transition-colors">
                Fourteam xd
              </h1>
            </a>
            {usuario ? (
              <div className="flex items-center gap-1.5 sm:gap-2">
                <span className="text-xs sm:text-sm font-medium text-zinc-800 bg-zinc-100 py-1.5 px-3 rounded-full border border-zinc-200">
                  {usuario}
                </span>
                <button
                  type="button"
                  onClick={() => setUsuario(null)}
                  title="Cerrar sesión"
                  aria-label="Cerrar sesión"
                  className="flex size-9 items-center justify-center rounded-full border border-zinc-900/10 bg-white/60 hover:bg-zinc-100 hover:text-red-600 transition-colors"
                >
                  <Icono nombre="logout" size={18} />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setLoginAbierto(true)}
                aria-label="Ingresar"
                className="flex size-9 items-center justify-center rounded-full border border-zinc-900/10 bg-white/60 hover:bg-white transition-colors"
              >
                <Icono nombre="login" size={20} />
              </button>
            )}
          </div>
        </header>

        <main className="grow min-h-[calc(100vh-3.5rem)] p-4">
          <Galeria />
        </main>

        <footer className="border-t border-zinc-900/5 bg-white/65 px-4 py-5 text-center text-zinc-500">
          <p className="text-xs font-medium tracking-wide">Fourteam &copy; 2026</p>
        </footer>
      </div>

      {/* Overlay para cerrar el menú en móviles y escritorios */}
      {menuAbierto && (
        <div
          className="fixed inset-0 z-40 bg-zinc-950/25 backdrop-blur-[2px] transition-opacity"
          onClick={() => setMenuAbierto(false)}
          aria-hidden="true"
        />
      )}

      {/* Menú lateral (Drawer) */}
      <aside
        className={`fixed top-0 left-0 w-64 h-full p-4 border-r border-zinc-900/10 bg-white/95 backdrop-blur-xl z-50 transform transition-transform duration-300 ease-in-out flex flex-col ${
          menuAbierto ? 'translate-x-0 shadow-2xl' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between mb-8 pb-2 border-b border-zinc-100">
          <h2 className="text-lg font-semibold text-zinc-900 tracking-tight">Menú</h2>
          <button
            type="button"
            onClick={() => setMenuAbierto(false)}
            aria-label="Cerrar menú"
            className="text-zinc-400 hover:text-zinc-900 p-1"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <ul className="space-y-4 text-center">
          <li>
            <a
              href="#miembros"
              onClick={() => setMenuAbierto(false)}
              className="text-zinc-600 hover:text-zinc-950 transition-colors block py-1"
            >
              Miembros
            </a>
          </li>
          <li>
            <a
              href="#galeria"
              onClick={() => setMenuAbierto(false)}
              className="text-zinc-600 hover:text-zinc-950 transition-colors block py-1"
            >
              Galería
            </a>
          </li>
          <li>
            <a
              href="#info"
              onClick={() => setMenuAbierto(false)}
              className="text-zinc-600 hover:text-zinc-950 transition-colors block py-1"
            >
              Info
            </a>
          </li>
        </ul>
      </aside>

      <LoginModal
        abierto={loginAbierto}
        cerrar={() => setLoginAbierto(false)}
        iniciarSesion={setUsuario}
      />
    </>
  );
}
