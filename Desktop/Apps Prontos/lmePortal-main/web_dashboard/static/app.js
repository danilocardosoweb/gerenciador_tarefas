// Variáveis globais para os gráficos
let chartDiario = null;
let chartSemanal = null;
let chartMensal = null;
let selectedMetal = 'cobre';
let graficoMargem = null;
let graficoSensibilidade = null;
let graficoCustosModal = null;
let graficoMultifator = null;
let simulacaoEventosRegistrados = false;
let modalEventosRegistrados = false;
let modalAjudaRegistrado = false;
let helpPopoverRegistrado = false;
let helpPopoverAtivo = null;
let helpPopoverElementos = null;
let graficoExpandido = false;

const PRESETS_KEY = 'lme_simulador_presets';

const HELP_CONTENT = {
    simulacao: {
        titulo: 'Como configurar a simulação',
        paragrafos: [
            'Preencha as cotações, custos e margens para calcular preços de venda em R$/kg e R$/tonelada.',
            'Use os presets automáticos para aplicar cenários de referência e ajuste manualmente conforme necessidade.'
        ],
        itens: [
            'Ajuste LME e dólar para refletir o mercado.',
            'Atualize custos operacionais pelo botão "Detalhar Custos".',
            'Defina margens e sensibilidade antes de rodar a simulação.'
        ]
    },
    sensibilidade: {
        titulo: 'Análise de Sensibilidade',
        paragrafos: [
            'Tabela cruzada que mostra o impacto da variação simultânea do dólar e da LME conforme a sensibilidade definida.'
        ],
        itens: [
            'Linhas representam cenários de LME (queda e alta).',
            'Colunas exibem o comportamento do dólar e o reflexo no preço.',
            'Utilize para entender limites de negociação e risco cambial.'
        ]
    },
    resultados: {
        titulo: 'Resultados da simulação',
        paragrafos: [
            'Resumo consolidado com preço base, custos totais, margem e receita projetada para a quantidade planejada.'
        ],
        itens: [
            'O alerta informa quando a margem desejada fica abaixo da mínima.',
            'O comparativo indica distância em relação à média mensal do mercado.',
            'Use os botões para duplicar, salvar ou exportar a simulação.'
        ]
    },
    projecao: {
        titulo: 'Projeção por Margem',
        paragrafos: [
            'Painel auxiliar com custos detalhados e gráficos para comparar diferentes combinações de margem e sensibilidade.'
        ],
        itens: [
            'Mantenha os custos detalhados alinhados ao valor operacional total.',
            'Revise a diferença entre custos detalhados e custo operacional para identificar ajustes necessários.'
        ]
    },
    impacto: {
        titulo: 'Impacto da Margem no Preço',
        paragrafos: [
            'Gráfico de linha que ilustra como percentuais de margem afetam o preço final em R$/kg.'
        ],
        itens: [
            'Cada ponto representa uma margem aplicada sobre o custo total.',
            'Avalie cenários mínimos, alvo e agressivos antes de negociar.'
        ]
    },
    cenarios: {
        titulo: 'Cenários LME x Dólar',
        paragrafos: [
            'Visualização em superfície que combina variações da LME e do dólar usando a sensibilidade configurada.'
        ],
        itens: [
            'Zonas quentes indicam maior pressão no preço.',
            'Permite comparar situações de câmbio favorável ou desfavorável.'
        ]
    },
    multifator: {
        titulo: 'Gráfico Multifator',
        paragrafos: [
            'Mostra a participação de cada componente (LME, frete, perdas, custos e margem) no preço final em R$/kg.'
        ],
        itens: [
            'Ideal para explicar ao cliente quais fatores compõem o preço.',
            'Caso algum componente esteja desproporcional, revise os valores no formulário ou no detalhamento de custos.'
        ]
    }
};

const simulacaoState = {
    referencia: null,
    meta: {
        dataCotacao: null,
        atualizadoEm: null
    },
    defaults: {
        lme: 0,
        dolar: 0,
        fator: 1.3,
        custos: 4,
        margem: 25,
        margemMinima: 20,
        quantidade: 1,
        sensibilidade: 5
    },
    custosDetalhados: {
        mao_obra: 0,
        energia: 0,
        manutencao: 0,
        administracao: 0
    },
    resultados: {},
    historico: []
};

const dbConfig = {
    nome: 'lme_simulacoes',
    versao: 1,
    store: 'simulacoes'
};

let dbInstance = null;

// Cache de dados para abas principais
let dadosCache = {
    diarios: null,
    semanais: null,
    mensais: null,
    indicadores: null,
    timestamp: null
};

function abrirIndexedDB() {
    if (typeof indexedDB === 'undefined') {
        return Promise.reject(new Error('IndexedDB não suportado neste navegador.'));
    }

function registrarAjudaSecoes() {
    if (helpPopoverRegistrado) return;
    const popover = document.getElementById('helpPopover');
    const titulo = document.getElementById('helpPopoverTitle');
    const corpo = document.getElementById('helpPopoverBody');
    const fechar = document.getElementById('helpPopoverClose');
    const botoes = document.querySelectorAll('.help-icon[data-help]');
    if (!popover || !titulo || !corpo || !fechar || !botoes.length) return;

    helpPopoverElementos = { popover, titulo, corpo, fechar };

    botoes.forEach(botao => {
        botao.addEventListener('click', (evento) => {
            evento.stopPropagation();
            const chave = botao.dataset.help;
            const conteudo = HELP_CONTENT[chave];
            if (!conteudo) return;
            if (helpPopoverAtivo?.botao === botao) {
                fecharPopoverAjuda();
                return;
            }
            abrirPopoverAjuda(botao, conteudo);
        });
    });

    fechar.addEventListener('click', fecharPopoverAjuda);

    document.addEventListener('click', (evento) => {
        if (!helpPopoverAtivo) return;
        if (evento.target.closest('.help-popover') || evento.target.closest('.help-icon')) return;
        fecharPopoverAjuda();
    });

    window.addEventListener('resize', fecharPopoverAjuda);
    window.addEventListener('scroll', fecharPopoverAjuda, { passive: true });
    document.addEventListener('keydown', (evento) => {
        if (evento.key === 'Escape') {
            fecharPopoverAjuda();
        }
    });

    helpPopoverRegistrado = true;
}

function abrirPopoverAjuda(botao, conteudo) {
    const { popover, titulo, corpo } = helpPopoverElementos;
    helpPopoverAtivo = { botao, chave: botao.dataset.help };

    titulo.textContent = conteudo.titulo;
    corpo.innerHTML = '';

    if (conteudo.paragrafos) {
        conteudo.paragrafos.forEach(texto => {
            const p = document.createElement('p');
            p.textContent = texto;
            corpo.appendChild(p);
        });
    }

    if (conteudo.itens && conteudo.itens.length) {
        const ul = document.createElement('ul');
        conteudo.itens.forEach(item => {
            const li = document.createElement('li');
            li.textContent = item;
            ul.appendChild(li);
        });
        corpo.appendChild(ul);
    }

    popover.setAttribute('aria-hidden', 'false');
    popover.style.visibility = 'hidden';
    popover.classList.add('show');
    popover.style.transform = 'translate(0, 0)';

    const rect = botao.getBoundingClientRect();
    const { offsetWidth, offsetHeight } = popover;
    const margem = 16;
    let top = rect.bottom + 12;
    let left = rect.left + (rect.width / 2) - (offsetWidth / 2);

    const limiteDireito = window.innerWidth - offsetWidth - margem;
    const limiteInferior = window.innerHeight - offsetHeight - margem;

    if (left < margem) left = margem;
    if (left > limiteDireito) left = Math.max(margem, limiteDireito);

    if (top > limiteInferior) {
        top = rect.top - offsetHeight - 12;
        if (top < margem) {
            top = Math.min(limiteInferior, rect.bottom + 12);
        }
    }

    popover.style.top = `${Math.max(margem, top)}px`;
    popover.style.left = `${left}px`;
    popover.style.visibility = 'visible';
}

function fecharPopoverAjuda() {
    if (!helpPopoverAtivo || !helpPopoverElementos) return;
    const { popover } = helpPopoverElementos;
    popover.classList.remove('show');
    popover.style.transform = 'translate(-9999px, -9999px)';
    popover.removeAttribute('style');
    popover.setAttribute('aria-hidden', 'true');
    helpPopoverAtivo = null;
}
    if (dbInstance) {
        return Promise.resolve(dbInstance);
    }
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(dbConfig.nome, dbConfig.versao);
        request.onupgradeneeded = () => {
            const db = request.result;
            if (!db.objectStoreNames.contains(dbConfig.store)) {
                db.createObjectStore(dbConfig.store, { keyPath: 'id', autoIncrement: true });
            }
        };
        request.onsuccess = () => {
            dbInstance = request.result;
            resolve(dbInstance);
        };
        request.onerror = () => reject(request.error);
    });
}

function lerPresets() {
    try {
        const dados = localStorage.getItem(PRESETS_KEY);
        return dados ? JSON.parse(dados) : [];
    } catch (error) {
        console.error('Erro ao ler presets:', error);
        return [];
    }
}

function salvarPresets(lista) {
    try {
        localStorage.setItem(PRESETS_KEY, JSON.stringify(lista));
    } catch (error) {
        console.error('Erro ao salvar presets:', error);
    }
}

function atualizarSelectPresets() {
    const select = document.getElementById('presetSelect');
    if (!select) return;

    const valorAtual = select.value;
    const presets = lerPresets();
    const ordenados = presets.slice().sort((a, b) => {
        if (a.automatico && !b.automatico) return -1;
        if (!a.automatico && b.automatico) return 1;
        return (a.nome || '').localeCompare(b.nome || '', 'pt-BR');
    });
    select.innerHTML = '<option value="">Presets salvos</option>';
    ordenados.forEach(preset => {
        const opt = document.createElement('option');
        opt.value = preset.id;
        opt.textContent = preset.automatico ? `${preset.nome} (automático)` : preset.nome;
        if (preset.automatico) {
            opt.dataset.automatico = 'true';
        }
        select.appendChild(opt);
    });
    if (valorAtual) {
        select.value = ordenados.some(p => p.id === valorAtual) ? valorAtual : '';
    }
}

function gerarIdPreset() {
    return `preset-${Date.now()}-${Math.floor(Math.random() * 100000)}`;
}

