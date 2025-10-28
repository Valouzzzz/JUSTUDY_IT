// Éléments du DOM 
const taskForm = document.getElementById('taskForm');
const taskList = document.getElementById('taskList');
const scheduleInput = document.getElementById('scheduleInput');
const scheduleImage = document.getElementById('scheduleImage');

// Boutons pour afficher toutes les tâches ou les trois premières
const showAllTasksButton = document.createElement('button');
const showFirstThreeTasksButton = document.createElement('button');
showAllTasksButton.textContent = 'Tout afficher';
showFirstThreeTasksButton.textContent = 'Réduire';

// Ajout des boutons après la liste de tâches
taskList.parentNode.insertBefore(showAllTasksButton, taskList.nextSibling);
taskList.parentNode.insertBefore(showFirstThreeTasksButton, showAllTasksButton.nextSibling);

// Cacher le bouton de réduction par défaut
showFirstThreeTasksButton.style.display = 'none';

// Fonction pour afficher uniquement les trois premières tâches triées par date
function displayFirstThreeTasks(tasks) {
    taskList.innerHTML = '';
    // Trier les tâches par date d'échéance
    tasks.sort((a, b) => new Date(a.deadline) - new Date(b.deadline));
    const firstThreeTasks = tasks.slice(0, 3);
    firstThreeTasks.forEach(task => {
        const li = document.createElement('li');
        li.classList.toggle('completed', task.completed);
        li.innerHTML = `<span>${task.name} - ${task.desc} (À faire avant : ${task.deadline})</span>
                        <button onclick="completeTask(this)">Terminer</button>
                        <button onclick="deleteTask(this)">Supprimer</button>`;
        taskList.appendChild(li);
    });
}

// Fonction pour afficher toutes les tâches triées par date
function displayAllTasks(tasks) {
    taskList.innerHTML = '';
    // Trier les tâches par date d'échéance
    tasks.sort((a, b) => new Date(a.deadline) - new Date(b.deadline));
    tasks.forEach(task => {
        const li = document.createElement('li');
        li.classList.toggle('completed', task.completed);
        li.innerHTML = `<span>${task.name} - ${task.desc} (À faire avant : ${task.deadline})</span>
                        <button onclick="completeTask(this)">Terminer</button>
                        <button onclick="deleteTask(this)">Supprimer</button>`;
        taskList.appendChild(li);
    });
}

// Charger et afficher les trois premières tâches par défaut, triées par date
function fetchTasks(initialLoad = false) {
    fetch('/tasks')
        .then(response => response.json())
        .then(tasks => {
            // Trier les tâches par date d'échéance avant de les afficher
            tasks.sort((a, b) => new Date(a.deadline) - new Date(b.deadline));
            if (initialLoad) {
                displayFirstThreeTasks(tasks);
            } else {
                displayAllTasks(tasks);
            }
        })
        .catch(error => console.error('Erreur lors de la récupération des tâches:', error));
}

// Gestion des boutons pour basculer l'affichage
showAllTasksButton.addEventListener('click', () => {
    fetch('/tasks')
        .then(response => response.json())
        .then(tasks => {
            displayAllTasks(tasks);
            showAllTasksButton.style.display = 'none';
            showFirstThreeTasksButton.style.display = 'inline';
        })
        .catch(error => console.error('Erreur lors de la récupération des tâches:', error));
});

showFirstThreeTasksButton.addEventListener('click', () => {
    fetch('/tasks')
        .then(response => response.json())
        .then(tasks => {
            displayFirstThreeTasks(tasks);
            showAllTasksButton.style.display = 'inline';
            showFirstThreeTasksButton.style.display = 'none';
        })
        .catch(error => console.error('Erreur lors de la récupération des tâches:', error));
});

// Éléments pour le gestionnaire de tâches
const newTaskInput = document.getElementById('new-task'); // Assurez-vous que cet ID existe
const addTaskButton = document.getElementById('add-task-button'); // Assurez-vous que cet ID existe

