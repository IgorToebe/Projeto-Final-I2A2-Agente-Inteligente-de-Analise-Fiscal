# 🚀 COMANDOS PRONTOS - COPIAR E COLAR

## 📤 UPLOAD PARA GITHUB (PRIMEIRA VEZ)

```powershell
# Navegar até o diretório do projeto
cd "c:\Users\Nasa\Desktop\Trabalhos faculdade\I2A2\Trabalho final\Trabalho-final-I2A2"

# Inicializar Git (se ainda não foi feito)
git init

# Adicionar remote do GitHub
git remote add origin https://github.com/IgorToebe/Trabalho-final-I2A2.git

# Verificar/criar branch main
git branch -M main

# Adicionar todos os arquivos
git add .

# Verificar o que será commitado (IMPORTANTE!)
git status

# Commit inicial
git commit -m "feat: Configuração completa para deploy - Sistema Agente Fiscal pronto para produção"

# Push inicial
git push -u origin main
```

---

## 🔄 ATUALIZAÇÕES FUTURAS

```powershell
# Navegar até o diretório
cd "c:\Users\Nasa\Desktop\Trabalhos faculdade\I2A2\Trabalho final\Trabalho-final-I2A2"

# Ver o que mudou
git status

# Adicionar todos os arquivos
git add .

# Commit com mensagem descritiva
git commit -m "Descrição das mudanças"

# Push
git push origin main
```

---

## 🛡️ VERIFICAÇÃO DE SEGURANÇA (ANTES DO PUSH)

```powershell
# Verificar se .env NÃO está no commit
git status | Select-String ".env"
# ✅ Não deve aparecer ".env" (apenas ".env.example" é OK)

# Ver todos os arquivos que serão enviados
git status

# Ver o conteúdo das mudanças
git diff --cached

# Se algo estiver errado, remover do staging:
git reset HEAD nome-do-arquivo
```

---

## 🔥 COMANDOS RÁPIDOS

### Commit rápido (tudo de uma vez):
```powershell
cd "c:\Users\Nasa\Desktop\Trabalhos faculdade\I2A2\Trabalho final\Trabalho-final-I2A2"; git add .; git commit -m "Atualização rápida"; git push origin main
```

### Apenas verificar status:
```powershell
cd "c:\Users\Nasa\Desktop\Trabalhos faculdade\I2A2\Trabalho final\Trabalho-final-I2A2"; git status
```

### Ver histórico:
```powershell
cd "c:\Users\Nasa\Desktop\Trabalhos faculdade\I2A2\Trabalho final\Trabalho-final-I2A2"; git log --oneline --graph --all
```

---

## 🌐 VERIFICAR RENDER APÓS DEPLOY

### Ver logs em tempo real:
```powershell
# No navegador, acesse:
# https://dashboard.render.com/
# Selecione seu serviço > Logs
```

### Testar aplicação:
```powershell
# Substitua pela sua URL do Render
start https://agente-fiscal-xxxx.onrender.com
```

---

## 🐛 RESOLUÇÃO DE PROBLEMAS

### Push rejeitado (out of sync):
```powershell
cd "c:\Users\Nasa\Desktop\Trabalhos faculdade\I2A2\Trabalho final\Trabalho-final-I2A2"
git pull --rebase origin main
git push origin main
```

### Desfazer último commit (mantém arquivos):
```powershell
cd "c:\Users\Nasa\Desktop\Trabalhos faculdade\I2A2\Trabalho final\Trabalho-final-I2A2"
git reset --soft HEAD~1
```

### Descartar mudanças locais (CUIDADO!):
```powershell
cd "c:\Users\Nasa\Desktop\Trabalhos faculdade\I2A2\Trabalho final\Trabalho-final-I2A2"
git checkout -- .
```

### Limpar arquivos não rastreados:
```powershell
cd "c:\Users\Nasa\Desktop\Trabalhos faculdade\I2A2\Trabalho final\Trabalho-final-I2A2"
git clean -fd
```

---

## 📊 INFORMAÇÕES ÚTEIS

### Ver tamanho do repositório:
```powershell
cd "c:\Users\Nasa\Desktop\Trabalhos faculdade\I2A2\Trabalho final\Trabalho-final-I2A2"
git count-objects -vH
```