function normalizarCustosAutomaticos(totalDesejado, detalhados = {}) {
    const chaves = ['mao_obra', 'energia', 'manutencao', 'administracao'];
    const arred = (valor, casas = 2) => {
        const numero = Number(valor);
        if (!Number.isFinite(numero)) return 0;
        return Number(numero.toFixed(casas));
    };

    const somaDetalhados = chaves.reduce((acc, chave) => acc + (Number(detalhados[chave]) || 0), 0);
    let totalReferencial = Number(totalDesejado);
    if (!Number.isFinite(totalReferencial) || totalReferencial <= 0) {
        totalReferencial = somaDetalhados;
    }
    if (!Number.isFinite(totalReferencial) || totalReferencial <= 0) {
        totalReferencial = 1;
    }

    let distribuicao;
    if (somaDetalhados > 0) {
        const fator = totalReferencial / somaDetalhados;
        distribuicao = chaves.reduce((acc, chave) => {
            acc[chave] = arred((Number(detalhados[chave]) || 0) * fator);
            return acc;
        }, {});
    } else {
        distribuicao = {
            mao_obra: arred(totalReferencial * 0.38),
            energia: arred(totalReferencial * 0.22),
            manutencao: arred(totalReferencial * 0.2),
            administracao: arred(totalReferencial * 0.2)
        };
    }

    const somaAtualizada = chaves.reduce((acc, chave) => acc + distribuicao[chave], 0);
    const diferenca = Number((totalReferencial - somaAtualizada).toFixed(2));
    if (Math.abs(diferenca) >= 0.01) {
        distribuicao.mao_obra = arred(distribuicao.mao_obra + diferenca);
    }

    return distribuicao;
}

function montarPresetsAutomaticos(base, detalhados) {
    const arred = (valor, casas = 2) => {
        const numero = Number(valor);
        if (!Number.isFinite(numero)) return 0;
        return Number(numero.toFixed(casas));
    };

    const baseLME = Number(base.lme) || 0;
    const baseDolar = Number(base.dolar) || 0;
    const baseFator = Number(base.fator) || 0;
    const baseCustos = Number(base.custos) || 0;
    const baseMargem = Number(base.margem) || 0;
    const baseMargemMin = Number(base.margemMinima) || 0;
    const baseQuantidade = Number(base.quantidade) || 1;
    const baseSensibilidade = Number(base.sensibilidade) || 5;

    const custoProtegidoTotal = arred(baseCustos * 1.05);
    const custoCompetitivoTotal = arred(baseCustos * 0.97);
    const custoStressTotal = arred(baseCustos * 1.08);

    return [
        {
            id: 'auto-margem-protegida',
            nome: '⚙️ Automático – Margem Protegida',
            valores: {
                lme: arred(baseLME * 0.98),
                dolar: arred(baseDolar * 1.02, 4),
                fator: arred(baseFator * 1.02),
                custos: custoProtegidoTotal,
                margem: Math.max(baseMargem, baseMargemMin + 8),
                margemMinima: Math.max(baseMargemMin + 3, baseMargemMin),
                quantidade: Math.max(baseQuantidade, 5),
                sensibilidade: Math.max(baseSensibilidade, 8),
                custosDetalhados: normalizarCustosAutomaticos(custoProtegidoTotal, detalhados)
            }
        },
        {
            id: 'auto-volume-competitivo',
            nome: '⚙️ Automático – Volume Competitivo',
            valores: {
                lme: arred(baseLME * 1.01),
                dolar: arred(baseDolar, 4),
                fator: arred(baseFator * 0.97),
                custos: custoCompetitivoTotal,
                margem: Math.max(baseMargemMin + 1, baseMargem - 4),
                margemMinima: Math.max(baseMargemMin, baseMargemMin - 1),
                quantidade: Math.max(arred(baseQuantidade * 3, 0), baseQuantidade + 10),
                sensibilidade: Math.max(baseSensibilidade, 6),
                custosDetalhados: normalizarCustosAutomaticos(custoCompetitivoTotal, detalhados)
            }
        },
        {
            id: 'auto-stress-cambial',
            nome: '⚙️ Automático – Stress Cambial',
            valores: {
                lme: arred(baseLME * 1.05),
                dolar: arred(baseDolar * 1.12, 4),
                fator: arred(baseFator * 1.01),
                custos: custoStressTotal,
                margem: Math.max(baseMargem, baseMargemMin + 5),
                margemMinima: Math.max(baseMargemMin + 4, baseMargemMin + 2),
                quantidade: Math.max(baseQuantidade, 2),
                sensibilidade: Math.max(baseSensibilidade, 10),
                custosDetalhados: normalizarCustosAutomaticos(custoStressTotal, detalhados)
            }
        }
    ];
}

function criarPresetsAutomaticos() {
    const presetsAtuais = lerPresets();
    const automaticosExistentes = new Map(
        presetsAtuais.filter(p => p.automatico).map(p => [p.id, p])
    );
    const manuais = presetsAtuais.filter(p => !p.automatico);
    const agora = new Date().toISOString();
    const definicoes = montarPresetsAutomaticos(simulacaoState.defaults, simulacaoState.custosDetalhados);

    const atualizados = definicoes.map(def => {
        const anterior = automaticosExistentes.get(def.id);
        return {
            id: def.id,
            nome: def.nome,
            automatico: true,
            valores: def.valores,
            criadoEm: anterior?.criadoEm || agora,
            atualizadoEm: agora
        };
    });

    salvarPresets([...atualizados, ...manuais]);
}

function solicitarNomePreset() {
    const nome = window.prompt('Informe um nome para o preset atual:');
    return nome ? nome.trim() : '';
}

function formatarDataHora(valor) {
    if (!valor) return '--';
    const data = typeof valor === 'string' ? new Date(valor) : valor;
    if (Number.isNaN(data.getTime())) return '--';
    return new Intl.DateTimeFormat('pt-BR', {
        day: '2-digit', month: '2-digit', year: 'numeric',
        hour: '2-digit', minute: '2-digit'
    }).format(data);
}

function atualizarMetaSimulacao() {
    const alvo = document.getElementById('metaTimestamp');
    if (!alvo) return;

    const { dataCotacao, atualizadoEm } = simulacaoState.meta;
    if (!dataCotacao && !atualizadoEm) {
        alvo.textContent = '--';
        return;
    }

    const dataCotacaoFormatada = dataCotacao ? formatarData(dataCotacao) : '--';
    const atualizadoFormatado = atualizadoEm ? formatarDataHora(atualizadoEm) : '--';
    alvo.textContent = `${dataCotacaoFormatada} (sincronizado em ${atualizadoFormatado})`;
}

