function toggleMenu() {
    var dropdown = document.querySelector('.dropdown');
    var submenu = dropdown.querySelector('.submenu');
    var currentHeight = submenu.scrollHeight; // Hauteur totale du contenu

    // Si le menu est déjà ouvert, on le ferme
    if (dropdown.classList.contains('active')) {
        submenu.style.height = '0';
    } else {
        // Si le menu est fermé, on l'ouvre
        submenu.style.height = currentHeight + 'px';
    }

    dropdown.classList.toggle('active');
}

// Ferme le menu si on clique ailleurs
document.addEventListener('click', function(event) {
    var dropdown = document.querySelector('.dropdown');
    var isClickInside = dropdown.contains(event.target);

    if (!isClickInside) {
        var submenu = dropdown.querySelector('.submenu');
        submenu.style.height = '0';  // Ferme le menu avec animation
        dropdown.classList.remove('active');
    }
});