// Événement pour le formulaire de tâches
taskForm.addEventListener('submit', function (e) {
    e.preventDefault();

    const title = document.getElementById('taskTitle').value;
    const desc = document.getElementById('taskDesc').value;
    const deadline = document.getElementById('taskDeadline').value;

    addTask(title, desc, deadline);
    taskForm.reset();
});

// Fonction pour ajouter une tâche à la liste et l'envoyer au serveur
function addTask(title, desc, deadline, completed = false) {
    const li = document.createElement('li');
    li.classList.toggle('completed', completed); // Ajouter la classe "completed" si la tâche est déjà complétée
    li.innerHTML = `<span>${title} - ${desc} (À faire avant : ${deadline})</span> 
                    <button onclick="completeTask(this)">Terminer</button>
                    <button onclick="deleteTask(this)">Supprimer</button>`;
    taskList.appendChild(li);

    // Envoyer la tâche au serveur
    fetch('/tasks', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name: title, desc: desc, deadline: deadline, completed: completed }),
    })
        .then(response => response.json())
        .then(data => console.log('Tâche ajoutée:', data))
        .catch(error => console.error('Erreur lors de l\'ajout de la tâche:', error));
}

// Fonction pour marquer une tâche comme complétée
function completeTask(button) {
    const li = button.parentElement;
    const index = Array.from(taskList.children).indexOf(li);
    const isCompleted = li.classList.toggle('completed'); // Inverser l'état complété

    // Mettre à jour l'état de la tâche sur le serveur
    fetch(`/tasks/${index}`, {
        method: 'PUT',  // Utiliser la méthode PUT pour mettre à jour l'état
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ completed: isCompleted }),
    })
        .then(response => {
            if (!response.ok) {
                throw new Error('Erreur lors de la mise à jour de la tâche');
            }
            console.log('Tâche mise à jour');
        })
        .catch(error => console.error('Erreur lors de la mise à jour de la tâche:', error));
}

// Fonction pour supprimer une tâche
function deleteTask(button) {
    const li = button.parentElement;
    const index = Array.from(taskList.children).indexOf(li); // Trouver l'index de l'élément

    // Supprimer la tâche de l'interface utilisateur
    taskList.removeChild(li);

    // Supprimer la tâche sur le serveur
    fetch(`/tasks/${index}`, {
        method: 'DELETE',
    })
        .then(response => {
            if (!response.ok) {
                throw new Error('Erreur lors de la suppression de la tâche');
            }
            console.log('Tâche supprimée');
        })
        .catch(error => console.error('Erreur lors de la suppression de la tâche:', error));
}

// Afficher l'image de l'emploi du temps
scheduleInput.addEventListener('change', function (event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function (e) {
            scheduleImage.src = e.target.result;
            scheduleImage.style.display = 'block';
        };
        reader.readAsDataURL(file);
    }
});

// Fonction pour récupérer les prévisions météo
document.getElementById('refreshWeather').addEventListener('click', fetchWeather);

function fetchWeather() {
    fetch('/weather')
        .then(response => response.text())
        .then(data => {
            document.getElementById('weather-info').textContent = data;
        })
        .catch(error => {
            document.getElementById('weather-info').textContent = 'Erreur lors de la récupération des prévisions météo.';
            console.error('Erreur:', error);
        });
}

// Charger les informations météo au démarrage
fetchWeather();

// Charger les tâches existantes au démarrage
document.addEventListener('DOMContentLoaded', fetchTasks);

// Fonction pour récupérer et afficher les tâches
function fetchTasks() {
    fetch('/tasks')
        .then(response => response.json())
        .then(tasks => {
            taskList.innerHTML = ''; // Vider la liste pour éviter les doublons
            tasks.forEach(task => {
                const li = document.createElement('li');
                li.classList.toggle('completed', task.completed); // Ajouter la classe "completed" si nécessaire
                li.innerHTML = `<span>${task.name} - ${task.desc} (À faire avant : ${task.deadline})</span> 
                                <button onclick="completeTask(this)">Terminer</button>
                                <button onclick="deleteTask(this)">Supprimer</button>`;
                taskList.appendChild(li);
            });
        })
        .catch(error => console.error('Erreur lors de la récupération des tâches:', error));
}

