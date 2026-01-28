# LME Portal Tecnoperfil

Portal web desenvolvido para a Tecnoperfil com dashboard interativo que apresenta cotações de metais da London Metal Exchange (LME), indicadores de variação e simulações comerciais.

## Visão Geral

- **Repositório oficial:** <https://github.com/danilocardosoweb/lme_Portal_Tecnoperfil>
- **Stack principal:** Flask, Chart.js, HTML/CSS/JS, integração com APIs LME e PTAX.
- **Hospedagem recomendada:** Railway (deploy rápido e suporte nativo a Flask).

## Funcionalidades

1. **Dashboard interativo** com gráficos diários, semanais e mensais dos metais.
2. **Indicadores de variação** (diária, semanal e mensal) com formatação brasileira.
3. **Filtros dinâmicos por metal** e abas diferenciadas (Gráficos e Dados do Período).
4. **Simulação de preços** com presets reutilizáveis, análise de sensibilidade e resumo executivo atualizado (03/11/2025).
5. **Integração com PTAX (BACEN)** e cache para redução de requisições externas.

## Estrutura do Repositório

```
lme_Portal_Tecnoperfil/
├── api/                     # Função serverless (Vercel)
├── web_dashboard/           # Aplicação Flask principal
│   ├── app.py
│   ├── templates/
│   ├── static/
│   └── docs/                # Documentação detalhada
├── vercel.json
├── Procfile
├── requirements.txt
├── requirements_vercel.txt
├── ALTERNATIVA_RAILWAY.md
├── DEPLOY_VERCEL.md
├── SOLUCAO_DEPLOY.md
└── RESUMO_FINAL.md
```

## Requisitos

- Python 3.8 ou superior
- pip (gerenciador de pacotes Python)

## Ambiente Local

```bash
git clone https://github.com/danilocardosoweb/lme_Portal_Tecnoperfil.git
cd lme_Portal_Tecnoperfil/web_dashboard
python -m venv .venv
. .venv/Scripts/activate  # Windows
# source .venv/bin/activate  # Linux/Mac
pip install --upgrade pip
pip install -r requirements.txt
python app.py
```

Acesse em <http://localhost:5000>.

## Deploy

### Railway (recomendado)

1. Crie um projeto em <https://railway.app> usando o repositório `danilocardosoweb/lme_Portal_Tecnoperfil`.
2. Configure o comando de start: `cd web_dashboard && gunicorn app:app`.
3. Defina a variável `PORT` se necessário (Railway já injeta automaticamente).

### Vercel (modo serverless)

- Utilize a função em `api/index.py` e o arquivo `vercel.json` já configurado.
- Dependências específicas: `requirements_vercel.txt`.

Outras plataformas suportadas: Render, Heroku e PythonAnywhere (ver documentação na pasta raiz).

## Documentação Complementar

- `RESUMO_FINAL.md`: panorama geral do projeto.
- `SOLUCAO_DEPLOY.md`: análise das plataformas de deploy.
- `web_dashboard/docs/*`: histórico de alterações e guias específicos.

## Licença

Este projeto segue a licença [MIT](LICENSE).