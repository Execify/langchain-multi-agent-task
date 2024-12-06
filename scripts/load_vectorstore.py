from docling.document_converter import DocumentConverter
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain_community.vectorstores import Chroma
from langchain_openai import OpenAIEmbeddings
import os
from dotenv import load_dotenv

load_dotenv()

os.environ["OPENAI_API_KEY"] = os.getenv("OPENAI_API_KEY")

result = DocumentConverter().convert("./data/Cat.pdf")
md = result.document.export_to_markdown()
print("Text extracted")

text_splitter = RecursiveCharacterTextSplitter(chunk_size=150, chunk_overlap=20)
text_chunks = text_splitter.split_text(md)
print("Text split")

PERSIST_DIRECTORY = "../chroma_db"

vectorstore = Chroma.from_texts(
    texts=text_chunks,
    embedding=OpenAIEmbeddings(),
    persist_directory=PERSIST_DIRECTORY
)

vectorstore.persist()

print("Vector store created")

test_query = "How good is a cats eyesight?"
print(f"Querying vector store: `{test_query}`")
results = vectorstore.similarity_search(test_query, k=3)
print(results)
