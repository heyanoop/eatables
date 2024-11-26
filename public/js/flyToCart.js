// flyToCart.js

function flyToCart(flyer, flyTo) {
  let flyerClone = flyer.cloneNode(true);
  flyerClone.style.position = 'absolute';
  flyerClone.style.width = `${flyer.offsetWidth}px`;  // Match original width
  flyerClone.style.height = `${flyer.offsetHeight}px`;  // Match original height
  flyerClone.style.borderRadius = '20%';  // Round shape

  const ft = flyTo.getBoundingClientRect();
  const f = flyer.getBoundingClientRect();

  const currentX = f.left + window.scrollX;
  const currentY = f.top + window.scrollY;

  flyerClone.style.left = `${currentX}px`;
  flyerClone.style.top = `${currentY}px`;

  flyerClone.style.opacity = 1;
  flyerClone.style.zIndex = 9999;
  flyerClone.style.transform = 'scale(0.5)'; // Adjust scale to make it smaller
  flyerClone.style.transition = 'transform 0.5s ease'; // Smooth scaling

  document.body.appendChild(flyerClone);

  const targetX = ft.left + window.scrollX;
  const targetY = ft.top + window.scrollY;

  const targetWidth = ft.width;
  const targetHeight = ft.height;

  const animationDuration = 1000;

  let startTime = null;

  function animateElement(timestamp) {
      if (!startTime) startTime = timestamp;

      const progress = timestamp - startTime;
      const ratio = Math.min(progress / animationDuration, 1);

      const deltaX = currentX - (currentX - targetX) * ratio;
      const deltaY = currentY - (currentY - targetY) * ratio;

      flyerClone.style.left = `${deltaX}px`;
      flyerClone.style.top = `${deltaY}px`;

      flyerClone.style.opacity = 1 - ratio; // Fade out during animation

      if (ratio < 1) {
          requestAnimationFrame(animateElement);
      } else {
          setTimeout(function () {
              flyerClone.remove();
          }, 250);
      }
  }

  requestAnimationFrame(animateElement);
}
