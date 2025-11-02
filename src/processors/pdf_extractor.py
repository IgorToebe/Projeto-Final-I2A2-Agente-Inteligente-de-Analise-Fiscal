"""
Extrator de texto de arquivos PDF usando pdfplumber
"""
import pdfplumber


def extrair_texto_pdf(caminho_pdf):
    """
    Extrai o texto completo de um arquivo PDF
    
    Args:
        caminho_pdf: Caminho do arquivo PDF
    
    Returns:
        str: Texto extraído ou mensagem de erro
    """
    try:
        texto = ""
        with pdfplumber.open(caminho_pdf) as pdf:
            for pagina in pdf.pages:
                conteudo = pagina.extract_text()
                if conteudo:
                    texto += conteudo + "\n"
        return texto.strip()
    except Exception as e:
        return f"Erro ao ler PDF: {str(e)}"
