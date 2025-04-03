const generateCorrectionPrompt = (text: string, mode: 'formelle' | 'informelle') => {
  if (mode === 'formelle') {
    return `Tu es un correcteur professionnel francophone. Examine le texte suivant pour :
1. Les erreurs grammaticales
2. Les fautes d'orthographe
3. La ponctuation
4. Le style formel et très poli,professionnel
5. Le choix des mots

Fournis d'abord la version corrigée du texte.
Puis, liste chaque correction avec une brève explication en français.
Format de la réponse :

TEXTE CORRIGÉ :
[Version corrigée]

CORRECTIONS ET EXPLICATIONS :
• [Première correction] : [Explication]
• [Deuxième correction] : [Explication]
(etc.)

Voici le texte à examiner :
"""${text}"""`;
  }

  if (mode === 'informelle') {
    return `Tu es un correcteur professionnel francophone. Examine le texte suivant pour :
1. Les erreurs grammaticales
2. Les fautes d'orthographe
3. La ponctuation
4. Le style informel et conversationnel
5. Le choix des mots

Fournis d'abord la version corrigée du texte.
Puis, liste chaque correction avec une brève explication en français.
Format de la réponse :

TEXTE CORRIGÉ :
[Version corrigée]

CORRECTIONS ET EXPLICATIONS :
• [Première correction] : [Explication]
• [Deuxième correction] : [Explication]
(etc.)

Voici le texte à examiner :
"""${text}"""`;
  }

  throw new Error('Mode de correction invalide');
};

const parseCorrectionResponse = (response: string) => {
  const cleanResponse = response.trim();

  const correctedMatch = cleanResponse.match(/TEXTE CORRIGÉ :\s*([\s\S]*?)(?=CORRECTIONS ET EXPLICATIONS :|$)/i);
  const correctionsMatch = cleanResponse.match(/CORRECTIONS ET EXPLICATIONS :\s*([\s\S]*?)$/i);

  const correctedText = correctedMatch ? correctedMatch[1].trim() : cleanResponse;
  let suggestions: string[] = [];

  if (correctionsMatch) {
    suggestions = correctionsMatch[1]
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.startsWith('•'))
      .map(line => line.substring(1).trim());
  }

  return {
    correctedText,
    suggestions: suggestions.length > 0 ? suggestions : undefined,
  };
};

export const correctText = async (text: string, mode: 'formelle' | 'informelle') => {
  try {
    if (!text.trim()) {
      throw new Error('Le texte ne peut pas être vide');
    }

    const response = await fetch('/api/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'mistral',
        prompt: generateCorrectionPrompt(text, mode), // Pass the mode to the prompt generator
        stream: false,
        options: {
          temperature: 0.3,
          top_p: 0.95,
          top_k: 40,
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

    return parseCorrectionResponse(data.response);
  } catch (error) {
    console.error('Erreur lors de la correction via Ollama:', error);
    throw new Error(
      error instanceof Error
        ? error.message
        : 'Impossible de se connecter à Ollama pour la correction.'
    );
  }
};
