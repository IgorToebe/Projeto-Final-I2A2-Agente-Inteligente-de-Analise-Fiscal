import { DASHBOARD_SCREENS, DEFAULT_DASHBOARD_SCREEN } from "/config/screens.js";

// Dashboard - Funcionalidades principais
const STORAGE_KEYS = { gemini: "apiKey", tavily: "tavilyKey" };
const SCREEN_STORAGE_KEY = "dashboardActiveScreen";
let currentApiKey = "";
let currentTavilyKey = "";
let currentScreenId = DEFAULT_DASHBOARD_SCREEN;

const uploadUI = {
    form: null,
    box: null,
    fileInput: null,
    trigger: null,
    preview: null,
    button: null,
    result: null,
    statusBanner: null,
    originalButtonContent: ""
};

const FILE_SIZE_UNITS = ["B", "KB", "MB", "GB"];

function formatFileSize(bytes) {
    if (!bytes) {
        return "0 B";
    }

    const exponent = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), FILE_SIZE_UNITS.length - 1);
    const size = bytes / Math.pow(1024, exponent);
    return `${size.toFixed(exponent === 0 ? 0 : 1)} ${FILE_SIZE_UNITS[exponent]}`;
}

function syncUploadButtonState() {
    if (!uploadUI.button) {
        return;
    }
    const hasFiles = Boolean(uploadUI.fileInput && uploadUI.fileInput.files && uploadUI.fileInput.files.length);
    const canSubmit = hasFiles && Boolean(currentApiKey);
    if (!uploadUI.button.disabled && !canSubmit) {
        uploadUI.button.disabled = true;
    } else if (canSubmit) {
        uploadUI.button.disabled = false;
    }
}

function setUploadResult(message, state = "info") {
    if (!uploadUI.result) {
        return;
    }

    uploadUI.result.classList.remove("result-success", "result-error", "result-info", "result-visible");

    if (!message) {
        uploadUI.result.innerHTML = "";
        return;
    }

    const statusClass = ["success", "error", "info"].includes(state) ? state : "info";
    uploadUI.result.innerHTML = message;
    uploadUI.result.classList.add(`result-${statusClass}`, "result-visible");
}

function clearUploadSelection(options = {}) {
    const { resetResult = true, focusBox = true } = options;

    if (uploadUI.fileInput) {
        uploadUI.fileInput.value = "";
    }

    updateUploadPreview(uploadUI.fileInput?.files);

    if (resetResult) {
        setUploadResult("");
    }

    if (focusBox && uploadUI.box) {
        uploadUI.box.focus();
    }
}

function updateUploadPreview(fileList) {
    if (!uploadUI.preview || !uploadUI.button) {
        return;
    }

    const files = Array.from(fileList || []);

    if (!files.length) {
        uploadUI.preview.classList.add("hidden");
        uploadUI.preview.innerHTML = "";
        uploadUI.button.disabled = true;
        return;
    }

    const totalSize = files.reduce((acc, file) => acc + (file.size || 0), 0);
    const itemsMarkup = files.map((file) => {
        const extension = file.name?.split(".").pop()?.toLowerCase() || "";
        let badgeLabel = extension ? extension.toUpperCase() : "ARQ";
        if (["pdf", "xml", "csv"].includes(extension)) {
            badgeLabel = extension.toUpperCase();
        }

        return `<li class="file-preview-item">
                    <span>
                        <span class="file-badge">${badgeLabel}</span>${file.name}
                    </span>
                    <span class="file-preview-size">${formatFileSize(file.size)}</span>
                </li>`;
    }).join("");

    uploadUI.preview.innerHTML = `
        <div class="file-preview-header">
            <span>${files.length} arquivo${files.length > 1 ? "s" : ""} selecionado${files.length > 1 ? "s" : ""}</span>
            <button type="button" class="file-preview-clear" id="file-clear-btn">Limpar</button>
        </div>
        <ul class="file-preview-list">${itemsMarkup}</ul>
        <div class="file-preview-footer">Total aproximado: ${formatFileSize(totalSize)}</div>
    `;

    uploadUI.preview.classList.remove("hidden");

    const clearBtn = document.getElementById("file-clear-btn");
    if (clearBtn) {
        clearBtn.addEventListener("click", () => clearUploadSelection(), { once: true });
    }

    syncUploadButtonState();
}

