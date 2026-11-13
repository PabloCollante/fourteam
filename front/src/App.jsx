import { useState, useEffect } from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation } from 'swiper/modules';
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

async function leerCarrusel(sesion) {
  const r = await fetch(`${API_URL}/api/carrusel`, {
    headers: { Authorization: `Bearer ${sesion.token}` },
  });
  if (!r.ok) throw new Error('No se pudieron cargar las fotos del carrusel.');
  const d = await r.json();
  return fotos.map((foto, i) => {
    const guardada = d.fotos.find((f) => f.posicion === i + 1);
    return guardada ? `${API_URL}${guardada.image_url}` : foto;
  });
}

function Galeria({ sesion }) {
  const [indice, setIndice] = useState(0);
  const [imagenes, setImagenes] = useState(fotos);
  const [error, setError] = useState('');
  useEffect(() => {
    leerCarrusel(sesion)
      .then(setImagenes)
      .catch((e) => setError(e.message));
  }, [sesion.token]);
  return (
    <section id="galeria" className="mx-auto max-w-6xl px-5 pt-14 sm:px-8 sm:pt-20">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-5">
        <div>
          <h2 className="text-4xl font-semibold tracking-tight sm:text-6xl">Nuestros momentos.</h2>
          <p className="mt-3 text-lg text-muted">Dentro y fuera de la cancha.</p>
        </div>
        <span className="text-sm tabular-nums text-muted">
          {String(indice + 1).padStart(2, '0')} / {String(fotos.length).padStart(2, '0')}
        </span>
      </div>
      {error && (
        <p role="alert" className="mb-4 text-sm text-danger">
          {error}
        </p>
      )}
      <Swiper
        className="galeria"
        modules={[Navigation]}
        navigation
        slidesPerView={1}
        onSlideChange={(swiper) => setIndice(swiper.activeIndex)}
      >
        {imagenes.map((foto, i) => (
          <SwiperSlide key={foto}>
            <img
              className="aspect-[4/3] w-full rounded-2xl object-cover sm:aspect-[2/1]"
              src={foto}
              alt={`Fourteam, foto ${i + 1}`}
            />
          </SwiperSlide>
        ))}
      </Swiper>
    </section>
  );
}