// Gestion des notes
const noteForm = document.getElementById('noteForm');
const noteList = document.getElementById('noteList');
const noteChartCtx = document.getElementById('notesChart').getContext('2d');
let notesChart;

// Charger les notes au démarrage
document.addEventListener('DOMContentLoaded', fetchNotes);

// Événement pour le formulaire de notes
noteForm.addEventListener('submit', function (e) {
    e.preventDefault();

    const subject = document.getElementById('noteSubject').value;
    const value = parseFloat(document.getElementById('noteValue').value);
    const coef = parseFloat(document.getElementById('noteCoef').value);  // Récupérer le coefficient
    const date = document.getElementById('noteDate').value;

    addNote(subject, value, coef, date);
    noteForm.reset();
});

// Fonction pour ajouter une note et l'envoyer au serveur
function addNote(subject, value, coef, date) {
    const li = document.createElement('li');
    li.innerHTML = `<span>${subject} : ${value}/20 (Coef : ${coef}) (Date : ${date})</span>
                    <button onclick="deleteNote(this)">Supprimer</button>`;
    noteList.appendChild(li);

    // Envoyer la note au serveur
    fetch('/notes', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ subject: subject, value: value, coef: coef, date: date }),
    })
        .then(response => response.json())
        .then(data => {
            console.log('Note ajoutée:', data);
            updateChart();  // Mettre à jour le graphique
        })
        .catch(error => console.error('Erreur lors de l\'ajout de la note:', error));
}

// Fonction pour supprimer une note
function deleteNote(button) {
    const li = button.parentElement;
    const index = Array.from(noteList.children).indexOf(li);

    // Supprimer la note de l'interface utilisateur
    noteList.removeChild(li);

    // Supprimer la note sur le serveur
    fetch(`/notes/${index}`, {
        method: 'DELETE',
    })
        .then(response => {
            if (!response.ok) {
                throw new Error('Erreur lors de la suppression de la note');
            }
            console.log('Note supprimée');
            updateChart();  // Mettre à jour le graphique
        })
        .catch(error => console.error('Erreur lors de la suppression de la note:', error));
}

// Fonction pour charger les notes au démarrage et afficher le graphique
function fetchNotes() {
    fetch('/notes')
        .then(response => response.json())
        .then(notes => {
            noteList.innerHTML = '';  // Vider la liste pour éviter des doublons
            notes.forEach(note => {
                const li = document.createElement('li');
                li.innerHTML = `<span>${note.subject} : ${note.value}/20 (Coef : ${note.coef}) (Date : ${note.date})</span>
                                <button onclick="deleteNote(this)">Supprimer</button>`;
                noteList.appendChild(li);
            });
            updateChart();  // Mettre à jour le graphique après le chargement des notes
        })
        .catch(error => console.error('Erreur lors de la récupération des notes:', error));
}

// Fonction pour réinitialiser le graphique
document.getElementById('resetGraph').addEventListener('click', function () {
    notesChart.data.labels = [];
    notesChart.data.datasets[0].data = [];
    notesChart.update();
});

// Fonction pour mettre à jour le graphique
function updateChart() {
    fetch('/notes')
        .then(response => response.json())
        .then(notes => {
            const subjects = notes.map(note => note.subject);
            const values = notes.map(note => note.value);

            if (notesChart) {
                notesChart.data.labels = subjects;
                notesChart.data.datasets[0].data = values;
                notesChart.update();
            } else {
                notesChart = new Chart(noteChartCtx, {
                    type: 'bar',
                    data: {
                        labels: subjects,
                        datasets: [{
                            label: 'Notes',
                            data: values,
                            backgroundColor: 'rgba(75, 192, 192, 0.2)',
                            borderColor: 'rgba(75, 192, 192, 1)',
                            borderWidth: 1,
                        }],
                    },
                    options: {
                        scales: {
                            y: {
                                beginAtZero: true,
                            },
                        },
                    },
                });
            }
        })
        .catch(error => console.error('Erreur lors de la mise à jour du graphique:', error));
}

