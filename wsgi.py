"""
WSGI Entry Point para deploy no Render
Importa a aplicação Flask do módulo src.main
"""
import sys
import os

# Adiciona o diretório raiz ao path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

# Importa a aplicação Flask
from src.main import app

# Expõe a aplicação para o Gunicorn
application = app

if __name__ == "__main__":
    # Para testes locais
    app.run()
