// Chat IA Fiscal - Interface de conversação
document.addEventListener("DOMContentLoaded", () => {
  const chatBox = document.getElementById("chat-box");
  const perguntaInput = document.getElementById("pergunta");
  const enviarBtn = document.getElementById("enviar");
  const ativarChavesBtn = document.getElementById("ativarChaves");
  const apiKeyInput = document.getElementById("apiKeyInput");
  const tavilyKeyInput = document.getElementById("tavilyKeyInput");
  const statusDiv = document.getElementById("apiStatus");
  const activationBanner = document.getElementById("activationBanner");
  const activationBannerText = document.querySelector(".activation-banner-text");
  const googleBadge = document.getElementById("googleBadge");
  const tavilyBadge = document.getElementById("tavilyBadge");

  let currentApiKey = localStorage.getItem("apiKey") || "";
  let currentTavilyKey = localStorage.getItem("tavilyKey") || "";

  if (currentApiKey) {
    apiKeyInput.value = currentApiKey;
  }
  if (currentTavilyKey) {
    tavilyKeyInput.value = currentTavilyKey;
  }

  function setStatus(message, type = "info") {
    statusDiv.textContent = message;
    statusDiv.classList.remove("hidden", "success", "info", "error");
    statusDiv.classList.add(type);
  }

  function hideStatus() {
    statusDiv.textContent = "";
    statusDiv.classList.add("hidden");
    statusDiv.classList.remove("success", "info", "error");
  }

  function refreshBadges() {
    const geminiActive = Boolean(currentApiKey);
    const tavilyActive = Boolean(currentTavilyKey);

    googleBadge.classList.toggle("active", geminiActive);
    googleBadge.textContent = geminiActive ? "Google Gemini conectada" : "Google Gemini";

    tavilyBadge.classList.toggle("active", tavilyActive);
    tavilyBadge.textContent = tavilyActive ? "Tavily Search ativa" : "Tavily Search";

    if (geminiActive) {
      activationBanner.classList.remove("hidden");
      activationBanner.querySelector("strong").textContent = tavilyActive
        ? "Ferramentas conectadas!"
        : "Assistente fiscal pronto!";
      activationBannerText.textContent = tavilyActive
        ? "O agente usa dados internos e buscas fiscais em tempo real."
        : "O agente usa suas notas fiscais; ative a Tavily para pesquisas na web.";
    } else {
      activationBanner.classList.add("hidden");
    }
  }

  refreshBadges();

  function addMessage(text, sender) {
    const msg = document.createElement("div");
    msg.classList.add("chat-message", sender);
    msg.textContent = text;
    chatBox.appendChild(msg);
    chatBox.scrollTop = chatBox.scrollHeight;
    return msg;
  }

  ativarChavesBtn.addEventListener("click", () => {
    const geminiKey = apiKeyInput.value.trim();
    const tavilyKey = tavilyKeyInput.value.trim();

    if (!geminiKey) {
      setStatus("Informe a chave do Google Gemini para habilitar o assistente fiscal.", "error");
      currentApiKey = "";
      localStorage.removeItem("apiKey");
      refreshBadges();
      return;
    }

    currentApiKey = geminiKey;
    localStorage.setItem("apiKey", geminiKey);

    if (tavilyKey) {
      currentTavilyKey = tavilyKey;
      localStorage.setItem("tavilyKey", tavilyKey);
    } else {
      currentTavilyKey = "";
      localStorage.removeItem("tavilyKey");
    }

    const mensagem = currentTavilyKey
      ? "Chaves ativadas! O agente utilizará dados internos e pesquisa fiscal Tavily."
      : "Chave Gemini ativada! Pesquisa web segue opcional.";

    setStatus(mensagem, "success");
    refreshBadges();
  });

  async function enviarPergunta() {
    const pergunta = perguntaInput.value.trim();

    if (!currentApiKey) {
      setStatus("Ative a chave do Google Gemini antes de iniciar a conversa.", "error");
      addMessage("Ative a chave do Google Gemini na barra lateral para conversar.", "bot");
      return;
    }

    if (!pergunta) {
      addMessage("Escreva uma pergunta antes de enviar.", "bot");
      return;
    }

    addMessage(pergunta, "user");
    perguntaInput.value = "";

    const loadingMsg = addMessage("Pensando... (analisando suas notas fiscais)", "bot");
    enviarBtn.disabled = true;
    enviarBtn.textContent = "Enviando...";

    try {
      const resposta = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pergunta, apiKey: currentApiKey, tavilyKey: currentTavilyKey }),
        credentials: "include"
      });

      const data = await resposta.json();
      chatBox.removeChild(loadingMsg);

      if (resposta.ok && data.resposta) {
        addMessage(data.resposta, "bot");
      } else {
        addMessage("Erro: " + (data.erro || "Sem resposta da IA."), "bot");
        setStatus(data.erro || "Ocorreu um erro ao processar sua pergunta.", "error");
      }
    } catch (err) {
      chatBox.removeChild(loadingMsg);
      addMessage("Erro na comunicação com o servidor.", "bot");
      console.error("Erro:", err);
      setStatus("Não foi possível conectar ao servidor. Tente novamente em instantes.", "error");
    } finally {
      enviarBtn.disabled = false;
      enviarBtn.textContent = "Enviar";
    }
  }

  enviarBtn.addEventListener("click", enviarPergunta);

  // Enter key sends message
  perguntaInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      enviarPergunta();
    }
  });

  // Limpa mensagem ao digitar nova pergunta
  perguntaInput.addEventListener("input", () => {
    hideStatus();
  });

  apiKeyInput.addEventListener("input", hideStatus);
  tavilyKeyInput.addEventListener("input", hideStatus);
});