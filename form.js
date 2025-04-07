document.addEventListener("DOMContentLoaded", function () {
    var reservationDetails = JSON.parse(localStorage.getItem("reservationDetails"));
    emailjs.init("oznZ1x3Y4vlQI0ASz"); 

    setTimeout(function () {
        window.history.replaceState(null, "", window.location.pathname);
    }, 100);

    if (reservationDetails) {
        var soinsSupplementaires = reservationDetails.soinsSupplementaires || [];
        localStorage.setItem("soinsSupplementaires", JSON.stringify(soinsSupplementaires));

        var dateCreneauElement = document.getElementById("date-value");

        if (reservationDetails.date && reservationDetails.creneau && dateCreneauElement) {
            // Convertir la date de "DD-MM-YYYY" vers "Jour Mois Année"
            var [day, month, year] = reservationDetails.date.split("-");
            var monthNames = [
                "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
                "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"
            ];
        
            var formattedDate = `${parseInt(day)} ${monthNames[parseInt(month) - 1].toUpperCase()} ${year}`;
        
            dateCreneauElement.textContent = `${formattedDate} à ${reservationDetails.creneau}`;
            console.log("Date et créneau affichés :", formattedDate, reservationDetails.creneau);
        } else {
            console.log("Les détails de réservation sont manquants ou incorrects.");
        }
        

        var urlParams = new URLSearchParams(window.location.search);
        var locationValue = urlParams.get("location");
        var locationElement = document.getElementById("location-value");
        if (locationElement && locationValue) {
            locationElement.textContent = decodeURIComponent(locationValue);
        }

        var soinContainer = document.getElementById("soins-supp-container");
        var soinValueElement = document.getElementById("soin-value");
        let soinsAffiches = [];

        // 📌 Gestion du soin principal
        if (reservationDetails.soin) {
            soinsAffiches.push(reservationDetails.soin);
        }

        // 📌 Gestion des soins supplémentaires
        if (reservationDetails.soinsSupplementaires && Array.isArray(reservationDetails.soinsSupplementaires)) {
            for (var i = 0; i < reservationDetails.soinsSupplementaires.length; i++) {
                var supp = reservationDetails.soinsSupplementaires[i];
                soinsAffiches.push(supp.soinNom);
            }
        }

        // 📌 Affichage des soins
        if (soinsAffiches.length > 0) {
            soinValueElement.innerHTML = soinsAffiches.map(soin => `<p class="styled-text">${soin}</p>`).join('');
        }

        // 📌 Affichage du container des soins supplémentaires
        if (reservationDetails.soinsSupplementaires && reservationDetails.soinsSupplementaires.length > 0) {
            soinContainer.classList.remove("hidden");
        } else {
            soinContainer.classList.add("hidden");
        }

        // 📌 Gestion des prix
        var prixContainer = document.getElementById("prix-supp-container");
        var prixValueElement = document.getElementById("prix-detail-value");
        var totalPrixContainer = document.getElementById("total-prix-container");
        var totalPrixElement = document.getElementById("total-prix-value");
        let prixTotal = 0;
        let prixAffiches = [];

        if (reservationDetails.prix !== null && reservationDetails.prix !== undefined) {
            let prixSoin = parseFloat(reservationDetails.prix);
            if (!isNaN(prixSoin)) {
                prixAffiches.push(`${prixSoin}€`);
                prixTotal += prixSoin;
            }
        }

        if (reservationDetails.soinsSupplementaires && Array.isArray(reservationDetails.soinsSupplementaires)) {
            for (var i = 0; i < reservationDetails.soinsSupplementaires.length; i++) {
                var supp = reservationDetails.soinsSupplementaires[i];
                let prixSupp = parseFloat(supp.soinPrix);
                if (!isNaN(prixSupp)) {
                    prixAffiches.push(`${prixSupp}€`);
                    prixTotal += prixSupp;
                }
            }
        }

        totalPrixElement.textContent = `${prixTotal.toFixed(2)}€`;

        // 📌 Affichage des prix
        if (prixAffiches.length > 0) {
            prixValueElement.innerHTML = prixAffiches.map(prix => `<p class="styled-text">${prix}</p>`).join('');
            prixContainer.classList.remove("hidden");
        } else {
            prixContainer.classList.add("hidden");
        }

        if (prixAffiches.length > 1) {
            totalPrixElement.textContent = `${prixTotal}€`;
            totalPrixContainer.classList.remove("hidden");
        } else {
            totalPrixContainer.classList.add("hidden");
        }

        // 📌 Activation du bouton de confirmation
        var confirmButton = document.getElementById("confirm-button");
        var nom = document.getElementById("nom");
        var prenom = document.getElementById("prenom");
        var email = document.getElementById("email");
        var phone = document.getElementById("phone");

        function checkFormCompletion() {
            confirmButton.disabled = !(nom.value.trim() && prenom.value.trim() && email.value.trim() && phone.value.trim());
        }

        nom.addEventListener("input", checkFormCompletion);
        prenom.addEventListener("input", checkFormCompletion);
        email.addEventListener("input", checkFormCompletion);
        phone.addEventListener("input", checkFormCompletion);

        confirmButton.addEventListener("click", function () {
        var soinsSupplementaires = JSON.parse(localStorage.getItem("soinsSupplementaires")) || [];

    // Récupération des données du formulaire
    var reservationData = {
        nom: nom.value.trim(),
        prenom: prenom.value.trim(),
        email: email.value.trim(),
        phone: phone.value.trim(),
        soin: reservationDetails.soin || "",
        prix: reservationDetails.prix ? `${reservationDetails.prix}€` : "",
        totalPrix: `${prixTotal.toFixed(2)}€`,
        location: document.getElementById("location-value").textContent,
        date: reservationDetails.date,
        creneau: reservationDetails.creneau,
        infoComplementaires: document.getElementById("infoComplementaires").value,
        soinsSupplementaires: soinsSupplementaires // Déjà stocké sous le bon format
    };

    function sauvegarderReservationDansLocalStorage(reservationData) {
        let reservations = JSON.parse(localStorage.getItem("reservations")) || [];
    
        reservations.push(reservationData);
    
        localStorage.setItem("reservations", JSON.stringify(reservations));
    }

    function getSoinDuration(soin) {
        var durations = {
            "Le Miracle Face": 60,
            "Le Miracle Face - La Cure": 60,
            "Face Lift": 30,
            "Le Soin Better Aging": 60,
            "Le Soin Better Aging - Expert": 90,
            "Drainage Lymphatique": 60,
            "Drainage Lymphatique - La Cure": 60,
            "Massage Relaxant": 60,
            "Massage Relaxant - Complet": 90,
            "Yoga Facial": 60,
            "Auto Massage": 60
        };
        return durations[soin] || 0;
    }
    
    function blockNonReservableSlots(soin, selectedTime, date) {

        var allTimeSlots = [
            "9:00", "9:15", "9:30", "9:45",
            "10:00", "10:15", "10:30", "10:45",
            "11:00", "11:15", "11:30", "11:45",
            "12:00", "12:15", "12:30", "12:45",
            "13:00", "13:15", "13:30", "13:45",
            "14:00", "14:15", "14:30", "14:45",
            "15:00", "15:15", "15:30", "15:45",
            "16:00", "16:15", "16:30", "16:45",
            "17:00", "17:15", "17:30", "17:45",
            "18:00", "18:15", "18:30", "18:45",
            "19:00"
        ];
    
        var duration = getSoinDuration(soin);
        let slotsToAdd = 0;
    
        // Détermine combien de créneaux ajouter en fonction de la durée du soin
        if (duration === 60) slotsToAdd = 3;  // 1h = 3 créneaux supplémentaires
        else if (duration === 90) slotsToAdd = 5; // 1h30 = 5 créneaux supplémentaires
    
        var startIndex = allTimeSlots.indexOf(selectedTime);
        if (startIndex === -1) {
            console.warn("Créneau de départ introuvable dans allTimeSlots :", selectedTime);
            return;
        }
    
        // Récupère les créneaux à bloquer
        var slotsToBlock = allTimeSlots.slice(startIndex + 1, startIndex + slotsToAdd + 1);
    
        // Récupère les créneaux non réservables depuis le localStorage
        let nonReservable = JSON.parse(localStorage.getItem("non-reservable")) || [];
    
        // Ajoute les créneaux à bloquer dans le tableau des créneaux non réservables
        slotsToBlock.forEach(time => {
            var entry = {
                date: date,
                location: document.getElementById("location-value").textContent, 
                time: time,
                text: "créneau non réservable"
            };
            nonReservable.push(entry);
        });
    
        // Sauvegarde les créneaux non réservables dans le localStorage
        localStorage.setItem("non-reservable", JSON.stringify(nonReservable));
    }    

    sauvegarderReservationDansLocalStorage(reservationData);

   // Remplacer soin et prix par le premier soinSupp si soin principal est vide
    if (!reservationData.soin && soinsSupplementaires.length > 0) {
    // Remplace soin principal par le 1er soin supp
        reservationData.soin = soinsSupplementaires[0].soinNom || "Prestation non spécifiée";
        // Remplace prix principal par le 1er soinPrix
        reservationData.prix = soinsSupplementaires[0].soinPrix ? `${soinsSupplementaires[0].soinPrix}` : "Prix non spécifié";
        // Supprime le premier soin supplémentaire de la liste après remplacement
        soinsSupplementaires.shift();
    }

    var soinData = reservationData.soin || soinsSupplementaires[0].soinNom;
    var selectedTime = reservationData.creneau;
    var reservationDate = reservationData.date;

    blockNonReservableSlots(soinData, selectedTime, reservationDate);

    var prixList = [];
    if (reservationData.prix) prixList.push(reservationData.prix);
    soinsSupplementaires.forEach(supp => {
        if (supp.soinPrix) prixList.push(supp.soinPrix);
    });

    var multiplePrix = prixList.length > 1;

    function formatDateForEmail(dateString) {
        var monthNames = [
            "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
            "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"
        ];
    
        var [day, month, year] = dateString.split("-");
        return `${parseInt(day)} ${monthNames[parseInt(month) - 1]} ${year}`;
    }
    
    

        });
    }
});