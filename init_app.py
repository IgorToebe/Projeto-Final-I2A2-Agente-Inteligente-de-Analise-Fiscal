#!/usr/bin/env python
"""
Script de inicialização para o Render
Garante que todos os diretórios e tabelas necessários sejam criados
"""
import os
import sys

# Adiciona o diretório src ao path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'src'))

def init_app():
    """Inicializa a aplicação criando estruturas necessárias"""
    print("🔧 Inicializando aplicação...")
    
    # Cria diretórios necessários
    directories = [
        'src/temp',
        'src/database',
        'src/static/images'
    ]
    
    for directory in directories:
        dir_path = os.path.join(os.path.dirname(__file__), directory)
        os.makedirs(dir_path, exist_ok=True)
        print(f"✅ Diretório criado/verificado: {directory}")
    
    # Importa e cria as tabelas do banco de dados
    try:
        from database.connection import engine, Base
        from models.usuario import Usuario
        from models.nota_fiscal import NotaFiscal
        
        print("🗄️  Criando tabelas do banco de dados...")
        Base.metadata.create_all(bind=engine)
        print("✅ Banco de dados inicializado com sucesso!")
        
    except Exception as e:
        print(f"⚠️  Aviso ao criar banco de dados: {e}")
        print("   O banco será criado na primeira requisição.")
    
    print("🚀 Aplicação pronta!")

if __name__ == "__main__":
    init_app()
