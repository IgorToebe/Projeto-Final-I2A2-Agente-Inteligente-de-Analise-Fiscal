"""
Script de teste para verificar se o sistema de chat com Gemini está funcionando
corretamente após as correções.
"""
import sys
import os
sys.path.insert(0, 'src')

from services.gemini_service import GeminiAgent, chamar_gemini

def test_gemini_agent_creation():
    """Testa a criação do GeminiAgent"""
    print("\n=== Teste 1: Criação do GeminiAgent ===")
    
    # Teste sem chave (deve falhar)
    try:
        agent = GeminiAgent(api_key=None)
        print("❌ FALHOU: Deveria ter lançado erro sem chave")
    except RuntimeError as e:
        print(f"✅ PASSOU: Erro esperado capturado: {e}")
    
    # Teste com chave fictícia (deve criar mas falhar ao inicializar)
    try:
        agent = GeminiAgent(
            api_key="AIzaSyTest_fake_key",
            modelo="gemini-2.0-flash-exp",
            system_instruction="Teste"
        )
        print("❌ FALHOU: Chave inválida deveria ter causado erro na inicialização")
    except RuntimeError as e:
        if "API" in str(e) or "invalid" in str(e).lower():
            print(f"✅ PASSOU: Erro de API esperado capturado")
        else:
            print(f"⚠️  AVISO: Erro diferente do esperado: {e}")


def test_chamar_gemini():
    """Testa a função legada chamar_gemini"""
    print("\n=== Teste 2: Função chamar_gemini ===")
    
    # Teste sem chave
    resultado = chamar_gemini("teste", api_key=None)
    if "Nenhuma chave de API fornecida" in resultado:
        print("✅ PASSOU: Mensagem correta quando sem chave")
    else:
        print(f"❌ FALHOU: Mensagem inesperada: {resultado}")
    
    # Teste com chave fictícia
    resultado = chamar_gemini("teste", api_key="AIzaSyTest_fake_key")
    if "Erro" in resultado:
        print(f"✅ PASSOU: Erro esperado com chave inválida")
    else:
        print(f"❌ FALHOU: Deveria ter retornado erro")


def test_imports():
    """Testa se todos os módulos importam corretamente"""
    print("\n=== Teste 3: Importações ===")
    
    try:
        from services.chat_manager import chat_manager
        print("✅ chat_manager importado com sucesso")
    except Exception as e:
        print(f"❌ Erro ao importar chat_manager: {e}")
    
    try:
        from routes.chat import chat_bp
        print("✅ chat_bp importado com sucesso")
    except Exception as e:
        print(f"❌ Erro ao importar chat_bp: {e}")


if __name__ == "__main__":
    print("╔════════════════════════════════════════════════════════════╗")
    print("║  TESTE DO SISTEMA DE CHAT GEMINI                           ║")
    print("║  Verificando correções de system_instruction e API Key     ║")
    print("╚════════════════════════════════════════════════════════════╝")
    
    test_imports()
    test_gemini_agent_creation()
    test_chamar_gemini()
    
    print("\n" + "="*60)
    print("RESUMO DOS TESTES")
    print("="*60)
    print("✅ Se todos os testes passaram, o sistema está pronto!")
    print("📝 Para testar com chave real, use a interface web do chat")
    print("🌐 Acesse: http://localhost:5000/chat")
    print("="*60 + "\n")