function buildUploadResultMarkup(items) {
    if (!Array.isArray(items) || !items.length) {
        return { html: "Processamento concluído.", state: "success" };
    }

    let hasError = false;

    const listItems = items.map((item) => {
        const name = item?.arquivo || item?.nota || "Arquivo";
        const statusText = item?.status || "Processado";
        const normalized = statusText.toString().toLowerCase();
        let statusClass = "info";

        if (normalized.includes("erro") || normalized.includes("falha")) {
            statusClass = "error";
            hasError = true;
        } else if (normalized.includes("sucesso") || normalized.includes("process") || normalized.includes("ok")) {
            statusClass = "ok";
        }

        const label = item?.arquivo && item?.nota
            ? `${item.arquivo} (NF ${item.nota})`
            : name;

        return `<li class="result-item">
                    <span>${label}</span>
                    <span class="result-status ${statusClass}">${statusText}</span>
                </li>`;
    }).join("");

    const summaryText = `${items.length} arquivo${items.length > 1 ? "s" : ""} processado${items.length > 1 ? "s" : ""}`;

    return {
        html: `<strong>${summaryText}</strong><ul class="result-list">${listItems}</ul>`,
        state: hasError ? "error" : "success"
    };
}

function handleUploadDragOver(event) {
    event.preventDefault();
    uploadUI.box?.classList.add("dragging");
}

function handleUploadDragLeave(event) {
    event.preventDefault();
    uploadUI.box?.classList.remove("dragging");
}

function handleUploadDrop(event) {
    event.preventDefault();
    handleUploadDragLeave(event);

    if (!uploadUI.fileInput) {
        return;
    }

    const droppedFiles = event.dataTransfer?.files;
    if (!droppedFiles || !droppedFiles.length) {
        return;
    }

    try {
        const dataTransfer = new DataTransfer();
        Array.from(droppedFiles).forEach((file) => dataTransfer.items.add(file));
        uploadUI.fileInput.files = dataTransfer.files;
        updateUploadPreview(uploadUI.fileInput.files);
    } catch (error) {
        console.warn("DataTransfer não suportado, tentando aplicar FileList diretamente.", error);
        try {
            uploadUI.fileInput.files = droppedFiles;
        } catch (assignError) {
            console.warn("Não foi possível atribuir arquivos diretamente ao input:", assignError);
        }
        const fallbackFiles = uploadUI.fileInput.files && uploadUI.fileInput.files.length
            ? uploadUI.fileInput.files
            : droppedFiles;
        updateUploadPreview(fallbackFiles);
    }

    setUploadResult("");
}

