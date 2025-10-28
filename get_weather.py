import requests 
from bs4 import BeautifulSoup
import unicodedata

# URL de la page météo
url = "https://www.lachainemeteo.com/meteo-france/ville-33/previsions-meteo-paris-aujourdhui"

def remove_accents(text):
    # Normaliser le texte en NFKD et filtrer les caractères combinés (accents)
    return ''.join(c for c in unicodedata.normalize('NFKD', text) if not unicodedata.combining(c))

def get_weather_info():
    # Faire une requête pour obtenir le contenu de la page
    response = requests.get(url)

    if response.status_code == 200:
        # S'assurer que l'encodage est bien en UTF-8
        response.encoding = 'utf-8'

        # Parser le contenu HTML
        soup = BeautifulSoup(response.text, 'html.parser')
        
        # Trouver la balise h3 avec la classe "textator"
        weather_info = soup.find('h3', class_='textator')
        
        if weather_info:
            # Retourner les informations météo sans accents
            return remove_accents(weather_info.get_text(strip=True))
        else:
            return "Les informations meteo ne sont pas disponibles."
    else:
        return "Erreur lors de la recuperation de la page."

# Exemple d'utilisation
if __name__ == "__main__":
    weather = get_weather_info()
    print(weather)