// Fonction pour mettre à jour la moyenne des notes
function updateAverage() {
    fetch('/notes')
        .then(response => response.json())
        .then(notes => {
            if (notes.length === 0) {
                document.getElementById('average-grade').textContent = 'Moyenne : --';
                return;
            }

            const totalWeighted = notes.reduce((sum, note) => sum + note.value * note.coef, 0);
            const totalCoef = notes.reduce((sum, note) => sum + note.coef, 0);
            const average = totalWeighted / totalCoef;

            document.getElementById('average-grade').textContent = `Moyenne : ${average.toFixed(2)}/20`;
        })
        .catch(error => console.error('Erreur lors du calcul de la moyenne:', error));
}

// Mettre à jour la moyenne après chaque ajout ou suppression de note
function addNote(subject, value, coef, date) {
    const li = document.createElement('li');
    li.innerHTML = `<span>${subject} : ${value}/20 (Coef : ${coef}) (Date : ${date})</span>
                    <button onclick="deleteNote(this)">Supprimer</button>`;
    noteList.appendChild(li);

    // Envoyer la note au serveur
    fetch('/notes', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ subject: subject, value: value, coef: coef, date: date }),
    })
        .then(response => response.json())
        .then(data => {
            console.log('Note ajoutée:', data);
            updateChart();  // Mettre à jour le graphique
            updateAverage(); // Mettre à jour la moyenne
        })
        .catch(error => console.error('Erreur lors de l\'ajout de la note:', error));
}

function deleteNote(button) {
    const li = button.parentElement;
    const index = Array.from(noteList.children).indexOf(li);

    // Supprimer la note de l'interface utilisateur
    noteList.removeChild(li);

    // Supprimer la note sur le serveur
    fetch(`/notes/${index}`, {
        method: 'DELETE',
    })
        .then(response => {
            if (!response.ok) {
                throw new Error('Erreur lors de la suppression de la note');
            }
            console.log('Note supprimée');
            updateChart();  // Mettre à jour le graphique
            updateAverage(); // Mettre à jour la moyenne
        })
        .catch(error => console.error('Erreur lors de la suppression de la note:', error));
}

// Charger les notes existantes et mettre à jour la moyenne au démarrage
function fetchNotes() {
    fetch('/notes')
        .then(response => response.json())
        .then(notes => {
            noteList.innerHTML = '';  // Vider la liste pour éviter des doublons
            notes.forEach(note => {
                const li = document.createElement('li');
                li.innerHTML = `<span>${note.subject} : ${note.value}/20 (Coef : ${note.coef}) (Date : ${note.date})</span>
                                <button onclick="deleteNote(this)">Supprimer</button>`;
                noteList.appendChild(li);
            });
            updateChart();  // Mettre à jour le graphique après le chargement des notes
            updateAverage(); // Mettre à jour la moyenne après le chargement des notes
        })
        .catch(error => console.error('Erreur lors de la récupération des notes:', error));
}

// Éléments pour gérer les boutons de visualisation des notes
const showAllNotesButton = document.createElement('button');
const showLastThreeNotesButton = document.createElement('button');
showAllNotesButton.textContent = 'Tout afficher';
showLastThreeNotesButton.textContent = 'Reduire';

// Ajout des boutons à la page (juste après le liste des notes)
noteList.parentNode.insertBefore(showAllNotesButton, noteList.nextSibling);
noteList.parentNode.insertBefore(showLastThreeNotesButton, showAllNotesButton.nextSibling);

// Cacher le bouton pour revenir aux 3 dernières notes par défaut
showLastThreeNotesButton.style.display = 'none';

