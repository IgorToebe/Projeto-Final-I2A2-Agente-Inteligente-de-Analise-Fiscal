"""
Serviço para integração com Google Gemini AI com memória de conversação
"""
import os
import google.generativeai as genai


class GeminiAgent:
    """
    Agente conversacional com memória persistente usando Google Gemini AI.
    Mantém o histórico da conversa para contexto contínuo entre mensagens.
    """
    
    def __init__(self, api_key=None, modelo="gemini-2.0-flash-exp", system_instruction=None):
        """
        Inicializa o agente Gemini com memória de chat.
        
        Args:
            api_key: Chave da API (OBRIGATÓRIO - deve ser fornecida pelo usuário)
            modelo: Nome do modelo Gemini a ser usado
            system_instruction: Instruções de sistema/personalidade do agente (opcional)
        """
        self.api_key = api_key  # Chave deve vir do frontend, não do ambiente
        self.modelo = modelo
        self.system_instruction = system_instruction
        self.history = []  # Histórico de mensagens (user/model)
        self.chat_session = None
        self._initialize_chat()
    
    def _initialize_chat(self):
        """Inicializa a sessão de chat com o modelo Gemini."""
        try:
            if not self.api_key:
                raise ValueError("❌ Nenhuma chave de API fornecida.")
            
            genai.configure(api_key=self.api_key)
            
            # Configurar modelo - tentar com system_instruction se disponível
            try:
                if self.system_instruction:
                    model = genai.GenerativeModel(
                        self.modelo,
                        system_instruction=self.system_instruction
                    )
                else:
                    model = genai.GenerativeModel(self.modelo)
            except TypeError:
                # Fallback para versões antigas sem system_instruction
                print("⚠️ Versão antiga do google-generativeai detectada. System instruction não suportado.")
                model = genai.GenerativeModel(self.modelo)
            
            # Iniciar chat session com histórico existente
            self.chat_session = model.start_chat(history=self.history)
            
        except Exception as e:
            raise RuntimeError(f"⚠️ Erro ao inicializar chat Gemini: {e}")
    
    def send_message(self, message):
        """
        Envia uma mensagem ao agente e retorna a resposta, mantendo o histórico.
        
        Args:
            message: Mensagem do usuário (string)
        
        Returns:
            str: Resposta do modelo ou mensagem de erro
        """
        try:
            if not self.chat_session:
                self._initialize_chat()
            
            # Enviar mensagem e obter resposta
            response = self.chat_session.send_message(message)
            response_text = response.text.strip()
            
            # O histórico é automaticamente atualizado pela API
            # mas mantemos uma cópia local para referência
            self.history = self.chat_session.history
            
            return response_text
            
        except Exception as e:
            return f"⚠️ Erro ao processar mensagem: {e}"
    
    def get_history(self):
        """
        Retorna o histórico completo da conversa.
        
        Returns:
            list: Lista de dicionários com 'role' e 'parts' de cada mensagem
        """
        return [
            {
                'role': msg.role,
                'parts': [part.text for part in msg.parts]
            }
            for msg in self.history
        ]
    
    def clear_history(self):
        """
        Limpa o histórico da conversa e reinicia a sessão de chat.
        Útil para começar uma nova conversa do zero.
        """
        self.history = []
        self._initialize_chat()
        print("✅ Histórico de chat limpo. Nova conversa iniciada.")
    
    def get_conversation_summary(self):
        """
        Retorna um resumo da conversa (quantidade de mensagens).
        
        Returns:
            dict: Estatísticas da conversa
        """
        user_messages = sum(1 for msg in self.history if msg.role == 'user')
        model_messages = sum(1 for msg in self.history if msg.role == 'model')
        
        return {
            'total_messages': len(self.history),
            'user_messages': user_messages,
            'model_messages': model_messages
        }


# Função legada para compatibilidade com código existente
def chamar_gemini(prompt, api_key=None, modelo="gemini-2.0-flash-exp"):
    """
    Função legada para compatibilidade. Cria um agente temporário sem memória.
    
    NOTA: Para conversas com memória, use a classe GeminiAgent diretamente.
    
    Args:
        prompt: Texto do prompt para a IA
        api_key: Chave da API (OBRIGATÓRIO - deve ser fornecida pelo usuário)
        modelo: Nome do modelo Gemini a ser usado
    
    Returns:
        str: Resposta da IA ou mensagem de erro
    """
    try:
        if not api_key:
            return "❌ Nenhuma chave de API fornecida. Por favor, insira sua chave no frontend."

        genai.configure(api_key=api_key)
        model = genai.GenerativeModel(modelo)
        response = model.generate_content(prompt)
        return response.text.strip()

    except Exception as e:
        return f"⚠️ Erro ao chamar Gemini: {e}"
