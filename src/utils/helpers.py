"""
Funções auxiliares reutilizáveis em todo o projeto
"""
import re


def limpar_cnpj(cnpj):
    """Remove caracteres especiais do CNPJ, retorna apenas dígitos"""
    return re.sub(r'[^\d]', '', cnpj) if cnpj else ''


def validar_cnpj(cnpj):
    """Valida formato básico do CNPJ (14 dígitos)"""
    cnpj_limpo = limpar_cnpj(cnpj)
    return cnpj_limpo.isdigit() and len(cnpj_limpo) == 14


def calcular_tipo_operacao(cnpj_emitente, cnpj_destinatario, user_cnpj):
    """
    Determina o tipo de operação (Entrada/Saída) baseado no CNPJ do usuário
    """
    if not user_cnpj:
        return "Desconhecida"
    
    user_cnpj = limpar_cnpj(user_cnpj)
    cnpj_emitente = limpar_cnpj(cnpj_emitente)
    cnpj_destinatario = limpar_cnpj(cnpj_destinatario)
    
    if user_cnpj == cnpj_emitente:
        return "Saída"
    elif user_cnpj == cnpj_destinatario:
        return "Entrada"
    return "Desconhecida"


def formatar_valor_monetario(valor):
    """Formata valor numérico para moeda brasileira"""
    try:
        valor_float = float(valor) if valor else 0.0
        return f"R$ {valor_float:,.2f}".replace(',', 'X').replace('.', ',').replace('X', '.')
    except (ValueError, TypeError):
        return "R$ 0,00"
