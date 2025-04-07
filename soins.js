document.addEventListener("DOMContentLoaded", function () {
    document.querySelectorAll(".btn-reserver").forEach(button => {
        button.addEventListener("click", function () {
            let soin = this.dataset.soin; 
            let duree = this.dataset.duree; 

            // Redirige vers la page de réservation principale
            window.location.href = `choix-du-lieu.html?soin=${encodeURIComponent(soin)}&duree=${encodeURIComponent(duree)}`;
        });
    });
});