function baixarArquivo(conteudo, nomeArquivo) {
    const blob = new Blob([conteudo], { type: 'application/json;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = nomeArquivo;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}

function lerArquivoJSON() {
    return new Promise((resolve, reject) => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'application/json';
        input.addEventListener('change', () => {
            const arquivo = input.files && input.files[0];
            if (!arquivo) {
                reject(new Error('Nenhum arquivo selecionado.'));
                return;
            }
            const reader = new FileReader();
            reader.onload = () => {
                try {
                    const dados = JSON.parse(reader.result);
                    resolve(dados);
                } catch (error) {
                    reject(new Error('Não foi possível interpretar o arquivo.'));
                }
            };
            reader.onerror = () => reject(reader.error || new Error('Falha ao ler o arquivo.'));
            reader.readAsText(arquivo, 'utf-8');
        });
        input.click();
    });
}

function atualizarAlertasMargem(margemBruta, margemMinima) {
    const alerta = document.getElementById('alertaMargem');
    if (!alerta) return;

    if (margemBruta < margemMinima) {
        alerta.className = 'resumo-alerta alerta';
        alerta.textContent = `⚠ Margem atual ${formatarNumero(margemBruta, 2)} % abaixo da meta mínima de ${formatarNumero(margemMinima, 2)} %.`;
    } else {
        alerta.className = 'resumo-alerta ok';
        alerta.textContent = `✅ Margem atual ${formatarNumero(margemBruta, 2)} % supera a meta mínima de ${formatarNumero(margemMinima, 2)} %.`;
    }
}

function calcularComparativoMensal({ precoVendaKg }) {
    if (!dadosCache.mensais || !dadosCache.mensais.length) {
        return null;
    }
    const ultimoMes = dadosCache.mensais[dadosCache.mensais.length - 1];
    if (!ultimoMes || !ultimoMes.aluminio) {
        return null;
    }
    const mediaKg = (ultimoMes.aluminio / 1000) * (ultimoMes.dolar || 0) * simulacaoState.defaults.fator;
    if (!mediaKg) return null;
    const variacao = ((precoVendaKg - mediaKg) / mediaKg) * 100;
    return {
        mediaKg,
        variacao
    };
}

function atualizarComparativoMensal(comparativo) {
    const campoValor = document.getElementById('resultadoComparativoMensal');
    const detalhe = document.getElementById('detalheComparativo');
    if (!campoValor || !detalhe) return;

    if (!comparativo) {
        campoValor.textContent = '0,00 %';
        detalhe.textContent = 'Sem comparação disponível.';
        return;
    }

    const variacao = comparativo.variacao;
    campoValor.textContent = `${variacao >= 0 ? '+' : ''}${formatarNumero(variacao, 2)} %`;
    detalhe.textContent = `Média mensal estimada: ${formatarMoeda(comparativo.mediaKg)}.`;
}

function atualizarResumoExecutivo({ precoVendaKg, margemBrutaReal, quantidade, receitaTotal, comparativo }) {
    const campoResumo = document.getElementById('resultadoResumo');
    if (!campoResumo) return;

    const linhas = [];
    linhas.push(`Preço alvo de ${formatarMoeda(precoVendaKg)} por kg com margem de ${formatarNumero(margemBrutaReal, 2)} %.`);
    linhas.push(`Volume total projetado: ${formatarNumero(quantidade, 2)} tonelada(s). Receita estimada de ${formatarMoeda(receitaTotal)}.`);
    if (comparativo) {
        linhas.push(`Diferença vs média mensal: ${comparativo.variacao >= 0 ? '+' : ''}${formatarNumero(comparativo.variacao, 2)} %.`);
    }
    const texto = linhas.join(' ');
    campoResumo.textContent = texto;
    campoResumo.setAttribute('title', texto);
}

function atualizarResumoCustosDetalhados(custos = {}, custoOperacional = 0) {
    const lista = document.getElementById('listaCustosDetalhados');
    if (lista) {
        lista.querySelectorAll('li').forEach(item => {
            const chave = item.getAttribute('data-chave');
            const spanValor = item.querySelector('.valor');
            const valorCampo = Number(custos?.[chave]) || 0;
            if (spanValor) {
                spanValor.textContent = formatarMoeda(valorCampo);
            }
        });
    }

    const total = calcularTotalCustosDetalhados(custos || {});
    const totalEl = document.getElementById('totalCustosDetalhados');
    if (totalEl) {
        totalEl.textContent = formatarMoeda(total);
    }

    const diffEl = document.getElementById('textoDiferencaCustos');
    if (diffEl) {
        const custo = Number(custoOperacional) || 0;
        const diff = custo - total;
        let mensagem = 'Diferença vs custo operacional: --';
        if (Math.abs(diff) < 0.01) {
            mensagem = 'Diferença vs custo operacional: equilibrado.';
        } else if (diff > 0) {
            mensagem = `Diferença vs custo operacional: +${formatarMoeda(diff)} (valor restante no campo principal).`;
        } else if (diff < 0) {
            mensagem = `Diferença vs custo operacional: -${formatarMoeda(Math.abs(diff))} (detalhado acima do total informado).`;
        }
        diffEl.textContent = mensagem;
    }
}

function atualizarGraficoMultifator(parametros = null) {
    const container = document.querySelector('.grafico-multifator');
    const placeholder = document.getElementById('placeholderMultifator');
    const ctx = document.getElementById('graficoMultifator');

    if (!container || !ctx) {
        return;
    }

    if (!parametros) {
        if (graficoMultifator) {
            graficoMultifator.destroy();
            graficoMultifator = null;
        }
        container.classList.add('sem-dados');
        if (placeholder) {
            placeholder.textContent = 'Calcule a simulação para visualizar a composição do preço final.';
        }
        return;
    }

    const { precoBaseRSkg = 0, custosOperacionais = 0, precoVendaKg = 0 } = parametros;
    const detalhados = simulacaoState.custosDetalhados || {};

    const itens = [];
    if (precoBaseRSkg > 0) {
        itens.push({ label: 'Base LME ajustada', valor: precoBaseRSkg });
    }

    const itensDetalhados = [
        { label: 'Mão de obra', chave: 'mao_obra' },
        { label: 'Energia e gás', chave: 'energia' },
        { label: 'Manutenção', chave: 'manutencao' },
        { label: 'Administração', chave: 'administracao' }
    ];

    let totalDetalhado = 0;
    itensDetalhados.forEach(item => {
        const valor = Number(detalhados[item.chave]) || 0;
        totalDetalhado += valor;
        if (valor > 0.0001) {
            itens.push({ label: item.label, valor });
        }
    });

    const diffCustos = custosOperacionais - totalDetalhado;
    if (diffCustos > 0.01) {
        itens.push({ label: 'Outros custos operacionais', valor: diffCustos });
    } else if (diffCustos < -0.01) {
        itens.push({ label: 'Excesso detalhado', valor: Math.abs(diffCustos) });
    }

    const margemValor = precoVendaKg > 0 ? Math.max(precoVendaKg - (precoBaseRSkg + custosOperacionais), 0) : 0;
    if (margemValor > 0.0001) {
        itens.push({ label: 'Margem desejada', valor: margemValor });
    }

    const possuiDados = itens.some(item => item.valor > 0.0001);
    if (!possuiDados) {
        if (graficoMultifator) {
            graficoMultifator.destroy();
            graficoMultifator = null;
        }
        container.classList.add('sem-dados');
        if (placeholder) {
            placeholder.textContent = 'Calcule a simulação para visualizar a composição do preço final.';
        }
        return;
    }

    container.classList.remove('sem-dados');
    if (placeholder) {
        placeholder.textContent = 'Visualização da contribuição de cada fator no preço final (R$/kg).';
    }

    const labels = itens.map(item => item.label);
    const valores = itens.map(item => Number(item.valor.toFixed(4)));

    if (graficoMultifator) {
        graficoMultifator.data.labels = labels;
        graficoMultifator.data.datasets[0].data = valores;
        graficoMultifator.update('none');
        return;
    }

    graficoMultifator = new Chart(ctx, {
        type: 'bar',
        data: {
            labels,
            datasets: [
                {
                    label: 'R$/kg',
                    data: valores,
                    backgroundColor: [
                        'rgba(59, 130, 246, 0.6)',
                        'rgba(16, 185, 129, 0.6)',
                        'rgba(234, 179, 8, 0.6)',
                        'rgba(244, 114, 182, 0.6)',
                        'rgba(129, 140, 248, 0.6)',
                        'rgba(251, 191, 36, 0.6)'
                    ],
                    borderColor: 'rgba(15, 23, 42, 0.08)',
                    borderWidth: 1.2,
                    borderRadius: 6,
                    barThickness: 22
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            indexAxis: 'y',
            scales: {
                x: {
                    ticks: {
                        callback: valor => `R$ ${formatarNumero(valor, 2)}`
                    },
                    grid: {
                        color: 'rgba(148, 163, 184, 0.2)'
                    }
                },
                y: {
                    ticks: {
                        font: { size: 11 }
                    },
                    grid: {
                        display: false
                    }
                }
            },
            plugins: {
                legend: { display: false },
                tooltip: {
                    callbacks: {
                        label: context => `${context.label}: ${formatarMoeda(context.parsed.x || context.parsed.y)}`
                    }
                }
            }
        }
    });
}

function salvarPresetAtual() {
    const nome = solicitarNomePreset();
    if (!nome) {
        atualizarMensagemSimulacao('erro', 'Informe um nome para salvar o preset.');
        return;
    }

    const presets = lerPresets();
    const valores = obterValoresFormulario();
    const existente = presets.find(p => p.nome.toLowerCase() === nome.toLowerCase());
    const agora = new Date().toISOString();
    if (existente) {
        existente.valores = valores;
        existente.atualizadoEm = agora;
    } else {
        presets.push({
            id: gerarIdPreset(),
            nome,
            valores,
            criadoEm: agora,
            atualizadoEm: agora
        });
    }
    salvarPresets(presets);
    atualizarSelectPresets();
    atualizarMensagemSimulacao('sucesso', `Preset "${nome}" salvo com sucesso.`);
}

function aplicarPresetSelecionado() {
    const select = document.getElementById('presetSelect');
    if (!select || !select.value) {
        atualizarMensagemSimulacao('erro', 'Selecione um preset para aplicar.');
        return;
    }
    const presets = lerPresets();
    const alvo = presets.find(p => p.id === select.value);
    if (!alvo) {
        atualizarMensagemSimulacao('erro', 'Preset não encontrado.');
        return;
    }
    simulacaoState.defaults = {
        ...simulacaoState.defaults,
        ...alvo.valores
    };
    aplicarValoresFormulario(alvo.valores);
    recalcularSimulacao();
    atualizarMensagemSimulacao('sucesso', `Preset "${alvo.nome}" aplicado.`);
}

function excluirPresetSelecionado() {
    const select = document.getElementById('presetSelect');
    if (!select || !select.value) {
        atualizarMensagemSimulacao('erro', 'Selecione um preset para excluir.');
        return;
    }
    const presets = lerPresets();
    const alvo = presets.find(p => p.id === select.value);
    if (!alvo) {
        atualizarMensagemSimulacao('erro', 'Preset não encontrado.');
        return;
    }
    if (alvo.automatico) {
        atualizarMensagemSimulacao('erro', 'Presets automáticos não podem ser excluídos.');
        return;
    }
    const confirmacao = window.confirm(`Excluir o preset "${alvo.nome}"?`);
    if (!confirmacao) return;
    const novos = presets.filter(p => p.id !== alvo.id);
    salvarPresets(novos);
    atualizarSelectPresets();
    atualizarMensagemSimulacao('sucesso', 'Preset removido.');
}

async function exportarHistoricoLocal() {
    if (!simulacaoState.historico.length) {
        atualizarMensagemSimulacao('erro', 'Nenhuma simulação no histórico para exportar.');
        return;
    }
    const payload = {
        exportadoEm: new Date().toISOString(),
        registros: simulacaoState.historico
    };
    baixarArquivo(JSON.stringify(payload, null, 2), `historico-simulacoes-${Date.now()}.json`);
    atualizarMensagemSimulacao('sucesso', 'Histórico exportado com sucesso.');
}

async function importarHistoricoLocal() {
    try {
        const dados = await lerArquivoJSON();
        if (!dados || !Array.isArray(dados.registros)) {
            throw new Error('Formato inválido.');
        }
        const confirmacao = window.confirm('A importação vai sobrescrever o histórico atual. Deseja continuar?');
        if (!confirmacao) return;

        await limparHistoricoIndexedDB();
        for (const registro of dados.registros) {
            delete registro.id;
            await salvarSimulacaoIndexedDB(registro);
        }
        await carregarHistorico();
        atualizarSelectPresets();
        atualizarMensagemSimulacao('sucesso', 'Histórico importado com sucesso.');
    } catch (error) {
        console.error(error);
        atualizarMensagemSimulacao('erro', error.message || 'Falha ao importar histórico.');
    }
}

function obterValoresFormulario() {
    return {
        lme: obterValorInput('inputLME'),
        dolar: obterValorInput('inputDolar'),
        fator: obterValorInput('inputFator'),
        custos: obterValorInput('inputCustos'),
        margem: obterValorInput('inputMargem'),
        margemMinima: obterValorInput('inputMargemMinima'),
        quantidade: obterValorInput('inputQuantidade'),
        sensibilidade: obterValorInput('inputSensibilidade'),
        custosDetalhados: obterCustosDetalhados()
    };
}

function aplicarValoresFormulario(valores) {
    const campo = (id, valor) => {
        const el = document.getElementById(id);
        if (el && valor !== undefined && valor !== null) {
            el.value = valor;
        }
    };
    campo('inputLME', valores.lme);
    campo('inputDolar', valores.dolar);
    campo('inputFator', valores.fator);
    campo('inputCustos', valores.custos);
    campo('inputMargem', valores.margem);
    campo('inputMargemMinima', valores.margemMinima ?? 0);
    campo('inputQuantidade', valores.quantidade ?? 1);
    campo('inputSensibilidade', valores.sensibilidade ?? 5);

    const detalhados = valores.custosDetalhados || {};
    campo('custoMaoObra', detalhados.mao_obra);
    campo('custoEnergia', detalhados.energia);
    campo('custoManutencao', detalhados.manutencao);
    campo('custoAdministracao', detalhados.administracao);

    simulacaoState.custosDetalhados = {
        mao_obra: detalhados.mao_obra ?? 0,
        energia: detalhados.energia ?? 0,
        manutencao: detalhados.manutencao ?? 0,
        administracao: detalhados.administracao ?? 0
    };
    atualizarModalTotal(simulacaoState.custosDetalhados);
    atualizarResumoCustosDetalhados(simulacaoState.custosDetalhados, valores.custos ?? obterValorInput('inputCustos'));
}

function desenharGraficoCustos(custos) {
    const ctx = document.getElementById('graficoCustos');
    if (!ctx) return;

    const labels = ['Mão de obra', 'Energia', 'Manutenção', 'Administração'];
    const valores = [custos.mao_obra, custos.energia, custos.manutencao, custos.administracao].map(v => Number(v) || 0);

    if (graficoCustosModal) {
        graficoCustosModal.data.datasets[0].data = valores;
        graficoCustosModal.update('none');
        return;
    }

    graficoCustosModal = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels,
            datasets: [{
                data: valores,
                backgroundColor: [
                    'rgba(59, 130, 246, 0.65)',
                    'rgba(34, 197, 94, 0.65)',
                    'rgba(234, 179, 8, 0.65)',
                    'rgba(14, 165, 233, 0.65)'
                ],
                borderWidth: 1,
                borderColor: '#fff'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        boxWidth: 14,
                        font: { size: 11 }
                    }
                }
            }
        }
    });
}

