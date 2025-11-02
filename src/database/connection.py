from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
import os

# Garante que o diretório do banco de dados existe
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
os.makedirs(BASE_DIR, exist_ok=True)

DB_PATH = os.path.join(BASE_DIR, "app.db")

# Configuração do engine com verificação de tipos desabilitada para SQLite
engine = create_engine(
    f"sqlite:///{DB_PATH}", 
    echo=False,
    connect_args={"check_same_thread": False}  # Necessário para Flask com threading
)
SessionLocal = sessionmaker(bind=engine)
Base = declarative_base()
