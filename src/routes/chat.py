# src/routes/chat.py
from flask import Blueprint, request, jsonify, session
import requests
import time  # Para retry
import os
from database.connection import SessionLocal
from models.nota_fiscal import NotaFiscal, ItemNota  # ItemNota pra detalhes
from models.usuario import Usuario  # Pra regime
from services.gemini_service import chamar_gemini  # Mantenha para Grok se necessário, mas use processar_pergunta_chat para Gemini

# Importar Tavily para busca web
try:
    from tavily import TavilyClient
    TAVILY_AVAILABLE = True
except ImportError:
    TAVILY_AVAILABLE = False
    print("AVISO: tavily-python não instalado. Busca web desabilitada.")

chat_bp = Blueprint("chat_bp", __name__)

@chat_bp.route("/chat", methods=["POST"])
def chat_ia():
    """
    Endpoint de chat fiscal inteligente (Gemini ou Grok) com contexto das notas do usuário
    e capacidade de busca web para informações fiscais atualizadas.
    """
    data = request.get_json()
    pergunta = data.get("pergunta")
    api_key = data.get("apiKey")
    tavily_key = data.get("tavilyKey")  # NOVO: Chave Tavily opcional

    if not pergunta:
        return jsonify({"erro": "Pergunta não fornecida."}), 400
    if not api_key:
        return jsonify({"erro": "Chave da API não fornecida."}), 400

    # Verifica autenticação via sessão
    cnpj = session.get("cnpj")
    if not cnpj:
        return jsonify({"erro": "Não autorizado. Faça login."}), 401

    db = SessionLocal()
    try:
        # Detecta se a pergunta requer busca web
        keywords_busca_web = [
            "alíquota", "aliquota", "imposto", "cfop", "ncm", "lei", "legislação", 
            "legislacao", "regra", "simples nacional", "lucro presumido", "icms", 
            "ipi", "pis", "cofins", "anexo", "faixa", "limite"
        ]
        precisa_busca_web = any(keyword in pergunta.lower() for keyword in keywords_busca_web)
        
        # Realiza busca web se necessário e se Tavily estiver disponível
        contexto_web = ""
        if precisa_busca_web and tavily_key and TAVILY_AVAILABLE:
            try:
                tavily_client = TavilyClient(api_key=tavily_key)
                search_results = tavily_client.search(
                    query=f"Brasil fiscal tributário {pergunta}",
                    max_results=3
                )
                
                if search_results and 'results' in search_results:
                    contexto_web = "\n\n=== INFORMAÇÕES ATUALIZADAS DA WEB ===\n"
                    for idx, result in enumerate(search_results['results'][:3], 1):
                        contexto_web += f"{idx}. {result.get('title', 'Sem título')}\n"
                        contexto_web += f"   {result.get('content', 'Sem conteúdo')[:300]}...\n"
                        contexto_web += f"   Fonte: {result.get('url', 'N/A')}\n\n"
                    print(f"DEBUG BUSCA WEB: {len(search_results['results'])} resultados encontrados")
            except Exception as e:
                print(f"DEBUG ERRO BUSCA WEB: {e}")
                contexto_web = "\n\n[Busca web falhou, usando apenas dados locais]\n"

        # Detectar se pergunta é sobre saída/entrada para filtrar query
        is_saida = "saida" in pergunta.lower() or "saída" in pergunta.lower()
        is_entrada = "entrada" in pergunta.lower()

        filter_tipo = None
        if is_saida and not is_entrada:
            filter_tipo = 'Saída'
        elif is_entrada and not is_saida:
            filter_tipo = 'Entrada'

        # Query: Últimas 5 notas do usuário (emitente ou destinatário), filtrado se aplicável
        query = db.query(NotaFiscal).filter(
            (NotaFiscal.cnpj_emitente == cnpj) | (NotaFiscal.cnpj_destinatario == cnpj)
        )
        if filter_tipo:
            query = query.filter(NotaFiscal.tipo_operacao == filter_tipo)
        notas = query.order_by(NotaFiscal.data_emissao.desc()).limit(5).all()

        # Query: Dados do usuário (regime tributário + natureza_juridica + RBT12)
        usuario = db.query(Usuario).filter_by(cnpj=cnpj).first()
        regime = usuario.regime_tributario if usuario else "desconhecido"
        natureza = usuario.natureza_juridica if usuario else "desconhecida"
        rbt12 = float(usuario.rbt12) if usuario and usuario.rbt12 else 0.0

        # Constrói contexto resumido com itens detalhados + impostos (mais conciso)
        contexto = f"Regime: {regime}, Natureza: {natureza}, RBT12 (Receita Bruta últimos 12 meses): R$ {rbt12:,.2f}.\n"
        if not notas:
            contexto += "Nenhuma nota encontrada."
        else:
            contexto += "Notas:\n"
            for nota in notas:
                itens_resumo = []
                itens = db.query(ItemNota).filter_by(nota_id=nota.id).all()  # Removido limit para completude, mas mantém conciso
                print(f"DEBUG CHAT: Nota {nota.id} tem {len(itens)} itens encontrados.")  # Debug
                if itens:
                    for item in itens:
                        val_unit = float(getattr(item, 'valor_unitario', 0) or 0)
                        val_total = float(getattr(item, 'valor_total', 0) or 0)
                        qtd = float(getattr(item, 'quantidade', 0) or 0)
                        icms_item = float(getattr(item, 'icms_valor', 0) or 0)
                        ipi_item = float(getattr(item, 'ipi_valor', 0) or 0)
                        pis_item = float(getattr(item, 'pis_valor', 0) or 0)
                        cofins_item = float(getattr(item, 'cofins_valor', 0) or 0)
                        itens_resumo.append(
                            f"{item.descricao_produto or 'N/A'} (qtd:{qtd}, unit:R${val_unit:.2f}, total:R${val_total:.2f}, NCM:{item.ncm or 'N/A'}, CFOP:{item.cfop or 'N/A'}, CST IPI:{item.cst_ipi or 'N/A'}, ICMS:R${icms_item:.2f}, IPI:R${ipi_item:.2f}, PIS:R${pis_item:.2f}, COFINS:R${cofins_item:.2f})"
                        )
                    itens_str = "; ".join(itens_resumo)
                else:
                    itens_str = "Sem itens."
                contexto += f"- Nota {nota.numero} ({nota.data_emissao}): Total R${nota.valor_total_nota or 0}, Natureza: {nota.natureza_operacao or 'N/A'}, Tipo: {nota.tipo_operacao or 'N/A'}. Itens: {itens_str}.\n"

        # Adiciona contexto web se houver
        contexto += contexto_web

        db.close()
        print(f"DEBUG CONTEXTO: {contexto[:500]}...")  # Debug

        try:
            # Detectar tipo de modelo pela chave
            if api_key.startswith("AIza"):  # Gemini
                resposta = chamar_gemini_with_retry(pergunta, api_key, contexto, cnpj)
            elif api_key.startswith("gsk_"):  # Grok
                resposta = chamar_grok_with_retry(pergunta, api_key, contexto, cnpj)
            else:
                return jsonify({"erro": "Chave de API inválida."}), 400

            return jsonify({"resposta": resposta}), 200

        except Exception as e:
            print(f"DEBUG ERRO IA: {e}")
            return jsonify({"erro": f"Erro ao processar IA: {str(e)}"}), 500

    except Exception as e:
        print(f"DEBUG ERRO GERAL: {e}")
        if 'db' in locals():
            db.close()
        return jsonify({"erro": f"Erro ao acessar dados: {str(e)}"}), 500


