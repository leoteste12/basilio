
const CSV_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vSZaWnjM2O-r-9OXy4Hr9R1dBtVPZogd-RiEUjCW3kSrMhb_ZK6jg-ugrhSglsnWEX2VVkAAD3X5aI6/pub?output=csv";

let dados = [];
let chart;

async function carregarDados() {
    const resposta = await fetch(CSV_URL);
    const texto = await resposta.text();
    const linhas = texto.trim().split("\n");
    const cabecalhos = linhas[0].split(",");
    dados = linhas.slice(1).map(linha => {
        const valores = linha.split(",");
        const obj = {};
        cabecalhos.forEach((coluna, i) => {
            obj[coluna.trim()] = valores[i]?.trim();
        });
        return obj;
    });

    preencherFiltros();
    atualizarGrafico();
}

function preencherFiltros() {
    const meses = [...new Set(dados.map(l => l.Mês))];
    const centros = [...new Set(dados.map(l => l["Centro de Custo"]))];

    const filtroMes = document.getElementById("filtro-mes");
    const filtroCentro = document.getElementById("filtro-centro");

    filtroMes.innerHTML = "<option value=''>Todos</option>" +
        meses.map(m => `<option>${m}</option>`).join("");
    filtroCentro.innerHTML = "<option value=''>Todos</option>" +
        centros.map(c => `<option>${c}</option>`).join("");

    filtroMes.addEventListener("change", atualizarGrafico);
    filtroCentro.addEventListener("change", atualizarGrafico);
}

function atualizarGrafico() {
    const mesSelecionado = document.getElementById("filtro-mes").value;
    const centroSelecionado = document.getElementById("filtro-centro").value;

    const filtrado = dados.filter(linha =>
        (mesSelecionado === "" || linha.Mês === mesSelecionado) &&
        (centroSelecionado === "" || linha["Centro de Custo"] === centroSelecionado)
    );

    const categorias = [...new Set(filtrado.map(l => l["Centro de Custo"]))];
    const orcamento = categorias.map(cat =>
        filtrado.filter(l => l["Centro de Custo"] === cat)
            .reduce((acc, curr) => acc + parseFloat(curr.Orçado || 0), 0)
    );
    const execucao = categorias.map(cat =>
        filtrado.filter(l => l["Centro de Custo"] === cat)
            .reduce((acc, curr) => acc + parseFloat(curr.Executado || 0), 0)
    );

    if (chart) chart.destroy();
    const ctx = document.getElementById("grafico").getContext("2d");
    chart = new Chart(ctx, {
        type: "bar",
        data: {
            labels: categorias,
            datasets: [
                {
                    label: "Orçado",
                    data: orcamento,
                    backgroundColor: "#4caf50"
                },
                {
                    label: "Executado",
                    data: execucao,
                    backgroundColor: "#f44336"
                }
            ]
        },
        options: {
            responsive: true,
            plugins: {
                legend: { labels: { color: "#fff" } }
            },
            scales: {
                x: { ticks: { color: "#fff" } },
                y: { ticks: { color: "#fff" } }
            }
        }
    });
}

document.addEventListener("DOMContentLoaded", carregarDados);