document.addEventListener("DOMContentLoaded", async () => {
    const logoutBtn = document.getElementById("logoutBtn");
    const uploadForm = document.getElementById("uploadForm");
    const uploadStatus = document.getElementById("uploadStatus");
    const apiKeyInput = document.getElementById("dashboardApiKeyInput");
    const tavilyKeyInput = document.getElementById("dashboardTavilyKeyInput");
    const ativarChavesBtn = document.getElementById("dashboardAtivarChaves");
    const apiStatusDiv = document.getElementById("dashboardApiStatus");
    const dashboardGoogleBadge = document.getElementById("dashboardGoogleBadge");
    const dashboardTavilyBadge = document.getElementById("dashboardTavilyBadge");
    const uploadGoogleBadge = document.getElementById("uploadGoogleBadge");
    const uploadTavilyBadge = document.getElementById("uploadTavilyBadge");
    const uploadKeyStatus = document.getElementById("uploadKeyStatus");
    const salvarRbt12Btn = document.getElementById("salvarRbt12Btn");
    const tabsContainer = document.getElementById("dashboardTabs");
    const screensHost = document.getElementById("dashboardScreens");
    const sectionElements = Array.from(document.querySelectorAll("[data-section-id]"));

    // Chat elements
    const chatBox = document.getElementById("chat-box");
    const perguntaInput = document.getElementById("pergunta");
    const enviarChatBtn = document.getElementById("enviar");
    const activationBanner = document.getElementById("activationBanner");
    const activationBannerText = document.querySelector(".activation-banner-text");

    uploadUI.form = uploadForm;
    uploadUI.box = document.getElementById("upload-box");
    uploadUI.fileInput = document.getElementById("file-input");
    uploadUI.trigger = document.getElementById("file-trigger");
    uploadUI.preview = document.getElementById("file-preview");
    uploadUI.button = document.getElementById("upload-btn");
    uploadUI.result = uploadStatus;
    uploadUI.statusBanner = uploadKeyStatus;

    if (uploadUI.button) {
        uploadUI.originalButtonContent = uploadUI.button.innerHTML;
        uploadUI.button.disabled = true;
    }

    if (uploadUI.result) {
        setUploadResult("");
    }

    if (uploadUI.box) {
        uploadUI.box.addEventListener("dragover", handleUploadDragOver);
        uploadUI.box.addEventListener("dragleave", handleUploadDragLeave);
        uploadUI.box.addEventListener("drop", handleUploadDrop);
        uploadUI.box.addEventListener("click", (event) => {
            if (event.target === uploadUI.trigger) {
                return;
            }
            uploadUI.fileInput?.click();
        });
        uploadUI.box.addEventListener("keydown", (event) => {
            if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                uploadUI.fileInput?.click();
            }
        });
    }

    if (uploadUI.trigger) {
        uploadUI.trigger.addEventListener("click", (event) => {
            event.preventDefault();
            uploadUI.fileInput?.click();
        });
    }

    if (uploadUI.fileInput) {
        uploadUI.fileInput.addEventListener("change", () => {
            updateUploadPreview(uploadUI.fileInput.files);
            setUploadResult("");
        });
    }

    const sectionRegistry = new Map();
    sectionElements.forEach((section) => {
        const sectionId = section.dataset.sectionId;
        if (!sectionId) {
            return;
        }
        sectionRegistry.set(sectionId, section);
    });

    const screenElements = new Map();
    const tabButtons = new Map();

    const setActiveScreen = (screenId) => {
        if (!screenElements.has(screenId)) {
            console.warn(`[dashboard] Tela não configurada: ${screenId}`);
            return;
        }

        if (currentScreenId && screenElements.has(currentScreenId)) {
            screenElements.get(currentScreenId).classList.remove("active");
            tabButtons.get(currentScreenId)?.classList.remove("active");
        }

        screenElements.get(screenId).classList.add("active");
        tabButtons.get(screenId)?.classList.add("active");
        currentScreenId = screenId;
        localStorage.setItem(SCREEN_STORAGE_KEY, screenId);

        // Load fiscal data when fiscal-dashboard screen is activated
        if (screenId === "fiscal-dashboard") {
            carregarDadosFiscais();
        }
    };

    const buildScreens = () => {
        if (!screensHost) {
            return;
        }

        const fragment = document.createDocumentFragment();

        DASHBOARD_SCREENS.forEach((screen) => {
            const wrapper = document.createElement("section");
            wrapper.classList.add("dashboard-screen");
            wrapper.dataset.screenId = screen.id;

            screen.sections.forEach((sectionId) => {
                const section = sectionRegistry.get(sectionId);
                if (!section) {
                    console.warn(`[dashboard] Seção não encontrada na configuração: ${sectionId}`);
                    return;
                }
                section.classList.remove("screen-section");
                wrapper.appendChild(section);
            });

            fragment.appendChild(wrapper);
            screenElements.set(screen.id, wrapper);
        });

        screensHost.appendChild(fragment);
    };

    const buildTabs = () => {
        if (!tabsContainer) {
            return;
        }

        const fragment = document.createDocumentFragment();

        DASHBOARD_SCREENS.forEach((screen) => {
            const button = document.createElement("button");
            button.type = "button";
            button.className = "dashboard-tab";
            button.dataset.screenId = screen.id;
            button.textContent = screen.label;
            if (screen.description) {
                button.title = screen.description;
            }

            button.addEventListener("click", () => setActiveScreen(screen.id));
            fragment.appendChild(button);
            tabButtons.set(screen.id, button);
        });

        tabsContainer.appendChild(fragment);
    };

    buildScreens();
    buildTabs();

    const storedScreenId = localStorage.getItem(SCREEN_STORAGE_KEY);
    const initialScreen = DASHBOARD_SCREENS.some((screen) => screen.id === storedScreenId)
        ? storedScreenId
        : DEFAULT_DASHBOARD_SCREEN;
    setActiveScreen(initialScreen);

    document.querySelectorAll("[data-screen-target]").forEach((trigger) => {
        trigger.setAttribute("type", trigger.getAttribute("type") || "button");
        trigger.addEventListener("click", (event) => {
            event.preventDefault();
            const targetId = trigger.dataset.screenTarget;
            if (targetId) {
                setActiveScreen(targetId);
            }
        });
    });

    currentApiKey = localStorage.getItem(STORAGE_KEYS.gemini) || "";
    currentTavilyKey = localStorage.getItem(STORAGE_KEYS.tavily) || "";

    if (apiKeyInput) apiKeyInput.value = currentApiKey;
    if (tavilyKeyInput) tavilyKeyInput.value = currentTavilyKey;

    const setSidebarStatus = (message, type = "info") => {
        if (!apiStatusDiv) return;
        apiStatusDiv.textContent = message;
        apiStatusDiv.classList.remove("hidden", "success", "info", "error");
        apiStatusDiv.classList.add(type);
    };

    const hideSidebarStatus = () => {
        if (!apiStatusDiv) return;
        apiStatusDiv.textContent = "";
        apiStatusDiv.classList.add("hidden");
        apiStatusDiv.classList.remove("success", "info", "error");
    };

    const updateBadge = (badge, active, activeText, defaultText) => {
        if (!badge) return;
        badge.classList.toggle("active", active);
        badge.textContent = active ? activeText : defaultText;
    };

    const refreshIntegrations = () => {
        const geminiActive = Boolean(currentApiKey);
        const tavilyActive = Boolean(currentTavilyKey);

        updateBadge(dashboardGoogleBadge, geminiActive, "Google Gemini conectada", "Google Gemini");
        updateBadge(uploadGoogleBadge, geminiActive, "Google Gemini conectada", "Google Gemini");
        updateBadge(dashboardTavilyBadge, tavilyActive, "Tavily Search ativa", "Tavily Search");
        updateBadge(uploadTavilyBadge, tavilyActive, "Tavily Search ativa", "Tavily Search");

        if (uploadKeyStatus) {
            uploadKeyStatus.classList.remove("hidden", "success", "info", "error");

            if (geminiActive) {
                const message = tavilyActive
                    ? "Chaves ativas! O upload aplicará análise Gemini e pesquisa Tavily."
                    : "Chave Gemini ativa. As notas serão processadas com análise fiscal contextual.";
                uploadKeyStatus.classList.add("success");
                uploadKeyStatus.textContent = message;
            } else {
                uploadKeyStatus.classList.add("info");
                uploadKeyStatus.textContent = "Ative a chave do Google Gemini na barra lateral para liberar o envio.";
            }
        }

        // Update chat activation banner
        if (activationBanner) {
            if (geminiActive) {
                activationBanner.classList.remove("hidden");
                activationBanner.querySelector("strong").textContent = tavilyActive
                    ? "Ferramentas conectadas!"
                    : "Assistente fiscal pronto!";
                if (activationBannerText) {
                    activationBannerText.textContent = tavilyActive
                        ? "O agente usa dados internos e buscas fiscais em tempo real."
                        : "O agente usa suas notas fiscais; ative a Tavily para pesquisas na web.";
                }
            } else {
                activationBanner.classList.add("hidden");
            }
        }
        syncUploadButtonState();
    };

    refreshIntegrations();

    // Limpar mensagem inicial se chaves já estiverem ativas
    if (currentApiKey) {
        clearInitialChatMessage();
    }

    if (logoutBtn) {
        logoutBtn.addEventListener("click", async () => {
            const res = await fetch("/logout", { method: "POST", credentials: "include" });
            if (res.ok) window.location.href = "/";
        });
    }

    // Chat functionality
    function addChatMessage(text, sender) {
        if (!chatBox) return;
        const msg = document.createElement("div");
        msg.classList.add("chat-message", sender);
        msg.textContent = text;
        chatBox.appendChild(msg);
        chatBox.scrollTop = chatBox.scrollHeight;
        return msg;
    }

    function clearInitialChatMessage() {
        if (!chatBox) return;
        const initialMessage = chatBox.querySelector(".chat-message.bot");
        if (initialMessage && initialMessage.textContent.includes("Ative as chaves na lateral")) {
            chatBox.removeChild(initialMessage);
        }
    }

    async function limparHistoricoChat() {
        if (!currentApiKey) {
            addChatMessage("Ative a chave do Google Gemini primeiro.", "bot");
            return;
        }

        const confirmacao = confirm("Limpar histórico da conversa?\n\nIsso apagará toda a memória do chat e o agente não lembrará das mensagens anteriores.");
        if (!confirmacao) return;

        try {
            const resposta = await fetch("/api/chat/clear", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ apiKey: currentApiKey }),
                credentials: "include"
            });

            const data = await resposta.json();

            if (resposta.ok) {
                // Limpar visualmente o chat (manter apenas mensagem de confirmação)
                if (chatBox) {
                    chatBox.innerHTML = "";
                }
                addChatMessage("Histórico limpo! Nova conversa iniciada. O agente não lembrará das mensagens anteriores.", "bot");
            } else {
                addChatMessage("Erro ao limpar histórico: " + (data.erro || "Erro desconhecido"), "bot");
            }
        } catch (err) {
            addChatMessage("Erro na comunicação com o servidor.", "bot");
            console.error("Erro ao limpar histórico:", err);
        }
    }

    async function enviarPergunta() {
        if (!perguntaInput || !enviarChatBtn) return;

        const pergunta = perguntaInput.value.trim();

        if (!currentApiKey) {
            setSidebarStatus("Ative a chave do Google Gemini antes de iniciar a conversa.", "error");
            addChatMessage("Ative a chave do Google Gemini na barra lateral para conversar.", "bot");
            return;
        }

        if (!pergunta) {
            addChatMessage("Escreva uma pergunta antes de enviar.", "bot");
            return;
        }

        addChatMessage(pergunta, "user");
        perguntaInput.value = "";

        const loadingMsg = addChatMessage("Pensando... (analisando suas notas fiscais)", "bot");
        enviarChatBtn.disabled = true;
        enviarChatBtn.textContent = "Enviando...";

        try {
            const resposta = await fetch("/api/chat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ pergunta, apiKey: currentApiKey, tavilyKey: currentTavilyKey }),
                credentials: "include"
            });

            const data = await resposta.json();
            if (loadingMsg && chatBox.contains(loadingMsg)) {
                chatBox.removeChild(loadingMsg);
            }

            if (resposta.ok && data.resposta) {
                addChatMessage(data.resposta, "bot");
            } else {
                addChatMessage("Erro: " + (data.erro || "Sem resposta da IA."), "bot");
                setSidebarStatus(data.erro || "Ocorreu um erro ao processar sua pergunta.", "error");
            }
        } catch (err) {
            if (loadingMsg && chatBox.contains(loadingMsg)) {
                chatBox.removeChild(loadingMsg);
            }
            addChatMessage("Erro na comunicação com o servidor.", "bot");
            console.error("Erro:", err);
            setSidebarStatus("Não foi possível conectar ao servidor. Tente novamente em instantes.", "error");
        } finally {
            enviarChatBtn.disabled = false;
            enviarChatBtn.textContent = "Enviar";
        }
    }

    // Expor função globalmente para uso no HTML
    window.limparHistoricoChat = limparHistoricoChat;

    if (enviarChatBtn) {
        enviarChatBtn.addEventListener("click", enviarPergunta);
    }

    if (perguntaInput) {
        perguntaInput.addEventListener("keypress", (e) => {
            if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                enviarPergunta();
            }
        });
        perguntaInput.addEventListener("input", hideSidebarStatus);
    }

    if (ativarChavesBtn) {
        ativarChavesBtn.addEventListener("click", () => {
            const geminiKey = apiKeyInput ? apiKeyInput.value.trim() : "";
            const tavilyKey = tavilyKeyInput ? tavilyKeyInput.value.trim() : "";

            // Sempre limpar chaves antigas primeiro (garante substituição completa)
            localStorage.removeItem(STORAGE_KEYS.gemini);
            localStorage.removeItem(STORAGE_KEYS.tavily);
            currentApiKey = "";
            currentTavilyKey = "";

            if (!geminiKey) {
                // Sem chave Gemini: limpar inputs e mostrar erro
                if (apiKeyInput) apiKeyInput.value = "";
                if (tavilyKeyInput) tavilyKeyInput.value = "";
                setSidebarStatus("Informe a chave do Google Gemini para habilitar o processamento.", "error");
                refreshIntegrations();
                return;
            }

            // Salvar nova chave Gemini (substitui a anterior)
            currentApiKey = geminiKey;
            localStorage.setItem(STORAGE_KEYS.gemini, geminiKey);

            // Salvar ou remover chave Tavily conforme preenchido
            if (tavilyKey) {
                currentTavilyKey = tavilyKey;
                localStorage.setItem(STORAGE_KEYS.tavily, tavilyKey);
            }

            const mensagem = currentTavilyKey
                ? "Chaves ativadas! O dashboard usará Gemini e Tavily nos envios."
                : "Chave Gemini ativada! Os arquivos enviados serão interpretados pelo agente.";

            setSidebarStatus(mensagem, "success");
            clearInitialChatMessage();
            refreshIntegrations();
            syncUploadButtonState();
        });
    }

    if (apiKeyInput) apiKeyInput.addEventListener("input", hideSidebarStatus);
    if (tavilyKeyInput) tavilyKeyInput.addEventListener("input", hideSidebarStatus);
    if (salvarRbt12Btn) salvarRbt12Btn.addEventListener("click", salvarRBT12);

    await carregarDadosUsuario();
    await carregarMetricasDashboard();

    if (uploadForm) {
        uploadForm.addEventListener("submit", async (e) => {
            e.preventDefault();
            await processarUpload();
        });
    }
});

