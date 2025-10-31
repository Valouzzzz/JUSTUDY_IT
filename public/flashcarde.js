let categories = ["Général"]; // Liste de catégories de base
let flashcards = []; // Stockage des flashcards en mémoire

// Charger les flashcards et les catégories existantes
window.addEventListener("DOMContentLoaded", function() {
    fetch("/get-flashcards")
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                flashcards = data.flashcards;
                flashcards.forEach(addFlashcardToList);
                updateCategoryOptions();
            } else {
                console.error("Erreur lors de la récupération des flashcards.");
            }
        })
        .catch(error => console.error("Erreur:", error));
});

// Mise à jour des options de catégorie dans les listes déroulantes
function updateCategoryOptions() {
    const categorySelect = document.getElementById("category");
    const filterSelect = document.getElementById("filterCategory");

    // Efface les options actuelles
    categorySelect.innerHTML = '<option value="">Sélectionner une catégorie</option>';
    filterSelect.innerHTML = '<option value="">Toutes les catégories</option>';

    // Ajouter les catégories
    categories.forEach(category => {
        const option = document.createElement("option");
        option.value = category;
        option.textContent = category;
        categorySelect.appendChild(option);
        filterSelect.appendChild(option.cloneNode(true));
    });
}

// Ajout d'une nouvelle catégorie
document.getElementById("addCategoryButton").addEventListener("click", function() {
    const newCategoryInput = document.getElementById("newCategory");
    const newCategory = newCategoryInput.value.trim();

    if (newCategory && !categories.includes(newCategory)) {
        categories.push(newCategory);
        updateCategoryOptions();
        newCategoryInput.value = "";
    }
});

// Gestion de la soumission du formulaire
document.getElementById("flashcardForm").addEventListener("submit", function(e) {
    e.preventDefault();
    
    const question = document.getElementById("question").value;
    const answer = document.getElementById("answer").value;
    const category = document.getElementById("category").value;

    const flashcard = { question, answer, category };

    fetch("/save-flashcard", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(flashcard)
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            flashcards.push(flashcard);
            addFlashcardToList(flashcard);
            document.getElementById("flashcardForm").reset();
        } else {
            console.error("Erreur lors de la sauvegarde de la flashcard.");
        }
    })
    .catch(error => console.error("Erreur:", error));
});

// Ajouter la flashcard à la liste
function addFlashcardToList(flashcard) {
    const list = document.getElementById("flashcardList");

    const listItem = document.createElement("li");
    listItem.className = "flashcard";

    // Afficher la question et la catégorie
    const questionElement = document.createElement("div");
    questionElement.textContent = `${flashcard.question} (${flashcard.category})`;
    questionElement.className = "question";
    listItem.appendChild(questionElement);

    // Ajouter la réponse (cachée)
    const answerElement = document.createElement("div");
    answerElement.textContent = flashcard.answer;
    answerElement.className = "answer";
    answerElement.style.display = "none";
    listItem.appendChild(answerElement);

    listItem.addEventListener("click", function() {
        if (questionElement.style.display === "none") {
            questionElement.style.display = "block";
            answerElement.style.display = "none";
        } else {
            questionElement.style.display = "none";
            answerElement.style.display = "block";
        }
    });

    const deleteButton = document.createElement("button");
    deleteButton.textContent = "Supprimer";
    deleteButton.className = "delete-button";
    deleteButton.addEventListener("click", function(e) {
        e.stopPropagation();
        deleteFlashcard(listItem, flashcard);
    });
    listItem.appendChild(deleteButton);

    list.appendChild(listItem);
}

// Filtrage des flashcards par catégorie
document.getElementById("filterCategory").addEventListener("change", function() {
    const selectedCategory = this.value;
    document.getElementById("flashcardList").innerHTML = "";

    flashcards
        .filter(flashcard => !selectedCategory || flashcard.category === selectedCategory)
        .forEach(addFlashcardToList);
});

// Suppression de la flashcard
function deleteFlashcard(listItem, flashcard) {
    fetch("/delete-flashcard", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(flashcard)
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            listItem.remove();
            flashcards = flashcards.filter(f => f !== flashcard);
        } else {
            console.error("Erreur lors de la suppression de la flashcard.");
        }
    })
    .catch(error => console.error("Erreur:", error));
}

document.getElementById("downloadJson").addEventListener("click", () => {
    // Crée un lien pour télécharger le vrai fichier JSON à la racine
    const link = document.createElement("a");
    link.href = "/flashcarde.json"; // le fichier est à la racine du serveur
    link.download = "flashcarde.json"; // nom du fichier à enregistrer
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
});
