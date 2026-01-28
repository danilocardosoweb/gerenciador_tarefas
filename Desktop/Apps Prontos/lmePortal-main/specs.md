# Especificação de Funcionalidades

Documento destinado a detalhar requisitos funcionais, regras de negócio, fluxos e premissas de implementação do projeto **LME Portal Tecnoperfil**. Atualize aqui sempre que novos recursos forem planejados ou entregues.

## Instruções de Atualização

1. Descreva o objetivo do recurso.
2. Liste requisitos funcionais e não funcionais.
3. Registre dependências internas e externas.
4. Inclua critérios de aceitação e cenários de teste.
5. Indique impactos em integração, banco de dados e infraestrutura.

> Manter este arquivo sincronizado com o `change_log.md` e demais documentações relacionadas a cada entrega.

## Presets Automáticos Inteligentes (Simulador)

- **Objetivo:** disponibilizar três configurações pré-definidas automáticas para análises rápidas no simulador de preços, permitindo que o usuário aproveite cenários estratégicos sem preencher manualmente todos os campos.
- **Requisitos funcionais:**
  1. Gerar automaticamente os presets no carregamento inicial utilizando as referências de `/api/simulacao/padroes`.
  2. Destacar cada preset no seletor com o sufixo "(automático)" e listar antes dos presets manuais.
  3. Impedir a exclusão manual dos presets automáticos.
  4. Atualizar os presets automáticos sempre que as referências forem recarregadas, preservando presets personalizados pelo usuário.
- **Cenários abordados:**
  1. **Margem Protegida:** prioriza manutenção de margem com ajustes defensivos em custos e cotações.
  2. **Volume Competitivo:** reduz custos unitários e margem para favorecer grandes quantidades.
  3. **Stress Cambial:** simula alta simultânea de LME e dólar, preservando margens mínimas seguras.
- **Regras e cálculos:**
  - Custos detalhados são normalizados mantendo proporções existentes ou, na ausência delas, distribuídos em 38% mão de obra, 22% energia, 20% manutenção e 20% administração.
  - Campos adicionais recebem limites mínimos inteligentes por cenário (margem mínima, sensibilidade, quantidade).
- **Critérios de aceitação:**
  1. O seletor exibe pelo menos três opções automáticas com o sufixo "(automático)" logo após o carregamento.
  2. Ao aplicar um preset automático, o formulário é preenchido com os valores calculados e a simulação é recalculada.
  3. Tentativas de excluir presets automáticos exibem mensagem de bloqueio.
  4. Presets manuais existentes permanecem intactos após recarregar a aplicação.
- **Impactos:** não há dependências adicionais no backend; operação totalmente no front-end via `localStorage`. Nenhuma alteração de banco de dados.

## Guia de Ajuda da Simulação de Preço

- **Objetivo:** fornecer um manual interativo dentro da aba de simulação explicando os campos, cálculos e cenários disponíveis.
- **Requisitos funcionais:**
  1. Exibir botão “❓ Ajuda da simulação” ao lado de “⟳ Atualizar agora”.
  2. Abrir modal com seções didáticas (visão geral, campos principais, presets automáticos e dicas rápidas).
  3. Fechar modal ao clicar em “Entendi”, no ícone "✕" ou fora da caixa de conteúdo.
  4. Garantir que o modal seja acessível em dispositivos móveis (rolagem vertical e largura responsiva).
- **Conteúdo destacado:**
  - Explicação resumida de como o simulador calcula preço, margem e gráficos.
  - Descrição de cada campo do formulário principal.
  - Resumo das regras de cada preset automático (incrementos de custo, câmbio e quantidade).
  - Boas práticas: uso do botão de atualização, leitura do gráfico multifator, alertas de margem e exportação de simulações.
- **Evoluções adicionais (03/11/2025 13:38):** ícones "?" foram adicionados diretamente em títulos das seções (simulação, sensibilidade, resultados, projeção por margem, gráficos) exibindo tooltips com descrições objetivas.
- **Evoluções adicionais (03/11/2025 13:47):** os ícones agora abrem popovers interativos com orientações detalhadas, listas de boas práticas e atalhos para cada bloco (formulário, resultados e gráficos).
- **Critérios de aceitação:**
  1. Clique no botão de ajuda abre o modal com todas as seções carregadas.
  2. Fechamento funciona por botão “Entendi”, ícone “✕” e clique na área externa.
  3. Conteúdo permanece legível em telas pequenas (rolagem habilitada).
- **Impactos:** atualização apenas no front-end (HTML, CSS e JavaScript). Nenhuma dependência extra e sem alterações em banco de dados.