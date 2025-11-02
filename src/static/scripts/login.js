document.getElementById("loginForm").addEventListener("submit", async (e) => {
    e.preventDefault();

    const cnpj = document.getElementById("cnpj").value.trim();
    const senha = document.getElementById("senha").value.trim();

    const response = await fetch("/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include", // IMPORTANTE: Inclui cookies de sessão
        body: JSON.stringify({ cnpj, senha }),
    });

    const data = await response.json();
    const msg = document.getElementById("mensagem");

    if (response.ok) {
        msg.textContent = "Login bem-sucedido!";
        msg.style.color = "var(--color-success)";
        setTimeout(() => (window.location.href = "/dashboard"), 1000);
    } else {
        msg.textContent = data.erro || "CNPJ ou senha inválidos";
        msg.style.color = "var(--color-danger)";
    }
});