function Partidos({ sesion }) {
  const [partidos, setPartidos] = useState([]);
  const [error, setError] = useState('');
  const [editando, setEditando] = useState(null);
  const [ocupado, setOcupado] = useState(false);
  const admin = ['admin', 'superadmin'].includes(sesion?.usuario.roll);
  async function cargar() {
    try {
      const r = await fetch(`${API_URL}/api/partidos`, {
        headers: { Authorization: `Bearer ${sesion.token}` },
      });
      if (!r.ok) throw new Error();
      setPartidos((await r.json()).partidos);
    } catch {
      setError('No se pudieron cargar los partidos.');
    }
  }
  useEffect(() => {
    cargar();
  }, []);
  async function enviar(url, metodo, cuerpo) {
    const r = await fetch(`${API_URL}${url}`, {
      method: metodo,
      headers: { Authorization: `Bearer ${sesion.token}`, 'Content-Type': 'application/json' },
      ...(cuerpo ? { body: JSON.stringify(cuerpo) } : {}),
    });
    const d = await r.json();
    if (!r.ok) throw new Error(d.mensaje || 'No se pudo completar la operación.');
    return d;
  }
  async function guardar(e) {
    e.preventDefault();
    setOcupado(true);
    setError('');
    const f = new FormData(e.currentTarget);
    const partido = {
      fecha: f.get('fecha'),
      rival: f.get('rival'),
      goles_fourtem: Number(f.get('goles_fourtem')),
      goles_rival: Number(f.get('goles_rival')),
      notas: f.get('notas'),
    };
    try {
      await enviar(
        editando.id ? `/api/partidos/${editando.id}` : '/api/partidos',
        editando.id ? 'PUT' : 'POST',
        partido,
      );
      setEditando(null);
      await cargar();
    } catch (err) {
      setError(err.message || 'No se pudo guardar el partido.');
    } finally {
      setOcupado(false);
    }
  }
  async function eliminar(id) {
    if (!window.confirm('¿Eliminar este partido?')) return;
    setOcupado(true);
    setError('');
    try {
      await enviar(`/api/partidos/${id}`, 'DELETE');
      await cargar();
    } catch (err) {
      setError(err.message || 'No se pudo eliminar el partido.');
    } finally {
      setOcupado(false);
    }
  }
  return (
    <section id="partidos" className="mx-auto max-w-4xl scroll-mt-20 px-5 pt-24 sm:px-8">
      <div className="text-center">
        <h2 className="text-4xl font-semibold tracking-tight sm:text-5xl">Partidos.</h2>
        <p className="mt-3 text-muted">Los resultados del equipo.</p>
        {admin && (
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <button
              onClick={() => {
                setEditando({});
                setError('');
              }}
              className="rounded-full bg-action px-5 py-2.5 text-sm font-medium text-on-action"
            >
              Agregar partido
            </button>
          </div>
        )}
      </div>
      {editando && (
        <form
          key={editando.id || 'nuevo'}
          onSubmit={guardar}
          className="mx-auto mt-8 max-w-xl space-y-4 rounded-2xl bg-panel p-6"
        >
          <h3 className="text-lg font-semibold">
            {editando.id ? 'Editar partido' : 'Agregar partido'}
          </h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="text-sm">
              Fecha
              <input
                name="fecha"
                type="date"
                required
                defaultValue={editando.fecha}
                className="mt-1 w-full rounded-xl bg-input p-3"
              />
            </label>
            <label className="text-sm">
              Equipo rival
              <input
                name="rival"
                required
                maxLength="80"
                defaultValue={editando.rival}
                className="mt-1 w-full rounded-xl bg-input p-3"
              />
            </label>
            <label className="text-sm">
              Goles de Fourteam
              <input
                name="goles_fourtem"
                type="number"
                min="0"
                max="999"
                required
                defaultValue={editando.goles_fourtem ?? 0}
                className="mt-1 w-full rounded-xl bg-input p-3"
              />
            </label>
            <label className="text-sm">
              Goles del rival
              <input
                name="goles_rival"
                type="number"
                min="0"
                max="999"
                required
                defaultValue={editando.goles_rival ?? 0}
                className="mt-1 w-full rounded-xl bg-input p-3"
              />
            </label>
          </div>
          <label className="block text-sm">
            Notas <span className="text-muted">(opcional)</span>
            <textarea
              name="notas"
              maxLength="1000"
              rows="3"
              defaultValue={editando.notas || ''}
              className="mt-1 w-full rounded-xl bg-input p-3"
            />
          </label>
          <div className="flex gap-3">
            <button
              disabled={ocupado}
              className="rounded-full bg-action px-5 py-2 text-sm text-on-action disabled:opacity-50"
            >
              Guardar
            </button>
            <button type="button" onClick={() => setEditando(null)} className="px-4 py-2 text-sm">
              Cancelar
            </button>
          </div>
        </form>
      )}
      {error && (
        <p role="status" className="mt-5 text-center text-sm text-muted">
          {error}
        </p>
      )}
      <div className="mt-10 space-y-4">
        {partidos.length ? (
          partidos.map((p) => (
            <article key={p.id} className="rounded-2xl bg-panel px-5 py-6 text-center sm:px-8">
              <time className="text-sm text-muted">{p.fecha.split('-').reverse().join('/')}</time>
              <div className="mt-4 grid grid-cols-[1fr_auto_1fr] items-center gap-3">
                <strong className="min-w-0 break-words text-right text-base sm:text-xl">
                  Fourteam
                </strong>
                <span className="whitespace-nowrap text-2xl font-semibold tabular-nums sm:text-3xl">
                  {p.goles_fourtem} <span className="text-base font-normal text-muted">vs</span>{' '}
                  {p.goles_rival}
                </span>
                <strong className="min-w-0 break-words text-left text-base sm:text-xl">
                  {p.rival}
                </strong>
              </div>
              {p.notas && (
                <p className="mt-4 whitespace-pre-wrap text-sm leading-relaxed text-muted">
                  {p.notas}
                </p>
              )}
              {admin && (
                <div className="mt-5 flex justify-center gap-5 text-sm">
                  <button
                    disabled={ocupado}
                    onClick={() => {
                      setEditando(p);
                      setError('');
                    }}
                  >
                    Editar
                  </button>
                  <button disabled={ocupado} onClick={() => eliminar(p.id)} className="text-danger">
                    Eliminar
                  </button>
                </div>
              )}
            </article>
          ))
        ) : (
          <p className="text-center text-muted">Todavía no hay partidos cargados.</p>
        )}
      </div>
    </section>
  );
}