# 🔹 Função auxiliar - Gemini com retry e MEMÓRIA DE CHAT
def chamar_gemini_with_retry(pergunta, api_key, contexto, user_cnpj, max_retries=3):
    """
    Processa pergunta usando Gemini com memória persistente de conversa.
    Mantém histórico separado por usuário (CNPJ).
    """
    from services.chat_manager import chat_manager
    
    # System instruction (personalidade do agente)
    system_instruction = f"""Você é um contador estrategista experiente e amigável, especializado em orientar empresas brasileiras sobre tributação, compliance fiscal e planejamento tributário. Seu objetivo é educar, contextualizar e apoiar o cliente na tomada de decisões inteligentes.

🎯 ESTILO DE COMUNICAÇÃO:
- Seja conversacional, caloroso e acessível (como um consultor que conhece o cliente pessoalmente)
- Explique o "porquê" por trás dos números (não apenas liste dados)
- Use analogias práticas quando relevante
- Destaque oportunidades de otimização fiscal e alertas de conformidade
- Termine respostas complexas com um resumo executivo ("Em resumo...")
- Seja proativo: sugira próximos passos ou análises complementares quando apropriado
- Use emojis ocasionalmente para tornar a conversa mais leve (📊 💡 ⚠️ ✅)

🔍 METODOLOGIA DE ANÁLISE:
- Classifique operações por tipo_operacao: 'Saída' (quando emitente={user_cnpj}), 'Entrada' (quando destinatário={user_cnpj})
- Ignore natureza_operacao para classificação de entrada/saída
- Analise impostos item por item dentro de cada nota (icms_valor, ipi_valor, pis_valor, cofins_valor individuais)
- Agregue valores quando necessário (totais cross-itens e cross-notas)
- Relacione os dados com o regime tributário do cliente para insights relevantes
- **IMPORTANTE: O RBT12 (Receita Bruta dos últimos 12 meses) está sempre disponível no contexto**
  - Use o RBT12 para calcular faixas do Simples Nacional (se aplicável)
  - Considere o RBT12 para análises de planejamento tributário
  - Alerte se o RBT12 está próximo dos limites de faixa ou regime
  - Compare faturamento mensal/notas com o RBT12 para insights de sazonalidade

📋 ESTRUTURA DE RESPOSTA:
1. **Contexto/Introdução** (1-2 frases situando a pergunta)
2. **Análise detalhada** (com números, breakdown e explicações)
3. **Interpretação estratégica** (o que isso significa para o negócio?)
4. **Recomendações práticas** (se aplicável)
5. **Resumo executivo** (bullet points ou frase conclusiva)

Use tabelas Markdown apenas para dados complexos que ganhem clareza visual. Para respostas simples, prefira texto corrido e estruturado."""
    
    for attempt in range(max_retries):
        try:
            # Obter agente com memória para este usuário
            agent = chat_manager.get_agent(
                cnpj=user_cnpj,
                api_key=api_key,
                modelo="gemini-2.0-flash-exp",
                system_instruction=system_instruction
            )
            
            # Montar mensagem com contexto das notas
            message = f"""📂 DADOS DISPONÍVEIS:
{contexto}

❓ PERGUNTA DO CLIENTE:
{pergunta}

💬 SUA RESPOSTA (como contador estrategista):"""
            
            # Enviar mensagem e obter resposta (com memória automática)
            response = agent.send_message(message)
            
            # Log para debug
            summary = agent.get_conversation_summary()
            print(f"DEBUG CHAT MEMORY: {summary}")
            
            return response
            
        except Exception as e:
            if "503" in str(e) and attempt < max_retries - 1:
                time.sleep(2 ** attempt)  # Exponential backoff
                continue
            raise e


