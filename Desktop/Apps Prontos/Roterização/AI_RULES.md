# Regras de IA e Diretrizes do Projeto

Este documento descreve a pilha de tecnologia e as convenções específicas para garantir a consistência e a qualidade do código-fonte do aplicativo RouteMaster.

## 1. Visão Geral da Pilha de Tecnologia

O projeto é construído com uma pilha moderna e robusta, focada em desempenho e manutenibilidade:

*   **Framework Frontend:** React (utilizando Vite para tooling).
*   **Linguagem:** TypeScript para tipagem forte e maior segurança no desenvolvimento.
*   **Estilização:** Tailwind CSS para estilização utilitária e design responsivo.
*   **Componentes UI:** shadcn/ui (construído sobre primitivas Radix UI) para componentes acessíveis e personalizáveis.
*   **Roteamento:** React Router DOM para navegação no lado do cliente.
*   **Gerenciamento de Estado/Dados:** React Query (`@tanstack/react-query`) para gerenciamento de estado de servidor e cache.
*   **Mapeamento:** Leaflet e React Leaflet para visualização e interação com mapas.
*   **Formulários e Validação:** React Hook Form para gerenciamento de estado de formulário, combinado com Zod para validação de esquema.
*   **Ícones:** Lucide React.
*   **Notificações:** Sonner para exibição de toasts e notificações.

## 2. Regras de Uso de Bibliotecas

| Funcionalidade | Biblioteca Recomendada | Regras Específicas |
| :--- | :--- | :--- |
| **Componentes UI** | shadcn/ui (Radix UI) | Utilize os componentes pré-construídos do shadcn/ui. Se for necessária uma modificação estrutural, crie um novo componente em `src/components/` em vez de editar os arquivos em `src/components/ui/`. |
| **Estilização** | Tailwind CSS | Toda a estilização deve ser feita usando classes utilitárias do Tailwind. Garanta que todos os componentes sejam responsivos. |
| **Roteamento** | React Router DOM | Defina as rotas principais da aplicação exclusivamente em `src/App.tsx`. |
| **Integração de Mapas** | Leaflet / React Leaflet | Use estas bibliotecas para toda a lógica de renderização e interação do mapa. |
| **Formulários e Validação** | React Hook Form / Zod | Use React Hook Form para gerenciar o estado do formulário e Zod para definir esquemas de validação. |
| **Notificações** | Sonner | Use a biblioteca `sonner` para exibir toasts/notificações. |
| **Ícones** | Lucide React | Use ícones importados de `lucide-react`. |

## 3. Estrutura de Código

*   **Organização de Arquivos:**
    *   Páginas devem residir em `src/pages/`.
    *   Componentes reutilizáveis devem residir em `src/components/`.
    *   Lógica de serviços/APIs externas deve residir em `src/services/`.
*   **Criação de Componentes:** Crie um novo arquivo para cada novo componente ou hook, mantendo os arquivos pequenos e focados.