// Fonction pour afficher uniquement les 3 dernières notes
function displayLastThreeNotes(notes) {
    noteList.innerHTML = '';
    const lastThreeNotes = notes.slice(-3);
    lastThreeNotes.forEach(note => {
        const li = document.createElement('li');
        li.innerHTML = `<span>${note.subject} : ${note.value}/20 (Coef : ${note.coef}) (Date : ${note.date})</span>
                        <button onclick="deleteNote(this)">Supprimer</button>`;
        noteList.appendChild(li);
    });
}

// Fonction pour afficher toutes les notes
function displayAllNotes(notes) {
    noteList.innerHTML = '';
    notes.forEach(note => {
        const li = document.createElement('li');
        li.innerHTML = `<span>${note.subject} : ${note.value}/20 (Coef : ${note.coef}) (Date : ${note.date})</span>
                        <button onclick="deleteNote(this)">Supprimer</button>`;
        noteList.appendChild(li);
    });
}

// Charger et afficher les 3 dernières notes par défaut
function fetchNotes(initialLoad = false) {
    fetch('/notes')
        .then(response => response.json())
        .then(notes => {
            if (initialLoad) {
                displayLastThreeNotes(notes);
            } else {
                displayAllNotes(notes);
            }
            updateChart(); // Mettre à jour le graphique après le chargement des notes
            updateAverage(); // Mettre à jour la moyenne après le chargement des notes
        })
        .catch(error => console.error('Erreur lors de la récupération des notes:', error));
}

// Gestion des boutons pour basculer l'affichage
showAllNotesButton.addEventListener('click', () => {
    fetch('/notes')
        .then(response => response.json())
        .then(notes => {
            displayAllNotes(notes);
            showAllNotesButton.style.display = 'none';
            showLastThreeNotesButton.style.display = 'inline';
            document.getElementById('notesChart').style.display = 'block';  // Afficher le graphique
        })
        .catch(error => console.error('Erreur lors de la récupération des notes:', error));
});

showLastThreeNotesButton.addEventListener('click', () => {
    fetch('/notes')
        .then(response => response.json())
        .then(notes => {
            displayLastThreeNotes(notes);
            showAllNotesButton.style.display = 'inline';
            showLastThreeNotesButton.style.display = 'none';
            document.getElementById('notesChart').style.display = 'none';  // Cacher le graphique
        })
        .catch(error => console.error('Erreur lors de la récupération des notes:', error));
});

// Charger les 3 dernières notes au démarrage
document.addEventListener('DOMContentLoaded', () => {
    fetchNotes(true);
});

// Gestion des boutons pour basculer l'affichage
showAllNotesButton.addEventListener('click', () => {
    fetch('/notes')
        .then(response => response.json())
        .then(notes => {
            displayAllNotes(notes);
            showAllNotesButton.style.display = 'none';
            showLastThreeNotesButton.style.display = 'inline';
            document.getElementById('chartContainer').style.display = 'block';  // Afficher le graphique et le conteneur
        })
        .catch(error => console.error('Erreur lors de la récupération des notes:', error));
});

showLastThreeNotesButton.addEventListener('click', () => {
    fetch('/notes')
        .then(response => response.json())
        .then(notes => {
            displayLastThreeNotes(notes);
            showAllNotesButton.style.display = 'inline';
            showLastThreeNotesButton.style.display = 'none';
            document.getElementById('chartContainer').style.display = 'none';  // Cacher le conteneur et le graphique
        })
        .catch(error => console.error('Erreur lors de la récupération des notes:', error));
});

// Insérer le bouton de réduction dans le conteneur du graphique
document.getElementById('chartContainer').appendChild(showLastThreeNotesButton);


// Initialiser en chargeant les trois premières tâches triées
document.addEventListener('DOMContentLoaded', () => fetchTasks(true));

