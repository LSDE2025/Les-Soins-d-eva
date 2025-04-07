document.addEventListener("DOMContentLoaded", function () {
    console.log("Valeur brute de RESERVATIONS :", localStorage.getItem("reservations"));
    console.log("Valeur brute de BLOCKEDSLOTS :", localStorage.getItem("BlockedSlots"));
    console.log("Valeur brute de NON-RESERVABLE :", localStorage.getItem("non-reservable"));


    var monthName = document.getElementById("month-name");
    var calendarContainer = document.getElementById("calendar");
    var prevMonthButton = document.getElementById("prev-month");
    var nextMonthButton = document.getElementById("next-month");

    var currentMonth = new Date();
    var selectedLocation = "";

    const horaires = [];
    for (let h = 9; h < 19; h++) { // On s'arrête à 18h45
        for (let m = 0; m < 60; m += 15) {
            horaires.push(`${h}:${m.toString().padStart(2, '0')}`);
        }
    }
    horaires.push("19:00");


    // Évènement aux boutons lieux
    document.getElementById("btn-paris").addEventListener("click", function() {
        selectedLocation = "30, rue de Trévise 75009 Paris";
        this.classList.add("selected");
        document.getElementById("btn-bandol").classList.remove("selected"); // Déselectionner l'autre bouton
        updateCalendar();
    });

    document.getElementById("btn-bandol").addEventListener("click", function() {
        selectedLocation = "4, bd Victor Hugo 83150 Bandol";
        this.classList.add("selected");
        document.getElementById("btn-paris").classList.remove("selected"); // Déselectionner l'autre bouton
        updateCalendar();
    });

    document.querySelectorAll("#location-buttons button").forEach(button => {
        button.addEventListener("click", function() {
            document.querySelectorAll("#location-buttons button").forEach(btn => btn.classList.remove("selected"));
            this.classList.add("selected");
        });
    });

    // Formater la date en "DD-MM-YYYY"
    function formatDate(date) {
        let d = date.getDate();
        let m = date.getMonth() + 1;
        let y = date.getFullYear();
        return `${d < 10 ? '0' + d : d}-${m < 10 ? '0' + m : m}-${y}`;
    }

    // Afficher le calendrier
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
        var weekdays = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];

        // Jours de la semaine
        weekdays.forEach(day => {
            var dayHeader = document.createElement('div');
            dayHeader.classList.add('day-header');
            dayHeader.textContent = day;
            calendarContainer.appendChild(dayHeader);
        });

        var adjustedFirstDay = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1;

        // Ajouter les cases vides avant le premier jour du mois
        for (let i = 0; i < adjustedFirstDay; i++) {
            var emptyDay = document.createElement('div');
            emptyDay.classList.add('empty-day');
            calendarContainer.appendChild(emptyDay);
        }

        // Jours du mois
        for (let i = 1; i <= daysInMonth; i++) {
            let dateObj = new Date(year, month, i);
            let formattedDate = formatDate(dateObj);

            var dayButton = document.createElement('button');
            dayButton.classList.add('day-button');
            dayButton.textContent = i;
            dayButton.dataset.date = formattedDate;

            // Gestion de la sélection d'un jour
            dayButton.addEventListener("click", function () {
                document.querySelectorAll(".day-button").forEach(btn => btn.classList.remove("selected"));
                this.classList.add("selected");

                // Vérifier si un bouton de lieu est sélectionné avant d'afficher le tableau
                if ((document.getElementById("btn-paris").classList.contains("selected") || document.getElementById("btn-bandol").classList.contains("selected")) && document.querySelector('.day-button.selected')) {
                    showTable(this.dataset.date);
                }

            });

            calendarContainer.appendChild(dayButton);
        }
    }

    // Vérifier et bloquer les créneaux en fonction de la sélection du lieu
    function checkAndBlockSlots(selectedDate) {
        let blockedSlots = JSON.parse(localStorage.getItem("blockedSlots")) || [];
    
        // Utilisation de selectedLocation et selectedDate pour filtrer
        let location = selectedLocation;
        let filteredBlockedSlots = blockedSlots.filter(slot => 
            slot.location === location && slot.date === selectedDate
        );
            
        // Parcourir tous les créneaux et les marquer comme bloqués si trouvés
        filteredBlockedSlots.forEach(slot => {
            let slotElement = document.querySelector(`.slot[data-time="${slot.creneau}"][data-date="${slot.date}"]`);
            
            if (slotElement) {
                let blockDayCheckbox = slotElement.querySelector('.block-day-checkbox');
            
                if (blockDayCheckbox) {
                    blockDayCheckbox.checked = true;  // Bloquer le créneau si trouvé
                    blockDayCheckbox.disabled = true; // Désactiver le bouton une fois bloqué
                }
            }
        });
    }
                    
    
    // Afficher les créneaux d'un jour sélectionné
    function showTable(selectedDate) {
    
        const reservations = JSON.parse(localStorage.getItem('reservations')) || [];
        const dayReservations = reservations.filter(reservation => 
            reservation.date === selectedDate && reservation.location === selectedLocation
        );
        
        document.getElementById('timeSlotsTable').style.display = 'block'; 
        document.getElementById('dayTitle').textContent = `Créneaux du ${selectedDate}`;
    
        const slotsBody = document.getElementById('slotsBody');
        slotsBody.innerHTML = '';  // Vide le contenu existant du tableau

        // Ligne pour modifier tous les créneaux
        const trModifyAll = document.createElement('tr');
        trModifyAll.innerHTML = `
            <td colspan="4" class="block-day-row">
                <button id="modifier-tous">Modifier tous les créneaux</button>
            </td>
        `;
        slotsBody.appendChild(trModifyAll);

        // Gérer le bouton "Modifier tous les créneaux"
        const modifierTousButton = document.getElementById('modifier-tous');
                
        modifierTousButton.addEventListener('click', function() {
            const allModifierButtons = document.querySelectorAll('.modifier-creneau');
            const allCheckboxes = document.querySelectorAll('.slot-status');

            // Créer le bouton "Sélectionner tout"
            let selectAllButton = document.getElementById('select-all');
            if (!selectAllButton) { // Si le bouton "Sélectionner tout" n'existe pas, on le crée
                selectAllButton = document.createElement('button');
                selectAllButton.id = 'select-all';
                selectAllButton.textContent = "Sélectionner tout";
                selectAllButton.style.marginLeft = "10px";
                modifierTousButton.parentElement.appendChild(selectAllButton);
                
                let allSelected = false; // État de sélection
                selectAllButton.addEventListener('click', function () {
                    allSelected = !allSelected; // Inverse l'état de sélection
                    allCheckboxes.forEach(checkbox => {
                        const slotCheckbox = checkbox.previousElementSibling;
                        slotCheckbox.checked = allSelected; // Coche ou décoche tout
                    });
                    selectAllButton.textContent = allSelected ? "Tout désélectionner" : "Sélectionner tout";
                });
            }

            // Gestion du bouton "Modifier tous les créneaux"
            if (modifierTousButton.textContent === "Modifier tous les créneaux") {
                modifierTousButton.textContent = "Valider tous";
                modifierTousButton.style.backgroundColor = "#8B0000"; 

                // Modifier les boutons de créneaux
                allModifierButtons.forEach(button => button.textContent = "Valider");
                allModifierButtons.forEach(button => button.style.backgroundColor = "#8B0000");

                // Activer les cases à cocher
                allCheckboxes.forEach(checkbox => checkbox.previousElementSibling.disabled = false);
                
                // Afficher le bouton "Sélectionner tout"
                selectAllButton.style.display = "inline-block";
            } else {
                const confirmation = confirm("Êtes-vous sûr de vouloir modifier tous les créneaux ?");
                if (confirmation) {
                    // Effectuer les modifications sur chaque créneau
                    allCheckboxes.forEach(checkbox => {
                        const slotCheckbox = checkbox.previousElementSibling;
                        const time = checkbox.id.replace("slot-status-", "");
                        
                        if (slotCheckbox.checked) {
                            checkbox.textContent = "Bloqué";
                            let blockedSlots = JSON.parse(localStorage.getItem("blockedSlots")) || [];
                            blockedSlots.push({ creneau: time, location: selectedLocation, date: selectedDate });
                            localStorage.setItem("blockedSlots", JSON.stringify(blockedSlots));
                        } else {
                            checkbox.textContent = "Libre";

                            // Supprimer la réservation du localStorage "reservations"
                            let reservations = JSON.parse(localStorage.getItem('reservations')) || [];
                            reservations = reservations.filter(reservation => !(reservation.creneau === time && reservation.location === selectedLocation && reservation.date === selectedDate));
                            localStorage.setItem('reservations', JSON.stringify(reservations));

                            // Supprimer ce créneau du localStorage "blockedSlots"
                            let blockedSlots = JSON.parse(localStorage.getItem("blockedSlots")) || [];
                            blockedSlots = blockedSlots.filter(slot => !(slot.creneau === time && slot.location === selectedLocation && slot.date === selectedDate));
                            localStorage.setItem("blockedSlots", JSON.stringify(blockedSlots));

                            // Supprimer ce créneau du localStorage "non-reservable"
                            let nonReservable = JSON.parse(localStorage.getItem("non-reservable")) || [];
                            nonReservable = nonReservable.filter(slot => !(slot.time === time && slot.location === selectedLocation && slot.date === selectedDate));
                            localStorage.setItem("non-reservable", JSON.stringify(nonReservable));

                        }

                        slotCheckbox.disabled = true;
                    });

                    // Réinitialiser le bouton "Modifier tous les créneaux"
                    modifierTousButton.textContent = "Modifier tous les créneaux";
                    modifierTousButton.style.backgroundColor = "rgb(106, 83, 78)"; 

                    // Réinitialiser les boutons des créneaux
                    allModifierButtons.forEach(button => button.textContent = "Modifier");
                    allModifierButtons.forEach(button => button.style.backgroundColor = "rgb(106, 83, 78)");

                    // Cacher le bouton "Sélectionner tout"
                    selectAllButton.style.display = "none";

                }

            }
        });
    
        horaires.forEach((time) => {
            let slotStatus = 'Libre';
            let clientInfo = '';

            const reservationForSlot = dayReservations.find(reservation => reservation.creneau === time);
    
             // Vérification si le créneau est réservé
            if (reservationForSlot) {
                if (reservationForSlot.status === 'Bloqué') {
                    slotStatus = 'Bloqué';
                } else {
                    slotStatus = 'Réservé';
                } 
    
                const soinsSupplementaires = reservationForSlot.soinsSupplementaires || [];
                const prestations = soinsSupplementaires.map(soin => soin.soinNom).join(', ');
    
                clientInfo = `
                    <strong>Nom :</strong> ${reservationForSlot.nom || ''} ${reservationForSlot.prenom || ''} <br>
                    <strong>Email :</strong> ${reservationForSlot.email || ''} <br>
                    <strong>Téléphone :</strong> ${reservationForSlot.phone || ''} <br>
                    <strong>Prestations :</strong> ${[reservationForSlot.soin, prestations].filter(Boolean).join(', ')} <br>
                `;
                
                if (reservationForSlot.infoComplementaires) {
                    clientInfo += `<strong>Informations :</strong> ${reservationForSlot.infoComplementaires} <br>`;
                }
            }
    
            // Vérifier si le créneau est bloqué
            const blockedSlots = JSON.parse(localStorage.getItem("blockedSlots")) || [];
            const blockedSlotForThisTime = blockedSlots.find(slot => slot.creneau === time && slot.location === selectedLocation && slot.date === selectedDate);
    
            if (blockedSlotForThisTime) {
                slotStatus = 'Bloqué';
            }

            // Vérifier si le créneau est non-réservable
            const nonReservableSlots = JSON.parse(localStorage.getItem("non-reservable")) || [];
            const nonReservableForThisTime = nonReservableSlots.find(slot =>
                slot.time === time &&
                slot.location === selectedLocation &&
                slot.date === selectedDate
            );

            if (nonReservableForThisTime && slotStatus === 'Libre') {
                slotStatus = 'Non-réservable';
                clientInfo = `<strong>${nonReservableForThisTime.text}</strong><br>`;
            }

             // Création de la ligne
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${time}</td>
                <td>
                    <input type="checkbox" id="slot-checkbox-${time}" 
                        ${slotStatus !== 'Libre' ? 'checked' : ''} disabled> 
                    <span class="slot-status" id="slot-status-${time}">${slotStatus}</span>
                </td>
                <td>${clientInfo}</td>
                <td class="action-column">
                    <button class="modifier-creneau" id="modifier-creneau-${time}">Modifier</button>
                </td>
            `;

            if (slotStatus === 'Bloqué') {
                tr.style.backgroundColor = "rgba(247, 219, 219, 0.79)";
            } else if (slotStatus === 'Non-réservable') {
                tr.style.backgroundColor = "rgba(213, 209, 209, 0.77)";
            }

            slotsBody.appendChild(tr);
        
            const modifierButton = document.getElementById(`modifier-creneau-${time}`);
            const slotCheckbox = document.getElementById(`slot-checkbox-${time}`);
            const slotStatusText = document.getElementById(`slot-status-${time}`);
    
            modifierButton.addEventListener('click', function() {
                if (modifierButton.textContent === "Modifier") {
                    modifierButton.textContent = "Valider";
                    modifierButton.style.backgroundColor = "#8B0000"; 
                    slotCheckbox.disabled = false; 
                } else {
                    const confirmation = confirm("Êtes-vous sûr de vouloir modifier ? Si vous bloquez le créneau, les données des réservations seront supprimées.");
                    
                    if (confirmation) {
                        const isChecked = slotCheckbox.checked;
    
                        if (isChecked) {
                            slotStatusText.textContent = "Bloqué";
                            alert("Le créneau est maintenant bloqué.");
                            
                            let blockedSlots = JSON.parse(localStorage.getItem("blockedSlots")) || [];
                            blockedSlots.push({ creneau: time, location: selectedLocation, date: selectedDate });
                            localStorage.setItem("blockedSlots", JSON.stringify(blockedSlots));
                        } else {
                            slotStatusText.textContent = "Libre";
                            alert("Le créneau est maintenant libre.");
                            
                        // Supprimer la réservation du localStorage "reservations"
                        let reservations = JSON.parse(localStorage.getItem('reservations')) || [];
                        reservations = reservations.filter(reservation => !(reservation.creneau === time && reservation.location === selectedLocation && reservation.date === selectedDate));
                        localStorage.setItem('reservations', JSON.stringify(reservations));
                                                
                        // Supprimer ce créneau du localStorage "blockedSlots"
                        let blockedSlots = JSON.parse(localStorage.getItem("blockedSlots")) || [];
                        blockedSlots = blockedSlots.filter(slot => !(slot.creneau === time && slot.location === selectedLocation && slot.date === selectedDate)); 
                        localStorage.setItem("blockedSlots", JSON.stringify(blockedSlots));

                        // Supprimer ce créneau du localStorage "non-reservable"
                        let nonReservable = JSON.parse(localStorage.getItem("non-reservable")) || [];
                        nonReservable = nonReservable.filter(slot => !(slot.time === time && slot.location === selectedLocation && slot.date === selectedDate));
                        localStorage.setItem("non-reservable", JSON.stringify(nonReservable));

                        showTable(selectedDate);
                        checkAndBlockSlots(selectedDate);
                    }
                }
    
                    modifierButton.textContent = "Modifier";
                    modifierButton.style.backgroundColor = "rgb(106, 83, 78)";
                    slotCheckbox.disabled = true;
                }
            });
        });
    
    }
        
    // Navigation entre les mois
    prevMonthButton.addEventListener("click", function () {
        currentMonth.setMonth(currentMonth.getMonth() - 1);
        updateCalendar();
    });

    nextMonthButton.addEventListener("click", function () {
        currentMonth.setMonth(currentMonth.getMonth() + 1);
        updateCalendar();
    });

    updateCalendar();
});
