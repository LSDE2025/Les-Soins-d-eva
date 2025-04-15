document.addEventListener("DOMContentLoaded", function () {

    setTimeout(function () {
        window.history.replaceState(null, "", window.location.pathname);
    }, 100);

    fetchAndStoreFirebaseData()

    // Définition des prix des soins
    var prixSoin = {
        "Le Miracle Face": 80,
        "Le Miracle Face - La Cure": 350,
        "Face Lift": 90,
        "Le Soin Better Aging": 120,
        "Le Soin Better Aging - Expert": 150,
        "Drainage Lymphatique": 150,
        "Drainage Lymphatique - La Cure": 600,
        "Massage Relaxant": 90,
        "Massage Relaxant - Complet": 130,
        "Yoga Facial": 70,
        "Auto Massage": 70,
    };

    // Fonction pour récupérer les paramètres de l'URL
    function getUrlParams() {
        var params = new URLSearchParams(window.location.search);
        var soin = params.get("soin");
        var duree = params.get("duree");

        return {soin, duree};
    }

    // Récupérer les paramètres de l'URL
    var { soin, duree } = getUrlParams();

    // Récupération des paramètres URL
    var params = new URLSearchParams(window.location.search);

    var ajouterSoinBtn = document.getElementById("ajouter-soin-btn");
    var listeSoins = document.getElementById("liste-soins");
    var soinsSelectionnes = document.getElementById("soins-selectionnes");

    let soinsSupplementaires = params.get("soinsSupplementaires")
    ? JSON.parse(decodeURIComponent(params.get("soinsSupplementaires")))
    : [];

    function cleanURL() {
        if (window.location.href.includes("soinsSupplementaires")) {
            window.history.replaceState(null, "", window.location.pathname);
        }
    }

    cleanURL();
    
    var monthName = document.getElementById("month-name");
    var montControls = document.getElementById("month-controls")
    var calendarContainer = document.getElementById("calendar");
    var prevMonthButton = document.getElementById("prev-month");
    var nextMonthButton = document.getElementById("next-month");

    document.getElementById("month-name").classList.add("hidden");
    document.getElementById("month-controls").classList.add("hidden");
    document.getElementById("calendar").classList.add("hidden");
    document.getElementById("prev-month").classList.add("hidden");
    document.getElementById("next-month").classList.add("hidden");

    var slots = document.querySelectorAll(".slot");
    var reserveButton = document.getElementById("reserve-button");

    reserveButton.classList.add("hidden");

    var selection = document.getElementById("selection");
    var mainContainer = document.querySelector(".selection-container");

    var selectedSlot = null;
    var selectedDate = null;
    var currentMonth = new Date();

    var today = new Date();

    if (!soin || !duree) {
        listeSoins.classList.remove("hidden");

        reserveButton.classList.add("hidden");

        // Masquer le conteneur de sélection
        document.querySelector("#selection-container").classList.add("hidden");

        // Masquer tout le calendrier
        document.getElementById("month-name").classList.add("hidden");
        document.getElementById("month-controls").classList.add("hidden");
        document.getElementById("calendar").classList.add("hidden");
        document.getElementById("prev-month").classList.add("hidden");
        document.getElementById("next-month").classList.add("hidden");

        document.getElementById("selection").classList.add("hidden");

        // Masquer le bouton "Ajouter un soin..."
        document.getElementById("ajouter-soin-btn").classList.add("hidden");
    } else {
        // Afficher les données du soin dans le bloc sélection client
        document.getElementById("soin-nom").textContent = soin;
        document.getElementById("soin-duree").textContent = duree;

        // Attribuer le prix en fonction du soin
        if (soin in prixSoin) {
            var prix = prixSoin[soin];
        
            var prixElement = document.getElementById("soin-prix");
        
            // Si l'élément #soin-prix existe
            if (prixElement) {
                prixElement.textContent = prix + "€"; 
            }
        } else {
            var prixElement = document.getElementById("soin-prix");
            if (prixElement) {
                prixElement.textContent = "Prix non disponible";  // Message par défaut si pas de prix trouvé
            }
        }        
        

        // Afficher calendrier
        document.getElementById("month-name").classList.remove("hidden");
        document.getElementById("month-controls").classList.remove("hidden");
        document.getElementById("calendar").classList.remove("hidden");
        document.getElementById("prev-month").classList.remove("hidden");
        document.getElementById("next-month").classList.remove("hidden");
    }
    
    // Fonction pour mettre à jour l'URL et masquer les paramètres
    function updateURL() {
        var params = new URLSearchParams(window.location.search);
        params.set("soinsSupplementaires", encodeURIComponent(JSON.stringify(soinsSupplementaires)));
        var newUrl = `${window.location.pathname}?${params.toString()}`;
        window.history.replaceState(null, "", newUrl);
    }

    // Suppression du soin déjà présent au chargement de la page
    var soinExistants = document.querySelectorAll(".soin-details .close-btn");

    soinExistants.forEach(btn => {
        btn.addEventListener("click", function () {
            if (confirm("Êtes-vous sûr de vouloir supprimer ce soin ?")) {
                var soinBloc = this.closest(".soin-details");
                soinBloc.remove();
                verifierNbSoins();

                // Mettre à jour l'URL en supprimant soin, duree et prix
                var params = new URLSearchParams(window.location.search);

                // Vérifier si le soin principal est supprimé
                if (!document.querySelector(".soin-details")) {
                    // Si plus de soins principaux, mettre soin, duree, prix à null
                    params.delete("soin");
                    params.delete("duree");
                    params.delete("prix");
                }

                // Remplacer l'URL sans recharger la page
                var newUrl = `${window.location.pathname}?${params.toString()}`;
                window.history.replaceState(null, "", newUrl);
            }
        });
    });

    function fetchAndStoreFirebaseData() {
        const selectedLocation = localStorage.getItem("location") || "30, rue de Trévise 75009 Paris";
    
        // 🔍 Fonction utilitaire pour gérer les deux formats de nom de champ
        const queryWithLocation = (ref) => {
            return Promise.all([
                ref.where("location", "==", selectedLocation).get(),
                ref.where("Lieu", "==", selectedLocation).get()
            ]).then(([locSnap, lieuSnap]) => [...locSnap.docs, ...lieuSnap.docs]);
        };
    
        // Fonction de formatage
        const formatDoc = (doc) => {
            const data = doc.data();
            return {
                location: data.location || data.Lieu || "",
                date: data.date || data.Date || "",
                creneau: data.creneau || data.time || "",
                text: data.Text || ""
            };
        };
    
        const reservationsRef = db.collection("reservationDetails");
        const blockedSlotsRef = db.collection("blockedSlots");
        const nonReservableRef = db.collection("non-reservable");
    
        Promise.all([
            queryWithLocation(reservationsRef),
            queryWithLocation(blockedSlotsRef),
            queryWithLocation(nonReservableRef)
        ])
        .then(([resDocs, blockedDocs, nonReservableDocs]) => {
            const formattedReservations = resDocs.map(formatDoc);
            const formattedBlocked = blockedDocs.map(formatDoc);
            const formattedNonReservable = nonReservableDocs.map(formatDoc);
    
            // 💾 Stockage local
            localStorage.setItem("reservationDetails", JSON.stringify(formattedReservations));
            localStorage.setItem("blockedSlots", JSON.stringify(formattedBlocked));
            localStorage.setItem("nonReservable", JSON.stringify(formattedNonReservable));
        })
        .catch(error => {
            console.error("❌ Erreur lors du chargement Firebase :", error);
        });
    }
                
    function showSlots() {
        var slotsContainer = document.getElementById("slots");
    
        slotsContainer.classList.remove("hidden");
        slotsContainer.style.display = "block";
        slotsContainer.style.opacity = "0";
        slotsContainer.style.transform = "translateY(40px)";
    
        // D'abord, on reset les tailles
        document.querySelectorAll(".slot").forEach(slot => {
            slot.style.width = ""; // reset
        });
    
        // On compte les créneaux visibles
        const visibleSlots = Array.from(document.querySelectorAll(".slot"))
            .filter(slot => !slot.hidden);
    
        if (visibleSlots.length <= 4) {
            visibleSlots.forEach(slot => {
                slot.style.width = "50%";
            });
        }
    
        setTimeout(() => {
            slotsContainer.style.transition = "opacity 0.6s ease-out, transform 1.1s ease-out";
            slotsContainer.style.opacity = "1";
            slotsContainer.style.transform = "translateY(0)";
        }, 50);
    }
      

    function applyBlockedDatesAndSlots() {
        const blockedSlots = JSON.parse(localStorage.getItem("blockedSlots") || "[]");
    
        blockedSlots.forEach(item => {
            if (item.text === "Jour bloqué" && item.date) {
                const dayButton = document.querySelector(`.day-button[data-date="${item.date}"]`);
                if (dayButton) {
                    dayButton.disabled = true;
                    dayButton.title = "Jour bloqué par l'administration";
                    dayButton.classList.add("disabled-day");
                }
            }
        });
    }    

    function bindDayClicks() {
        document.querySelectorAll(".day-button").forEach(btn => {
            btn.addEventListener("click", function () {
                if (this.disabled) return;
    
                const selectedDate = this.getAttribute("data-date");
                localStorage.setItem("date", selectedDate);
    
                // ✅ Visuel sélection
                document.querySelectorAll(".day-button.selected").forEach(b =>
                    b.classList.remove("selected")
                );
                this.classList.add("selected");
    
                // Reset slots
                document.querySelectorAll(".slot").forEach(slot => {
                    slot.classList.remove("blocked", "reserved");
                    slot.disabled = false;
                    slot.hidden = false;
                });
    
                const blockedSlots = JSON.parse(localStorage.getItem("blockedSlots") || "[]");
                const reservationDetails = JSON.parse(localStorage.getItem("reservationDetails") || "[]");
                const nonReservable = JSON.parse(localStorage.getItem("nonReservable") || "[]");
    
                document.querySelectorAll(".slot").forEach(slot => {
                    const slotTime = slot.textContent.trim();
    
                    const isBlocked = blockedSlots.some(doc =>
                        doc.date === selectedDate && doc.creneau === slotTime
                    );
                    const isReserved = reservationDetails.some(doc =>
                        doc.date === selectedDate && doc.creneau === slotTime
                    );
                    const isNonReservable = nonReservable.some(doc =>
                        doc.date === selectedDate && doc.creneau === slotTime
                    );
    
                    if (isBlocked) {
                        slot.classList.add("blocked");
                        slot.hidden = true;
                        slot.disabled = true;
                    } else if (isReserved || isNonReservable) {
                        slot.classList.add("reserved");
                        slot.disabled = true;
                    }
                });
    
                showSlots();
            });
        });
    }    
                    

    // Masquer les créneaux au chargement
    document.getElementById("slots").style.display = 'none';

    function updateCalendar() {
        var month = currentMonth.getMonth();
        var year = currentMonth.getFullYear();
        var monthNames = [
            "janvier", "février", "mars", "avril", "mai", "juin",
            "juillet", "août", "septembre", "octobre", "novembre", "décembre"
        ];
    
        monthName.textContent = `${monthNames[month]} ${year}`;
        calendarContainer.innerHTML = '';
    
        var firstDayOfMonth = new Date(year, month, 1).getDay();
        var daysInMonth = new Date(year, month + 1, 0).getDate();
        var isMobile = window.matchMedia("(max-width: 600px)").matches;
    
        var weekdays = isMobile
            ? ['Lun.', 'Mar.', 'Mer.', 'Jeu.', 'Ven.', 'Sam.', 'Dim.']
            : ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];
    
        weekdays.forEach(day => {
            var dayHeader = document.createElement('div');
            dayHeader.classList.add('day-header');
            dayHeader.textContent = day;
            calendarContainer.appendChild(dayHeader);
        });
    
        var adjustedFirstDay = (firstDayOfMonth === 0) ? 6 : firstDayOfMonth - 1;
        for (let i = 0; i < adjustedFirstDay; i++) {
            var emptyDay = document.createElement('div');
            calendarContainer.appendChild(emptyDay);
        }
    
        var today = new Date();
        today.setHours(0, 0, 0, 0);
    
        // 🔘 Création des jours cliquables
        for (let i = 1; i <= daysInMonth; i++) {
            var dayButton = document.createElement('button');
            dayButton.classList.add('day-button');
            dayButton.textContent = i;
    
            var dayDate = new Date(year, month, i);
            dayDate.setHours(0, 0, 0, 0);
    
            var formattedDate = `${("0" + i).slice(-2)}-${("0" + (month + 1)).slice(-2)}-${year}`;
            dayButton.setAttribute("data-date", formattedDate);
    
            if (dayDate < today) {
                dayButton.classList.add("non-clickable");
                dayButton.disabled = true;
            }
    
            calendarContainer.appendChild(dayButton);
        }
    
        // ✅ Après TOUT est affiché : bind les clics + appliquer les désactivations
        bindDayClicks(); // on sépare proprement la logique de clics
        applyBlockedDatesAndSlots(); // maintenant ça peut trouver les boutons
    }
                
    
    slots.forEach(slot => {
        slot.addEventListener("click", () => {
            if (slot.disabled) return;

            if (selectedSlot) {
                selectedSlot.classList.remove("selected");
            }
            slot.classList.add("selected");
            selectedSlot = slot;
            checkConditions();
        });
    });

    // Initialisation : centrer
    mainContainer.style.display = "flex";
    mainContainer.style.flexDirection = "row";
    mainContainer.style.alignItems = "flex-start"; // Alignement en haut
    mainContainer.style.justifyContent = "center";
    mainContainer.style.marginBottom = "10px";
    mainContainer.style.marginTop = "20px";  // Marge en haut

    function showReserveButton() {
        var reserveButton = document.getElementById("reserve-button");
    
        reserveButton.classList.remove("hidden");
        reserveButton.style.display = "block";
        reserveButton.style.opacity = "0"; 
        reserveButton.style.transform = "translateY(40px)"; 
    
        setTimeout(() => {
            reserveButton.style.transition = "opacity 0.6s ease-out, transform 1.1s ease-out";
            reserveButton.style.opacity = "1";
            reserveButton.style.transform = "translateY(0)";
        }, 50);
    }    


    function checkConditions() {
        if (selectedDate && selectedSlot) {
            reserveButton.classList.remove("hidden");
        } else {
            reserveButton.classList.add("hidden");
        }
    }
    
    prevMonthButton.addEventListener("click", () => {
        currentMonth.setMonth(currentMonth.getMonth() - 1);
        updateCalendar();
        updateNavigationButtons();
    });

    nextMonthButton.addEventListener("click", () => {
        const today = new Date();
        const maxMonth = new Date(today.getFullYear(), today.getMonth() + 3, 0); // Dernier jour du mois + 2 mois (fin juin)
    
        const nextMonth = new Date(currentMonth);
        nextMonth.setMonth(currentMonth.getMonth() + 1); // Passer au mois suivant
    
        // Vérifie si on ne dépasse pas la limite (fin juin)
        if (nextMonth <= maxMonth) {
            currentMonth = nextMonth;
            updateCalendar(); // Met à jour le calendrier
        } 

        updateNavigationButtons(); // Vérifie l'état des boutons après la mise à jour
    });
    
    function updateNavigationButtons() {
        const today = new Date();
        const maxMonth = new Date(today.getFullYear(), today.getMonth() + 3, 0); // Dernier jour du mois + 2 mois (fin juin)
    
        // Vérifie si on est sur la fin du mois limite (juin)
        const isAtMax = currentMonth.getFullYear() === maxMonth.getFullYear() &&
                        currentMonth.getMonth() === maxMonth.getMonth();
    
        // Désactive le bouton en ajoutant une classe "disabled" si on est en juin
        if (isAtMax) {
            nextMonthButton.classList.add("disabled");
        } else {
            nextMonthButton.classList.remove("disabled");
        }
    }
    
    updateNavigationButtons(); // Initialisation de l'état des boutons au chargement de la page
    
    
    

    updateCalendar();

    slots.forEach(slot => {
        slot.addEventListener("click", () => {
            if (selectedSlot) {
                selectedSlot.classList.remove("selected");
            }
            slot.classList.add("selected");
            selectedSlot = slot;
            checkConditions();
            showReserveButton();
        });
    });
    

    function verifierNbSoins() {
        var nbSoins = document.querySelectorAll(".soin-details").length;
        if (nbSoins === 0) {
            soinsSelectionnes.classList.remove("hidden");
        }
        document.getElementById("ajouter-soin-btn").classList.remove("hidden");
    }

    ajouterSoinBtn.addEventListener("click", function () {
        listeSoins.classList.toggle("hidden");
        monthName.classList.add("hidden");
        montControls.classList.add("hidden");
        calendarContainer.classList.add("hidden");
        prevMonthButton.classList.add("hidden");
        nextMonthButton.classList.add("hidden");
        reserveButton.classList.add("hidden");
        document.getElementById("slots").style.display = 'none';
    });

    document.querySelectorAll(".btn-reserver").forEach(btn => {
        btn.addEventListener("click", function (event) {
            event.preventDefault();

            selection.classList.remove("hidden");

            monthName.classList.remove("hidden");
            montControls.classList.remove("hidden");
            calendarContainer.classList.remove("hidden");
            prevMonthButton.classList.remove("hidden");
            nextMonthButton.classList.remove("hidden");

            var soinNom = this.getAttribute("data-soin");
            var soinDuree = this.getAttribute("data-duree");
            var soinPrix = this.getAttribute("data-prix");

            var newSoinBloc = document.createElement("div");
            newSoinBloc.classList.add("soin-details");
            newSoinBloc.innerHTML = `
                <span class="close-btn">&times;</span>
                <div class="soin-nom">${soinNom}</div>
                <div class="details-bas">
                    <span>${soinDuree}</span>
                    <span>${soinPrix}</span>
                </div>
            `;

            newSoinBloc.querySelector(".close-btn").addEventListener("click", function () {
                if (confirm("Êtes-vous sûr de vouloir supprimer ce soin ?")) {
                    newSoinBloc.remove();
                    soinsSupplementaires = soinsSupplementaires.filter(soin => soin.soinNom !== soinNom);
                    updateURL();
                    verifierNbSoins();
                }
            });

            soinsSelectionnes.appendChild(newSoinBloc);
            soinsSupplementaires.push({
                soinNom: soinNom,
                soinPrix: soinPrix
            });

            listeSoins.classList.add("hidden");
            ajouterSoinBtn.classList.remove("hidden");
        });
    });

    
    reserveButton.addEventListener("click", function () {
        var selectedSlot = document.querySelector(".slot.selected"); 
        var selectedTime = selectedSlot ? selectedSlot.textContent.trim() : null;
        var selectedDate = localStorage.getItem("date"); 
    
        if (!selectedTime || !selectedDate) { 
            console.log("Aucun créneau ou date sélectionné, opération annulée.");
            return; 
        }
    
        // Vérifier si le soin principal est toujours présent
        var soinElement = document.getElementById("soin-nom");
        var soinPrincipal = soinElement && soinElement.textContent.trim() ? soinElement.textContent.trim() : null;
    
        var soinsSupplementairesEncoded = encodeURIComponent(JSON.stringify(soinsSupplementaires));
    
        if (!soinPrincipal) {
            // Soin principal supprimé => on envoie uniquement la date, le créneau et les soins supplémentaires
            localStorage.setItem("reservationDetails", JSON.stringify({
                date: selectedDate,
                creneau: selectedTime,
                soinsSupplementaires: soinsSupplementaires.length > 0 ? soinsSupplementaires : null,
            }));
    
            var url = `Formulaire-de-reservation.html?ldate=${encodeURIComponent(selectedDate)}&creneau=${encodeURIComponent(selectedTime)}&soinsSupplementaires=${soinsSupplementairesEncoded}&location=${encodeURIComponent('30, rue de Trévise 75009 Paris')}`;
            window.location.href = url;
        } else {
            // Récupérer l'élément contenant le prix affiché
            var prixElement = document.getElementById("soin-prix");
            let prixSoinPrincipal = prixElement && prixElement.textContent ? prixElement.textContent.replace("€", "").trim() : null;
            
            // Convertir le prix en nombre
            prixSoinPrincipal = prixSoinPrincipal ? parseFloat(prixSoinPrincipal) : null;
    
            // Enregistre normalement avec soin principal et soins supp
            localStorage.setItem("reservationDetails", JSON.stringify({
                soin: soinPrincipal,
                date: selectedDate,
                creneau: selectedTime,
                prix: prixSoinPrincipal,
                location: "30, rue de Trévise 75009 Paris",
                soinsSupplementaires: soinsSupplementaires.length > 0 ? soinsSupplementaires : null,
            }));
    
            var url = `Formulaire-de-reservation.html?soin=${encodeURIComponent(soinPrincipal)}&duree=${encodeURIComponent(duree)}&prix=${encodeURIComponent(prixSoinPrincipal)}&ldate=${encodeURIComponent(selectedDate)}&creneau=${encodeURIComponent(selectedTime)}&soinsSupplementaires=${soinsSupplementairesEncoded}&location=${encodeURIComponent('30, rue de Trévise 75009 Paris')}`;
            window.location.href = url;
        }    

    
    
        
    });
});