async function carregarDadosUsuario() {
    try {
        const res = await fetch("/api/usuario_dados", { credentials: "include" });
        const data = await res.json();

        document.getElementById("nomeEmpresa").textContent = data.nome || "—";
        document.getElementById("regimeEmpresa").textContent = data.regime || "—";
        document.getElementById("naturezaEmpresa").textContent = data.natureza || "—";

        const rbt12Value = data.rbt12 || 0;
        document.getElementById("rbt12").textContent = formatarMoeda(rbt12Value);
        document.getElementById("rbt12Input").value = rbt12Value;
    } catch (e) {
        console.error("Erro ao carregar dados:", e);
        document.getElementById("nomeEmpresa").textContent = "—";
        document.getElementById("regimeEmpresa").textContent = "—";
        document.getElementById("naturezaEmpresa").textContent = "—";
        document.getElementById("rbt12").textContent = "R$ 0,00";
    }
}

async function salvarRBT12() {
    const rbt12Input = document.getElementById("rbt12Input").value;
    const rbt12 = parseFloat(rbt12Input);

    if (isNaN(rbt12) || rbt12 < 0) {
        alert("RBT12 deve ser um número positivo!");
        return;
    }

    try {
        const res = await fetch("/api/atualizar_rbt12", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ rbt12 }),
            credentials: "include"
        });
        const data = await res.json();

        if (res.ok) {
            alert("RBT12 salvo com sucesso!");
            document.getElementById("rbt12").textContent = formatarMoeda(rbt12);
        } else {
            alert("Erro: " + data.erro);
        }
    } catch (error) {
        alert("Erro de conexão: " + error.message);
        console.error("Erro salvar RBT12:", error);
    }
}