function EditorPost({ sesion, publicado }) {
  const [error, setError] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [archivo, setArchivo] = useState('');
  async function publicar(e) {
    e.preventDefault();
    const form = e.currentTarget;
    const datos = new FormData(form);
    if (!datos.get('descripcion').trim() && !datos.get('imagen').size) {
      setError('Escribí un texto o elegí una foto.');
      return;
    }
    if (!datos.get('imagen').size) datos.delete('imagen');
    setEnviando(true);
    setError('');
    try {
      const r = await fetch(`${API_URL}/api/posts`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${sesion.token}` },
        body: datos,
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.mensaje);
      form.reset();
      setArchivo('');
      await publicado();
    } catch (err) {
      setError(err.message || 'No se pudo publicar. Intentá de nuevo.');
    } finally {
      setEnviando(false);
    }
  }
  return (
    <form onSubmit={publicar} className="glass-surface rounded-2xl p-5 text-center sm:p-7">
      <label className="block text-sm font-semibold">
        Compartí algo, {sesion.usuario.nombre}
        <textarea
          name="descripcion"
          maxLength="2000"
          rows="3"
          placeholder="¿Qué querés contar?"
          className="access-input mt-4 resize-y font-normal"
        />
      </label>
      <div className="mt-4 flex items-center justify-between gap-4">
        <label
          className="relative flex size-11 shrink-0 cursor-pointer items-center justify-center rounded-full bg-panel/70 text-muted hover:bg-panel focus-within:ring-2 focus-within:ring-zinc-500"
          title="Agregar imagen"
        >
          <input
            aria-label="Agregar imagen"
            className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
            type="file"
            name="imagen"
            accept="image/jpeg,image/png,image/webp"
            onChange={(e) => setArchivo(e.target.files[0]?.name || '')}
          />
          <svg
            width="22"
            height="22"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <rect x="3" y="3" width="18" height="18" rx="4" />
            <circle cx="8.5" cy="8.5" r="1.5" />
            <path d="m21 16-5-5L5 21M3 16l4-4 4 4" />
          </svg>
        </label>
        <span className="min-w-0 truncate text-xs text-muted">{archivo}</span>
        <button
          disabled={enviando}
          className="rounded-full bg-action px-6 py-2.5 text-sm font-medium text-on-action disabled:opacity-50"
        >
          {enviando ? 'Publicando…' : 'Publicar'}
        </button>
      </div>
      {error && (
        <p role="alert" className="mt-4 text-sm text-danger">
          {error}
        </p>
      )}
    </form>
  );
}

function TarjetaPost({ post, sesion }) {
  const [abierto, setAbierto] = useState(false);
  const [comentarios, setComentarios] = useState([]);
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(false);
  const [enviando, setEnviando] = useState(false);
  async function cargar() {
    setCargando(true);
    setError('');
    try {
      const r = await fetch(`${API_URL}/api/posts/${post.id}/comentarios`, {
        headers: { Authorization: `Bearer ${sesion.token}` },
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.mensaje);
      setComentarios(d.comentarios);
    } catch (err) {
      setError(err.message || 'No se pudieron cargar los comentarios.');
    } finally {
      setCargando(false);
    }
  }
  async function comentar(e) {
    e.preventDefault();
    const form = e.currentTarget;
    const texto = new FormData(form).get('texto');
    if (!texto.trim()) return;
    setEnviando(true);
    setError('');
    try {
      const r = await fetch(`${API_URL}/api/posts/${post.id}/comentarios`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${sesion.token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ texto }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.mensaje);
      form.reset();
      await cargar();
    } catch (err) {
      setError(err.message || 'No se pudo enviar el comentario.');
    } finally {
      setEnviando(false);
    }
  }
  return (
    <article className="glass-surface overflow-hidden rounded-2xl text-center">
      <div className="px-5 pb-5 pt-6 sm:px-7">
        <a className="font-semibold hover:underline" href={`#/perfil/${post.usuario_id}`}>
          {post.nombre}
        </a>
        <time className="mt-1 block text-xs text-muted">
          {new Date(post.fecha_publicacion.replace(' ', 'T') + 'Z').toLocaleDateString('es-AR', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
          })}
        </time>
        {post.descripcion && (
          <p className="mt-5 whitespace-pre-wrap break-words leading-relaxed">{post.descripcion}</p>
        )}
      </div>
      {post.image_url && (
        <img
          className="max-h-[600px] w-full object-contain"
          src={`${API_URL}${post.image_url}`}
          alt={`Publicación de ${post.nombre}`}
          loading="lazy"
        />
      )}
      <div className="px-5 py-4 sm:px-7">
        <button
          aria-expanded={abierto}
          onClick={() => {
            if (!abierto) cargar();
            setAbierto(!abierto);
          }}
          className="inline-flex items-center gap-2 rounded-full px-3 py-2 text-sm text-muted hover:bg-panel/60"
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M5 4h14a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H9l-6 4V6a2 2 0 0 1 2-2Z" />
          </svg>
          Comentarios
        </button>
        {abierto && (
          <div className="mt-4 border-t border-ink/10 pt-4 text-left">
            {cargando ? (
              <p className="text-sm text-muted">Cargando comentarios…</p>
            ) : (
              <div className="space-y-4">
                {comentarios.length ? (
                  comentarios.map((c) => (
                    <div key={c.id}>
                      <a
                        className="text-sm font-semibold hover:underline"
                        href={`#/perfil/${c.usuario_id}`}
                      >
                        {c.nombre}
                      </a>
                      <p className="mt-1 whitespace-pre-wrap break-words text-sm leading-relaxed text-muted">
                        {c.texto}
                      </p>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted">Todavía no hay comentarios.</p>
                )}
              </div>
            )}
            <form onSubmit={comentar} className="mt-5">
              <label className="text-sm font-medium">
                Tu comentario
                <textarea
                  name="texto"
                  required
                  maxLength="1000"
                  rows="2"
                  className="access-input mt-2 resize-y font-normal"
                  placeholder="Escribí un comentario…"
                />
              </label>
              <button
                disabled={enviando}
                className="mt-3 rounded-full bg-action px-5 py-2 text-sm text-on-action disabled:opacity-50"
              >
                {enviando ? 'Enviando…' : 'Comentar'}
              </button>
            </form>
            {error && (
              <p role="alert" className="mt-3 text-sm text-danger">
                {error}
              </p>
            )}
          </div>
        )}
      </div>
    </article>
  );
}

function Publicaciones({ sesion }) {
  const [posts, setPosts] = useState([]);
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(true);
  async function cargar() {
    try {
      const r = await fetch(`${API_URL}/api/posts`, {
        headers: { Authorization: `Bearer ${sesion.token}` },
      });
      if (!r.ok) throw new Error();
      setPosts((await r.json()).posts);
      setError('');
    } catch {
      setError('No se pudieron cargar las publicaciones.');
    } finally {
      setCargando(false);
    }
  }
  useEffect(() => {
    cargar();
  }, []);
  return (
    <section id="publicaciones" className="mx-auto max-w-2xl px-5 py-20 text-center sm:py-28">
      <div className="mb-10">
        <h2 className="text-4xl font-semibold tracking-tight sm:text-5xl">
          Lo que pasa
          <br />
          en el equipo.
        </h2>
        <p className="mt-4 text-lg text-muted">Fotos, historias y todo lo que queremos recordar.</p>
      </div>
      <EditorPost sesion={sesion} publicado={cargar} />
      {error && (
        <p role="alert" className="mt-4 text-sm text-danger">
          {error}
        </p>
      )}
      <div className="mt-8 space-y-6">
        {cargando ? (
          <p>Cargando publicaciones…</p>
        ) : posts.length ? (
          posts.map((p) => <TarjetaPost key={p.id} post={p} sesion={sesion} />)
        ) : (
          <p className="text-muted">Todavía no hay publicaciones.</p>
        )}
      </div>
    </section>
  );
}

function CarruselAjustes({ sesion }) {
  const [imagenes, setImagenes] = useState(fotos);
  const [error, setError] = useState('');
  const [mensaje, setMensaje] = useState('');
  const [ocupado, setOcupado] = useState(false);
  useEffect(() => {
    leerCarrusel(sesion)
      .then(setImagenes)
      .catch((e) => setError(e.message));
  }, [sesion.token]);
  async function guardar(e, posicion) {
    e.preventDefault();
    const form = e.currentTarget;
    const datos = new FormData(form);
    if (!datos.get('imagen').size) {
      setError('Elegí una imagen para reemplazar la foto.');
      return;
    }
    setOcupado(true);
    setError('');
    setMensaje('');
    try {
      const r = await fetch(`${API_URL}/api/carrusel/${posicion}`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${sesion.token}` },
        body: datos,
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.mensaje);
      setImagenes(await leerCarrusel(sesion));
      form.reset();
      setMensaje(`Foto ${posicion} actualizada.`);
    } catch (err) {
      setError(err.message || 'No se pudo actualizar la imagen.');
    } finally {
      setOcupado(false);
    }
  }
  return (
    <div className="glass-surface mt-8 rounded-2xl p-6 sm:p-8">
      <h3 className="text-xl font-semibold">Fotos del carrusel</h3>
      <p className="mt-2 text-sm text-muted">Reemplazá las fotos que aparecen en el inicio.</p>
      <div className="mt-6 space-y-7">
        {imagenes.map((src, i) => (
          <form key={i} onSubmit={(e) => guardar(e, i + 1)} className="space-y-3">
            <img
              src={src}
              alt={`Foto ${i + 1} del carrusel`}
              className="aspect-[2/1] w-full rounded-xl object-cover"
            />
            <label className="block text-sm font-medium">
              Reemplazar foto {i + 1}
              <input
                name="imagen"
                type="file"
                accept="image/jpeg,image/png,image/webp"
                required
                className="mt-2 block w-full text-sm"
              />
            </label>
            <button
              disabled={ocupado}
              className="rounded-full bg-action px-5 py-2 text-sm text-on-action disabled:opacity-50"
            >
              Guardar foto {i + 1}
            </button>
          </form>
        ))}
      </div>
      {error && (
        <p role="alert" className="mt-4 text-sm text-danger">
          {error}
        </p>
      )}
      {mensaje && (
        <p role="status" className="mt-4 text-sm">
          {mensaje}
        </p>
      )}
    </div>
  );
}

function BotonTema({ tema, cambiarTema }) {
  return (
    <button
      type="button"
      onClick={() => cambiarTema(tema === 'dark' ? 'light' : 'dark')}
      aria-label={tema === 'dark' ? 'Activar modo claro' : 'Activar modo oscuro'}
      title={tema === 'dark' ? 'Modo claro' : 'Modo oscuro'}
      className="flex size-10 items-center justify-center rounded-full hover:bg-ink/5"
    >
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        aria-hidden="true"
      >
        {tema === 'dark' ? (
          <>
            <circle cx="12" cy="12" r="4" />
            <path d="M12 2v2m0 16v2M2 12h2m16 0h2M5 5l1.5 1.5m11 11L19 19M5 19l1.5-1.5m11-11L19 5" />
          </>
        ) : (
          <path d="M20.5 13.5A8.5 8.5 0 0 1 10.5 3.5a8.5 8.5 0 1 0 10 10Z" />
        )}
      </svg>
    </button>
  );
}

function Ajustes({ sesion, tema, cambiarTema }) {
  const [mensaje, setMensaje] = useState('');
  const [error, setError] = useState('');
  const [ocupado, setOcupado] = useState(false);
  async function guardar(e) {
    e.preventDefault();
    const form = e.currentTarget;
    const f = new FormData(form);
    setError('');
    setMensaje('');
    if (f.get('nueva') !== f.get('confirmacion')) {
      setError('Las contraseñas nuevas no coinciden.');
      return;
    }
    setOcupado(true);
    try {
      const r = await fetch(`${API_URL}/api/password`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${sesion.token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ actual: f.get('actual'), nueva: f.get('nueva') }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.mensaje);
      form.reset();
      setMensaje('Contraseña actualizada.');
    } catch (err) {
      setError(err.message || 'No se pudo cambiar la contraseña.');
    } finally {
      setOcupado(false);
    }
  }
  if (!sesion) return null;
  return (
    <section className="mx-auto max-w-lg px-5 py-16">
      <h2 className="mb-8 text-center text-4xl font-semibold tracking-tight">Ajustes</h2>
      <div className="glass-surface mb-8 rounded-2xl p-6 sm:p-8">
        <h3 className="text-xl font-semibold">Apariencia</h3>
        <label className="mt-4 block text-sm font-medium">
          Tema
          <select
            value={tema}
            onChange={(e) => cambiarTema(e.target.value)}
            className="access-input mt-2"
          >
            <option value="light">Claro</option>
            <option value="dark">Oscuro</option>
          </select>
        </label>
      </div>
      <form onSubmit={guardar} className="glass-surface space-y-5 rounded-2xl p-6 sm:p-8">
        <h3 className="text-xl font-semibold">Cambiar contraseña</h3>
        {[
          ['actual', 'Contraseña actual'],
          ['nueva', 'Contraseña nueva'],
          ['confirmacion', 'Repetir contraseña nueva'],
        ].map(([name, label]) => (
          <label key={name} className="block text-sm font-medium">
            {label}
            <input
              name={name}
              type="password"
              autoComplete={name === 'actual' ? 'current-password' : 'new-password'}
              minLength={name === 'actual' ? undefined : 8}
              maxLength="128"
              required
              className="access-input mt-2"
            />
          </label>
        ))}
        {error && (
          <p role="alert" className="text-sm text-danger">
            {error}
          </p>
        )}
        {mensaje && (
          <p role="status" className="text-sm text-muted">
            {mensaje}
          </p>
        )}
        <button
          disabled={ocupado}
          className="rounded-full bg-action px-6 py-3 text-sm text-on-action disabled:opacity-50"
        >
          {ocupado ? 'Guardando…' : 'Guardar contraseña'}
        </button>
      </form>
      {['admin', 'superadmin'].includes(sesion.usuario.roll) && <CarruselAjustes sesion={sesion} />}
    </section>
  );
}

function Avatar({ perfil, grande = false }) {
  return (
    <div
      className={`${grande ? 'size-28 text-3xl' : 'size-14 text-lg'} overflow-hidden rounded-full bg-input flex shrink-0 items-center justify-center font-semibold text-muted`}
    >
      {perfil.foto_url ? (
        <img src={`${API_URL}${perfil.foto_url}`} alt="" className="h-full w-full object-cover" />
      ) : (
        perfil.nombre?.charAt(0).toUpperCase()
      )}
    </div>
  );
}

function Miembros({ sesion }) {
  const [miembros, setMiembros] = useState([]);
  const [error, setError] = useState(false);
  useEffect(() => {
    fetch(`${API_URL}/api/equipo`, { headers: { Authorization: `Bearer ${sesion.token}` } })
      .then((r) => {
        if (!r.ok) throw new Error();
        return r.json();
      })
      .then((d) => setMiembros(d.equipo))
      .catch(() => setError(true));
  }, []);
  return (
    <section id="miembros" className="mx-auto max-w-6xl px-5 pt-24 sm:px-8">
      <div className="mb-8 text-center">
        <h2 className="text-4xl font-semibold tracking-tight sm:text-5xl">El equipo.</h2>
        <p className="mt-3 text-muted">Los integrantes de Fourteam.</p>
      </div>
      {error ? (
        <p className="text-center text-muted">No se pudieron cargar los integrantes.</p>
      ) : (
        <div className="flex flex-wrap justify-center gap-x-8 gap-y-7">
          {miembros.map((m) => (
            <a
              key={m.id}
              href={`#/perfil/${m.id}`}
              className="group flex w-24 flex-col items-center gap-2 text-center"
            >
              <Avatar perfil={m} />
              <span className="text-sm font-medium group-hover:underline">{m.nombre}</span>
              {m.apodo && <span className="-mt-1 text-xs text-muted">{m.apodo}</span>}
            </a>
          ))}
        </div>
      )}
    </section>
  );
}

