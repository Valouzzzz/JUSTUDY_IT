// Récupérer l'événement sélectionné depuis le localStorage
const eventDetails = JSON.parse(localStorage.getItem('selectedEvent'));

if (eventDetails) {
    const detailsDiv = document.getElementById('eventDetails');

    // Afficher les détails de l'événement
    detailsDiv.innerHTML = `
        <h2>${eventDetails.title}</h2>
        <p><strong>Description :</strong> ${eventDetails.description}</p>
        <p><strong>Jour :</strong> ${eventDetails.day}</p>
        <p><strong>Heure :</strong> ${eventDetails.time}</p>
    `;

    // Bouton pour supprimer l'événement
    const deleteButton = document.createElement('button');
    deleteButton.textContent = 'Supprimer l\'événement';
    deleteButton.addEventListener('click', async () => {
        if (confirm('Voulez-vous vraiment supprimer cet événement ?')) {
            try {
                const response = await fetch('/events', {
                    method: 'DELETE',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        title: eventDetails.title,
                        day: eventDetails.day,
                        time: eventDetails.time
                    })
                });

                if (response.ok) {
                    alert('Événement supprimé.');
                    localStorage.removeItem('selectedEvent');
                    window.location.href = 'index.html';
                } else {
                    alert('Erreur lors de la suppression de l\'événement.');
                }
            } catch (error) {
                console.error('Erreur réseau :', error);
            }
        }
    });

    detailsDiv.appendChild(deleteButton);
} else {
    document.getElementById('eventDetails').textContent = 'Aucun événement sélectionné.';
}