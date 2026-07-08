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