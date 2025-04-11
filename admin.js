document.addEventListener("DOMContentLoaded", function () {

    // Fonction pour vérifier si la date est dans le mois précédent
    function isDateInPreviousMonth(dateString) {
        if (!dateString || typeof dateString !== 'string') {
            console.error("La date est invalide ou manquante : ", dateString);
            return false; // Retourner false si la date n'est pas valide
        }

        const [day, month, year] = dateString.split('-').map(num => parseInt(num, 10));
        if (isNaN(day) || isNaN(month) || isNaN(year)) {
            console.error("Le format de la date est invalide : ", dateString);
            return false; // Retourner false si la date ne peut pas être analysée
        }

        const currentDate = new Date();
        const currentMonth = currentDate.getMonth(); // 0 = janvier, 11 = décembre
        const previousMonth = (currentMonth === 0) ? 11 : currentMonth - 1;

        // Créer un objet Date à partir de la date extraite
        const dateToCheck = new Date(year, month - 1, day);

        // Comparer le mois et l'année
        return dateToCheck.getMonth() === previousMonth && dateToCheck.getFullYear() === currentDate.getFullYear();
    }

        // Fonction pour supprimer les données du mois précédent dans les 3 collections
        async function clearPreviousMonthData() {
            const collections = ['reservationDetails', 'non-reservable', 'blockedSlots'];

            // Parcourir chaque collection
            for (let collection of collections) {
                const snapshot = await window.db.collection(collection).get();
                
                snapshot.forEach(doc => {
                    const data = doc.data();
                    const date = data['date']; // On récupère la date sous le champ "date"
                    
                    if (date && isDateInPreviousMonth(date)) {
                        // Si la date est valide et du mois précédent, on supprime le document
                        doc.ref.delete();
                    } else {
                        console.log(`Aucune suppression pour ${doc.id} - Date non valide ou pas dans le mois précédent.`);
                    }
                });
            }
        }

        // Ajout d'un événement sur le bouton "Clear Datas"
        document.getElementById('clear-data-btn').addEventListener('click', async () => {
            const confirmDelete = confirm('Voulez-vous vraiment supprimer les données du mois précédent ?');
            if (confirmDelete) {
                await clearPreviousMonthData();
                alert('Les données du mois précédent ont été supprimées.');
            }
        });

        // Fonction pour supprimer toutes les données de Firebase
        async function clearAllData() {
            const db = window.db;

            // Supprimer toutes les données dans "reservationDetails"
            const reservationSnapshot = await db.collection('reservationDetails').get();
            reservationSnapshot.forEach(doc => {
                doc.ref.delete();
            });

            // Supprimer toutes les données dans "blockedSlots"
            const blockedSlotsSnapshot = await db.collection('blockedSlots').get();
            blockedSlotsSnapshot.forEach(doc => {
                doc.ref.delete();
            });

            // Supprimer toutes les données dans "non-reservable"
            const nonReservableSnapshot = await db.collection('non-reservable').get();
            nonReservableSnapshot.forEach(doc => {
                doc.ref.delete();
            });

            alert('Toutes les données ont été supprimées avec succès.');
        }

        // Ajouter un gestionnaire d'événements pour le bouton "Clear All Datas"
        document.getElementById('clear-all-data-btn').addEventListener('click', async () => {
            // 1. Demander la première confirmation
            const firstConfirm = confirm('Êtes-vous sûr de vouloir supprimer TOUTES les données de la base ? Cette action est irréversible.');
            
            if (firstConfirm) {
                // 2. Demander la confirmation de la phrase
                const confirmationText = prompt('Veuillez entrer "lessoinsdeva/delateall" pour confirmer la suppression complète des données :');
                
                if (confirmationText === 'lessoinsdeva/delateall') {
                    // 3. Si la phrase est correcte, supprimer toutes les données
                    await clearAllData();
                } else {
                    alert('La phrase de confirmation est incorrecte. Aucune donnée n\'a été supprimée.');
                }
            } else {
                alert('Suppression annulée.');
            }
        });

        // Fonction pour afficher le pop-up
        function showPopup() {
            const popup = document.getElementById('popupModal');
            const closeButton = document.getElementById('closeModal'); // Le bouton de fermeture

            if (popup) {
                popup.style.display = 'flex';

                // Fermer le pop-up lorsqu'on clique en dehors de celui-ci
                popup.addEventListener('click', function(event) {
                    if (event.target === popup) {
                        popup.style.display = 'none';
                    }
                });

                // Fermer le pop-up lorsqu'on clique sur le bouton de fermeture (span)
                if (closeButton) {
                    closeButton.addEventListener('click', function() {
                        popup.style.display = 'none';
                    });
                }
            }
        }        
    // Appeler la fonction pour afficher le pop-up
    showPopup();

    document.getElementById('notice-link').addEventListener('click', function () {
        const popup = document.getElementById('notice-popup');
        popup.style.display = 'flex';
    });
    
    // Fermer le pop-up quand on clique sur le bouton "Fermer"
    document.getElementById('close-notice').addEventListener('click', function () {
        const popup = document.getElementById('notice-popup');
        popup.style.display = 'none';
    });
    
    // Fermer le pop-up si l'utilisateur clique en dehors du pop-up
    document.getElementById('notice-popup').addEventListener('click', function (event) {
        // Si l'utilisateur clique sur le fond (overlay) et pas sur le contenu du pop-up
        if (event.target === this) {
            this.style.display = 'none';
        }
    });


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
        const db = window.db;
        let location = selectedLocation;
    
        db.collection("blockedSlots")
            .where("date", "==", selectedDate)
            .where("location", "==", location)
            .get()
            .then(snapshot => {
                snapshot.forEach(doc => {
                    const slot = doc.data();
    
                    let slotElement = document.querySelector(`.slot[data-time="${slot.creneau}"][data-date="${slot.date}"]`);
                    
                    if (slotElement) {
                        let blockDayCheckbox = slotElement.querySelector('.block-day-checkbox');
                    
                        if (blockDayCheckbox) {
                            blockDayCheckbox.checked = true;
                            blockDayCheckbox.disabled = true;
                        }
                    }
                });
            })
            .catch(error => {
                console.error("Erreur lors de la récupération des créneaux bloqués :", error);
            });
    }                    
    
    // Afficher les créneaux d'un jour sélectionné
    async function showTable(selectedDate) {

        const dayReservations = [];

        async function showTable(selectedDate) {
            const dayReservations = [];
            
            try {
                // Créer une référence de la collection "reservations"
                const reservationsRef = collection(window.db, "reservations");
                // Créer une requête pour filtrer les documents selon la date et l'emplacement
                const q = query(reservationsRef, 
                    where("date", "==", selectedDate),
                    where("location", "==", selectedLocation)
                );
                
                // Récupérer les documents
                const querySnapshot = await getDocs(q);
                
                // Parcourir les documents récupérés
                querySnapshot.forEach((doc) => {
                    dayReservations.push(doc.data());
                });
                
            } catch (error) {
                console.error("Erreur lors de la récupération des réservations :", error);
            }
        
        }            
            
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
                    allCheckboxes.forEach(async checkbox => {
                        const slotCheckbox = checkbox.previousElementSibling;
                        const time = checkbox.id.replace("slot-status-", "");
                        
                if (slotCheckbox.checked) {
                    checkbox.textContent = "Bloqué";

                    // Ajouter dans "blockedSlots" de Firestore
                    await window.db.collection("blockedSlots").add({
                        creneau: time,
                        location: selectedLocation,
                        date: selectedDate
                    });

                } else {
                    checkbox.textContent = "Libre";

                    // Supprimer la réservation de Firestore ("reservations")
                    const reservationsSnapshot = await window.db.collection("reservationDetails")
                        .where("creneau", "==", time)
                        .where("location", "==", selectedLocation)
                        .where("date", "==", selectedDate)
                        .get();

                    reservationsSnapshot.forEach(doc => {
                        doc.ref.delete();
                    });

                    // Supprimer le créneau de "blockedSlots"
                    const blockedSlotsSnapshot = await window.db.collection("blockedSlots")
                        .where("creneau", "==", time)
                        .where("location", "==", selectedLocation)
                        .where("date", "==", selectedDate)
                        .get();

                    blockedSlotsSnapshot.forEach(doc => {
                        doc.ref.delete();
                    });

                    // Supprimer le créneau de "non-reservable"
                    const nonReservableSnapshot = await window.db.collection("non-reservable")
                        .where("time", "==", time)
                        .where("location", "==", selectedLocation)
                        .where("date", "==", selectedDate)
                        .get();

                    nonReservableSnapshot.forEach(doc => {
                        doc.ref.delete();
                    });
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

         // Fonction pour mettre à jour l'UI avec les données du créneau
        function updateSlotUI(time, status, info) {
            const slotElement = document.querySelector(`.slot[data-time="${time}"]`);
            if (slotElement) {
                slotElement.querySelector('.status').textContent = status;
                slotElement.querySelector('.client-info').innerHTML = info;
            }
        }
    
        horaires.forEach(async (time) => {
            let slotStatus = 'Libre';
            let clientInfo = '';
        
            try {
                // Ajouter des filtres par "location" et "date" pour récupérer les données correspondantes
                const reservationQuery = await firebase.firestore()
                    .collection("reservationDetails")
                    .where("creneau", "==", time)  // Filtrer par créneau
                    .where("location", "==", selectedLocation)  // Filtrer par location
                    .where("date", "==", selectedDate)  // Filtrer par date
                    .get();
        
                // Vérification si une réservation existe pour ce créneau
                if (!reservationQuery.empty) {
                    const reservationForSlot = reservationQuery.docs[0].data(); // On prend la première réservation correspondante
        
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
            } catch (error) {
                console.error("Erreur lors de la récupération des réservations depuis Firebase :", error);
            }
                
            // Vérifier si le créneau est bloqué
            const db = firebase.firestore();
            
            // Pour récupérer les slots bloqués
            const blockedSlotsRef = db.collection("blockedSlots");
            const blockedSlotsSnapshot = await blockedSlotsRef
                .where("creneau", "==", time)
                .where("location", "==", selectedLocation)
                .where("date", "==", selectedDate)
                .get();
            
            // Traitement des résultats
            blockedSlotsSnapshot.forEach(doc => {
                // Ici, tu peux traiter les résultats, par exemple
                const slotData = doc.data();
            });            
            
            let blockedSlotForThisTime = null;

        // Vérifier s'il y a des documents retournés
        if (!blockedSlotsSnapshot.empty) {
            blockedSlotForThisTime = blockedSlotsSnapshot.docs[0].data(); // On suppose que l'on prend le premier résultat
        }    
        if (blockedSlotForThisTime) {
            slotStatus = 'Bloqué';
        }

        // Vérifier si le créneau est non-réservable
        const nonReservableSlotsSnapshot = await window.db.collection("non-reservable")
            .where("time", "==", time)
            .where("location", "==", selectedLocation)
            .where("date", "==", selectedDate)
            .get();

        let nonReservableForThisTime = null;

            // Vérifier s'il y a des documents retournés
            if (!nonReservableSlotsSnapshot.empty) {
                nonReservableForThisTime = nonReservableSlotsSnapshot.docs[0].data(); // On suppose que l'on prend le premier résultat
            }
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
    
            modifierButton.addEventListener('click', async function() {
                if (modifierButton.textContent === "Modifier") {
                    modifierButton.textContent = "Valider";
                    modifierButton.style.backgroundColor = "#8B0000"; 
                    slotCheckbox.disabled = false; 
                } else {
                    const confirmation = confirm("Êtes-vous sûr de vouloir modifier ? Si vous libérez le créneau, les données des réservations seront supprimées.");
                    
                    if (confirmation) {
                        const isChecked = slotCheckbox.checked;
    
                        if (isChecked) {
                            slotStatusText.textContent = "Bloqué";
                            alert("Le créneau est maintenant bloqué.");
                        
                            // Ajouter le créneau aux slots bloqués dans Firestore
                            await window.db.collection('blockedSlots').add({
                                creneau: time,
                                location: selectedLocation,
                                date: selectedDate
                            });
                        } else {
                            slotStatusText.textContent = "Libre";
                            alert("Le créneau est maintenant libre.");
                        
                            // Supprimer la réservation dans Firestore "reservations"
                            const reservationRef = window.db.collection('reservationDetails')
                                .where('creneau', '==', time)
                                .where('location', '==', selectedLocation)
                                .where('date', '==', selectedDate);
                        
                            const reservationSnapshot = await reservationRef.get();
                            reservationSnapshot.forEach(doc => {
                                doc.ref.delete();
                            });
                        
                            // Supprimer ce créneau de Firestore "blockedSlots"
                            const blockedSlotRef = window.db.collection('blockedSlots')
                                .where('creneau', '==', time)
                                .where('location', '==', selectedLocation)
                                .where('date', '==', selectedDate);
                        
                            const blockedSnapshot = await blockedSlotRef.get();
                            blockedSnapshot.forEach(doc => {
                                doc.ref.delete();
                            });
                        
                            // Supprimer ce créneau de Firestore "non-reservable"
                            const nonReservableRef = window.db.collection('non-reservable')
                                .where('time', '==', time)
                                .where('location', '==', selectedLocation)
                                .where('date', '==', selectedDate);
                        
                            const nonReservableSnapshot = await nonReservableRef.get();
                            nonReservableSnapshot.forEach(doc => {
                                doc.ref.delete();
                            });
                        
                            // Rafraîchir la table après modification
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
