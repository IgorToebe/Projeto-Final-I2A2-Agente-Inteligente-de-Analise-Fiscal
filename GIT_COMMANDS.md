# 🚀 COMANDOS RÁPIDOS - GIT & DEPLOY

## 📤 Upload para GitHub

### Primeira vez (inicializar repositório):

```bash
# Inicializar Git (se ainda não foi feito)
git init

# Adicionar remote (substitua com seu repositório)
git remote add origin https://github.com/IgorToebe/Trabalho-final-I2A2.git

# Verificar branch
git branch -M main

# Adicionar todos os arquivos
git add .

# Primeiro commit
git commit -m "Initial commit - Agente Fiscal configurado para deploy"

# Push inicial
git push -u origin main
```

### Atualizações subsequentes:

```bash
# Ver status dos arquivos modificados
git status

# Adicionar todos os arquivos alterados
git add .

# Commit com mensagem descritiva
git commit -m "Descrição das mudanças realizadas"

# Push para GitHub
git push origin main
```

---

## 🔄 Workflow Recomendado

### 1. Verificar o que mudou:
```bash
git status
git diff
```

### 2. Adicionar arquivos específicos:
```bash
git add src/routes/chat.py
git add src/services/gemini_service.py
```

Ou adicionar tudo:
```bash
git add .
```

### 3. Commit descritivo:
```bash
git commit -m "feat: Adiciona memória de conversação no chat"
# ou
git commit -m "fix: Corrige erro de system_instruction no Gemini"
# ou
git commit -m "docs: Atualiza README com instruções de deploy"
```

### 4. Push:
```bash
git push origin main
```

---

## 🛡️ Verificar Antes do Push

### Checklist de Segurança:

```bash
# 1. Verificar se .env não está sendo commitado
git status | grep ".env"
# Não deve aparecer nada!

# 2. Verificar arquivos que serão enviados
git status

# 3. Verificar o conteúdo das mudanças
git diff --cached
```

### ⚠️ NUNCA COMMITE:
- ❌ `.env` (chaves API)
- ❌ `*.db` (banco de dados)
- ❌ `__pycache__/` (cache Python)
- ❌ `.venv/` (ambiente virtual)
- ❌ Senhas ou tokens

✅ O `.gitignore` já está configurado para proteger esses arquivos!

---

## 🌐 Deploy Automático no Render

### Após fazer push:

Se configurou **Auto-Deploy** no Render:
1. ✅ Push para `main` aciona deploy automaticamente
2. ✅ Aguarde 5-10 minutos
3. ✅ Verifique logs no painel Render

### Deploy Manual no Render:

1. Acesse: https://dashboard.render.com/
2. Selecione seu serviço
3. Clique em **"Manual Deploy"** → **"Deploy latest commit"**

---

## 🐛 Desfazer Mudanças (se necessário)

### Desfazer último commit (mantém arquivos):
```bash
git reset --soft HEAD~1
```

### Descartar mudanças locais:
```bash
git checkout -- nome-do-arquivo.py
```

### Reverter para commit anterior:
```bash
git log  # Ver histórico
git revert <commit-hash>
```

---

## 📋 Comandos Úteis

### Ver histórico:
```bash
git log --oneline --graph --all
```

### Ver branches:
```bash
git branch -a
```

### Criar nova branch (para testes):
```bash
git checkout -b feature/nova-funcionalidade
```

### Voltar para main:
```bash
git checkout main
```

### Atualizar do GitHub:
```bash
git pull origin main
```

---

## 🎯 Fluxo Completo de Deploy

```bash
# 1. Fazer alterações no código
code .

# 2. Testar localmente
python src/main.py

# 3. Adicionar ao Git
git add .

# 4. Commit
git commit -m "feat: Nova funcionalidade implementada"

# 5. Push para GitHub
git push origin main

# 6. Render faz deploy automático
# Aguardar ~5-10 minutos

# 7. Verificar no navegador
# https://seu-app.onrender.com
```

---

## ✅ Checklist Antes do Push

- [ ] Código testado localmente
- [ ] `.env` não está no commit
- [ ] Sem senhas ou chaves no código
- [ ] `requirements.txt` atualizado (se adicionou dependências)
- [ ] Commit message descritivo
- [ ] Arquivos desnecessários ignorados

---

## 🚨 Resolução de Problemas

### Push rejeitado:

```bash
# Atualizar antes de fazer push
git pull --rebase origin main
git push origin main
```

### Conflitos de merge:

```bash
# 1. Resolver conflitos manualmente nos arquivos
# 2. Adicionar arquivos resolvidos
git add arquivo-resolvido.py

# 3. Continuar rebase
git rebase --continue

# 4. Push
git push origin main
```

### Ver arquivos ignorados:

```bash
git status --ignored
```

---

## 📞 Ajuda Rápida

### Comandos essenciais:

| Comando | Descrição |
|---------|-----------|
| `git status` | Ver estado atual |
| `git add .` | Adicionar todos os arquivos |
| `git commit -m "msg"` | Fazer commit |
| `git push origin main` | Enviar para GitHub |
| `git pull origin main` | Baixar do GitHub |
| `git log` | Ver histórico |

### Links úteis:

- 📚 [Git Cheat Sheet](https://education.github.com/git-cheat-sheet-education.pdf)
- 🎓 [GitHub Learning Lab](https://lab.github.com/)
- 💬 [Git Documentation](https://git-scm.com/doc)

---

**💡 Dica**: Faça commits pequenos e frequentes com mensagens claras!
