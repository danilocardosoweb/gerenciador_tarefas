# Dashboard LME - Cotações de Metais

Dashboard web interativo para visualização de cotações de metais da London Metal Exchange (LME) com dados reais obtidos via API.

## 📊 Funcionalidades

- **Indicadores em Tempo Real**: Exibe cotações atuais de Cobre, Zinco, Alumínio e Dólar com variação percentual
- **Gráfico de Evolução Diária**: Visualização da evolução diária do Cobre
- **Gráfico de Evolução Semanal**: Médias semanais do Cobre
- **Gráfico de Evolução Mensal**: Médias mensais do Cobre (últimos 12 meses)
- **Tabela Detalhada**: Informações diárias de todos os metais (Cobre, Zinco, Alumínio, Chumbo, Estanho, Níquel) e Dólar
- **Filtros por Mês/Ano**: Selecione o período desejado para análise
- **Simulação de Preço expandida**: Presets reutilizáveis, histórico em IndexedDB, análise de sensibilidade e resumo executivo

## 🚀 Como Executar

### Pré-requisitos

- Python 3.8 ou superior
- pip (gerenciador de pacotes Python)

### Instalação

1. **Navegue até a pasta do projeto:**
```bash
cd web_dashboard
```

2. **Instale as dependências:**
```bash
pip install -r requirements.txt
```

### Executando o Servidor

```bash
python app.py
```

O servidor será iniciado em: **http://localhost:5000**

Abra seu navegador e acesse o endereço acima para visualizar o dashboard.

## 🎨 Tecnologias Utilizadas

### Backend
- **Flask**: Framework web Python
- **Flask-CORS**: Suporte para CORS
- **Requests**: Requisições HTTP para API LME

### Frontend
- **HTML5/CSS3**: Estrutura e estilização
- **JavaScript (ES6+)**: Lógica da aplicação
- **Chart.js**: Biblioteca para gráficos interativos
- **Google Fonts (Inter)**: Tipografia moderna

## 📡 API Endpoints

### `GET /api/dados/<mes>/<ano>`
Retorna dados diários e indicadores de um mês específico.

**Exemplo:** `/api/dados/10/2025`

**Resposta:**
```json
{
  "dados_diarios": [...],
  "indicadores": {
    "cobre": {
      "valor_atual": 9500.00,
      "valor_anterior": 9450.00,
      "variacao": 0.53
    },
    ...
  }
}
```

### `GET /api/dados-semanais/<mes>/<ano>`
Retorna médias semanais de um mês específico.

**Exemplo:** `/api/dados-semanais/10/2025`

### `GET /api/dados-mensais`
Retorna médias mensais de todos os dados disponíveis.

### `GET /api/dados-completos`
Retorna todos os dados disponíveis na API.

## 📊 Estrutura do Projeto

```
web_dashboard/
├── app.py                 # Backend Flask
├── requirements.txt       # Dependências Python
├── README.md             # Documentação
├── templates/
│   └── index.html        # Interface principal
└── static/
    └── app.js            # Lógica JavaScript
```

## 🎯 Funcionalidades Principais

### 1. Indicadores com Variação Percentual
Cards coloridos exibindo:
- Valor atual da cotação
- Variação percentual em relação ao dia anterior
- Indicador visual (↑ positivo / ↓ negativo)

### 2. Gráficos Interativos
- **Gráficos de área** com gradiente
- **Tooltips informativos** ao passar o mouse
- **Formatação brasileira** de números (1.000,50)
- **Responsivos** para diferentes tamanhos de tela

### 3. Tabela de Dados
- Ordenação por data (mais recente primeiro)
- Formatação de números no padrão brasileiro
- Todas as cotações de metais em uma única visualização

### 4. Filtros Dinâmicos
- Seleção de mês e ano
- Atualização automática de todos os gráficos e tabelas

### 5. Simulação de Preço (Nova UX 03/11/2025)
- Layout vertical com três cards principais: formulário, resultados e projeções
- Presets salvos/automáticos com timestamps e sincronização com defaults de API
- Histórico local (IndexedDB) com importação/exportação via JSON
- Análise de sensibilidade (tabela e gráfico LME x Dólar) com placeholders para estados vazios
- Resumo executivo com alerta de margem mínima e comparação mensal
- Composição de custos detalhados sincronizada com o modal de edição e gráfico multifator em barras

## 🌐 Fonte de Dados

Os dados são obtidos em tempo real da API oficial:
```
https://lme.gorilaxpress.com/cotacao/2cf4ff0e-8a30-48a5-8add-f4a1a63fee10/json/
```

## 📱 Responsividade

O dashboard é totalmente responsivo e se adapta a diferentes tamanhos de tela:
- Desktop (1400px+)
- Tablet (768px - 1399px)
- Mobile (< 768px)

## 🎨 Paleta de Cores

- **Cobre**: #ef4444 (vermelho)
- **Zinco**: #8b5cf6 (roxo)
- **Alumínio**: #3b82f6 (azul)
- **Dólar**: #10b981 (verde)
- **Gradiente de fundo**: #667eea → #764ba2

## 🔧 Personalização

Para personalizar as cores dos gráficos, edite o objeto `cores` em `static/app.js`:

```javascript
const cores = {
    cobre: 'rgba(255, 99, 132, 0.8)',
    zinco: 'rgba(153, 102, 255, 0.8)',
    // ... outras cores
};
```

## 📝 Observações

- Os dados são atualizados conforme disponibilidade da API LME
- A formatação de números segue o padrão brasileiro (1.000,50)
- As datas são exibidas no formato DD/MM/AAAA
- O primeiro dia da semana é segunda-feira

## 🐛 Troubleshooting

### Erro ao conectar com a API
Verifique sua conexão com a internet e se a API está disponível:
```bash
curl https://lme.gorilaxpress.com/cotacao/2cf4ff0e-8a30-48a5-8add-f4a1a63fee10/json/
```

### Porta 5000 já em uso
Altere a porta no arquivo `app.py`:
```python
app.run(debug=True, host='0.0.0.0', port=8080)
```

## 📄 Licença

Este projeto utiliza dados públicos da API LME e é fornecido como está, sem garantias.