async function processarUpload() {
    const files = uploadUI.fileInput?.files;

    if (!files || !files.length) {
        setUploadResult("Selecione pelo menos um arquivo antes de enviar.", "error");
        uploadUI.box?.focus();
        return;
    }

    if (!currentApiKey) {
        setUploadResult("", "info");
        if (uploadUI.statusBanner) {
            uploadUI.statusBanner.classList.remove("hidden", "success", "error");
            uploadUI.statusBanner.classList.add("info");
            uploadUI.statusBanner.textContent = "Ative a chave do Google Gemini na barra lateral para liberar o envio.";
        }
        syncUploadButtonState();
        return;
    }

    const formData = new FormData();
    Array.from(files).forEach((file) => formData.append("files", file));
    formData.append("api_key", currentApiKey);
    if (currentTavilyKey) {
        formData.append("tavily_key", currentTavilyKey);
    }

    if (uploadUI.button) {
        uploadUI.button.disabled = true;
        uploadUI.button.innerHTML = "Enviando...";
    }

    setUploadResult("Enviando arquivos...", "info");

    try {
        const res = await fetch("/api/process-documents", {
            method: "POST",
            body: formData,
            credentials: "include"
        });

        const responseText = await res.text();
        let data = null;

        if (responseText) {
            try {
                data = JSON.parse(responseText);
            } catch (parseError) {
                console.warn("Resposta de upload não está em JSON válido:", parseError, responseText);
            }
        }

        if (!res.ok) {
            const message = data?.erro || data?.error || data?.message || res.statusText || "Falha no processamento.";
            setUploadResult(`Erro: ${message}`, "error");
            if (uploadUI.statusBanner) {
                uploadUI.statusBanner.classList.remove("success", "info");
                uploadUI.statusBanner.classList.add("error");
                uploadUI.statusBanner.textContent = message;
            }
            return;
        }

        const payload = Array.isArray(data) ? data : data?.result;
        const { html, state } = buildUploadResultMarkup(payload || []);
        setUploadResult(html, state);

        if (uploadUI.statusBanner) {
            uploadUI.statusBanner.classList.remove("error", "info");
            uploadUI.statusBanner.classList.add("success");
            uploadUI.statusBanner.textContent = currentTavilyKey
                ? "Upload concluído com Gemini e Tavily ativos."
                : "Upload concluído com análise do Gemini.";
        }

        clearUploadSelection({ resetResult: false, focusBox: false });
        carregarMetricasDashboard();
        carregarDadosFiscais();
    } catch (error) {
        console.error("Erro no upload:", error);
        setUploadResult(`Erro ao enviar os arquivos: ${error.message || error}`, "error");
        if (uploadUI.statusBanner) {
            uploadUI.statusBanner.classList.remove("success", "info");
            uploadUI.statusBanner.classList.add("error");
            uploadUI.statusBanner.textContent = "Erro ao enviar arquivos. Verifique sua conexão e tente novamente.";
        }
    } finally {
        if (uploadUI.button) {
            uploadUI.button.innerHTML = uploadUI.originalButtonContent || "Enviar";
        }
        syncUploadButtonState();
    }
}

