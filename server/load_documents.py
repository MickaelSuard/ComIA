import os
from pathlib import Path
from langchain_community.document_loaders import TextLoader, PyPDFLoader, UnstructuredMarkdownLoader
from langchain_community.vectorstores import Chroma
from sentence_transformers import SentenceTransformer
from langchain.docstore.document import Document

# Dossiers
DOCS_PATH = "../documents"
CHROMA_PATH = "./chroma"

# Vérification du dossier des documents
if not os.path.exists(DOCS_PATH):
    raise FileNotFoundError(f"[ERROR] Le dossier '{DOCS_PATH}' n'existe pas.")

# Chargement des documents
loaders = []
for file in Path(DOCS_PATH).glob("*"):
    if file.suffix == ".txt":
        loaders.append(TextLoader(str(file), encoding="utf-8"))
    elif file.suffix == ".pdf":
        loaders.append(PyPDFLoader(str(file)))
    elif file.suffix == ".md":
        loaders.append(UnstructuredMarkdownLoader(str(file)))
    else:
        print(f"[INFO] Le fichier {file} avec l'extension {file.suffix} a été ignoré.")

documents = []
for loader in loaders:
    try:
        documents.extend(loader.load())
    except Exception as e:
        print(f"[ERROR] Erreur lors du chargement du fichier {loader}: {e}")

# Vérification du nombre de documents chargés
print(f"[INFO] {len(documents)} documents chargés.")

# Chargement du modèle local
model_name = "all-MiniLM-L6-v2"
embedding_model = SentenceTransformer(model_name)

# Wrapper de SentenceTransformer
class SentenceTransformerEmbedding:
    def __init__(self, model):
        self.model = model

    def embed_documents(self, texts):  # texts est une liste de str
        return self.model.encode(texts, show_progress_bar=True).tolist()

    def embed_query(self, query):
        return self.model.encode(query).tolist()

# Instancier le wrapper
embedding_function = SentenceTransformerEmbedding(embedding_model)

# Indexation avec Chroma
db = Chroma.from_documents(
    documents=documents,
    embedding=embedding_function,
    persist_directory=CHROMA_PATH
)
# db.persist()
print(f"[✅] Indexation terminée. Données sauvegardées dans '{CHROMA_PATH}'")


# # Test de l'indexation avec une requête simple
# test_query = "GRILLE A"
# results = db.similarity_search(test_query, k=3)

# if results:
#     print(f"[INFO] Test de recherche :")
#     for result in results:
#         print(f"  - Document trouvé : {result.metadata.get('source', 'Inconnu')} - {result.page_content[:200]}...")
# else:
#     print("[INFO] Aucun document trouvé pour la requête de test.")