# 🔹 Função auxiliar - Grok com retry
def chamar_grok_with_retry(pergunta, api_key, contexto, user_cnpj, max_retries=3):
    url = "https://api.x.ai/v1/chat/completions"
    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {api_key}"
    }
    system_prompt = f"""Você é um contador estrategista experiente e amigável, especializado em orientar empresas brasileiras sobre tributação, compliance fiscal e planejamento tributário. Seu objetivo é educar, contextualizar e apoiar o cliente na tomada de decisões inteligentes.

🎯 ESTILO DE COMUNICAÇÃO:
- Seja conversacional, caloroso e acessível (como um consultor que conhece o cliente pessoalmente)
- Explique o "porquê" por trás dos números (não apenas liste dados)
- Use analogias práticas quando relevante
- Destaque oportunidades de otimização fiscal e alertas de conformidade
- Termine respostas complexas com um resumo executivo ("Em resumo...")
- Seja proativo: sugira próximos passos ou análises complementares quando apropriado
- Use emojis ocasionalmente para tornar a conversa mais leve (📊 💡 ⚠️ ✅)

🔍 METODOLOGIA DE ANÁLISE:
- Classifique operações por tipo_operacao: 'Saída' (quando emitente={user_cnpj}), 'Entrada' (quando destinatário={user_cnpj})
- Ignore natureza_operacao para classificação de entrada/saída
- Analise impostos item por item dentro de cada nota (icms_valor, ipi_valor, pis_valor, cofins_valor individuais)
- Agregue valores quando necessário (totais cross-itens e cross-notas)
- Relacione os dados com o regime tributário do cliente para insights relevantes
- **IMPORTANTE: O RBT12 (Receita Bruta dos últimos 12 meses) está sempre disponível no contexto**
  - Use o RBT12 para calcular faixas do Simples Nacional (se aplicável)
  - Considere o RBT12 para análises de planejamento tributário
  - Alerte se o RBT12 está próximo dos limites de faixa ou regime
  - Compare faturamento mensal/notas com o RBT12 para insights de sazonalidade

📋 ESTRUTURA DE RESPOSTA:
1. **Contexto/Introdução** (1-2 frases situando a pergunta)
2. **Análise detalhada** (com números, breakdown e explicações)
3. **Interpretação estratégica** (o que isso significa para o negócio?)
4. **Recomendações práticas** (se aplicável)
5. **Resumo executivo** (bullet points ou frase conclusiva)

Use tabelas Markdown apenas para dados complexos que ganhem clareza visual. Para respostas simples, prefira texto corrido e estruturado.

📂 DADOS DISPONÍVEIS:
{contexto}"""
    body = {
        "model": "grok-beta",
        "messages": [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": pergunta}
        ]
    }

    for attempt in range(max_retries):
        try:
            response = requests.post(url, headers=headers, json=body)
            if response.status_code == 200:
                data = response.json()
                try:
                    return data["choices"][0]["message"]["content"]
                except Exception:
                    return "Erro ao interpretar resposta."
            else:
                if response.status_code == 503 and attempt < max_retries - 1:
                    time.sleep(2 ** attempt)
                    continue
                return f"Erro Grok: {response.status_code} → {response.text}"
        except Exception as e:
            if attempt < max_retries - 1:
                time.sleep(2 ** attempt)
                continue
            return f"Erro ao chamar Grok: {str(e)}"


