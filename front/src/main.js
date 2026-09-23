//? Pagina principal
const menuBtn = document.getElementById('menu-btn');
const sidebar = document.getElementById('sidebar');
const mainContent = document.getElementById('main-content');

menuBtn.addEventListener('click', () => {
  sidebar.classList.toggle('-translate-x-full');
  mainContent.classList.toggle('translate-x-64');
});

const swiper = new Swiper('.mySwiper', {
  slidesPerView: "auto",
  spaceBetween: 20,
  
  pagination: {
    el: '.swiper-pagination',
    type: 'progressbar',
  },
  navigation: {
    nextEl: '.swiper-button-next',
    prevEl: '.swiper-button-prev'
  }
});

//? modal del login
const btnOpenLogin = document.getElementById("btn-open-login");
const btnCloseLogin = document.getElementById("btn-close-login");
const loginModal = document.getElementById("login-modal");

//? abrir el modal
btnOpenLogin.addEventListener("click", () => {
  loginModal.classList.remove("hidden")
});
//? Cerrar modal
btnCloseLogin.addEventListener("click", () => {
  loginModal.classList.remove("hidden")
});

//? Cerrar si se toca fuera del modal
loginModal.addEventListener("click", (e) => {
  if (e.target === loginModal) {
    loginModal.classList.add("hidden")
  }
});

//! Conexion con la db 
const formLogin = document.getElementById("form-login");
const mensajeError = document.getElementById("mensaje-error");

formLogin.addEventListener("submit", async (e) => {
  e.preventDefault();

  const nombre = document.getElementById("nombre").value.trim();
  const password = document.getElementById("password").value.trim();

  try {
    const respuesta = await fetch("http://localhost:3000/api/login", {
      method: "POST",
      headers: { "Content-Type" : "application/json"},
      body: JSON.stringify({ nombre, password })
    });

    const data = await respuesta.json()

    if (data.exito) {
      mensajeError.classList.add("hidden");
      loginModal.classList.add("hidden");
      alert(`Sos Boludo, ${data.usuario.nombre}?`)

      //? aqui podes cambiar el boton de login por la foto de perfil
      btnOpenLogin.innerHTML = `<span class="font-bold text-green-500">${data.usuario.nombre}></span>`
  } else {
    mensajeError.textContent = data.mensaje
    mensajeError.classList.remove = ("hidden")
  }
  }catch(error) {
    mensajeError.textContent = "El servidor está apagado (Error de conexión).";
    mensajeError.classList.remove("hidden");
  }
});

