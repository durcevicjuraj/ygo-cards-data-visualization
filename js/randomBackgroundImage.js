(function() {
  const images = [
    'ygo-background.jpg',
    'ygo-background-bakura.jpg',
    'ygo-background-jaden.jpg',
    'ygo-background-joey.jpg',
    'ygo-background-kaiba.jpg',
    'ygo-background-marik.jpg',
    'ygo-background-tea.jpg',
    'ygo-background-yusei.jpg'
  ];

  const chosen = images[Math.floor(Math.random() * images.length)];
  const pathPrefix = window.location.pathname.includes('/pages/') ? '../' : '';
  document.body.style.backgroundImage = "url('" + pathPrefix + "images/" + chosen + "')";
})();
