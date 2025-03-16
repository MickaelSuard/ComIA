# OrthoIA

OrthoIA est une application web qui permet de corriger les fautes d'orthographe et de grammaire ainsi que de traduire du texte en local grâce à l'IA.

## 🚀 Fonctionnalités

- ✍️ **Correction orthographique et grammaticale** en local  
- 🌍 **Traduction automatique** de plusieurs langues  
- 🔐 **Respect de la confidentialité** : aucune donnée envoyée sur des serveurs distants  
- 🛠 **Utilisation d'Ollama et du modèle Mistral** pour l'analyse et la correction  

## 🛠️ Installation

### Prérequis
- [Node.js]
- [React.js]
- [TypeScript]
- [Ollama](https://ollama.ai/) avec le modèle Mistral installé

### Étapes d'installation
```
# Cloner le projet
git clone https://github.com/MickaelSuard/OrthoIA.git
cd OrthoIA

# Installer les dépendances
npm install

# Démarrer l'application
npm run dev
```

## 🔧️ Configuration
```
const OLLAMA_URL = '/api/generate';
const OLLAMA_MODEL = 'mistral';
```


## 🖥️️ Utilisation
```
npm run dev

http://localhost:5173/
```
- Ouvrez votre navigateur web
- Accédez à la page OrthoIA
- Saisissez votre texte et profitez des corrections et traductions automatiques

![alt text](image.png)

👨‍💻 Développé par MickaelSuard