function Perfil({ id, sesion }) {
  const [datos, setDatos] = useState(null);
  const [error, setError] = useState('');
  const [editando, setEditando] = useState(false);
  const [guardando, setGuardando] = useState(false);
  async function cargar() {
    try {
      const r = await fetch(`${API_URL}/api/perfiles/${id}`, {
        headers: { Authorization: `Bearer ${sesion.token}` },
      });
      if (!r.ok) throw new Error('No se encontró el perfil.');
      setDatos(await r.json());
      setError('');
    } catch (e) {
      setError(e.message || 'No se pudo cargar el perfil.');
    }
  }
  useEffect(() => {
    cargar();
  }, [id]);
  async function guardar(e) {
    e.preventDefault();
    setGuardando(true);
    setError('');
    const form = new FormData(e.currentTarget);
    if (!form.get('foto').size) form.delete('foto');
    try {
      const r = await fetch(`${API_URL}/api/perfil`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${sesion.token}` },
        body: form,
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.mensaje);
      setEditando(false);
      await cargar();
    } catch (e) {
      setError(e.message || 'No se pudo guardar el perfil.');
    } finally {
      setGuardando(false);
    }
  }
  if (!datos)
    return (
      <div className="mx-auto max-w-2xl px-5 py-24 text-center">{error || 'Cargando perfil…'}</div>
    );
  const { perfil, posts } = datos;
  return (
    <section className="mx-auto max-w-2xl px-5 py-14 sm:py-20">
      <div className="mt-10 flex flex-col items-center text-center">
        <Avatar perfil={perfil} grande />
        <h2 className="mt-5 text-4xl font-semibold tracking-tight">{perfil.nombre}</h2>
        {perfil.apodo && <p className="mt-2 text-lg text-muted">{perfil.apodo}</p>}
        {sesion?.usuario.id === perfil.id && !editando && (
          <button
            onClick={() => setEditando(true)}
            className="mt-5 rounded-full bg-action px-5 py-2 text-sm text-on-action"
          >
            Editar perfil
          </button>
        )}
      </div>
      {editando && (
        <form onSubmit={guardar} className="mx-auto mt-8 max-w-md rounded-2xl bg-panel p-6">
          <label htmlFor="apodo" className="block text-sm font-medium">
            Apodo
          </label>
          <input
            id="apodo"
            name="apodo"
            maxLength="40"
            defaultValue={perfil.apodo}
            className="mt-2 w-full rounded-xl bg-input px-4 py-3"
            placeholder="Opcional"
          />
          <label className="mt-5 block text-sm font-medium">
            Foto de perfil
            <input
              className="mt-2 block w-full text-sm"
              type="file"
              name="foto"
              accept="image/jpeg,image/png,image/webp"
            />
          </label>
          <div className="mt-6 flex gap-3">
            <button
              disabled={guardando}
              className="rounded-full bg-action px-5 py-2 text-sm text-on-action disabled:opacity-50"
            >
              {guardando ? 'Guardando…' : 'Guardar'}
            </button>
            <button type="button" onClick={() => setEditando(false)} className="px-4 py-2 text-sm">
              Cancelar
            </button>
          </div>
        </form>
      )}
      {error && (
        <p role="alert" className="mt-5 text-center text-sm text-danger">
          {error}
        </p>
      )}
      <h3 className="mb-8 mt-16 text-center text-2xl font-semibold">Publicaciones</h3>
      {sesion.usuario.id === perfil.id && <EditorPost sesion={sesion} publicado={cargar} />}
      <div className="mt-8 space-y-6">
        {posts.length ? (
          posts.map((post) => (
            <TarjetaPost key={post.id} post={{ ...post, nombre: perfil.nombre }} sesion={sesion} />
          ))
        ) : (
          <p className="text-center text-muted">Todavía no hay publicaciones.</p>
        )}
      </div>
    </section>
  );
}

function LoginModal({ abierto, iniciarSesion, tema, cambiarTema }) {
  const [error, setError] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [pendiente, setPendiente] = useState(null);

  function volverAlAcceso() {
    if (pendiente)
      fetch(`${API_URL}/api/logout`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${pendiente.token}` },
      }).catch(() => {});
    setPendiente(null);
    setError('');
  }

  useEffect(() => {
    if (!abierto) return;

    function handleKeyDown(evento) {
      if (evento.key === 'Escape' && pendiente) volverAlAcceso();
    }

    const scrollOriginal = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = scrollOriginal;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [abierto, pendiente]);

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

      if (!data.token || typeof data.requiere_cambio !== 'boolean') {
        setError('El servidor necesita actualizarse. Reiniciá npm run dev e intentá de nuevo.');
        return;
      }

      if (data.requiere_cambio) {
        setPendiente({ usuario: data.usuario, token: data.token });
        return;
      }
      iniciarSesion({ usuario: data.usuario, token: data.token });
    } catch {
      setError('El servidor está apagado (Error de conexión).');
    } finally {
      setEnviando(false);
    }
  }

  async function cambiarInicial(evento) {
    evento.preventDefault();
    setError('');
    const datos = new FormData(evento.currentTarget);
    if (datos.get('nueva') !== datos.get('confirmacion')) {
      setError('Las contraseñas nuevas no coinciden.');
      return;
    }
    setEnviando(true);
    try {
      const respuesta = await fetch(`${API_URL}/api/password`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${pendiente.token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ actual: datos.get('actual'), nueva: datos.get('nueva') }),
      });
      const data = await respuesta.json();
      if (!respuesta.ok) throw new Error(data.mensaje || 'No se pudo cambiar la contraseña.');
      iniciarSesion(pendiente);
    } catch (err) {
      setError(err.message || 'No se pudo conectar con el servidor.');
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="access-screen fixed inset-0 z-100 overflow-y-auto px-5 py-8 sm:px-8">
      <div className="absolute right-4 top-4">
        <BotonTema tema={tema} cambiarTema={cambiarTema} />
      </div>
      <div className="access-card relative my-auto w-full max-w-sm rounded-[28px] p-7 sm:p-9">
        <div className="mb-8 text-center">
          <div
            className="access-mark mx-auto mb-5 flex size-12 items-center justify-center rounded-2xl"
            aria-hidden="true"
          >
            <svg
              width="23"
              height="23"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="12" cy="8" r="3.5" />
              <path d="M5.5 20a6.5 6.5 0 0 1 13 0" />
            </svg>
          </div>
          <h2 className="text-3xl font-semibold tracking-tight text-ink">
            {pendiente ? 'Elegí tu contraseña' : 'Fourteam xd'}
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-muted">
            {pendiente
              ? `Hola, ${pendiente.usuario.nombre}. Cambiá tu contraseña para continuar.`
              : 'Iniciá sesión para entrar.'}
          </p>
        </div>

        {pendiente ? (
          <form onSubmit={cambiarInicial} className="space-y-5">
            <label className="block text-sm font-medium text-muted">
              Contraseña actual
              <input
                name="actual"
                type="password"
                autoComplete="current-password"
                required
                className="access-input mt-2"
              />
            </label>
            <label className="block text-sm font-medium text-muted">
              Contraseña nueva
              <input
                name="nueva"
                type="password"
                autoComplete="new-password"
                minLength="8"
                maxLength="128"
                required
                className="access-input mt-2"
              />
            </label>
            <label className="block text-sm font-medium text-muted">
              Repetir contraseña nueva
              <input
                name="confirmacion"
                type="password"
                autoComplete="new-password"
                minLength="8"
                maxLength="128"
                required
                className="access-input mt-2"
              />
            </label>
            {error && (
              <p role="alert" className="text-center text-sm text-danger">
                {error}
              </p>
            )}
            <div className="flex flex-wrap items-center justify-center gap-4">
              <button
                type="submit"
                disabled={enviando}
                className="rounded-full bg-action px-6 py-3 text-on-action disabled:opacity-50"
              >
                Guardar y entrar
              </button>
              <button
                type="button"
                onClick={volverAlAcceso}
                className="text-sm text-muted underline"
              >
                Volver
              </button>
            </div>
          </form>
        ) : (
          <form onSubmit={enviar} className="space-y-5">
            <div>
              <label htmlFor="nombre" className="block text-sm font-medium text-muted mb-1">
                Usuario
              </label>
              <input
                type="text"
                id="nombre"
                name="nombre"
                placeholder="Ej: Gero"
                required
                autoFocus
                className="access-input"
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-muted mb-1">
                Contraseña
              </label>
              <input
                type="password"
                id="password"
                name="password"
                placeholder="••••••"
                required
                className="access-input"
              />
            </div>
            {error && (
              <p role="alert" className="text-danger text-sm text-center">
                {error}
              </p>
            )}
            <div className="flex justify-center w-full">
              <button
                type="submit"
                disabled={enviando}
                className="w-full rounded-full bg-action px-6 py-3 font-medium text-on-action transition-colors hover:bg-action/80 disabled:opacity-60"
              >
                Ingresar
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

export default function App() {
  const [tema, setTema] = useState(document.documentElement.dataset.theme || 'light');
  function cambiarTema(nuevo) {
    setTema(nuevo);
    document.documentElement.dataset.theme = nuevo;
    try {
      localStorage.setItem('fourteam-tema', nuevo);
    } catch {}
  }
  const [menuAbierto, setMenuAbierto] = useState(false);
  const [sesion, setSesion] = useState(null);
  const usuario = sesion?.usuario.nombre;
  const [hash, setHash] = useState(window.location.hash);
  useEffect(() => {
    const actualizar = () => setHash(window.location.hash);
    window.addEventListener('hashchange', actualizar);
    return () => window.removeEventListener('hashchange', actualizar);
  }, []);
  const perfilId = hash.match(/^#\/perfil\/(\d+)$/)?.[1];
  useEffect(() => {
    if (!sesion) return;
    const frame = requestAnimationFrame(() => {
      const seccion = document.getElementById(hash.slice(1));
      if (seccion) seccion.scrollIntoView({ block: 'start' });
      else window.scrollTo(0, 0);
    });
    return () => cancelAnimationFrame(frame);
  }, [hash, sesion]);
  function cerrarSesion() {
    fetch(`${API_URL}/api/logout`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${sesion.token}` },
    }).catch(() => {});
    setSesion(null);
  }

  if (!sesion)
    return hash === '#ajustes' ? null : (
      <LoginModal abierto iniciarSesion={setSesion} tema={tema} cambiarTema={cambiarTema} />
    );

  return (
    <>
      <div className="w-full min-h-screen flex flex-col">
        <header className="sticky top-0 z-30 h-14 border-b border-ink/5 bg-panel/75 backdrop-blur-xl supports-backdrop-filter:bg-panel/65">
          <div className="flex h-full w-full items-center justify-between px-4 sm:px-7">
            <button
              type="button"
              onClick={() => setMenuAbierto((abierto) => !abierto)}
              aria-label={menuAbierto ? 'Cerrar menú' : 'Abrir menú'}
              aria-expanded={menuAbierto}
              className="flex size-9 items-center justify-center rounded-full hover:bg-ink/5 transition-colors focus:outline-none"
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.7"
                strokeLinecap="round"
                aria-hidden="true"
              >
                <path d="M4 8h16M4 16h16" />
              </svg>
            </button>
            <a href="/">
              <h1 className="text-base font-semibold tracking-tight text-ink hover:text-muted transition-colors">
                Fourteam xd
              </h1>
            </a>
            {usuario ? (
              <div className="flex items-center gap-1.5 sm:gap-2">
                <BotonTema tema={tema} cambiarTema={cambiarTema} />
                <a
                  href={`#/perfil/${sesion.usuario.id}`}
                  className="text-xs sm:text-sm font-medium text-ink bg-input py-1.5 px-3 rounded-full"
                >
                  {usuario}
                </a>
                <button
                  type="button"
                  onClick={cerrarSesion}
                  title="Cerrar sesión"
                  aria-label="Cerrar sesión"
                  className="flex size-9 items-center justify-center rounded-full border border-ink/10 bg-panel/60 hover:bg-input hover:text-danger transition-colors"
                >
                  <svg
                    width="19"
                    height="19"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.7"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <path d="M10 4H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h4M14 8l4 4-4 4M8 12h10" />
                  </svg>
                </button>
              </div>
            ) : null}
          </div>
        </header>

        <main className="grow min-h-[calc(100vh-3.5rem)]">
          {hash === '#ajustes' ? (
            <Ajustes sesion={sesion} tema={tema} cambiarTema={cambiarTema} />
          ) : perfilId ? (
            <Perfil key={perfilId} id={perfilId} sesion={sesion} />
          ) : (
            <>
              <Galeria sesion={sesion} />
              <Partidos sesion={sesion} />
              <Miembros sesion={sesion} />
              <Publicaciones sesion={sesion} />
            </>
          )}
        </main>

        <footer className="border-t border-ink/5 bg-panel/65 px-4 py-5 text-center text-muted">
          <p className="text-xs font-medium tracking-wide">Fourteam &copy; 2026</p>
        </footer>
      </div>

      {menuAbierto && (
        <>
          <div
            className="fixed inset-0 z-40 bg-zinc-950/15"
            onClick={() => setMenuAbierto(false)}
            aria-hidden="true"
          />
          <nav
            aria-label="Navegación"
            className="glass-menu fixed left-4 top-16 z-50 w-64 rounded-2xl p-3 sm:left-7"
          >
            {[
              ['Galería', '#galeria'],
              ['Partidos', '#partidos'],
              ['Miembros', '#miembros'],
              ['Publicaciones', '#publicaciones'],
              ['Ajustes', '#ajustes'],
            ].map(([texto, destino]) => (
              <a
                key={destino}
                href={destino}
                onClick={() => setMenuAbierto(false)}
                className="block rounded-xl px-4 py-3 font-medium text-ink hover:bg-ink/5"
              >
                {texto}
              </a>
            ))}
          </nav>
        </>
      )}
    </>
  );
}
