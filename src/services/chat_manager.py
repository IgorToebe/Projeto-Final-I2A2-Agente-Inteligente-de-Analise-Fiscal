"""
Gerenciador de sessões de chat com memória persistente por usuário.
Mantém instâncias de GeminiAgent separadas para cada usuário (CNPJ).
"""
from services.gemini_service import GeminiAgent


class ChatSessionManager:
    """
    Gerencia múltiplas sessões de chat com memória, uma por usuário.
    """
    
    def __init__(self):
        """Inicializa o gerenciador de sessões."""
        self.sessions = {}  # {cnpj: GeminiAgent}
    
    def get_agent(self, cnpj, api_key, modelo="gemini-2.0-flash-exp", system_instruction=None):
        """
        Obtém ou cria um agente para o usuário especificado.
        
        Args:
            cnpj: CNPJ do usuário (identificador único)
            api_key: Chave da API Gemini
            modelo: Nome do modelo a usar
            system_instruction: Instruções de sistema (opcional)
        
        Returns:
            GeminiAgent: Instância do agente com memória
        """
        # Criar chave única combinando CNPJ e parte da API key
        session_key = f"{cnpj}_{api_key[-8:]}"  # Últimos 8 chars da chave
        
        # Se não existe ou API key mudou, criar novo agente
        if session_key not in self.sessions:
            self.sessions[session_key] = GeminiAgent(
                api_key=api_key,
                modelo=modelo,
                system_instruction=system_instruction
            )
            print(f"✅ Nova sessão de chat criada para {cnpj}")
        
        return self.sessions[session_key]
    
    def clear_session(self, cnpj, api_key):
        """
        Limpa o histórico de uma sessão específica.
        
        Args:
            cnpj: CNPJ do usuário
            api_key: Chave da API
        """
        session_key = f"{cnpj}_{api_key[-8:]}"
        
        if session_key in self.sessions:
            self.sessions[session_key].clear_history()
            print(f"✅ Histórico limpo para {cnpj}")
        else:
            print(f"⚠️ Nenhuma sessão ativa para {cnpj}")
    
    def remove_session(self, cnpj, api_key):
        """
        Remove completamente uma sessão.
        
        Args:
            cnpj: CNPJ do usuário
            api_key: Chave da API
        """
        session_key = f"{cnpj}_{api_key[-8:]}"
        
        if session_key in self.sessions:
            del self.sessions[session_key]
            print(f"✅ Sessão removida para {cnpj}")
    
    def get_session_summary(self, cnpj, api_key):
        """
        Retorna estatísticas da sessão de um usuário.
        
        Args:
            cnpj: CNPJ do usuário
            api_key: Chave da API
        
        Returns:
            dict: Estatísticas da conversa ou None se não existir
        """
        session_key = f"{cnpj}_{api_key[-8:]}"
        
        if session_key in self.sessions:
            return self.sessions[session_key].get_conversation_summary()
        return None
    
    def get_active_sessions_count(self):
        """
        Retorna o número de sessões ativas.
        
        Returns:
            int: Quantidade de sessões ativas
        """
        return len(self.sessions)


# Instância global do gerenciador (singleton)
chat_manager = ChatSessionManager()
