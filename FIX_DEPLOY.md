# 🔧 CORREÇÃO - Deploy Render

## ❌ Problema Identificado

```
ModuleNotFoundError: No module named 'app'
```

**Causa**: O Render estava tentando executar `gunicorn app:app` mas o módulo principal está em `src/main.py`.

## ✅ Solução Implementada

### 1. Criado `wsgi.py` na raiz

Arquivo de entrada WSGI que importa corretamente a aplicação Flask:

```python
# wsgi.py
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from src.main import app

application = app
```

### 2. Atualizado `render.yaml`

```yaml
startCommand: "gunicorn --bind 0.0.0.0:$PORT --workers 2 --timeout 120 wsgi:application"
```

### 3. Atualizado `Procfile`

```
web: python init_app.py && gunicorn --bind 0.0.0.0:$PORT --workers 2 --timeout 120 wsgi:application
```

## 🚀 Como Aplicar a Correção

### Passo 1: Fazer commit das mudanças

```powershell
cd "c:\Users\Nasa\Desktop\Trabalhos faculdade\I2A2\Trabalho final\Trabalho-final-I2A2"

git add .
git status  # Verificar arquivos
git commit -m "fix: Adiciona wsgi.py para corrigir deploy no Render"
git push origin main
```

### Passo 2: Aguardar redeploy automático

- O Render detectará o push e fará redeploy automaticamente
- Aguarde ~5-10 minutos
- Acompanhe os logs em: https://dashboard.render.com/

### Passo 3: Verificar deploy

Você deve ver nos logs:

```
==> Running 'gunicorn wsgi:application'
✅ Deploy successful!
Your service is live at https://agente-fiscal-xxxx.onrender.com
```

## 🧪 Testar Localmente Antes de Push

```powershell
# Testar importação do wsgi
python -c "from wsgi import application; print('OK:', application.name)"

# Testar com gunicorn local (se instalado)
gunicorn --bind 127.0.0.1:8000 wsgi:application
# Acesse: http://127.0.0.1:8000
```

## 📋 Arquivos Alterados

1. ✅ **wsgi.py** - NOVO - Entry point WSGI
2. ✅ **render.yaml** - ATUALIZADO - Comando start corrigido
3. ✅ **Procfile** - ATUALIZADO - Comando start corrigido

## 🔍 Verificação

Após o deploy, verifique:

- [ ] Aplicação acessível via URL
- [ ] Página de login carrega corretamente
- [ ] Sem erros `ModuleNotFoundError` nos logs
- [ ] Gunicorn iniciou com sucesso

## 📞 Se Ainda Houver Erro

### Verificar logs no Render:

1. Acesse: https://dashboard.render.com/
2. Selecione seu serviço
3. Vá em "Logs"
4. Procure por erros na inicialização

### Comandos úteis para debug:

```bash
# No shell do Render (se disponível)
python -c "import sys; print(sys.path)"
python -c "from wsgi import application; print(application)"
ls -la
```

## ✅ Status

- [x] wsgi.py criado
- [x] render.yaml atualizado
- [x] Procfile atualizado
- [x] Testado localmente
- [ ] Push para GitHub (PRÓXIMO PASSO!)
- [ ] Deploy no Render verificado

---

**🎯 PRÓXIMO PASSO**: Execute os comandos do Passo 1 acima!
