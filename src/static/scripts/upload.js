// upload.js - integração com /api/process-documents
const uploadBtn = document.getElementById("upload-btn");
const fileInput = document.getElementById("file-input");
const resultDiv = document.getElementById("result");
const uploadBox = document.getElementById("upload-box");
const filePreview = document.getElementById("file-preview");
const fileTrigger = document.getElementById("file-trigger");

// Estilo drag and drop
function handleDragOver(event) {
    event.preventDefault();
    uploadBox?.classList.add("dragging");
}

function handleDragLeave(event) {
    event.preventDefault();
    uploadBox?.classList.remove("dragging");
}

function handleDrop(event) {
    event.preventDefault();
    handleDragLeave(event);
    if (!fileInput) return;

    const droppedFiles = event.dataTransfer?.files;
    if (!droppedFiles || !droppedFiles.length) {
        return;
    }

    try {
        const dataTransfer = new DataTransfer();
        Array.from(droppedFiles).forEach(file => dataTransfer.items.add(file));
        fileInput.files = dataTransfer.files;
        updateFilePreview(fileInput.files);
    } catch (error) {
        // Fallback para navegadores que não suportam DataTransfer()
        console.warn("DataTransfer não suportado, usando FileList original.", error);
        try {
            fileInput.files = droppedFiles;
        } catch (assignError) {
            console.warn("Não foi possível atribuir arquivos diretamente ao input:", assignError);
        }
        updateFilePreview(fileInput.files.length ? fileInput.files : droppedFiles);
    }

    setResult("");
}

function formatFileSize(bytes) {
    if (!bytes) return "0 B";
    const units = ["B", "KB", "MB", "GB"];
    const exponent = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
    const size = bytes / Math.pow(1024, exponent);
    return `${size.toFixed(exponent === 0 ? 0 : 1)} ${units[exponent]}`;
}

function updateFilePreview(files) {
    if (!filePreview || !uploadBtn) return;

    const fileList = Array.from(files || []);
    if (!fileList.length) {
        filePreview.classList.add("hidden");
        filePreview.innerHTML = "";
        uploadBtn.disabled = true;
        return;
    }

    const totalSize = fileList.reduce((acc, file) => acc + (file.size || 0), 0);
    const itemsMarkup = fileList.map(file => {
        const extension = file.name?.split(".").pop()?.toLowerCase() || "";
        const badgeLabel = extension === "pdf" ? "PDF" : extension === "xml" ? "XML" : (extension || "FILE");
        return `<li class="file-preview-item">
                    <span>
                        <span class="file-badge">${badgeLabel}</span>${file.name}
                    </span>
                    <span class="file-preview-size">${formatFileSize(file.size)}</span>
                </li>`;
    }).join("");

    filePreview.innerHTML = `
        <div class="file-preview-header">
            <span>${fileList.length} arquivo${fileList.length > 1 ? "s" : ""} selecionado${fileList.length > 1 ? "s" : ""}</span>
            <button type="button" class="file-preview-clear" id="file-clear-btn">Limpar</button>
        </div>
        <ul class="file-preview-list">${itemsMarkup}</ul>
        <div class="file-preview-footer">Total aproximado: ${formatFileSize(totalSize)}</div>
    `;

    filePreview.classList.remove("hidden");
    uploadBtn.disabled = false;

    const clearBtn = document.getElementById("file-clear-btn");
    if (clearBtn) {
        clearBtn.addEventListener("click", clearFileSelection, { once: true });
    }
}

function clearFileSelection(options = {}) {
    if (!fileInput) {
        return;
    }

    const { resetResult = true } = options;

    fileInput.value = "";
    updateFilePreview(fileInput.files);

    if (resetResult) {
        setResult("");
        uploadBox?.focus();
    }
}

function setResult(message, state = "info") {
    if (!resultDiv) return;

    resultDiv.classList.remove("result-success", "result-error", "result-info", "result-visible");

    if (!message) {
        resultDiv.innerHTML = "";
        return;
    }

    const statusClass = ["success", "error", "info"].includes(state) ? state : "info";
    resultDiv.innerHTML = message;
    resultDiv.classList.add(`result-${statusClass}`, "result-visible");
}

function buildResultMarkup(items) {
    if (!Array.isArray(items) || !items.length) {
        return { html: "Processamento concluído.", state: "success" };
    }

    let hasError = false;

    const listItems = items.map(item => {
        const name = item?.arquivo || "Arquivo";
        const statusText = item?.status || "Processado";
        const normalized = statusText.toString().toLowerCase();
        let statusClass = "info";

        if (normalized.includes("erro") || normalized.includes("falha")) {
            statusClass = "error";
            hasError = true;
        } else if (normalized.includes("process") || normalized.includes("sucesso") || normalized.includes("ok")) {
            statusClass = "ok";
        }

        return `<li class="result-item">
                    <span>${name}</span>
                    <span class="result-status ${statusClass}">${statusText}</span>
                </li>`;
    }).join("");

    const summaryText = `${items.length} arquivo${items.length > 1 ? "s" : ""} processado${items.length > 1 ? "s" : ""}`;

    return {
        html: `<strong>${summaryText}</strong><ul class="result-list">${listItems}</ul>`,
        state: hasError ? "error" : "success"
    };
}

if (uploadBtn && fileInput && uploadBox) {
    const originalButtonContent = uploadBtn.innerHTML;
    uploadBtn.disabled = true;

    uploadBox.addEventListener("click", event => {
        if (event.target === fileTrigger) {
            return;
        }
        fileInput.click();
    });

    uploadBox.addEventListener("keydown", event => {
        if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            fileInput.click();
        }
    });

    if (fileTrigger) {
        fileTrigger.addEventListener("click", event => {
            event.preventDefault();
            fileInput.click();
        });
    }

    fileInput.addEventListener("change", () => {
        updateFilePreview(fileInput.files);
        setResult("");
    });

    uploadBtn.addEventListener("click", async () => {
        const files = fileInput.files;

        if (!files || !files.length) {
            alert("Selecione ao menos um arquivo!");
            return;
        }

        const formData = new FormData();
        Array.from(files).forEach(file => formData.append("files", file));

        uploadBtn.disabled = true;
        uploadBtn.innerHTML = "Enviando...";
        setResult("Enviando arquivos...", "info");

        try {
            const response = await fetch("/api/process-documents", {
                method: "POST",
                body: formData,
                credentials: "include"
            });

            const responseText = await response.text();
            let data = null;

            if (responseText) {
                try {
                    data = JSON.parse(responseText);
                } catch (parseError) {
                    console.warn("Resposta não está em JSON válido:", parseError);
                }
            }

            if (!response.ok) {
                const message = data?.error || data?.message || response.statusText || "Falha no envio";
                setResult(`Erro: ${message}`, "error");
                return;
            }

            const payload = Array.isArray(data) ? data : data?.result;
            const { html, state } = buildResultMarkup(payload || []);
            setResult(html, state);
            clearFileSelection({ resetResult: false });
        } catch (error) {
            console.error("Erro ao enviar os arquivos:", error);
            setResult("Erro ao enviar os arquivos.", "error");
        } finally {
            uploadBtn.innerHTML = originalButtonContent;
            uploadBtn.disabled = fileInput.files.length === 0;
        }
    });
}
