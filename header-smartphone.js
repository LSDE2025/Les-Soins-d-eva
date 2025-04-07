document.addEventListener("DOMContentLoaded", function () {
    var menuToggle = document.getElementById("menu-toggle");
    var sidebar = document.getElementById("sidebar");
    var closeBtn = document.getElementById("close-btn");

    // Gérer le clic sur la flèche pour le menu déroulant
    var dropdowns = document.querySelectorAll(".dropdownsmart"); // Tous les dropdowns
    var arrows = document.querySelectorAll(".arrowsmart"); // Toutes les flèches
    var submenus = document.querySelectorAll(".submenusmart"); // Tous les sous-menus

    // Ouvrir le menu burger (pour les écrans mobiles)
    menuToggle.addEventListener("click", function () {
        sidebar.classList.add("active");
    });

    // Fermer le menu burger (si on clique sur la croix ou en dehors)
    function closeMenu() {
        sidebar.classList.remove("active");
        // Ferme tous les sous-menus
        dropdowns.forEach(dropdown => dropdown.classList.remove("active"));
        arrows.forEach(arrow => arrow.classList.remove("rotate"));
    }

    closeBtn.addEventListener("click", closeMenu);

    // Gérer le clic sur la flèche des sous-menus
    arrows.forEach((arrow, index) => {
        arrow.addEventListener("click", function (event) {
            event.stopPropagation(); // Empêche la propagation pour ne pas affecter le lien

            var dropdown = dropdowns[index];
            var submenu = submenus[index];

            if (dropdown.classList.contains("active")) {
                submenu.style.maxHeight = "0px"; // Effet de fermeture
                setTimeout(() => {
                    dropdown.classList.remove("active");
                }, 500); // Temps aligné sur l'animation CSS
            } else {
                dropdown.classList.add("active");
                submenu.style.maxHeight = submenu.scrollHeight + "px"; // Déroulement fluide
            }

            arrow.classList.toggle("rotate");
        });
    });

    // Fermer le menu si clic en dehors
    document.addEventListener("click", function (event) {
        if (!sidebar.contains(event.target) && !menuToggle.contains(event.target)) {
            closeMenu();
        }
    });
});
