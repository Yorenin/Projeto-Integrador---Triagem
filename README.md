Sistema de Gestão de Fluxo e Acolhimento - UBSEste projeto foi desenvolvido como parte do Projeto Integrador (Grupo 25) - Faculdade Microlins, focado na "Redução das Filas de Atendimento no SUS".O sistema soluciona as dores identificadas na pesquisa de campo, especificamente a falta de informação e o gargalo na triagem (Conforme relatado na Seção 3.2 e 6.1 do documento oficial do projeto), fornecendo uma solução tecnológica distribuída em três terminais:

Totem de Autoatendimento: Para pacientes retirarem senhas.

Painel de Chamada: Monitor para a sala de espera.

Painel do Profissional (Recepção/Triagem): Gestão de fluxo para a equipe técnica.

Tecnologias UtilizadasReact.js (Vite)Tailwind CSS (Estilização visual responsiva)Lucide React (Ícones padronizados)LocalStorage Sync (Sincronização de dados em tempo real entre abas)

Passo a Passo para Instalação e Execução

Para rodar este projeto na sua máquina local, certifique-se de ter o Node.js instalado. Siga as instruções abaixo no terminal:

1. Clonar ou Criar o Projeto
2. Se você estiver criando o projeto do zero usando o código fornecido: npm create vite@latest ubs-sistema -- --template react
cd ubs-sistema
3. Instalar Dependências Básicas npm install
4. Instalar Bibliotecas de Visual e Ícones Instale a biblioteca de ícones (lucide-react) e o framework de CSS (tailwindcss): npm install lucide-react
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p
5. Configurar o Tailwind CSS Abra o arquivo tailwind.config.js na raiz do projeto e substitua o conteúdo por:/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}
No arquivo src/index.css, substitua tudo por estas 3 linhas:@tailwind base;
@tailwind components;
@tailwind utilities;
6. Substituir o Código PrincipalCole todo o código gerado no arquivo src/App.jsx.6. Executar o Sistemanpm run dev

Como Testar o Sistema em "Rede" (Simulação)O diferencial deste protótipo é que ele sincroniza as informações automaticamente sem precisar de um banco de dados complexo (Back-end) para fins de apresentação.Inicie o servidor (npm run dev) e abra o link gerado (geralmente http://localhost:5173). Abra este mesmo link em três abas diferentes do navegador. Em cada aba, escolha uma máquina diferente: Aba 1: Clique em "Totem de Senhas" Aba 2: Clique em "Painel de Espera" Aba 3: Clique em "Recepção / Triagem" Gere uma senha no Totem e observe que ela aparecerá instantaneamente como "aguardando" no Painel da Recepção.

Este código no GitHub é o nosso MVP (Produto Mínimo Viável). Na implantação física, o React seria empacotado para web, hospedado no servidor municipal e acessado por Mini-PCs acoplados a totens com impressoras térmicas e televisores com Raspberry Pi, rodando os navegadores em Modo Quiosque. A comunicação entre eles seria feita por uma API real conectada ao e-SUS.

📚 Fontes do Regras de Negócio: Atendimento e prioridades baseados nas diretrizes do SUS e FIOCRUZ.

Regras de negócio mapeadas pelo Grupo 25 da Faculdade Microlins (2026).
