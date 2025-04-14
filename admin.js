document.addEventListener("DOMContentLoaded", function () {

// Ajout de la fonctionnalité "Bloquer Jours"
let modeSelectionJours = false;
let joursSelectionnes = [];

const bloquerJoursBtn = document.getElementById('bloquerJoursBtn');

// Création du bouton Annuler
const annulerSelectionBtn = document.createElement("button");
annulerSelectionBtn.id = "annulerSelectionBtn";
annulerSelectionBtn.textContent = "Annuler";
annulerSelectionBtn.style.display = "none";
annulerSelectionBtn.className = bloquerJoursBtn.className; // même style

bloquerJoursBtn.parentNode.insertBefore(annulerSelectionBtn, bloquerJoursBtn.nextSibling);

// Active le bouton seulement si un lieu est sélectionné
const observerLocation = new MutationObserver(() => {
    if (selectedLocation) {
        bloquerJoursBtn.disabled = false;
    } else {
        bloquerJoursBtn.disabled = true;
    }
});
observerLocation.observe(document.body, { childList: true, subtree: true });

// Clic sur le bouton "Bloquer Jours"
bloquerJoursBtn.addEventListener('click', () => {
    if (!modeSelectionJours) {
        modeSelectionJours = true;
        bloquerJoursBtn.textContent = "Valider";
        annulerSelectionBtn.style.display = "inline-block";
        rendreJoursCliquables();
    } else {
        const confirmation = confirm("⚠️ Confirmez-vous les actions sur les jours sélectionnés ?");
        if (confirmation) {
            joursSelectionnes.forEach(jour => {
                const formattedDate = jour;

                // Vérifie si la date existe déjà dans Firebase
                window.db.collection("blockedSlots")
                    .where("Date", "==", formattedDate)
                    .where("Lieu", "==", selectedLocation)
                    .where("Text", "==", "Jour bloqué")
                    .get()
                    .then(snapshot => {
                        if (!snapshot.empty) {
                            // Jour déjà bloqué → SUPPRIMER
                            snapshot.forEach(doc => {
                                window.db.collection("blockedSlots").doc(doc.id).delete().then(() => {
                                    console.log(`🗑️ Supprimé : ${formattedDate}`);
                                });
                            });
                        } else {
                            // Jour pas encore bloqué → AJOUTER
                            window.db.collection("blockedSlots").add({
                                Date: formattedDate,
                                Lieu: selectedLocation,
                                Text: "Jour bloqué"
                            }).then(() => {
                                console.log(`✅ Bloqué : ${formattedDate}`);
                            });
                        }
                    })
                    .catch(error => {
                        console.error("🔥 Erreur Firebase : ", error);
                    });
            });

            resetSelection();
            updateCalendar();
        }
    }
});

// Clic sur "Annuler"
annulerSelectionBtn.addEventListener('click', () => {
    const confirmCancel = confirm("❌ Annuler la sélection de jours ?");
    if (confirmCancel) {
        resetSelection();
    }
});

function rendreJoursCliquables() {
    joursSelectionnes = [];
    document.querySelectorAll('.jour').forEach(cell => {
        cell.classList.add('jour-selectable');
        cell.addEventListener('click', () => {
            const date = cell.dataset.date;
            if (!date) return;

            if (joursSelectionnes.includes(date)) {
                joursSelectionnes = joursSelectionnes.filter(d => d !== date);
                cell.classList.remove('jour-selectionne');
                console.log("🔄 Jour désélectionné :", date);
            } else {
                joursSelectionnes.push(date);
                cell.classList.add('jour-selectionne');
                console.log("✅ Jour sélectionné :", date);
            }

            console.log("📦 Jours sélectionnés actuellement :", joursSelectionnes);
        });
    });
}

function resetSelection() {
    modeSelectionJours = false;
    bloquerJoursBtn.textContent = "Bloquer Jours";
    annulerSelectionBtn.style.display = "none";

    document.querySelectorAll('.jour').forEach(cell => {
        cell.classList.remove('jour-selectable');
        cell.classList.remove('jour-selectionne');
    });

    joursSelectionnes = [];
}

    // Fonction pour vérifier si la date est dans le mois précédent
    function isDateInPreviousMonth(dateValue) {
        let dateToCheck;
    
        if (!dateValue) {
            console.error("❌ Date manquante :", dateValue);
            return false;
        }
    
        if (typeof dateValue === 'string') {
            const [day, month, year] = dateValue.split('-').map(num => parseInt(num, 10));
            if (isNaN(day) || isNaN(month) || isNaN(year)) {
                console.error("❌ Format de la date invalide :", dateValue);
                return false;
            }
            dateToCheck = new Date(year, month - 1, day);
        } else if (typeof dateValue === 'object' && typeof dateValue.toDate === 'function') {
            // Firestore Timestamp
            dateToCheck = dateValue.toDate();
        } else if (dateValue instanceof Date) {
            dateToCheck = dateValue;
        } else {
            console.error("❌ Format de date non pris en charge :", dateValue);
            return false;
        }
    
        const now = new Date();
        const previousMonth = (now.getMonth() === 0) ? 11 : now.getMonth() - 1;
        const yearOfPreviousMonth = (now.getMonth() === 0) ? now.getFullYear() - 1 : now.getFullYear();
    
        return (
            dateToCheck.getMonth() === previousMonth &&
            dateToCheck.getFullYear() === yearOfPreviousMonth
        );
    }
    
        // Fonction pour supprimer les données du mois précédent dans les 3 collections
        async function clearPreviousMonthData() {
            const collections = ['reservationDetails', 'non-reservable', 'blockedSlots'];
        
            for (let collection of collections) {
                console.log(`🔍 Lecture de la collection : ${collection}`);
                const snapshot = await window.db.collection(collection).get();
                console.log(`📄 Nombre de documents récupérés : ${snapshot.size}`);
        
                snapshot.forEach(doc => {
                    const data = doc.data();
                    const date = data['date'] || data['Date'];
                    console.log(`🧪 Lecture date: ${date} | Doc ID: ${doc.id} | Collection: ${collection}`);

        
                    console.log(`➡️ Doc ID: ${doc.id} | Date: ${date}`);
        
                    if (date && isDateInPreviousMonth(date)) {
                        console.log(`🗑️ Suppression du document ${doc.id}`);
                        doc.ref.delete().catch(error => {
                            console.error(`❌ Erreur lors de la suppression du doc ${doc.id} :`, error);
                        });
                    } else {
                        console.log(`⏭️ Pas de suppression pour ${doc.id}`);
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

    function surlignerJoursBloques() {
        const db = window.db;
        const location = selectedLocation;
        const buttons = document.querySelectorAll(".day-button");
    
        if (!location || buttons.length === 0) return;
    
        let datesAffichees = Array.from(buttons).map(btn => btn.dataset.date);
    
        db.collection("blockedSlots")
            .where("Lieu", "==", location)
            .where("Text", "==", "Jour bloqué")
            .get()
            .then(snapshot => {
                snapshot.forEach(doc => {
                    const data = doc.data();
                    const dateBloquee = data.Date;
    
                    buttons.forEach(btn => {
                        if (btn.dataset.date === dateBloquee) {
                            btn.classList.add("jour-bloque");
                        }
                    });
                });
            })
            .catch(error => {
                console.error("Erreur Firebase dans surlignerJoursBloques :", error);
            });
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

            dayButton.addEventListener("click", function () {
                const selectedDate = this.dataset.date;
            
                if (modeSelectionJours) {
                    if (joursSelectionnes.includes(selectedDate)) {
                        joursSelectionnes = joursSelectionnes.filter(d => d !== selectedDate);
                        this.classList.remove("jour-selectionne");
                    } else {
                        joursSelectionnes.push(selectedDate);
                        this.classList.add("jour-selectionne");
                    }
                    return;
                }
            
                // Mode normal (sélection simple)
                document.querySelectorAll(".day-button").forEach(btn => btn.classList.remove("selected"));
                this.classList.add("selected");
            
                if ((document.getElementById("btn-paris").classList.contains("selected") ||
                     document.getElementById("btn-bandol").classList.contains("selected")) &&
                     document.querySelector('.day-button.selected')) {
                    showTable(this.dataset.date);
                }
            });
            
            if (modeSelectionJours && joursSelectionnes.includes(formattedDate)) {
                dayButton.classList.add("jour-selectionne");
            }            

            calendarContainer.appendChild(dayButton);
        }

        surlignerJoursBloques();
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