function gerarSensibilidade({ precoKg, precoTon, lme, dolar, sensibilidade }) {
    const percent = Math.abs(sensibilidade) || 5;
    const variacoes = [-percent, 0, percent];
    const linhas = [];

    variacoes.forEach(varLme => {
        variacoes.forEach(varDol => {
            const fatorLme = 1 + varLme / 100;
            const fatorDol = 1 + varDol / 100;
            const novoLme = lme * fatorLme;
            const novoDol = dolar * fatorDol;
            const precoKgAjustado = precoKg * fatorLme * fatorDol;
            linhas.push({
                label: `${varLme >= 0 ? '+' : ''}${varLme}% LME / ${varDol >= 0 ? '+' : ''}${varDol}% Dólar`,
                lme: novoLme,
                dolar: novoDol,
                precoKg: precoKgAjustado,
                precoTon: precoKgAjustado * 1000
            });
        });
    });

    return linhas;
}

function atualizarTabelaSensibilidade(linhas) {
    const tbody = document.querySelector('#tabelaSensibilidade tbody');
    if (!tbody) return;

    if (!linhas || !linhas.length) {
        tbody.innerHTML = '<tr><td colspan="5">Calcule para exibir a matriz.</td></tr>';
        return;
    }

    tbody.innerHTML = '';
    linhas.forEach(linha => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${linha.label}</td>
            <td>${formatarNumero(linha.lme, 2)}</td>
            <td>${formatarNumero(linha.dolar, 4)}</td>
            <td>${formatarNumero(linha.precoKg, 2)}</td>
            <td>${formatarNumero(linha.precoTon, 2)}</td>
        `;
        tbody.appendChild(tr);
    });
}

function atualizarGraficoSensibilidade(linhas) {
    const ctx = document.getElementById('graficoSensibilidade');
    if (!ctx) return;

    const container = ctx.closest('.grafico-secundario');
    const placeholder = document.getElementById('placeholderSensibilidade');

    if (!linhas || !linhas.length) {
        if (graficoSensibilidade) {
            graficoSensibilidade.destroy();
            graficoSensibilidade = null;
        }
        if (container) {
            container.classList.add('sem-dados');
        }
        if (placeholder) {
            placeholder.textContent = 'Calcule a simulação para visualizar os cenários de sensibilidade.';
        }
        return;
    }

    if (container) {
        container.classList.remove('sem-dados');
    }
    if (placeholder) {
        placeholder.textContent = 'Resultados considerando variações simultâneas de LME e Dólar.';
    }

    const labels = linhas.map(l => l.label);
    const dadosKg = linhas.map(l => l.precoKg);
    const dadosTon = linhas.map(l => l.precoTon);

    if (graficoSensibilidade) {
        graficoSensibilidade.data.labels = labels;
        graficoSensibilidade.data.datasets[0].data = dadosKg;
        graficoSensibilidade.data.datasets[1].data = dadosTon;
        graficoSensibilidade.update('none');
        return;
    }

    graficoSensibilidade = new Chart(ctx, {
        type: 'bar',
        data: {
            labels,
            datasets: [
                {
                    label: 'Preço (R$/kg)',
                    data: dadosKg,
                    backgroundColor: 'rgba(59, 130, 246, 0.55)',
                    borderColor: 'rgba(59, 130, 246, 1)',
                    borderWidth: 1
                },
                {
                    label: 'Preço (R$/ton)',
                    data: dadosTon,
                    backgroundColor: 'rgba(16, 185, 129, 0.45)',
                    borderColor: 'rgba(16, 185, 129, 1)',
                    borderWidth: 1
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                x: {
                    ticks: {
                        maxRotation: 0,
                        minRotation: 0,
                        font: { size: 10 }
                    }
                },
                y: {
                    ticks: {
                        callback: valor => `R$ ${formatarNumero(valor, 2)}`
                    }
                }
            },
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: { font: { size: 11 } }
                },
                tooltip: {
                    callbacks: {
                        label: context => `${context.dataset.label}: R$ ${formatarNumero(context.parsed.y, 2)}`
                    }
                }
            }
        }
    });
}

async function salvarSimulacaoIndexedDB(dados) {
    try {
        const db = await abrirIndexedDB();
        return await new Promise((resolve, reject) => {
            const tx = db.transaction(dbConfig.store, 'readwrite');
            const store = tx.objectStore(dbConfig.store);
            const request = store.add(dados);
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    } catch (error) {
        console.error('IndexedDB salvar erro:', error);
        throw error;
    }
}

async function carregarSimulacoesIndexedDB() {
    try {
        const db = await abrirIndexedDB();
        return await new Promise((resolve, reject) => {
            const tx = db.transaction(dbConfig.store, 'readonly');
            const store = tx.objectStore(dbConfig.store);
            const request = store.getAll();
            request.onsuccess = () => resolve(request.result || []);
            request.onerror = () => reject(request.error);
        });
    } catch (error) {
        console.error('IndexedDB carregar erro:', error);
        return [];
    }
}

async function limparHistoricoIndexedDB() {
    try {
        const db = await abrirIndexedDB();
        return await new Promise((resolve, reject) => {
            const tx = db.transaction(dbConfig.store, 'readwrite');
            const store = tx.objectStore(dbConfig.store);
            const request = store.clear();
            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    } catch (error) {
        console.error('IndexedDB limpar erro:', error);
    }
}

async function buscarDadosSimulacao({ forcar = false } = {}) {
    const cacheValido = !forcar && simulacaoState.referencia && (Date.now() - (simulacaoState.referencia.timestamp || 0)) < 300000;
    if (cacheValido) {
        return simulacaoState.referencia;
    }

    try {
        const response = await fetch('/api/simulacao/padroes');
        if (!response.ok) {
            throw new Error('Falha ao buscar dados de simulação');
        }
        const data = await response.json();
        simulacaoState.referencia = { ...data, timestamp: Date.now() };
        const parseNumero = (valor, fallback = 0) => {
            const numero = parseFloat(valor);
            return Number.isFinite(numero) ? numero : fallback;
        };

        simulacaoState.defaults = {
            lme: parseNumero(data.cotacao_lme, simulacaoState.defaults.lme),
            dolar: parseNumero(data.cotacao_dolar, simulacaoState.defaults.dolar),
            fator: parseNumero(data.fator_referencia, 1.3),
            custos: parseNumero(data.custos_referencia, simulacaoState.defaults.custos),
            margem: parseNumero(data.margem_padrao ?? 25, 25),
            margemMinima: parseNumero(data.margem_minima ?? simulacaoState.defaults.margemMinima, 20),
            quantidade: parseNumero(data.quantidade_padrao ?? simulacaoState.defaults.quantidade, 1),
            sensibilidade: parseNumero(data.sensibilidade_padrao ?? simulacaoState.defaults.sensibilidade, 5)
        };

        simulacaoState.meta = {
            dataCotacao: data.data_referencia || null,
            atualizadoEm: new Date()
        };

        if (data.custos_detalhados) {
            const detalhados = data.custos_detalhados;
            const ler = (chave, fallback) => {
                if (detalhados && typeof detalhados === 'object') {
                    const valor = detalhados[chave];
                    return parseNumero(valor, fallback);
                }
                return fallback;
            };
            simulacaoState.custosDetalhados = {
                mao_obra: ler('mao_obra', simulacaoState.custosDetalhados.mao_obra),
                energia: ler('energia', simulacaoState.custosDetalhados.energia),
                manutencao: ler('manutencao', simulacaoState.custosDetalhados.manutencao),
                administracao: ler('administracao', simulacaoState.custosDetalhados.administracao)
            };
        }
        return simulacaoState.referencia;
    } catch (error) {
        console.error('Erro ao obter dados de simulação:', error);
        throw error;
    }
}

function preencherCamposSimulacao() {
    const { lme, dolar, fator, custos, margem, margemMinima, quantidade, sensibilidade } = simulacaoState.defaults;
    const campo = (id, valor) => {
        const el = document.getElementById(id);
        if (el) {
            el.value = valor !== undefined && valor !== null ? valor : 0;
        }
    };
    campo('inputLME', lme?.toFixed ? lme.toFixed(2) : lme);
    campo('inputDolar', dolar?.toFixed ? dolar.toFixed(4) : dolar);
    campo('inputFator', fator);
    campo('inputCustos', custos);
    campo('inputMargem', margem);
    campo('inputMargemMinima', margemMinima);
    campo('inputQuantidade', quantidade);
    campo('inputSensibilidade', sensibilidade);

    const { mao_obra, energia, manutencao, administracao } = simulacaoState.custosDetalhados;
    campo('custoMaoObra', mao_obra?.toFixed ? mao_obra.toFixed(2) : mao_obra);
    campo('custoEnergia', energia?.toFixed ? energia.toFixed(2) : energia);
    campo('custoManutencao', manutencao?.toFixed ? manutencao.toFixed(2) : manutencao);
    campo('custoAdministracao', administracao?.toFixed ? administracao.toFixed(2) : administracao);

    atualizarModalTotal(simulacaoState.custosDetalhados);
    atualizarMetaSimulacao();
}

function atualizarGraficoMargem(custoTotal) {
    const labels = [];
    const dados = [];
    for (let margem = 0; margem <= 40; margem += 5) {
        const margemDecimal = margem / 100;
        const preco = margemDecimal >= 1 ? 0 : custoTotal / (1 - margemDecimal);
        labels.push(`${margem}%`);
        dados.push(Number(preco.toFixed(2)));
    }

    const ctx = document.getElementById('graficoMargem');
    if (!ctx) return;

    if (graficoMargem) {
        graficoMargem.data.labels = labels;
        graficoMargem.data.datasets[0].data = dados;
        graficoMargem.update('none');
    } else {
        graficoMargem = new Chart(ctx, {
            type: 'line',
            data: {
                labels,
                datasets: [{
                    label: 'Preço de Venda (R$/kg)',
                    data: dados,
                    backgroundColor: 'rgba(37, 99, 235, 0.2)',
                    borderColor: 'rgba(37, 99, 235, 0.85)',
                    borderWidth: 3,
                    fill: true,
                    tension: 0.35
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        callbacks: {
                            label: (context) => `Preço: ${formatarMoeda(context.parsed.y)}`
                        }
                    }
                },
                scales: {
                    y: {
                        ticks: {
                            callback: (value) => formatarMoeda(value)
                        }
                    }
                }
            }
        });
    }
}

function recalcularSimulacao() {
    const cotacaoLME = obterValorInput('inputLME');
    const cotacaoDolar = obterValorInput('inputDolar');
    const fatorAjuste = obterValorInput('inputFator');
    const custosOperacionais = obterValorInput('inputCustos');
    const margemPercentual = obterValorInput('inputMargem');
    const margemMinima = obterValorInput('inputMargemMinima');
    const quantidade = Math.max(obterValorInput('inputQuantidade'), 0);
    const sensibilidade = obterValorInput('inputSensibilidade');

    if (!cotacaoLME || !cotacaoDolar || !fatorAjuste) {
        atualizarMensagemSimulacao('erro', 'Preencha as cotações e fator de ajuste antes de continuar.');
        atualizarResumoCustosDetalhados(simulacaoState.custosDetalhados, custosOperacionais);
        atualizarGraficoMultifator();
        return;
    }

    const precoBaseUSDkg = cotacaoLME / 1000;
    const precoBaseRSkg = precoBaseUSDkg * cotacaoDolar * fatorAjuste;
    const custoTotal = precoBaseRSkg + custosOperacionais;
    const margemDecimal = margemPercentual / 100;

    const precoVendaKg = margemDecimal >= 1 ? 0 : custoTotal / (1 - margemDecimal);
    const precoVendaTon = precoVendaKg * 1000;
    const margemBrutaReal = precoVendaKg === 0 ? 0 : ((precoVendaKg - custoTotal) / precoVendaKg) * 100;
    const receitaTotal = precoVendaTon * quantidade;

    simulacaoState.defaults = {
        ...simulacaoState.defaults,
        lme: cotacaoLME,
        dolar: cotacaoDolar,
        fator: fatorAjuste,
        custos: custosOperacionais,
        margem: margemPercentual,
        margemMinima,
        quantidade,
        sensibilidade
    };

    simulacaoState.resultados = {
        cotacaoLME,
        cotacaoDolar,
        fatorAjuste,
        custosOperacionais,
        margemPercentual,
        margemMinima,
        precoBaseRSkg,
        custoTotal,
        precoVendaKg,
        precoVendaTon,
        margemBrutaReal,
        quantidade,
        receitaTotal,
        sensibilidade
    };

    atualizarResultado('resultadoPrecoBase', formatarMoeda(precoBaseRSkg));
    atualizarResultado('resultadoCustoTotal', formatarMoeda(custoTotal));
    atualizarResultado('resultadoVendaKg', formatarMoeda(precoVendaKg));
    atualizarResultado('resultadoVendaTon', formatarMoeda(precoVendaTon));
    atualizarResultado('resultadoMargem', formatarPercentual(margemBrutaReal));
    atualizarResultado('resultadoQuantidade', formatarNumero(quantidade, 2));
    atualizarResultado('resultadoReceitaTotal', formatarMoeda(receitaTotal));

    atualizarMensagemSimulacao(null, '');
    atualizarGraficoMargem(custoTotal);
    atualizarResumoPainel();
    atualizarResumoCustosDetalhados(simulacaoState.custosDetalhados, custosOperacionais);
    atualizarGraficoMultifator({
        precoBaseRSkg,
        custosOperacionais,
        precoVendaKg
    });

    const comparativo = calcularComparativoMensal({
        precoVendaKg,
        margemDecimal,
        fatorAjuste,
        custosOperacionais,
        margemPercentual
    });
    atualizarComparativoMensal(comparativo);

    atualizarAlertasMargem(margemBrutaReal, margemMinima);
    atualizarResumoExecutivo({
        precoVendaKg,
        margemBrutaReal,
        quantidade,
        receitaTotal,
        comparativo
    });

    const linhasSensibilidade = gerarSensibilidade({
        precoKg: precoVendaKg,
        precoTon: precoVendaTon,
        lme: cotacaoLME,
        dolar: cotacaoDolar,
        sensibilidade
    });
    document.getElementById('tituloSensibilidade').textContent = `Sensibilidade ±${formatarNumero(Math.abs(sensibilidade), 0)}%`;
    atualizarTabelaSensibilidade(linhasSensibilidade);
    atualizarGraficoSensibilidade(linhasSensibilidade);
}

function resetarSimulacao() {
    if (!simulacaoState.referencia) return;
    preencherCamposSimulacao();
    recalcularSimulacao();
}

async function carregarSimulacao(opcoes = { restaurar: false }) {
    try {
        const dados = await buscarDadosSimulacao();
        if (opcoes.restaurar || !simulacaoEventosRegistrados) {
            simulacaoState.custosDetalhados = dados.custos_detalhados || simulacaoState.custosDetalhados;
            preencherCamposSimulacao();
        }
        criarPresetsAutomaticos();
        await carregarHistorico();
        atualizarSelectPresets();
        if (!simulacaoEventosRegistrados) {
            registrarEventosSimulacao();
            simulacaoEventosRegistrados = true;
        }
        recalcularSimulacao();
    } catch (error) {
        atualizarMensagemSimulacao('erro', 'Não foi possível carregar os dados de referência.');
    }
}

function registrarEventosSimulacao() {
    const campos = ['inputLME', 'inputDolar', 'inputFator', 'inputCustos', 'inputMargem', 'inputMargemMinima', 'inputQuantidade', 'inputSensibilidade'];
    campos.forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            el.addEventListener('input', () => recalcularSimulacao());
        }
    });

    const btnDetalhar = document.getElementById('btnDetalharCustos');
    if (btnDetalhar) {
        btnDetalhar.addEventListener('click', abrirModalCustos);
    }

    const btnForcarAtualizacao = document.getElementById('btnForcarAtualizacao');
    if (btnForcarAtualizacao) {
        btnForcarAtualizacao.addEventListener('click', async () => {
            try {
                await buscarDadosSimulacao({ forcar: true });
                preencherCamposSimulacao();
                recalcularSimulacao();
                atualizarMensagemSimulacao('sucesso', 'Cotações atualizadas com sucesso.');
            } catch (error) {
                atualizarMensagemSimulacao('erro', 'Não foi possível atualizar as cotações agora.');
            }
        });
    }

    registrarAjudaSimulacao();

    const btnSalvarPreset = document.getElementById('btnSalvarPreset');
    if (btnSalvarPreset) {
        btnSalvarPreset.addEventListener('click', salvarPresetAtual);
    }

    const btnAplicarPreset = document.getElementById('btnAplicarPreset');
    if (btnAplicarPreset) {
        btnAplicarPreset.addEventListener('click', aplicarPresetSelecionado);
    }

    const btnExcluirPreset = document.getElementById('btnExcluirPreset');
    if (btnExcluirPreset) {
        btnExcluirPreset.addEventListener('click', excluirPresetSelecionado);
    }

    const btnExportarHistorico = document.getElementById('btnExportarHistorico');
    if (btnExportarHistorico) {
        btnExportarHistorico.addEventListener('click', exportarHistoricoLocal);
    }

    const btnImportarHistorico = document.getElementById('btnImportarHistorico');
    if (btnImportarHistorico) {
        btnImportarHistorico.addEventListener('click', importarHistoricoLocal);
    }

    const btnAtualizar = document.getElementById('btnAtualizarDados');
    if (btnAtualizar) {
        btnAtualizar.addEventListener('click', async () => {
            try {
                await buscarDadosSimulacao({ forcar: true });
                preencherCamposSimulacao();
                recalcularSimulacao();
                atualizarMensagemSimulacao('sucesso', 'Cotações atualizadas com sucesso.');
            } catch (error) {
                atualizarMensagemSimulacao('erro', 'Não foi possível atualizar as cotações.');
            }
        });
    }

    const btnResetar = document.getElementById('btnResetar');
    if (btnResetar) {
        btnResetar.addEventListener('click', () => {
            resetarSimulacao();
            atualizarMensagemSimulacao('sucesso', 'Valores restaurados para os padrões atuais do mercado.');
        });
    }

    const btnSalvar = document.getElementById('btnSalvar');
    if (btnSalvar) {
        btnSalvar.addEventListener('click', salvarSimulacao);
    }

    const btnExportar = document.getElementById('btnExportar');
    if (btnExportar) {
        btnExportar.addEventListener('click', () => {
            exportarSimulacao().catch(erro => {
                console.error('Exportação falhou:', erro);
                atualizarMensagemSimulacao('erro', 'Não foi possível exportar. Recarregue a página e tente novamente.');
            });
        });
    }

    const btnDuplicar = document.getElementById('btnDuplicar');
    if (btnDuplicar) {
        btnDuplicar.addEventListener('click', () => {
            if (!simulacaoState.resultados || !Object.keys(simulacaoState.resultados).length) {
                atualizarMensagemSimulacao('erro', 'Calcule primeiro para duplicar.');
                return;
            }
            preencherCamposSimulacao();
            atualizarMensagemSimulacao('sucesso', 'Parâmetros duplicados com sucesso.');
        });
    }

    const btnToggleResultados = document.getElementById('btnToggleResultados');
    const cardResultados = document.querySelector('.resultados-card');
    if (btnToggleResultados && cardResultados) {
        btnToggleResultados.addEventListener('click', () => {
            const estaColapsado = cardResultados.classList.toggle('collapsed');
            btnToggleResultados.textContent = estaColapsado ? '⬇ Expandir' : '⬆ Recolher';
        });
    }

    const btnLimparHistorico = document.getElementById('btnLimparHistorico');
    if (btnLimparHistorico) {
        btnLimparHistorico.addEventListener('click', async () => {
            await limparHistoricoIndexedDB();
            await carregarHistorico();
            atualizarMensagemSimulacao('sucesso', 'Histórico local limpo.');
        });
    }

    const btnExpandirGrafico = document.getElementById('btnExpandirGrafico');
    if (btnExpandirGrafico) {
        btnExpandirGrafico.addEventListener('click', () => {
            graficoExpandido = !graficoExpandido;
            document.body.classList.toggle('grafico-expandido', graficoExpandido);
            btnExpandirGrafico.textContent = graficoExpandido ? '⤡ Recolher' : '⤢ Expandir';
            setTimeout(() => atualizarGraficoMargem(simulacaoState.resultados.custoTotal || 0), 250);
        });
    }
}

function abrirModalCustos() {
    const modal = document.getElementById('modalCustos');
    if (!modal) return;
    const custos = simulacaoState.custosDetalhados;
    document.getElementById('custoMaoObra').value = custos.mao_obra ?? 0;
    document.getElementById('custoEnergia').value = custos.energia ?? 0;
    document.getElementById('custoManutencao').value = custos.manutencao ?? 0;
    document.getElementById('custoAdministracao').value = custos.administracao ?? 0;
    atualizarModalTotal(custos);
    modal.classList.add('show');

    if (!modalEventosRegistrados) {
        const inputs = modal.querySelectorAll('input');
        inputs.forEach(input => {
            input.addEventListener('input', () => {
                const novosCustos = obterCustosDetalhados();
                atualizarModalTotal(novosCustos);
            });
        });
        const btnFechar = document.getElementById('modalFechar');
        if (btnFechar) btnFechar.addEventListener('click', () => modal.classList.remove('show'));
        const btnCancelar = document.getElementById('modalCancelar');
        if (btnCancelar) btnCancelar.addEventListener('click', () => modal.classList.remove('show'));
        const btnAplicar = document.getElementById('modalAplicar');
        if (btnAplicar) {
            btnAplicar.addEventListener('click', () => {
                simulacaoState.custosDetalhados = obterCustosDetalhados();
                const total = calcularTotalCustosDetalhados(simulacaoState.custosDetalhados);
                const campoCustos = document.getElementById('inputCustos');
                if (campoCustos) {
                    campoCustos.value = total.toFixed(2);
                }
                modal.classList.remove('show');
                recalcularSimulacao();
            });
        }
        modalEventosRegistrados = true;
    }

    modal.classList.add('show');
}

async function salvarSimulacao() {
    try {
        if (!simulacaoState.resultados || !Object.keys(simulacaoState.resultados).length) {
            atualizarMensagemSimulacao('erro', 'Realize um cálculo antes de salvar.');
            return;
        }

        const payload = {
            ...simulacaoState.resultados,
            custosDetalhados: simulacaoState.custosDetalhados,
            createdAt: new Date().toISOString()
        };

        const idLocal = await salvarSimulacaoIndexedDB(payload);
        simulacaoState.historico.unshift({ id: idLocal, ...payload });
        renderizarHistorico();

        atualizarMensagemSimulacao('sucesso', 'Simulação salva localmente.');
    } catch (error) {
        console.error(error);
        atualizarMensagemSimulacao('erro', 'Não foi possível salvar a simulação.');
    }
}

async function exportarSimulacao() {
    const resultados = simulacaoState.resultados;
    if (!resultados || !Object.keys(resultados).length) {
        atualizarMensagemSimulacao('erro', 'Realize um cálculo antes de exportar.');
        return;
    }

    if (!dadosCache.diarios) {
        await atualizarDados();
    }

    await carregarDadosPeriodo();

    const resumoSimulacao = [
        ['Campo', 'Valor'],
        ['Cotação LME (US$/tonelada)', resultados.cotacaoLME ?? ''],
        ['Cotação do Dólar (R$/US$)', resultados.cotacaoDolar ?? ''],
        ['Fator de Ajuste do Tarugo', resultados.fatorAjuste ?? ''],
        ['Custos Operacionais (R$/kg)', resultados.custosOperacionais ?? ''],
        ['Margem Desejada (%)', resultados.margemPercentual ?? ''],
        ['Margem Mínima (%)', resultados.margemMinima ?? ''],
        ['Preço Base (R$/kg)', resultados.precoBaseRSkg ?? ''],
        ['Custo Total (R$/kg)', resultados.custoTotal ?? ''],
        ['Preço de Venda (R$/kg)', resultados.precoVendaKg ?? ''],
        ['Preço de Venda (R$/ton)', resultados.precoVendaTon ?? ''],
        ['Margem Bruta (%)', resultados.margemBrutaReal ?? ''],
        ['Quantidade (ton)', resultados.quantidade ?? ''],
        ['Receita Total (R$)', resultados.receitaTotal ?? ''],
        ['Sensibilidade (±%)', resultados.sensibilidade ?? ''],
        ['Data da Cotação', simulacaoState.meta.dataCotacao ? formatarData(simulacaoState.meta.dataCotacao) : '--'],
        ['Atualizado em', simulacaoState.meta.atualizadoEm ? formatarDataHora(simulacaoState.meta.atualizadoEm) : '--']
    ];

    const tabelaVisaoGeral = extrairTabela('#tabelaDados');
    const tabelaPeriodo = extrairTabela('#tabelaPeriodoBody', true);

    if (!tabelaVisaoGeral.length || !tabelaPeriodo.length) {
        atualizarMensagemSimulacao('erro', 'Carregue os dados das abas Visão Geral e Dados do Período antes de exportar.');
        return;
    }

    const wb = XLSX.utils.book_new();
    const wsSimulacao = XLSX.utils.aoa_to_sheet(resumoSimulacao);
    XLSX.utils.book_append_sheet(wb, wsSimulacao, 'Simulacao');

    const wsVisaoGeral = XLSX.utils.aoa_to_sheet(tabelaVisaoGeral);
    XLSX.utils.book_append_sheet(wb, wsVisaoGeral, 'Visao_Geral');

    const wsPeriodo = XLSX.utils.aoa_to_sheet(tabelaPeriodo);
    XLSX.utils.book_append_sheet(wb, wsPeriodo, 'Dados_Periodo');

    const nomeArquivo = `simulacao-preco-${new Date().toISOString().slice(0, 10)}.xlsx`;
    XLSX.writeFile(wb, nomeArquivo);
    atualizarMensagemSimulacao('sucesso', 'Arquivo Excel gerado com sucesso.');
}

function extrairTabela(seletor, incluirCabecalhoPeriodo = false) {
    const tabela = document.querySelector(seletor.startsWith('#') ? seletor : `${seletor}`);
    if (!tabela) {
        return [];
    }

    const linhas = [];

    if (incluirCabecalhoPeriodo) {
        const thead = document.querySelector('#tabPeriodo table thead');
        if (thead) {
            thead.querySelectorAll('tr').forEach(tr => {
                const linha = Array.from(tr.children).map(c => c.innerText.trim());
                linhas.push(linha);
            });
        }
    } else {
        const thead = document.querySelector('#tabelaDados thead');
        if (thead) {
            const headerRow = Array.from(thead.querySelectorAll('tr')[0].children).map(c => c.innerText.trim());
            linhas.push(headerRow);
        }
    }

    tabela.querySelectorAll('tr').forEach(tr => {
        const linha = Array.from(tr.children).map(td => td.innerText.trim());
        if (linha.length) {
            linhas.push(linha);
        }
    });

    return linhas;
}

async function carregarHistorico() {
    simulacaoState.historico = await carregarSimulacoesIndexedDB();
    simulacaoState.historico.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    renderizarHistorico();
}

function renderizarHistorico() {
    const lista = document.getElementById('listaHistorico');
    const vazio = document.getElementById('historicoVazio');
    if (!lista || !vazio) return;

    lista.innerHTML = '';

    if (!simulacaoState.historico.length) {
        vazio.style.display = 'block';
        lista.appendChild(vazio);
        return;
    }

    vazio.style.display = 'none';
    simulacaoState.historico.slice(0, 6).forEach(item => {
        const li = document.createElement('li');
        li.className = 'historico-item';
        const data = new Date(item.createdAt);
        const dataFormatada = data.toLocaleString('pt-BR', {
            day: '2-digit', month: '2-digit', year: 'numeric',
            hour: '2-digit', minute: '2-digit'
        });

        li.innerHTML = `
            <div style="display:flex;flex-direction:column;gap:2px">
                <strong>${formatarMoeda(item.precoVendaKg || 0)}</strong>
                <span>Margem ${formatarNumero(item.margemBrutaReal || 0, 2)} %</span>
            </div>
            <span>${dataFormatada}</span>
        `;

        li.addEventListener('click', () => {
            definirSimulacao(item);
            atualizarMensagemSimulacao('sucesso', 'Simulação carregada do histórico.');
        });

        lista.appendChild(li);
    });
}

function definirSimulacao(item) {
    const campos = {
        inputLME: item.cotacaoLME,
        inputDolar: item.cotacaoDolar,
        inputFator: item.fatorAjuste,
        inputCustos: item.custosOperacionais,
        inputMargem: item.margemPercentual,
        inputMargemMinima: item.margemMinima ?? simulacaoState.defaults.margemMinima,
        inputQuantidade: item.quantidade ?? simulacaoState.defaults.quantidade,
        inputSensibilidade: item.sensibilidade ?? simulacaoState.defaults.sensibilidade
    };

    Object.entries(campos).forEach(([id, valor]) => {
        const el = document.getElementById(id);
        if (el && valor !== undefined) {
            el.value = valor;
        }
    });

    simulacaoState.custosDetalhados = item.custosDetalhados || simulacaoState.custosDetalhados;
    simulacaoState.defaults = {
        ...simulacaoState.defaults,
        lme: item.cotacaoLME ?? simulacaoState.defaults.lme,
        dolar: item.cotacaoDolar ?? simulacaoState.defaults.dolar,
        fator: item.fatorAjuste ?? simulacaoState.defaults.fator,
        custos: item.custosOperacionais ?? simulacaoState.defaults.custos,
        margem: item.margemPercentual ?? simulacaoState.defaults.margem,
        margemMinima: campos.inputMargemMinima,
        quantidade: campos.inputQuantidade,
        sensibilidade: campos.inputSensibilidade
    };
    recalcularSimulacao();
}

function atualizarResumoPainel() {
    const cards = document.querySelectorAll('#resultadoCards .result-card');
    cards.forEach(card => {
        card.classList.remove('positivo', 'negativo');
    });
    const margem = simulacaoState.resultados.margemBrutaReal || 0;
    const destaque = document.getElementById('resultadoMargem')?.parentElement;
    if (destaque) {
        destaque.classList.add(margem >= 25 ? 'positivo' : 'negativo');
    }
}

// Configuração de cores
const cores = {
    cobre: 'rgba(255, 99, 132, 0.8)',
    cobreBorda: 'rgba(255, 99, 132, 1)',
    cobreArea: 'rgba(255, 99, 132, 0.2)',
    zinco: 'rgba(153, 102, 255, 0.8)',
    aluminio: 'rgba(54, 162, 235, 0.8)',
    chumbo: 'rgba(75, 192, 192, 0.8)',
    estanho: 'rgba(255, 206, 86, 0.8)',
    niquel: 'rgba(255, 159, 64, 0.8)',
    dolar: 'rgba(34, 197, 94, 0.8)'
};

// Função para formatar números no padrão brasileiro
function formatarNumero(numero, casasDecimais = 2) {
    return new Intl.NumberFormat('pt-BR', {
        minimumFractionDigits: casasDecimais,
        maximumFractionDigits: casasDecimais
    }).format(numero);
}

function formatarMoeda(valor) {
    return `R$ ${formatarNumero(valor, 2)}`;
}

function formatarPercentual(valor) {
    return `${formatarNumero(valor, 2)} %`;
}

function obterValorInput(id) {
    const el = document.getElementById(id);
    if (!el) return 0;
    const valor = parseFloat(el.value.replace(',', '.'));
    return Number.isFinite(valor) ? valor : 0;
}

function atualizarResultado(id, valorFormatado) {
    const el = document.getElementById(id);
    if (el) {
        el.textContent = valorFormatado;
    }
}

function atualizarMensagemSimulacao(tipo, mensagem) {
    const mensagemBox = document.getElementById('simulacaoMensagem');
    if (!mensagemBox) return;
    mensagemBox.classList.remove('sucesso', 'erro');
    if (!mensagem) {
        mensagemBox.style.display = 'none';
        return;
    }
    mensagemBox.textContent = mensagem;
    mensagemBox.classList.add(tipo === 'erro' ? 'erro' : 'sucesso');
    mensagemBox.style.display = 'block';
}

function obterCustosDetalhados() {
    return {
        mao_obra: obterValorInput('custoMaoObra'),
        energia: obterValorInput('custoEnergia'),
        manutencao: obterValorInput('custoManutencao'),
        administracao: obterValorInput('custoAdministracao')
    };
}

function calcularTotalCustosDetalhados(custos) {
    return Object.values(custos).reduce((acc, valor) => acc + valor, 0);
}

function atualizarModalTotal(custos) {
    const total = calcularTotalCustosDetalhados(custos);
    const el = document.getElementById('modalTotal');
    if (el) {
        el.textContent = formatarMoeda(total);
    }
    desenharGraficoCustos(custos);
    atualizarResumoCustosDetalhados(custos, obterValorInput('inputCustos'));
}

// Converte 'YYYY-MM-DD' -> 'DD/MM/YYYY'
function formatarData(iso) {
    try {
        const [y, m, d] = iso.split('-');
        return `${d}/${m}/${y}`;
    } catch (e) {
        return iso;
    }
}

// Indicadores de variação (Diária, Semanal, Mensal) para o metal selecionado
function criarIndicadores(indicadores_variacao) {
    const container = document.getElementById('indicadores');
    container.innerHTML = '';

    const metal = selectedMetal;
    const unidade = metal === 'dolar' ? 'R$' : 'US$/t';
    const cor = {
        cobre: '#ef4444', zinco: '#8b5cf6', aluminio: '#3b82f6', chumbo: '#64748b', estanho: '#eab308', niquel: '#2563eb', dolar: '#10b981'
    }[metal] || '#ef4444';

    const blocos = [
        { chave: 'diario', titulo: `Variação Diária de ${metal.toUpperCase()}` },
        { chave: 'semanal', titulo: `Variação Semanal de ${metal.toUpperCase()}` },
        { chave: 'mensal', titulo: `Variação Mensal de ${metal.toUpperCase()}` }
    ];

    blocos.forEach(b => {
        const info = indicadores_variacao[b.chave] && indicadores_variacao[b.chave][metal];
        if (!info) return;

        const isPositivo = info.variacao >= 0;
        const arrow = isPositivo ? '↑' : '↓';
        const changeClass = isPositivo ? 'positive' : 'negative';

        let topoEsquerda = '', topoDireita = '';
        if (b.chave === 'diario') {
            topoEsquerda = `Em ${formatarData(info.data_atual)}<br><strong>${formatarNumero(info.valor_atual)}</strong>`;
            topoDireita = `Em ${formatarData(info.data_anterior)}<br><strong>${formatarNumero(info.valor_anterior)}</strong>`;
        } else if (b.chave === 'semanal') {
            topoEsquerda = `Semana ${info.semana_atual}<br><strong>${formatarNumero(info.valor_atual)}</strong>`;
            topoDireita = `Semana ${info.semana_anterior}<br><strong>${formatarNumero(info.valor_anterior)}</strong>`;
        } else if (b.chave === 'mensal') {
            topoEsquerda = `Em ${info.mes_atual}<br><strong>${formatarNumero(info.valor_atual)}</strong>`;
            topoDireita = `Em ${info.mes_anterior}<br><strong>${formatarNumero(info.valor_anterior)}</strong>`;
        }

        const card = document.createElement('div');
        card.className = 'indicator-card';
        card.style.padding = '0';

        card.innerHTML = `
            <div style="background:${cor};color:#fff;padding:8px 12px;border-top-left-radius:10px;border-top-right-radius:10px;font-weight:700;font-size:.9rem">${b.titulo}</div>
            <div style="display:flex;justify-content:space-between;gap:10px;background:#f7ebe6;padding:8px 12px;border-bottom-left-radius:10px;border-bottom-right-radius:10px">
                <div style="font-size:.8rem;line-height:1.2">${topoEsquerda}</div>
                <div style="font-size:.8rem;line-height:1.2;text-align:right">${topoDireita}</div>
            </div>
            <div style="padding:10px 12px;text-align:center">
                <span class="indicator-change ${changeClass}" style="font-size:1rem"><span class="arrow">${arrow}</span> ${Math.abs(info.variacao).toFixed(2)} %</span>
            </div>
        `;

        container.appendChild(card);
    });
}

// Função para criar gráfico de área
function criarGraficoArea(ctx, labels, dados, titulo, cor, unidade = 'US$/t') {
    return new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: titulo,
                data: dados,
                backgroundColor: cor.replace('0.8', '0.2'),
                borderColor: cor,
                borderWidth: 3,
                fill: true,
                tension: 0.4,
                pointRadius: 4,
                pointHoverRadius: 6,
                pointBackgroundColor: cor,
                pointBorderColor: '#fff',
                pointBorderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    padding: 12,
                    titleFont: {
                        size: 14
                    },
                    bodyFont: {
                        size: 13
                    },
                    callbacks: {
                        label: function(context) {
                            return `${titulo}: ${formatarNumero(context.parsed.y)} ${unidade}`;
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: false,
                    ticks: {
                        callback: function(value) {
                            return formatarNumero(value, 0);
                        }
                    },
                    grid: {
                        color: 'rgba(0, 0, 0, 0.05)'
                    }
                },
                x: {
                    grid: {
                        display: false
                    }
                }
            }
        }
    });
}

// Função para buscar dados da API (com cache)
async function buscarDados(mes, ano) {
    // Verificar se já tem cache válido (menos de 5 minutos)
    const agora = Date.now();
    if (dadosCache.timestamp && (agora - dadosCache.timestamp) < 300000) {
        return dadosCache;
    }

    try {
        const [responseDados, responseSemanais, responseMensais] = await Promise.all([
            fetch(`/api/dados/${mes}/${ano}`),
            fetch(`/api/dados-semanais/${mes}/${ano}`),
            fetch(`/api/dados-mensais`)
        ]);

        const dataDados = await responseDados.json();
        const dataSemanais = await responseSemanais.json();
        const dataMensais = await responseMensais.json();

        // Atualizar cache
        dadosCache = {
            diarios: dataDados.dados_diarios,
            semanais: dataSemanais,
            mensais: dataMensais,
            indicadores: dataDados.indicadores_variacao,
            timestamp: agora
        };

        return dadosCache;
    } catch (error) {
        console.error('Erro ao buscar dados:', error);
        throw error;
    }
}

// Função para atualizar visualização (sem buscar dados novamente)
function atualizarVisualizacao() {
    if (!dadosCache.diarios) return;

    // Criar indicadores de variação
    if (dadosCache.indicadores) {
        criarIndicadores(dadosCache.indicadores);
    }

    // Preparar dados para o gráfico diário
    const labels = dadosCache.diarios.map(d => {
        const [dia, mes] = d.data_formatada.split('/');
        return `${dia}/${mes}`;
    });
    const dadosSelecionados = dadosCache.diarios.map(d => d[selectedMetal]);

    // Atualizar títulos dos gráficos
    const nomeMetalFormatado = selectedMetal.charAt(0).toUpperCase() + selectedMetal.slice(1);
    document.querySelectorAll('.chart-card h3')[0].textContent = `Evolução Diária de ${nomeMetalFormatado}`;
    document.querySelectorAll('.chart-card h3')[1].textContent = `Evolução Semanal de ${nomeMetalFormatado}`;
    document.querySelectorAll('.chart-card h3')[2].textContent = `Evolução Mensal de ${nomeMetalFormatado}`;

    // Atualizar gráfico diário
    const cor = cores[selectedMetal] || cores.cobre;
    const unidade = selectedMetal === 'dolar' ? 'R$' : 'US$/t';
    
    if (chartDiario) {
        // Atualizar dados do gráfico existente (mais rápido que recriar)
        chartDiario.data.datasets[0].data = dadosSelecionados;
        chartDiario.data.datasets[0].backgroundColor = cor.replace('0.8', '0.2');
        chartDiario.data.datasets[0].borderColor = cor;
        chartDiario.options.plugins.tooltip.callbacks.label = function(context) {
            return `${selectedMetal.toUpperCase()}: ${formatarNumero(context.parsed.y)} ${unidade}`;
        };
        chartDiario.update('none'); // 'none' = sem animação, mais rápido
    } else {
        const ctx = document.getElementById('chartDiario').getContext('2d');
        chartDiario = criarGraficoArea(ctx, labels, dadosSelecionados, selectedMetal.toUpperCase(), cor, unidade);
    }

    // Atualizar gráfico semanal
    atualizarGraficoSemanal();

    // Atualizar gráfico mensal
    atualizarGraficoMensal();
}

// Função para carregar dados diários (primeira vez)
async function carregarDadosDiarios(mes, ano) {
    try {
        await buscarDados(mes, ano);
        atualizarVisualizacao();
        await preencherTabelaComMedias(dadosCache.diarios, mes, ano);
    } catch (error) {
        console.error('Erro ao carregar dados diários:', error);
        mostrarErro('Erro ao carregar dados diários');
    }
}

// Função para atualizar gráfico semanal (usando cache)
function atualizarGraficoSemanal() {
    if (!dadosCache.semanais || dadosCache.semanais.length === 0) return;

    const labels = dadosCache.semanais.map(d => `Sem ${d.semana}`);
    const dadosSelecionados = dadosCache.semanais.map(d => d[selectedMetal]);
    const cor = cores[selectedMetal] || cores.cobre;
    const unidade = selectedMetal === 'dolar' ? 'R$' : 'US$/t';

    if (chartSemanal) {
        // Atualizar dados do gráfico existente
        chartSemanal.data.datasets[0].data = dadosSelecionados;
        chartSemanal.data.datasets[0].backgroundColor = cor.replace('0.8', '0.2');
        chartSemanal.data.datasets[0].borderColor = cor;
        chartSemanal.options.plugins.tooltip.callbacks.label = function(context) {
            return `${selectedMetal.toUpperCase()}: ${formatarNumero(context.parsed.y)} ${unidade}`;
        };
        chartSemanal.update('none');
    } else {
        const ctx = document.getElementById('chartSemanal').getContext('2d');
        chartSemanal = criarGraficoArea(ctx, labels, dadosSelecionados, `${selectedMetal.toUpperCase()} (Média Semanal)`, cor, unidade);
    }
}

// Função para carregar dados semanais (primeira vez)
async function carregarDadosSemanais(mes, ano) {
    // Dados já estão no cache, apenas atualizar visualização
    if (dadosCache.semanais) {
        atualizarGraficoSemanal();
    }
}

// Função para atualizar gráfico mensal (usando cache)
function atualizarGraficoMensal() {
    if (!dadosCache.mensais || dadosCache.mensais.length === 0) return;

    const ultimos12Meses = dadosCache.mensais.slice(-12);
    const labels = ultimos12Meses.map(d => d.mes);
    const dadosSelecionados = ultimos12Meses.map(d => d[selectedMetal]);
    const cor = cores[selectedMetal] || cores.cobre;
    const unidade = selectedMetal === 'dolar' ? 'R$' : 'US$/t';

    if (chartMensal) {
        // Atualizar dados do gráfico existente
        chartMensal.data.datasets[0].data = dadosSelecionados;
        chartMensal.data.datasets[0].backgroundColor = cor.replace('0.8', '0.2');
        chartMensal.data.datasets[0].borderColor = cor;
        chartMensal.options.plugins.tooltip.callbacks.label = function(context) {
            return `${selectedMetal.toUpperCase()}: ${formatarNumero(context.parsed.y)} ${unidade}`;
        };
        chartMensal.update('none');
    } else {
        const ctx = document.getElementById('chartMensal').getContext('2d');
        chartMensal = criarGraficoArea(ctx, labels, dadosSelecionados, `${selectedMetal.toUpperCase()} (Média Mensal)`, cor, unidade);
    }
}

// Função para carregar dados mensais (primeira vez)
async function carregarDadosMensais() {
    // Dados já estão no cache, apenas atualizar visualização
    if (dadosCache.mensais) {
        atualizarGraficoMensal();
    }
}

// Função para preencher tabela com médias semanais usando dados da API
async function preencherTabelaComMedias(dados, mes, ano) {
    const tbody = document.getElementById('tabelaBody');
    tbody.innerHTML = '';

    if (dados.length === 0) {
        tbody.innerHTML = '<tr><td colspan="9" style="text-align: center;">Nenhum dado disponível</td></tr>';
        return;
    }

    try {
        // Buscar médias semanais da API
        const response = await fetch(`/api/dados-semanais/${mes}/${ano}`);
        const mediasSemanais = await response.json();
        
        // Criar mapa de semanas para fácil acesso
        const mapaMedias = {};
        mediasSemanais.forEach(m => {
            mapaMedias[m.semana] = m;
        });

        // Ordenar dados por data decrescente (mais recente primeiro)
        const dadosOrdenados = [...dados].sort((a, b) => {
            return new Date(b.data) - new Date(a.data);
        });

        // Agrupar dados por semana ISO
        const semanas = {};
        dadosOrdenados.forEach(item => {
            const [ano, mes, dia] = item.data.split('-').map(Number);
            const data = new Date(ano, mes - 1, dia);
            const semana = getWeekNumber(data);
            
            if (!semanas[semana]) {
                semanas[semana] = [];
            }
            semanas[semana].push(item);
        });

        // Preencher tabela com dados e médias da API (ordem decrescente - mais recente primeiro)
        Object.keys(semanas).sort((a, b) => b - a).forEach(semana => {
            const dadosSemana = semanas[semana];
            
            // Adicionar dados da semana
            dadosSemana.forEach(item => {
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td><strong>${item.data_formatada}</strong></td>
                    <td>${formatarNumero(item.cobre, 2)}</td>
                    <td>${formatarNumero(item.zinco, 2)}</td>
                    <td>${formatarNumero(item.aluminio, 2)}</td>
                    <td>${formatarNumero(item.chumbo, 2)}</td>
                    <td>${formatarNumero(item.estanho, 2)}</td>
                    <td>${formatarNumero(item.niquel, 2)}</td>
                    <td>${formatarNumero(item.dolar, 4)}</td>
                    <td>${item.dolar_ptax ? formatarNumero(item.dolar_ptax, 4) : '-'}</td>
                `;
                tbody.appendChild(tr);
            });

            // Adicionar média da API (se existir)
            const mediaAPI = mapaMedias[parseInt(semana)];
            if (mediaAPI) {
                const trMedia = document.createElement('tr');
                trMedia.className = 'semana-media';
                trMedia.innerHTML = `
                    <td><strong>Média Semana ${mediaAPI.semana}</strong></td>
                    <td>${formatarNumero(mediaAPI.cobre, 2)}</td>
                    <td>${formatarNumero(mediaAPI.zinco, 2)}</td>
                    <td>${formatarNumero(mediaAPI.aluminio, 2)}</td>
                    <td>${formatarNumero(mediaAPI.chumbo, 2)}</td>
                    <td>${formatarNumero(mediaAPI.estanho, 2)}</td>
                    <td>${formatarNumero(mediaAPI.niquel, 2)}</td>
                    <td>${formatarNumero(mediaAPI.dolar, 4)}</td>
                    <td>-</td>
                `;
                tbody.appendChild(trMedia);
            }
        });
    } catch (error) {
        console.error('Erro ao buscar médias semanais:', error);
        // Fallback: mostrar apenas os dados sem médias
        dadosOrdenados.forEach(item => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td><strong>${item.data_formatada}</strong></td>
                <td>${formatarNumero(item.cobre, 2)}</td>
                <td>${formatarNumero(item.zinco, 2)}</td>
                <td>${formatarNumero(item.aluminio, 2)}</td>
                <td>${formatarNumero(item.chumbo, 2)}</td>
                <td>${formatarNumero(item.estanho, 2)}</td>
                <td>${formatarNumero(item.niquel, 2)}</td>
                <td>${formatarNumero(item.dolar, 4)}</td>
                <td>${item.dolar_ptax ? formatarNumero(item.dolar_ptax, 4) : '-'}</td>
            `;
            tbody.appendChild(tr);
        });
    }
}

// Função auxiliar para obter número da semana ISO (segunda-feira = dia 1)
function getWeekNumber(date) {
    // Criar cópia da data
    const d = new Date(date.getTime());
    
    // Ajustar para quinta-feira da mesma semana (ISO)
    const dayOfWeek = d.getDay(); // 0=domingo, 1=segunda, ..., 6=sábado
    const dayNum = dayOfWeek === 0 ? 7 : dayOfWeek; // Converter domingo de 0 para 7
    
    // Quinta-feira da semana atual
    d.setDate(d.getDate() + 4 - dayNum);
    
    // Primeiro dia do ano
    const yearStart = new Date(d.getFullYear(), 0, 1);
    
    // Calcular número da semana
    const weekNo = Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
    
    return weekNo;
}

// Função para mostrar erro
function mostrarErro(mensagem) {
    const container = document.querySelector('.container');
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error';
    errorDiv.textContent = mensagem;
    container.insertBefore(errorDiv, container.firstChild);
}

// Função para atualizar todos os dados
async function atualizarDados() {
    // Usar data atual
    const hoje = new Date();
    const mes = hoje.getMonth() + 1; // getMonth() retorna 0-11
    const ano = hoje.getFullYear();

    await Promise.all([
        carregarDadosDiarios(mes, ano),
        carregarDadosSemanais(mes, ano),
        carregarDadosMensais()
    ]);
}

// Filtros de metal
document.querySelectorAll('.chip').forEach(chip => {
    chip.addEventListener('click', () => {
        document.querySelectorAll('.chip').forEach(c => c.classList.remove('active'));
        chip.classList.add('active');
        selectedMetal = chip.getAttribute('data-metal');
        
        // Se já tem dados em cache, apenas atualizar visualização (instantâneo)
        if (dadosCache.diarios) {
            atualizarVisualizacao();
            
            // Se estiver na aba de período, atualizar também
            const tabPeriodo = document.getElementById('tabPeriodo');
            if (tabPeriodo && tabPeriodo.classList.contains('active')) {
                carregarDadosPeriodo();
            }
        } else {
            // Primeira vez, buscar dados
            atualizarDados();
        }
    });
});

// Função para carregar dados do período
async function carregarDadosPeriodo() {
    const tbody = document.getElementById('tabelaPeriodoBody');
    tbody.innerHTML = '<tr><td colspan="11" class="loading" style="color:#333">Carregando dados...</td></tr>';

    try {
        const hoje = new Date();
        const mes = hoje.getMonth() + 1;
        const ano = hoje.getFullYear();

        // Usar cache se disponível, senão buscar
        if (!dadosCache.diarios) {
            await buscarDados(mes, ano);
        }

        // Atualizar título com metal selecionado
        const nomeMetalFormatado = selectedMetal.charAt(0).toUpperCase() + selectedMetal.slice(1);
        document.getElementById('tituloPeriodo').textContent = `Dados do Período - ${nomeMetalFormatado.toUpperCase()}`;

        // Criar mapas para acesso rápido
        const mapaSemanais = {};
        dadosCache.semanais.forEach(s => {
            mapaSemanais[s.semana] = s;
        });

        const mapaMensais = {};
        dadosCache.mensais.forEach(m => {
            mapaMensais[m.mes] = m;
        });

        // Ordenar dados por data decrescente
        const dadosOrdenados = [...dadosCache.diarios].sort((a, b) => {
            return new Date(b.data) - new Date(a.data);
        });

        tbody.innerHTML = '';

        dadosOrdenados.forEach(item => {
            // Calcular semana e dia da semana
            const [ano, mes, dia] = item.data.split('-').map(Number);
            const data = new Date(ano, mes - 1, dia);
            const semana = getWeekNumber(data);
            const diasSemana = ['DOM', 'SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SAB'];
            const diaSemana = diasSemana[data.getDay()];

            // Pegar metal selecionado
            const metalAtual = selectedMetal;
            const valorLME = item[metalAtual];
            const valorDolar = item.dolar;
            const precoTon = valorLME * valorDolar;

            // Médias semanais
            const mediaSemanal = mapaSemanais[semana];
            const mediaSemanDolar = mediaSemanal ? mediaSemanal.dolar : 0;
            const mediaSemanalLME = mediaSemanal ? mediaSemanal[metalAtual] : 0;
            const mediaSemanalPreco = mediaSemanDolar * mediaSemanalLME;

            // Médias mensais
            const mesReferencia = `${String(mes).padStart(2, '0')}/${ano}`;
            const mediaMensal = mapaMensais[mesReferencia];
            const mediaMensalDolar = mediaMensal ? mediaMensal.dolar : 0;
            const mediaMensalLME = mediaMensal ? mediaMensal[metalAtual] : 0;
            const mediaMensalPreco = mediaMensalDolar * mediaMensalLME;

            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${item.data_formatada}</td>
                <td><strong>${diaSemana}</strong></td>
                <td>${formatarNumero(valorDolar, 4)}</td>
                <td>${formatarNumero(valorLME, 2)}</td>
                <td>${formatarNumero(precoTon, 2)}</td>
                <td>${formatarNumero(mediaSemanDolar, 4)}</td>
                <td>${formatarNumero(mediaSemanalLME, 2)}</td>
                <td>${formatarNumero(mediaSemanalPreco, 2)}</td>
                <td>${formatarNumero(mediaMensalDolar, 4)}</td>
                <td>${formatarNumero(mediaMensalLME, 2)}</td>
                <td>${formatarNumero(mediaMensalPreco, 2)}</td>
            `;
            tbody.appendChild(tr);
        });

    } catch (error) {
        console.error('Erro ao carregar dados do período:', error);
        tbody.innerHTML = '<tr><td colspan="11" style="color:#e74c3c;text-align:center">Erro ao carregar dados</td></tr>';
    }
}

// Carregar dados iniciais
document.addEventListener('DOMContentLoaded', () => {
    atualizarDados();
    carregarSimulacao();
    registrarAjudaSecoes();
});

function registrarAjudaSimulacao() {
    if (modalAjudaRegistrado) return;
    const botaoAjuda = document.getElementById('btnAjudaSimulacao');
    const modal = document.getElementById('modalAjuda');
    const fechar = document.getElementById('modalAjudaFechar');
    const entendi = document.getElementById('modalAjudaEntendi');
    if (!botaoAjuda || !modal) return;

    const fecharModal = () => modal.classList.remove('show');
    botaoAjuda.addEventListener('click', () => {
        modal.classList.add('show');
    });
    if (fechar) fechar.addEventListener('click', fecharModal);
    if (entendi) entendi.addEventListener('click', fecharModal);
    modal.addEventListener('click', (evento) => {
        if (evento.target === modal) {
            fecharModal();
        }
    });
    modalAjudaRegistrado = true;
}