// Fonction de récupération des tâches
function fetchTasks(initialLoad = false) {
    fetch('/tasks')
        .then(response => response.json())
        .then(tasks => {
            if (initialLoad) {
                displayFirstThreeTasks(tasks);  // Affiche uniquement les 3 premières tâches
            } else {
                displayAllTasks(tasks);  // Affiche toutes les tâches
            }
        })
        .catch(error => console.error('Erreur lors de la récupération des tâches:', error));
}

// Variables pour l'agenda et le formulaire d'événements
const agendaBody = document.getElementById('agendaBody');
const eventForm = document.getElementById('eventForm');
const eventTitleInput = document.getElementById('eventTitle');
const eventDescriptionInput = document.getElementById('eventDescription');
const eventDayInput = document.getElementById('eventDay');
const eventTimeInput = document.getElementById('eventTime');
const eventColorInput = document.getElementById('eventColor');
const eventDurationInput = document.getElementById('eventDuration'); // Nouveau champ pour la durée

// Fonction pour charger les événements depuis le serveur
async function loadEvents() {
    try {
        const response = await fetch('/events');
        const events = await response.json();
        events.forEach(event => displayEvent(event.title, event.description, event.day, event.time, event.color, event.duration));
    } catch (error) {
        console.error('Erreur lors du chargement des événements :', error);
    }
}

// Fonction pour afficher un événement dans l'agenda
function displayEvent(title, description, day, time, color, duration = 1) {
    const startHour = parseInt(time.split(':')[0], 10);
    const startMinutes = parseInt(time.split(':')[1], 10);

    // Parcours des créneaux horaires en fonction de la durée
    for (let i = 0; i < duration; i++) {
        const currentHour = startHour + i;
        const currentTime = `${String(currentHour).padStart(2, '0')}:${String(startMinutes).padStart(2, '0')}`;
        const cell = document.querySelector(`td[data-day="${day}"][data-time="${currentTime}"]`);

        if (cell) {
            if (i === 0) {
                cell.innerHTML = ''; // Vider le contenu précédent
                cell.textContent = title;
                cell.classList.add('eventAdded');
                cell.style.backgroundColor = color;

                // Ajouter un bouton "Détails" pour la première cellule
                const detailsButton = document.createElement('button');
                detailsButton.textContent = 'Détails';
                detailsButton.classList.add('detailsButton');
                detailsButton.addEventListener('click', () => {
                    const selectedEvent = { title, description, day, time, color, duration };
                    localStorage.setItem('selectedEvent', JSON.stringify(selectedEvent));
                    window.location.href = 'details.html';
                });
                cell.appendChild(detailsButton);
            } else {
                // Ajouter un style pour indiquer que le créneau est occupé par un événement prolongé
                cell.classList.add('eventSpan');
                cell.style.backgroundColor = color;
            }
        }
    }
}

// Ajouter un événement et l'enregistrer sur le serveur
eventForm.addEventListener('submit', async function (e) {
    e.preventDefault();

    const title = eventTitleInput.value;
    const description = eventDescriptionInput.value;
    const day = eventDayInput.value;
    const time = eventTimeInput.value;
    const color = eventColorInput.value;
    const duration = parseInt(eventDurationInput.value, 10) || 1;

    const newEvent = { title, description, day, time, color, duration };
    try {
        await fetch('/events', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(newEvent)
        });
        displayEvent(title, description, day, time, color, duration);
    } catch (error) {
        console.error('Erreur lors de l\'enregistrement de l\'événement :', error);
    }

    eventForm.reset();
});

// Génération des créneaux horaires
function generateTimeSlots() {
    const hours = ["07:00", "08:00", "09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00", "17:00", "18:00", "19:00", "20:00"];
    hours.forEach(hour => {
        const row = document.createElement('tr');
        const timeCell = document.createElement('td');
        timeCell.textContent = hour;
        row.appendChild(timeCell);

        for (let i = 0; i < 7; i++) { // 7 colonnes pour les jours de la semaine
            const cell = document.createElement('td');
            cell.dataset.day = i;
            cell.dataset.time = hour;
            cell.classList.add('timeSlot');
            row.appendChild(cell);
        }
        agendaBody.appendChild(row);
    });
}

