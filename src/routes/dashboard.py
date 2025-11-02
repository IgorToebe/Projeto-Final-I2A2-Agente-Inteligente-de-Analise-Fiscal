# src/routes/dashboard.py
from flask import Blueprint, jsonify, session
from sqlalchemy import func
from database.connection import SessionLocal
from models.nota_fiscal import NotaFiscal, ItemNota
from models.usuario import Usuario

dashboard_bp = Blueprint("dashboard_bp", __name__)

@dashboard_bp.route("/dashboard_metrics", methods=["GET"])
def get_dashboard_metrics():
    """
    Retorna métricas do dashboard: faturamento, número de notas, ticket médio e clientes únicos.
    Baseado nas notas de VENDA (tipo_operacao='Saída') do usuário logado.
    """
    cnpj = session.get("cnpj")
    if not cnpj:
        return jsonify({"erro": "Não autorizado. Faça login."}), 401

    db = SessionLocal()
    try:
        # Buscar notas de saída (vendas) onde o usuário é o emitente
        notas_vendas = db.query(NotaFiscal).filter(
            NotaFiscal.cnpj_emitente == cnpj,
            NotaFiscal.tipo_operacao == 'Saída'
        ).all()

        if not notas_vendas:
            return jsonify({
                "faturamento_total": 0.0,
                "num_notas": 0,
                "ticket_medio": 0.0,
                "num_clientes": 0
            }), 200

        # Calcular métricas
        faturamento_total = sum(float(nota.valor_total_nota or 0) for nota in notas_vendas)
        num_notas = len(set(nota.numero for nota in notas_vendas))  # Notas únicas
        ticket_medio = faturamento_total / num_notas if num_notas > 0 else 0.0
        
        # Clientes únicos (CNPJs destinatários diferentes)
        clientes_unicos = set(
            nota.cnpj_destinatario for nota in notas_vendas 
            if nota.cnpj_destinatario
        )
        num_clientes = len(clientes_unicos)

        return jsonify({
            "faturamento_total": round(faturamento_total, 2),
            "num_notas": num_notas,
            "ticket_medio": round(ticket_medio, 2),
            "num_clientes": num_clientes
        }), 200

    except Exception as e:
        return jsonify({"erro": f"Erro ao calcular métricas: {str(e)}"}), 500
    finally:
        db.close()


@dashboard_bp.route("/fiscal_data", methods=["GET"])
def get_fiscal_data():
    """
    Retorna dados fiscais para o Dashboard Fiscal:
    - classificacao: lista de notas com tipo (Entrada/Saída)
    - impostosPorNota: impostos detalhados por nota fiscal
    - impostosConsolidados: totais consolidados de ICMS, PIS, COFINS
    """
    cnpj = session.get("cnpj")
    print(f"[DEBUG fiscal_data] CNPJ da sessão: {cnpj}")
    if not cnpj:
        return jsonify({"erro": "Não autorizado. Faça login."}), 401

    db = SessionLocal()
    try:
        # Buscar TODAS as notas do usuário: 
        # - Saídas: onde o usuário é emitente
        # - Entradas: onde o usuário é destinatário
        notas = db.query(NotaFiscal).filter(
            (NotaFiscal.cnpj_emitente == cnpj) | (NotaFiscal.cnpj_destinatario == cnpj)
        ).all()

        if not notas:
            return jsonify({
                "classificacao": [],
                "impostosPorNota": [],
                "impostosConsolidados": {"ICMS": 0.0, "PIS": 0.0, "COFINS": 0.0}
            }), 200

        # Classificação: Entrada vs Saída
        classificacao = []
        for nota in notas:
            classificacao.append({
                "nota": nota.numero,
                "tipo": nota.tipo_operacao  # "Entrada" ou "Saída"
            })

        # Impostos por nota fiscal (agregando itens)
        impostos_por_nota = []
        icms_total = 0.0
        pis_total = 0.0
        cofins_total = 0.0

        for nota in notas:
            # Buscar itens da nota (usando o relacionamento correto)
            itens = db.query(ItemNota).filter(ItemNota.nota_id == nota.id).all()
            
            # Agregar impostos dos itens (usando os nomes corretos das colunas)
            icms_nota = sum(float(item.icms_valor or 0) for item in itens)
            pis_nota = sum(float(item.pis_valor or 0) for item in itens)
            cofins_nota = sum(float(item.cofins_valor or 0) for item in itens)

            impostos_por_nota.append({
                "nota": nota.numero,
                "ICMS": round(icms_nota, 2),
                "PIS": round(pis_nota, 2),
                "COFINS": round(cofins_nota, 2)
            })

            # Acumular totais consolidados
            icms_total += icms_nota
            pis_total += pis_nota
            cofins_total += cofins_nota

        # Impostos consolidados
        impostos_consolidados = {
            "ICMS": round(icms_total, 2),
            "PIS": round(pis_total, 2),
            "COFINS": round(cofins_total, 2)
        }

        print(f"[DEBUG fiscal_data] Total de notas encontradas: {len(notas)}")
        print(f"[DEBUG fiscal_data] Impostos consolidados: {impostos_consolidados}")

        return jsonify({
            "classificacao": classificacao,
            "impostosPorNota": impostos_por_nota,
            "impostosConsolidados": impostos_consolidados
        }), 200

    except Exception as e:
        print(f"[DEBUG fiscal_data] ERRO: {str(e)}")
        return jsonify({"erro": f"Erro ao buscar dados fiscais: {str(e)}"}), 500
    finally:
        db.close()