# 🔹 Endpoint para limpar histórico de chat
@chat_bp.route("/chat/clear", methods=["POST"])
def clear_chat_history():
    """
    Limpa o histórico de chat do usuário logado.
    Útil para iniciar uma nova conversa do zero.
    """
    data = request.get_json()
    api_key = data.get("apiKey")
    
    if not api_key:
        return jsonify({"erro": "Chave da API não fornecida."}), 400
    
    cnpj = session.get("cnpj")
    if not cnpj:
        return jsonify({"erro": "Não autorizado. Faça login."}), 401
    
    try:
        from services.chat_manager import chat_manager
        chat_manager.clear_session(cnpj, api_key)
        return jsonify({"mensagem": "✅ Histórico de chat limpo com sucesso."}), 200
    except Exception as e:
        return jsonify({"erro": f"Erro ao limpar histórico: {str(e)}"}), 500


# 🔹 Endpoint para obter estatísticas da conversa
@chat_bp.route("/chat/stats", methods=["GET"])
def get_chat_stats():
    """
    Retorna estatísticas da sessão de chat do usuário logado.
    """
    api_key = request.args.get("apiKey")
    
    if not api_key:
        return jsonify({"erro": "Chave da API não fornecida."}), 400
    
    cnpj = session.get("cnpj")
    if not cnpj:
        return jsonify({"erro": "Não autorizado. Faça login."}), 401
    
    try:
        from services.chat_manager import chat_manager
        summary = chat_manager.get_session_summary(cnpj, api_key)
        
        if summary:
            return jsonify(summary), 200
        else:
            return jsonify({
                "mensagem": "Nenhuma conversa ativa.",
                "total_messages": 0,
                "user_messages": 0,
                "model_messages": 0
            }), 200
    except Exception as e:
        return jsonify({"erro": f"Erro ao obter estatísticas: {str(e)}"}), 500