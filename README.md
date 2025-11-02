# 🤖 Agente Fiscal - Sistema de Análise de Notas Fiscais

Sistema inteligente para análise e gestão de notas fiscais eletrônicas (NF-e) com integração de IA para consultas e relatórios.

## 📋 Descrição

O Agente Fiscal é uma aplicação web desenvolvida em Python/Flask que permite:

- 📄 Upload e processamento de notas fiscais (XML e PDF)
- 💬 Chat interativo com IA (Google Gemini) para consultas sobre documentos
- 📊 Dashboard para visualização e análise de dados fiscais
- 🔐 Sistema de autenticação de usuários
- 📈 Geração de relatórios e insights fiscais

## 🚀 Tecnologias

- **Backend**: Python 3.11, Flask, SQLAlchemy
- **Frontend**: HTML, CSS, JavaScript
- **IA**: Google Gemini API, LangChain
- **Banco de Dados**: SQLite
- **Processamento**: PDFPlumber, XML Parser
- **Deploy**: Render (PaaS)

## 📦 Instalação Local

### Pré-requisitos

- Python 3.11+
- pip
- Git

### Passos

1. Clone o repositório:

```bash
git clone https://github.com/IgorToebe/Trabalho-final-I2A2.git
cd "Trabalho-final-I2A2 - HTML"
```

2. Crie um ambiente virtual:

```bash
python -m venv venv
venv\Scripts\activate  # Windows
# ou
source venv/bin/activate  # Linux/Mac
```

3. Instale as dependências:

```bash
cd agente-fiscal
pip install -r requirements.txt
```

4. Configure as variáveis de ambiente:

```bash
# Copie o arquivo de exemplo
copy .env.example .env  # Windows
# ou
cp .env.example .env  # Linux/Mac

# Edite o arquivo .env e adicione sua chave API do Gemini
```

5. Inicialize o banco de dados:

```bash
python init_db.py
```

6. Execute a aplicação:

```bash
python src/main.py
```

7. Acesse no navegador:

```
http://localhost:5000
```

## 🌐 Deploy no Render

### Passos para Deploy:

1. **Obter Chave API do Gemini**

   - Acesse: https://makersuite.google.com/app/apikey
   - Faça login e gere sua chave API

2. **Push para GitHub**

   ```bash
   git add .
   git commit -m "Deploy para Render"
   git push origin main
   ```

3. **Configurar no Render**

   - Acesse: https://dashboard.render.com/
   - Clique em "New +" → "Blueprint"
   - Conecte seu repositório GitHub
   - Configure a variável `GEMINI_API_KEY`
   - Clique em "Apply"

4. **Aguarde o Deploy** (~10 minutos)
   - O Render fará build e deploy automaticamente
   - Sua aplicação estará disponível em: `https://seu-app.onrender.com`

## 📁 Estrutura do Projeto

```
agente-fiscal/
├── src/
│   ├── main.py              # Aplicação Flask principal
│   ├── routes/              # Rotas da API
│   │   ├── auth.py          # Autenticação
│   │   ├── chat.py          # Chat com IA
│   │   ├── dashboard.py     # Dashboard
│   │   └── documents.py     # Upload de documentos
│   ├── services/            # Serviços
│   │   ├── gemini_service.py   # Integração Gemini
│   │   └── chat_manager.py     # Gerenciamento de chat
│   ├── models/              # Modelos do banco
│   │   ├── usuario.py
│   │   └── nota_fiscal.py
│   ├── processors/          # Processadores
│   │   ├── xml_processor.py
│   │   └── pdf_extractor.py
│   ├── database/            # Banco de dados
│   │   └── connection.py
│   ├── templates/           # Templates HTML
│   └── static/              # CSS, JS, Imagens
├── requirements.txt         # Dependências
└── init_db.py              # Script de inicialização do BD
```

## 🔐 Variáveis de Ambiente

| Variável         | Descrição                         | Obrigatória           |
| ---------------- | --------------------------------- | --------------------- |
| `GEMINI_API_KEY` | Chave API do Google Gemini        | ✅ Sim                |
| `SECRET_KEY`     | Chave secreta Flask               | ✅ Sim                |
| `FLASK_ENV`      | Ambiente (development/production) | ❌ Não                |
| `PORT`           | Porta do servidor                 | ❌ Não (padrão: 5000) |

## 🎯 Funcionalidades

### 1. Autenticação

- Registro de novos usuários
- Login com CNPJ e senha
- Sistema de sessões seguro

### 2. Upload de Documentos

- Suporte para XML (NF-e)
- Suporte para PDF
- Extração automática de dados
- Validação de formato

### 3. Chat Inteligente

- Consultas em linguagem natural
- Contexto sobre notas fiscais
- Histórico de conversas
- Respostas baseadas em documentos

### 4. Dashboard

- Visualização de notas fiscais
- Filtros e pesquisa
- Estatísticas e métricas
- Exportação de dados

## 🧪 Testes

O projeto inclui arquivos de teste em `nfe_simuladas_v2/`:

- Notas fiscais de entrada (2006-2010)
- Notas fiscais de saída (1001-1005)

## 🛠️ Desenvolvimento

### Arquivos Removidos na Limpeza

- ❌ `__pycache__/` - Cache do Python
- ❌ `backup/` - Backups antigos
- ❌ `test_*.py` - Scripts de teste
- ❌ `check_*.py` - Scripts de verificação
- ❌ `run.bat` - Arquivo específico do Windows
- ❌ `*.db` - Bancos de dados locais

### Arquivos Essenciais Mantidos

- ✅ Código fonte (`src/`)
- ✅ Dependências (`requirements.txt`)
- ✅ Configurações de deploy
- ✅ Documentação
- ✅ Templates e assets

## 📝 Documentação Técnica Adicional

- [MELHORIAS_REALIZADAS.md](MELHORIAS_REALIZADAS.md) - Histórico de melhorias do projeto
- [GUIA_TESTES.md](agente-fiscal/GUIA_TESTES.md) - Guia de testes da aplicação
- [MEMORIA_CHAT.md](agente-fiscal/MEMORIA_CHAT.md) - Documentação do sistema de chat
- [INTEGRACAO_RBT12.md](agente-fiscal/INTEGRACAO_RBT12.md) - Documentação da integração RBT12

## 🤝 Contribuindo

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## 📄 Licença

Este projeto está licenciado sob a Licença MIT — veja o arquivo `LICENSE` para mais detalhes.

(Copyright: Equipe Nexa, 2025)

## 👨‍💻 Autor

Equipe Nexa.

## 🙏 Agradecimentos

- Google Gemini API
- Flask Framework
- Render Platform
- Comunidade Python
- I2A2
- Meta

---

**Desenvolvido com ❤️ para I2A2 - Outubro 2025**