function formatarMoeda(valor) {
    return `R$ ${parseFloat(valor).toLocaleString('pt-BR', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    })}`;
}

async function carregarMetricasDashboard() {
    try {
        const res = await fetch("/api/dashboard_metrics", { credentials: "include" });
        const data = await res.json();

        if (res.ok) {
            document.getElementById("faturamento").textContent = formatarMoeda(data.faturamento_total);
            document.getElementById("numNotas").textContent = data.num_notas;
            document.getElementById("ticketMedio").textContent = formatarMoeda(data.ticket_medio);
            document.getElementById("numClientes").textContent = data.num_clientes;
        } else {
            console.error("Erro ao carregar métricas:", data.erro);
        }
    } catch (e) {
        console.error("Erro ao carregar métricas do dashboard:", e);
    }
}

// Fiscal Dashboard - Chart instances
let chartClassificacao = null;
let chartImpostosConsolidados = null;
let chartImpostosPorNota = null;

async function carregarDadosFiscais() {
    console.log("[DEBUG] carregarDadosFiscais() iniciado");
    const loadingState = document.getElementById("fiscalLoadingState");
    const errorState = document.getElementById("fiscalErrorState");
    const chartsContainer = document.getElementById("fiscalChartsContainer");

    if (!loadingState || !errorState || !chartsContainer) {
        console.error("[DEBUG] Elementos do DOM não encontrados!");
        return;
    }

    // Show loading
    loadingState.style.display = "flex";
    errorState.classList.add("hidden");
    chartsContainer.classList.add("hidden");

    try {
        console.log("[DEBUG] Fazendo fetch para /api/fiscal_data");
        const res = await fetch("/api/fiscal_data", { credentials: "include" });
        const data = await res.json();
        console.log("[DEBUG] Resposta recebida:", data);

        if (!res.ok) {
            throw new Error(data.erro || "Erro ao carregar dados fiscais");
        }

        // Hide loading, show charts
        loadingState.style.display = "none";
        chartsContainer.classList.remove("hidden");

        console.log("[DEBUG] Renderizando gráficos com dados:", {
            classificacao: data.classificacao?.length,
            impostosPorNota: data.impostosPorNota?.length,
            impostos: data.impostosConsolidados
        });

        // Render charts with fetched data
        renderChartClassificacao(data.classificacao);
        renderChartImpostosConsolidados(data.impostosConsolidados);
        renderChartImpostosPorNota(data.impostosPorNota);

    } catch (error) {
        console.error("[DEBUG] Erro ao carregar dados fiscais:", error);
        loadingState.style.display = "none";
        errorState.classList.remove("hidden");
    }
}

