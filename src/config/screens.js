// Configuração centralizada das telas do dashboard
// Para adicionar uma nova aba, basta incluir um novo objeto no array abaixo.
export const DASHBOARD_SCREENS = [
    {
        id: "overview",
        label: "Painel Geral",
        sections: ["empresaInfo", "dashboardMetrics"],
        description: "Resumo executivo com indicadores principais."
    },
    {
        id: "fiscal-dashboard",
        label: "Dashboard Fiscal",
        sections: ["fiscalDashboard"],
        description: "Visualização estratégica de impostos e classificação de notas fiscais."
    },
    {
        id: "uploads",
        label: "Envio de Documentos",
        sections: ["upload"],
        description: "Área de upload de notas fiscais e acompanhamento de status."
    },
    {
        id: "chat",
        label: "Chat IA Fiscal",
        sections: ["chatSection"],
        description: "Converse com o agente fiscal para esclarecer dúvidas e obter insights."
    }
];

export const DEFAULT_DASHBOARD_SCREEN = DASHBOARD_SCREENS[0]?.id ?? "overview";
