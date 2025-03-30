export const reformulateText = async (text) => {
const OLLAMA_MODEL = 'mistral';
  try {
    const response = await fetch('http://localhost:11434/api/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: OLLAMA_MODEL,
        prompt: `Vous allez recevoir la transcription d'un audio d'une réunion. Créez un résumé clair, structuré et concis en suivant ces règles :  

1. **Décisions prises** : Listez les décisions clés.  
2. **Tâches assignées** : Associez chaque tâche à son responsable.  
3. **Actions de suivi** : Notez les actions requises et leurs échéances.  
4. **Points importants** : Résumez les informations essentielles.  

Le résumé doit être précis, factuel et sans reformulation inutile. Ne conservez que les informations pertinentes.  

Transcription :  \n\n""${text}""`,
        stream: false,
        options: {
          temperature: 0.3, // Réduit la créativité pour un résumé plus factuel
          top_p: 0.8, // Utilise le top-p sampling pour la diversité
          top_k: 40, // Limite le nombre de mots à considérer pour chaque étape
        },
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      throw new Error(
        `Erreur API Ollama (${response.status}): ${errorData || response.statusText}`
      );
    }

    const data = await response.json();

    if (!data.response) {
      throw new Error('Réponse invalide de l\'API Ollama');
    }

    return data.response.trim();
  } catch (error) {
    console.error('Erreur lors de la reformulation du texte:', error);
    throw new Error(
      error instanceof Error
        ? error.message
        : 'Impossible de se connecter à Ollama pour la reformulation.'
    );
  }
};