### Ver branches:
```powershell
cd "c:\Users\Nasa\Desktop\Trabalhos faculdade\I2A2\Trabalho final\Trabalho-final-I2A2"
git branch -a
```

### Ver remotes configurados:
```powershell
cd "c:\Users\Nasa\Desktop\Trabalhos faculdade\I2A2\Trabalho final\Trabalho-final-I2A2"
git remote -v
```

---

## ✅ CHECKLIST FINAL

Antes de fazer o primeiro push, verifique:

```powershell
# 1. Diretório correto
cd "c:\Users\Nasa\Desktop\Trabalhos faculdade\I2A2\Trabalho final\Trabalho-final-I2A2"
pwd

# 2. Git inicializado
git status

# 3. Remote configurado
git remote -v

# 4. Arquivos sensíveis protegidos
git status | Select-String ".env"
# ✅ Não deve aparecer ".env"

# 5. Ver o que será enviado
git status

# 6. Tudo OK? Push!
git push -u origin main
```

---

## 🎯 SEQUÊNCIA COMPLETA (COPIAR TUDO)

```powershell
# ==========================================
# SEQUÊNCIA COMPLETA DE UPLOAD GITHUB
# ==========================================

# 1. Ir para o diretório do projeto
cd "c:\Users\Nasa\Desktop\Trabalhos faculdade\I2A2\Trabalho final\Trabalho-final-I2A2"

# 2. Inicializar Git (se necessário)
git init

# 3. Configurar remote
git remote add origin https://github.com/IgorToebe/Trabalho-final-I2A2.git

# 4. Verificar branch
git branch -M main

# 5. Adicionar arquivos
git add .

# 6. IMPORTANTE: Verificar o que será enviado
Write-Host "=== VERIFICANDO ARQUIVOS ===" -ForegroundColor Yellow
git status

# 7. Verificar se .env NÃO está incluído
Write-Host "=== VERIFICANDO SEGURANÇA ===" -ForegroundColor Yellow
$envCheck = git status | Select-String "\.env$"
if ($envCheck) {
    Write-Host "⚠️ ATENÇÃO: Arquivo .env será commitado! PARE E REMOVA!" -ForegroundColor Red
} else {
    Write-Host "✅ Arquivo .env protegido. Pode continuar!" -ForegroundColor Green
}

# 8. Commit
git commit -m "feat: Sistema Agente Fiscal configurado e pronto para deploy"

# 9. Push
Write-Host "=== FAZENDO PUSH ===" -ForegroundColor Green
git push -u origin main

# 10. Confirmar
Write-Host "=== CONCLUÍDO ===" -ForegroundColor Green
Write-Host "✅ Acesse: https://github.com/IgorToebe/Trabalho-final-I2A2" -ForegroundColor Cyan
Write-Host "✅ Configure deploy no Render: https://dashboard.render.com/" -ForegroundColor Cyan
```

---

## 💡 DICAS

### Commits semânticos (recomendado):

```powershell
# Nova funcionalidade
git commit -m "feat: Adiciona sistema de relatórios"

# Correção de bug
git commit -m "fix: Corrige erro no cálculo de impostos"

# Documentação
git commit -m "docs: Atualiza guia de instalação"

# Refatoração
git commit -m "refactor: Melhora estrutura do código"

# Testes
git commit -m "test: Adiciona testes para chat"

# Estilo
git commit -m "style: Formata código"
```

---

## 🚨 EM CASO DE EMERGÊNCIA

### Remover arquivo sensível que foi commitado:

```powershell
# 1. Remover do Git (mas manter localmente)
git rm --cached .env

# 2. Commit
git commit -m "fix: Remove arquivo .env sensível"

# 3. Push
git push origin main

# 4. Verificar se .gitignore está funcionando
git status | Select-String ".env"
```

### Reverter tudo e começar de novo:

```powershell
# ⚠️ CUIDADO: Isso apaga tudo que não foi commitado!
git reset --hard HEAD
git clean -fd
```

---

**📝 NOTA**: Sempre revise com `git status` antes de `git push`!

**🔗 URLs Úteis**:
- GitHub: https://github.com/IgorToebe/Trabalho-final-I2A2
- Render: https://dashboard.render.com/
- Google AI: https://makersuite.google.com/app/apikey
