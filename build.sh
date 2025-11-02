#!/bin/bash

# Script de build para Render
echo "🚀 Iniciando build do Agente Fiscal..."

# Navega para o diretório correto
cd agente-fiscal

# Instala as dependências
echo "📦 Instalando dependências..."
pip install -r requirements.txt

# Cria diretórios necessários
echo "📁 Criando diretórios..."
mkdir -p src/temp
mkdir -p src/database

echo "✅ Build concluído com sucesso!"
