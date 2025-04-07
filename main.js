document.addEventListener("DOMContentLoaded", function () {
    // 🔁 Récupération et stockage des données de l'URL au chargement
    const params = new URLSearchParams(window.location.search);
    const soin = params.get("soin");
    const duree = params.get("duree");

    if (soin && duree) {
        // Stockage temporaire dans le localStorage
        localStorage.setItem("reservationTemp", JSON.stringify({ soin, duree }));

        // Nettoyage visuel de l'URL pour l'utilisateur
        window.history.replaceState(null, "", window.location.pathname);
    } else {
        console.warn("Aucune donnée à récupérer dans l'URL.");
    }

    // 🔘 Sélection des boutons
    var parisBtn = document.getElementById("location-btn-Paris");
    var bandolBtn = document.getElementById("location-btn-Bandol");

    // 👉 Fonction de redirection avec récupération des données stockées
    function redirectToLocation(location) {
        const data = JSON.parse(localStorage.getItem("reservationTemp"));

        if (!data || !data.soin || !data.duree) {
            alert("Les informations du soin ne sont pas disponibles !");
            return;
        }

        const queryString = new URLSearchParams(data).toString();
        const url = `Reservation-${location}.html?${queryString}`;

        window.location.href = url;
    }

    // 🚀 Événements sur les boutons
    parisBtn.addEventListener("click", function () {
        redirectToLocation("Paris");
    });

    bandolBtn.addEventListener("click", function () {
        redirectToLocation("Bandol");
    });
});
