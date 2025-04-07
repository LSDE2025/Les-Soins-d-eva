document.addEventListener("DOMContentLoaded", function () {

    var cadeauxBtn = document.getElementById("cadeaux-btn");
    var popup = document.getElementById("cadeaux-popup");
    var closePopupBtn = document.getElementById("close-popup-btn");
    var popupContent = document.querySelector(".popup-content"); 

    // Fonction pour ouvrir la popup
    function openPopup() {
        popup.style.display = "flex";  
        setTimeout(function () {
            popup.style.opacity = "1"; 
        }, 10); 
    }

    // Fonction pour fermer la popup
    function closePopup() {
        popup.style.opacity = "0";  
        setTimeout(function () {
            popup.style.display = "none"; 
        }, 300); 
    }

    // Ouvrir la popup quand le bouton est cliqué
    cadeauxBtn.addEventListener("click", openPopup);

    // Fermer la popup quand le bouton "Fermer" est cliqué
    closePopupBtn.addEventListener("click", closePopup);

    // Ajouter l'événement pour fermer la popup si on clique en dehors du contenu
    popup.addEventListener("click", function(event) {
        // Si le clic est en dehors du contenu de la popup, on ferme la popup
        if (!popupContent.contains(event.target)) {
            closePopup();
        }
    });
});
