# Plan de trabajo de Fourteam

Documento vivo para acordar y completar mejoras por etapas. Las casillas se marcan únicamente después de implementar y verificar cada tarea.

## Meta actual: subir fotos de celulares sin prepararlas fuera de la página

Permitir seleccionar fotos grandes desde publicaciones, perfil y carrusel, prepararlas dentro de Fourteam y subir una versión adecuada para la web. El editor de publicaciones debe seguir siendo el mismo en inicio y perfil.

**Estado:** planificación. Todavía no se implementó el compresor ni se eligió una dependencia.

### Punto de partida

- React y Vite en `front/`; Express y SQLite en `back/`.
- Multer recibe una imagen por solicitud, con un límite de `5 * 1024 * 1024` bytes: 5 MiB, mostrado actualmente como 5 MB.
- Se aceptan JPEG, PNG y WebP. Las imágenes se guardan en `back/uploads/`.
- Hay tres flujos de subida: publicaciones, foto de perfil y reemplazo de fotos del carrusel.
- La validación actual del servidor comprueba firmas de archivo; aún no decodifica toda la imagen ni limita sus dimensiones.

### Qué significa conservar la calidad

La compresión **sin pérdida** conserva los píxeles, pero no garantiza que una foto ya comprimida termine debajo de 5 MiB. Redimensionar o recodificar JPEG/WebP con pérdida modifica información, aunque la diferencia puede ser poco apreciable en una pantalla.

La propuesta es buscar **buena calidad visual para la web**, con comparación antes/después y límites explícitos. No prometer un porcentaje fijo de ahorro ni resultados idénticos para todas las imágenes. El original del dispositivo no se modifica; si se sube únicamente la versión optimizada, Fourteam no conserva una copia original para descargar después.

## Opciones

| Alternativa | Ventajas | Trabajo y límites |
| --- | --- | --- |
| A. APIs del navegador: Canvas y `toBlob()` | Sin dependencia de compresión ni solicitudes externas. Control del tamaño y del formato. | Implementar orientación, intentos de calidad, límites, cancelación y compatibilidad. Comprobar el MIME real del resultado: un formato no admitido puede producir PNG. |
| B. `browser-image-compression` | Ya ofrece objetivos de tamaño y dimensiones, progreso, cancelación y uso de worker cuando el navegador lo permite. | Agrega una dependencia. Verificar salida, calidad y consumo de memoria. Servir el código del worker desde nuestra aplicación, sin depender del CDN predeterminado. |
| C. Sharp en nuestro backend | Procesamiento y validación centralizados, con control sobre formatos y dimensiones. Sin enviar imágenes a terceros. | Primero hay que subir el archivo grande. Requiere revisar el límite de entrada, memoria y CPU; un hosting gratuito puede ser insuficiente. HEIC depende de los códecs disponibles en la instalación. |

**Recomendación inicial:** evaluar B para la primera versión, manteniendo la validación del backend. Compararla con A mediante una prueba pequeña antes de instalarla definitivamente. Dejar C como una decisión posterior si hace falta validar mediante decodificación o resolver formatos que el cliente no pueda procesar. Si se elige C, no ampliar el límite de entrada sin controles de recursos.

Procesar una foto localmente no requiere enviarla a una web compresora. Usar una biblioteca instalada en el proyecto tampoco implica subirle las fotos a su autor.

## Tareas en orden

### 1. Acordar alcance y reunir muestras

- [ ] Elegir A, B o C y registrar la decisión abajo.
- [ ] Reunir fotos autorizadas de Android e iPhone: JPEG, PNG, WebP, HEIC/HEIF, retratos, paisajes y capturas con texto.
- [ ] Incluir archivos de más de 5 MiB y fotos de 12, 24 y 48 megapíxeles para medir los límites reales.
- [ ] Definir tamaño y cantidad máxima de píxeles de entrada según las pruebas de memoria en celulares.
- [ ] Resolver HEIC/HEIF: investigar decodificación local y compatibilidad, o declarar que la primera versión requiere JPEG/WebP/PNG y mostrar cómo recuperarse. No anunciar soporte general para fotos de iPhone antes de probarlo.
- [ ] Acordar si se necesitan originales descargables; esta propuesta guarda solo la imagen preparada para la web.

**Salida:** decisión técnica y conjunto de muestras con permisos de uso. No subir fotos personales al repositorio sin autorización.

### 2. Probar tamaño frente a calidad

- [ ] Comparar A y B sobre las mismas muestras y registrar bytes, dimensiones, tiempo y dispositivo.
- [ ] Evaluar WebP con alternativa JPEG cuando el navegador no pueda codificar WebP; conservar transparencia cuando corresponda.
- [ ] Comparar rostros, letras, bordes y escenas oscuras antes/después en móvil y escritorio.
- [ ] Probar como punto de partida: lado mayor de 2560 px para posteos, 3200 px para carrusel y 512 px para avatar. Son candidatos, no límites aprobados.
- [ ] Definir una calidad mínima aceptable por formato y una cantidad acotada de intentos. Si no alcanza, reducir dimensiones según la política elegida o mostrar un error; evitar degradar indefinidamente.
- [ ] Mantener archivos pequeños que ya cumplan la política cuando recodificarlos no aporte ahorro. Nunca subir un resultado más pesado solo por haberlo procesado.

