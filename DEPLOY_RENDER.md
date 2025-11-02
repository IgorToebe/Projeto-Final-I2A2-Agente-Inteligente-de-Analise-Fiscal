# 🚀 Guia de Deploy - Render.com

## 📋 Pré-requisitos

1. ✅ Conta no [GitHub](https://github.com)
2. ✅ Conta no [Render](https://render.com)
3. ✅ Chave API do Google Gemini ([obter aqui](https://makersuite.google.com/app/apikey))

---

## 📤 Passo 1: Preparar o Repositório GitHub

### 1.1 - Verificar arquivos importantes

Certifique-se de que estes arquivos estão no repositório:
- ✅ `.gitignore` - Protege arquivos sensíveis
- ✅ `requirements.txt` - Lista de dependências
- ✅ `runtime.txt` - Versão do Python
- ✅ `Procfile` - Comando de inicialização
- ✅ `render.yaml` - Configuração do Render
- ✅ `init_app.py` - Script de inicialização

### 1.2 - Fazer commit e push

```bash
# Verificar status
git status

# Adicionar todos os arquivos
git add .

# Fazer commit
git commit -m "Configuração para deploy no Render"

# Fazer push
git push origin main
```

**⚠️ IMPORTANTE**: O arquivo `.env` NÃO deve ser commitado (já está no `.gitignore`)

---

## 🌐 Passo 2: Configurar no Render

### 2.1 - Criar novo Web Service

1. Acesse: https://dashboard.render.com/
2. Clique em **"New +"** → **"Web Service"**
3. Conecte seu repositório GitHub
4. Selecione o repositório: `Trabalho-final-I2A2`

### 2.2 - Configurações Básicas

| Campo | Valor |
|-------|-------|
| **Name** | `agente-fiscal` (ou seu nome preferido) |
| **Region** | `Oregon (US West)` ou mais próximo |
| **Branch** | `main` |
| **Runtime** | `Python 3` |
| **Build Command** | `pip install -r requirements.txt && python init_app.py` |
| **Start Command** | `gunicorn --bind 0.0.0.0:$PORT --workers 2 --timeout 120 --chdir src main:app` |

### 2.3 - Plano

- Selecione: **Free** (para começar)
- Recursos: 512MB RAM, CPU compartilhada
- Limitações: Dorme após 15 min de inatividade

### 2.4 - Variáveis de Ambiente

Clique em **"Advanced"** e adicione:

| Key | Value | Tipo |
|-----|-------|------|
| `PYTHON_VERSION` | `3.11.9` | Manual |
| `SECRET_KEY` | (clique em "Generate") | Auto |
| `FLASK_ENV` | `production` | Manual |
| `PORT` | `10000` | Manual |

**📝 NOTA**: `GEMINI_API_KEY` não é necessária aqui - usuários inserem no frontend!

### 2.5 - Deploy Automático

- ✅ Marque **"Auto-Deploy"** (opcional)
- Toda vez que fizer push na branch `main`, será feito deploy automaticamente

---

## 🔄 Passo 3: Fazer o Deploy

1. Clique em **"Create Web Service"**
2. Aguarde o build (~5-10 minutos)
3. Acompanhe os logs em tempo real

### Logs esperados:
```
==> Building...
Installing dependencies from requirements.txt
Running init_app.py
✅ Aplicação pronta!

==> Deploying...
Starting gunicorn...
✅ Deploy successful!

Your service is live at https://agente-fiscal-xxxx.onrender.com
```

---

## ✅ Passo 4: Verificar Deploy

### 4.1 - Testar a URL

Acesse: `https://seu-app.onrender.com`

Você deve ver a tela de login do Agente Fiscal.

### 4.2 - Testar endpoints

```bash
# Health check (opcional - criar endpoint)
curl https://seu-app.onrender.com/

# Deve retornar a página de login
```

### 4.3 - Verificar logs

No painel do Render:
1. Clique no seu serviço
2. Vá em **"Logs"**
3. Verifique se não há erros

---

## 🔧 Passo 5: Configuração Pós-Deploy

### 5.1 - Domínio Customizado (Opcional)

1. No painel do Render, vá em **"Settings"**
2. Clique em **"Custom Domains"**
3. Adicione seu domínio
4. Configure DNS conforme instruções

### 5.2 - Configurar HTTPS

- ✅ Render fornece HTTPS automático com Let's Encrypt
- Não precisa configurar nada!

### 5.3 - Monitoramento

- Ative notificações de deploy
- Configure alertas de uptime (opcional)
- Use ferramentas como [UptimeRobot](https://uptimerobot.com/) para monitorar

---

## 🎯 Usando a Aplicação

### Para Usuários Finais:

1. **Acesse**: `https://seu-app.onrender.com`

2. **Registre-se**: Crie uma conta com seu CNPJ

3. **Faça login**: Entre no sistema

4. **Configure API**: 
   - Vá para o **Chat**
   - Insira sua chave do Google Gemini na barra lateral
   - Clique em "Ativar chaves"

5. **Use o sistema**:
   - Upload de notas fiscais no Dashboard
   - Análise fiscal no Chat
   - Visualização de métricas

---

## 🐛 Troubleshooting

### Problema: Deploy falha no build

**Solução**:
```bash
# Verificar requirements.txt localmente
pip install -r requirements.txt

# Se funcionar localmente, o problema pode ser:
# - Versão do Python incompatível (verificar runtime.txt)
# - Dependência específica de Windows (remover do requirements.txt)
```

### Problema: Aplicação não inicia

**Solução**:
1. Verificar logs no Render
2. Conferir se o `start command` está correto
3. Verificar variáveis de ambiente

### Problema: Erro 500 ao acessar

**Solução**:
1. Verificar logs de runtime
2. Confirmar que `SECRET_KEY` está configurada
3. Verificar se banco de dados foi inicializado (`init_app.py`)

### Problema: App "dorme" rapidamente

**Explicação**: Plano Free dorme após 15 min de inatividade.

**Soluções**:
- Upgrade para plano pago ($7/mês)
- Use serviço de "ping" gratuito (UptimeRobot)
- Aceite a limitação (primeiro acesso demora ~30s)

### Problema: Build lento

**Solução**:
- Normal no Render (5-10 minutos)
- Cache de dependências melhora em builds subsequentes
- Considere remover dependências não usadas

---

## 📊 Limites do Plano Free

| Recurso | Limite |
|---------|--------|
| **RAM** | 512 MB |
| **CPU** | Compartilhada |
| **Largura de banda** | 100 GB/mês |
| **Build time** | 90 dias de histórico |
| **Instâncias** | 1 |
| **Inatividade** | Dorme após 15 min |

---

## 🔐 Segurança

### ✅ Boas Práticas Implementadas:

1. **Chaves API**: 
   - ✅ Não estão no código-fonte
   - ✅ Usuário insere no frontend
   - ✅ Armazenadas no localStorage do navegador

2. **Senhas**:
   - ✅ Hashadas com bcrypt
   - ✅ Nunca armazenadas em texto plano

3. **Sessões**:
   - ✅ Cookies HTTPOnly
   - ✅ HTTPS obrigatório em produção
   - ✅ Secret key gerada automaticamente

4. **CORS**:
   - ✅ Configurado adequadamente
   - ✅ Credenciais permitidas

### ⚠️ Recomendações:

- 🔒 Use HTTPS sempre (Render fornece automático)
- 🔑 Nunca commite `.env` no Git
- 👥 Limite acesso ao painel do Render
- 📝 Monitore logs regularmente

---

## 🔄 Atualizações

### Deploy de Nova Versão:

```bash
# 1. Fazer alterações no código
git add .
git commit -m "Descrição das mudanças"

# 2. Push para GitHub
git push origin main

# 3. Render faz deploy automaticamente (se configurado)
# Ou: Clique em "Manual Deploy" no painel Render
```

### Rollback em Caso de Erro:

1. No painel Render, vá em **"Deploys"**
2. Encontre o deploy anterior funcionando
3. Clique em **"Rollback to this version"**

---

## 📞 Suporte

### Recursos Úteis:

- 📚 [Documentação Render](https://render.com/docs)
- 💬 [Comunidade Render](https://community.render.com/)
- 🐛 [Reportar Issues](https://github.com/seu-usuario/Trabalho-final-I2A2/issues)
- 📧 Email: suporte@render.com

### Logs e Debug:

```bash
# Ver logs em tempo real no terminal
render logs -f

# Ver logs de build
render logs --build

# Ver logs de runtime
render logs --runtime
```

---

## ✅ Checklist Final

Antes de considerar o deploy completo:

- [ ] Aplicação acessível via URL pública
- [ ] Login/Registro funcionando
- [ ] Upload de notas fiscais funcionando
- [ ] Chat com IA funcionando (após usuário inserir chave)
- [ ] Dashboard exibindo dados corretamente
- [ ] Logs sem erros críticos
- [ ] HTTPS funcionando
- [ ] Tempo de resposta aceitável (<5s)
- [ ] Mobile responsivo

---

**🎉 Parabéns! Seu Agente Fiscal está no ar!**

Compartilhe a URL: `https://seu-app.onrender.com`
