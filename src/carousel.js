const carousel = document.querySelector(".more_services__container__row--2__carousel");
const slides = Array.from(carousel.querySelectorAll(".more_services__container__row--2__carousel__item__container"));
const leftButton = document.querySelector(".more_services__container__row--1__carousel__buttons__button--left");
const rightButton = document.querySelector(".more_services__container__row--1__carousel__buttons__button--right");

const getOrder = elem => {
  const styles = getComputedStyle(elem);
  const orderValue = styles.order;
  const order = parseInt(orderValue);
  return order;
}

const moveRight = _ => {
  slides.forEach(function(slide) {
    order = getOrder(slide);
    if (order < slides.length) {
      slide.style.order = order += 1;
    } else {
      slide.style.order = 1;
    }
  });
}

const moveLeft = _ => {
  slides.forEach(function(slide) {
    order = getOrder(slide)
    
    if (order > 1) {
      slide.style.order = order -= 1;
    } else {
      slide.style.order = 5;
    }
    
  });
}

rightButton.addEventListener('click', _ => {
  moveRight();
});

leftButton.addEventListener('click', _ => {
  moveLeft();
});