**Salida:** política de tamaños y calidad aprobada con evidencia. El resultado enviado debe quedar por debajo del límite del servidor.

### 3. Crear una preparación de imágenes compartida

- [ ] Implementar una función común de preparación que reciba archivo y destino: post, avatar o carrusel.
- [ ] Comprobar formato, tamaño y dimensiones; conservar proporciones y orientación visible.
- [ ] Aplicar la política acordada, usando un worker cuando sea viable y una alternativa compatible cuando no lo sea.
- [ ] Retirar metadatos innecesarios, incluida ubicación GPS; comprobar orientación y color después del procesamiento.
- [ ] Devolver archivo, MIME y extensión coherentes con la salida real.
- [ ] Liberar URLs de previsualización y memoria de imágenes/canvas al terminar, cancelar o reemplazar la selección.

### 4. Integrar la experiencia de subida

- [ ] Incorporar la función a `EditorPost`, a la foto de perfil y a `CarruselAjustes`.
- [ ] Mostrar previsualización y estado «Preparando imagen…» sin romper los temas claro/oscuro ni el estilo glassmorfismo.
- [ ] Deshabilitar el envío durante la preparación y evitar que una selección anterior sobrescriba una más reciente.
- [ ] Permitir reemplazar o cancelar la imagen, conservando el texto escrito.
- [ ] Mostrar errores concretos para archivo corrupto, formato incompatible, exceso de dimensiones o falta de memoria.
- [ ] No subir nada hasta que la persona pulse Publicar/Guardar.
- [ ] Comprobar que no se envíen fotos ni se descargue código de compresión desde servicios externos.

### 5. Mantener controles en el servidor

- [ ] Mantener autenticación y permisos actuales en todos los destinos.
- [ ] Mantener el límite de 5 MiB para la versión enviada en la opción de compresión local.
- [ ] Revisar validación de MIME, firma, dimensiones y decodificación; no confiar en datos declarados por el navegador.
- [ ] Si la decodificación requiere una dependencia, elegirla según el hosting y sus límites de memoria.
- [ ] Rechazar solicitudes manipuladas, imágenes inválidas y archivos que superen los límites, aunque no pasen por la interfaz.
- [ ] Limpiar archivos incompletos cuando falle una operación.

### 6. Verificar el recorrido completo

- [ ] Probar fotos grandes en Chrome/Android, Safari/iPhone y navegadores de escritorio disponibles; registrar qué dispositivos se usaron realmente.
- [ ] Probar fotos rotadas, transparencia, HEIC según el alcance aprobado, imágenes corruptas y formatos no admitidos.
- [ ] Probar cancelación, selección repetida, red lenta, error de subida y sesión vencida.
- [ ] Verificar que se pueda publicar solo texto y que la compresión no altere comentarios ni perfiles.
- [ ] Probar que un usuario común no pueda modificar el carrusel.
- [ ] Comparar visualmente las muestras y registrar casos donde no se logre el tamaño objetivo con calidad aceptable.
- [ ] Ejecutar `npm --prefix back test` y `npm --prefix front run build`.

**Criterio de cierre:** una foto admitida de más de 5 MiB se prepara y guarda correctamente en los tres destinos; no se modifica el original; no hay envío a terceros; los formatos o tamaños fuera de alcance tienen una respuesta clara; no se eluden permisos ni validaciones del backend.

### 7. Documentar y cerrar

- [ ] Actualizar el README con formatos, límites, comportamiento y restricciones verificadas.
- [ ] Registrar la dependencia elegida, si corresponde, y cómo se sirve localmente.
- [ ] Documentar resultados y dispositivos pendientes de verificar.
- [ ] Revisar el diff y cerrar las tareas efectivamente completadas.

## Registro de decisiones

| Tema | Estado |
| --- | --- |
| Motor de compresión | Pendiente; B es la propuesta inicial. |
| Tamaño y píxeles máximos de entrada | Pendiente de mediciones. |
| Calidad, dimensiones y tamaño objetivo por destino | Pendiente de comparación visual. |
| HEIC/HEIF | Pendiente de prueba y decisión de alcance. |
| Almacenamiento de originales | Pendiente; se propone no guardarlos en la primera versión. |
| Hosting de producción | Pendiente; no se selecciona en esta tarea. |

## Próximas metas

Agregar aquí las nuevas solicitudes antes de implementarlas, con objetivo, tareas y criterio de cierre. La elección de hosting y la migración del almacenamiento se planificarán por separado cuando se elija una plataforma.

## Referencias técnicas

- [Canvas: `toBlob()` — MDN](https://developer.mozilla.org/en-US/docs/Web/API/HTMLCanvasElement/toBlob).
- [Repositorio de `browser-image-compression`](https://github.com/Donaldcwl/browser-image-compression).
- [Formatos y opciones de salida de Sharp](https://sharp.pixelplumbing.com/api-output/).
