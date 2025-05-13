from fastapi import FastAPI, Request
from fastapi.responses import StreamingResponse, JSONResponse
from langchain_huggingface import HuggingFaceEmbeddings  
from langchain_chroma import Chroma 
from fastapi.middleware.cors import CORSMiddleware
import requests
import io

app = FastAPI()

# Embedding modèle HuggingFace
# Utilisation de HuggingFaceEmbeddings pour le modèle d'embedding
embedding_function = HuggingFaceEmbeddings(model_name="all-MiniLM-L6-v2") 

CHROMA_PATH = "./chroma"

# Charger la base Chroma
db = Chroma(persist_directory=CHROMA_PATH, embedding_function=embedding_function) 

origins = [
    "http://localhost:5173",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "OPTIONS"], 
    allow_headers=["*"], 
)

@app.get("/api/check_documents")
async def check_documents():
    # Récupérer tous les documents
    results = db.similarity_search('GRILLE A', k=3)

    if not results:
        return JSONResponse(content={"error": "Aucun document trouvé dans la base de données Chroma"}, status_code=404)

    # Formater les détails des documents
    doc_details = [
        {"metadata": result.metadata, "content": result.page_content[:200]}
        for result in results
    ]

    return JSONResponse(content={"documents": doc_details}, status_code=200)

@app.post("/api/chat")
async def chat(request: Request):
    data = await request.json()
    question = data.get("prompt")

    if not question:
        return JSONResponse(content={"error": "Prompt manquant"}, status_code=400)

    # Étape 1 : récupération des documents les plus pertinents
    docs = db.similarity_search(question, k=3)
    if not docs:
        print(f"Aucun document trouvé pour la question: {question}")
        return JSONResponse(content={"error": "Aucun document trouvé pour la question"}, status_code=404)
    else:
        print(f"Documents trouvés: {len(docs)}")
        for doc in docs:
            print(f"Document : {doc.metadata.get('source', 'Inconnu')} - {doc.page_content[:200]}...")

    context = "\n\n".join([doc.page_content for doc in docs])

    # Étape 2 : Création du prompt avec contexte
    final_prompt = f"""
Voici des extraits de documents :
{context}

Réponds précisément à cette question en t’appuyant sur ces documents :
{question}
"""

    # Étape 3 : Appel à Ollama en local avec streaming
    try:
        response = requests.post(
            "http://localhost:11434/api/generate",
            json={
                "model": "mistral",
                "prompt": final_prompt,
                "stream": True
            },
            stream=True  # Utiliser stream pour recevoir des données en flux
        )

        # Vérifie le statut de la réponse
        if response.status_code != 200:
            return JSONResponse(content={"error": "Erreur de génération avec Ollama"}, status_code=500)

        # Créer un générateur pour envoyer les morceaux de réponse
        def generate_stream():
            for chunk in response.iter_content(chunk_size=1024):
                if chunk:
                    # Décode chaque morceau et l'envoie immédiatement
                    yield chunk.decode('utf-8')

        # Retourner la réponse en streaming au frontend
        return StreamingResponse(generate_stream(), media_type="text/plain")

    except Exception as e:
        return JSONResponse(content={"error": f"Erreur lors de l'appel à Ollama: {str(e)}"}, status_code=500)