// Charger les événements existants et générer les créneaux horaires au démarrage
document.addEventListener('DOMContentLoaded', () => {
    generateTimeSlots();
    loadEvents();
});

// Sélection du bouton de téléchargement et du conteneur de l'agenda
document.getElementById('downloadSchedule').addEventListener('click', () => {
    const agendaContainer = document.getElementById('weekAgenda');

    if (!agendaContainer) {
        console.error("L'élément weekAgenda est introuvable.");
        return;
    }

    // Utilisation de html2canvas pour capturer l'élément
    html2canvas(agendaContainer, { scale: 2 }).then(canvas => {
        canvas.toBlob(blob => {
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.download = 'emploi_du_temps.png';
            link.click();

            // Libération de l'URL pour éviter les fuites de mémoire
            URL.revokeObjectURL(link.href);
        }, 'image/png');
    }).catch(error => {
        console.error("Erreur lors de la capture de l'emploi du temps :", error);
    });
});


async function loadQuestionnaireStatus() {
        try {
            // Vérifier si un questionnaire a été fait aujourd'hui
            const todayRes = await fetch('/check-today');
            const todayData = await todayRes.json();

            const doneTodayElem = document.getElementById("doneToday");
            if (todayData.doneToday) {
                doneTodayElem.textContent = "✅1/1 questionnaire rèalisé !";
            } else {
                doneTodayElem.textContent = "❌0/1 questionnaire rèalisé !";
            }

            // Récupérer tout l'historique pour comparer avec le dernier
            const res = await fetch('/questionnaires.json');
            if (!res.ok) return;
            const allResults = await res.json();

            if (allResults.length >= 2) {
                const last = allResults[allResults.length - 1];
                const previous = allResults[allResults.length - 2];

                const progressElem = document.getElementById("progress");
                if (last.percentage > previous.percentage) {
                    progressElem.textContent = `Bravo ! Ton dernier score (${last.percentage.toFixed(2)}%) est meilleur que l'avant-dernier (${previous.percentage.toFixed(2)}%).`;
                } else if (last.percentage < previous.percentage) {
                    progressElem.textContent = `Ton dernier score (${last.percentage.toFixed(2)}%) est plus bas que l'avant-dernier (${previous.percentage.toFixed(2)}%).`;
                } else {
                    progressElem.textContent = `➡️ Ton dernier score (${last.percentage.toFixed(2)}%) est identique au précédent.`;
                }
            }
        } catch (err) {
            console.error("Erreur chargement questionnaire:", err);
        }
    }

    // Charger au démarrage
    loadQuestionnaireStatus();

// Compte à rebours
function startCountdown() {
    const targetDate = new Date('2026-01-05T09:00:00');
    function updateCountdown() {
        const now = new Date();
        const diff = targetDate - now;

        if (diff <= 0) {
            document.getElementById('countdown').textContent = 'C’est le moment !';
            clearInterval(interval);
            return;
        }

        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);

        document.getElementById('countdown').textContent = `${days}j ${hours}h ${minutes}m ${seconds}s`;
    }

    const interval = setInterval(updateCountdown, 1000);
    updateCountdown();
}

// Appel à notre serveur pour récupérer le chapitre du jour
async function fetchChapterToday() {
    try {
        const response = await fetch('/chapitre-du-jour');
        const data = await response.text(); // c'est du texte HTML
        document.getElementById('chapter-today').innerHTML = data;
    } catch (err) {
        console.error('Erreur lors de la récupération du chapitre :', err);
        document.getElementById('chapter-today').innerHTML = "Erreur lors du chargement";
    }
}

// Appel au chargement de la page
window.addEventListener('DOMContentLoaded', fetchChapterToday);

// Initialisation
document.addEventListener('DOMContentLoaded', () => {
    startCountdown();
});
