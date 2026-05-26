from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from langchain_groq import ChatGroq
from langchain_community.vectorstores import Chroma
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_community.document_loaders import TextLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
import os
from app.core.config import GROQ_API_KEY
router = APIRouter()
# Load the file you just created
# BASE_DIR = os.getcwd()

# file_path = os.path.join(BASE_DIR, "platform-knowledge.txt")

loader = TextLoader('platform-knowledge.txt')
documents = loader.load()

# Split text into chunks so the AI can search effectively
text_splitter = RecursiveCharacterTextSplitter(chunk_size=300, chunk_overlap=30)
chunks = text_splitter.split_documents(documents)

# print(f"Created {len(chunks)} chunks from your text file.")
DB_PATH = "chroma_db" 
# Initialize the embedding model (runs on your CPU)
embeddings = HuggingFaceEmbeddings(model_name="all-MiniLM-L6-v2")

# Create the Vector Database and save it to a folder named 'db'
vector_db = Chroma.from_documents(
    documents=chunks, 
    embedding=embeddings, 
    persist_directory=DB_PATH
)

# print("Vector Database created and saved to ../chroma_db")

llm = ChatGroq(
    groq_api_key=GROQ_API_KEY,
    model="llama-3.1-8b-instant",
    temperature=0.2
)

# Request Schema
class ChatQuery(BaseModel):
    question: str

@router.post("/chat")
async def chat_with_ai(data: ChatQuery):
    try:
        # 1. Search DB for context
        docs = vector_db.similarity_search(data.question, k=2)
        context = "\n\n".join([doc.page_content for doc in docs])

        # 2. Build Prompt
        prompt = f"""
        You are an AI assistant for an Ed-Tech platform.
        Use ONLY the context below to answer the question.
        Rules:
        - Keep answer short (max 2 lines)
        - Be precise
        - No extra information
        Context: {context}
        Question: {data.question}
        Answer:
        """

        # 3. Get Response
        response = llm.invoke(prompt)
        return {"answer": response.content}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