function renderChartClassificacao(classificacao) {
    const ctx = document.getElementById("classificacaoChart");
    if (!ctx) return;

    // Count entrada vs saida
    const entrada = classificacao.filter(n => n.tipo === "Entrada").length;
    const saida = classificacao.filter(n => n.tipo === "Saída").length;

    // Destroy previous instance
    if (chartClassificacao) {
        chartClassificacao.destroy();
    }

    chartClassificacao = new Chart(ctx, {
        type: "doughnut",
        data: {
            labels: ["Entrada", "Saída"],
            datasets: [{
                data: [entrada, saida],
                backgroundColor: [
                    "rgba(34, 197, 94, 0.75)",
                    "rgba(96, 165, 250, 0.75)"
                ],
                borderColor: [
                    "rgba(34, 197, 94, 1)",
                    "rgba(96, 165, 250, 1)"
                ],
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    position: "bottom",
                    labels: {
                        color: "rgba(226, 232, 240, 0.87)",
                        font: { size: 14 },
                        padding: 15
                    }
                },
                tooltip: {
                    callbacks: {
                        label: (context) => {
                            const label = context.label || "";
                            const value = context.parsed || 0;
                            const total = context.dataset.data.reduce((a, b) => a + b, 0);
                            const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : 0;
                            return `${label}: ${value} notas (${percentage}%)`;
                        }
                    }
                }
            }
        }
    });
}

