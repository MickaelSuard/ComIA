

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
        prompt: `Résumez les points clés de cette réunion en points. Concentrez-vous sur les principales décisions, les tâches assignées et les actions de suivi. Supprimez tous les détails non pertinents et créez un résumé facile à lire, détaillé et structuré. La transcription :  :\n\n""${text}""`,
        stream: false,
        options: {
          temperature: 0.7,
          top_p: 0.9,
          top_k: 50,
          num_predict: 1000,
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