function renderChartImpostosConsolidados(impostosConsolidados) {
    const ctx = document.getElementById("impostosConsolidadosChart");
    if (!ctx) return;

    const { ICMS, PIS, COFINS } = impostosConsolidados;

    if (chartImpostosConsolidados) {
        chartImpostosConsolidados.destroy();
    }

    chartImpostosConsolidados = new Chart(ctx, {
        type: "bar",
        data: {
            labels: ["ICMS", "PIS", "COFINS"],
            datasets: [{
                label: "Valor Total (R$)",
                data: [ICMS, PIS, COFINS],
                backgroundColor: [
                    "rgba(96, 165, 250, 0.75)",
                    "rgba(34, 197, 94, 0.75)",
                    "rgba(168, 85, 247, 0.75)"
                ],
                borderColor: [
                    "rgba(96, 165, 250, 1)",
                    "rgba(34, 197, 94, 1)",
                    "rgba(168, 85, 247, 1)"
                ],
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    callbacks: {
                        label: (context) => {
                            const value = context.parsed.y || 0;
                            return `Total: R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        color: "rgba(226, 232, 240, 0.7)",
                        callback: (value) => `R$ ${value.toLocaleString('pt-BR')}`
                    },
                    grid: {
                        color: "rgba(96, 165, 250, 0.1)"
                    }
                },
                x: {
                    ticks: {
                        color: "rgba(226, 232, 240, 0.87)",
                        font: { size: 13, weight: "600" }
                    },
                    grid: {
                        display: false
                    }
                }
            }
        }
    });
}

function renderChartImpostosPorNota(impostosPorNota) {
    const ctx = document.getElementById("impostosPorNotaChart");
    if (!ctx) return;

    const labels = impostosPorNota.map(n => n.nota);
    const icmsData = impostosPorNota.map(n => n.ICMS);
    const pisData = impostosPorNota.map(n => n.PIS);
    const cofinsData = impostosPorNota.map(n => n.COFINS);

    if (chartImpostosPorNota) {
        chartImpostosPorNota.destroy();
    }

    chartImpostosPorNota = new Chart(ctx, {
        type: "bar",
        data: {
            labels: labels,
            datasets: [
                {
                    label: "ICMS",
                    data: icmsData,
                    backgroundColor: "rgba(96, 165, 250, 0.75)",
                    borderColor: "rgba(96, 165, 250, 1)",
                    borderWidth: 2
                },
                {
                    label: "PIS",
                    data: pisData,
                    backgroundColor: "rgba(34, 197, 94, 0.75)",
                    borderColor: "rgba(34, 197, 94, 1)",
                    borderWidth: 2
                },
                {
                    label: "COFINS",
                    data: cofinsData,
                    backgroundColor: "rgba(168, 85, 247, 0.75)",
                    borderColor: "rgba(168, 85, 247, 1)",
                    borderWidth: 2
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    position: "bottom",
                    labels: {
                        color: "rgba(226, 232, 240, 0.87)",
                        font: { size: 13 },
                        padding: 12
                    }
                },
                tooltip: {
                    callbacks: {
                        label: (context) => {
                            const label = context.dataset.label || "";
                            const value = context.parsed.y || 0;
                            return `${label}: R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
                        }
                    }
                }
            },
            scales: {
                y: {
                    stacked: true,
                    beginAtZero: true,
                    ticks: {
                        color: "rgba(226, 232, 240, 0.7)",
                        callback: (value) => `R$ ${value.toLocaleString('pt-BR')}`
                    },
                    grid: {
                        color: "rgba(96, 165, 250, 0.1)"
                    }
                },
                x: {
                    stacked: true,
                    ticks: {
                        color: "rgba(226, 232, 240, 0.87)",
                        font: { size: 11 }
                    },
                    grid: {
                        display: false
                    }
                }
            }
        }
    });
}
