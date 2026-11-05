# Âncora

Aplicativo mobile de **finanças pessoais** em português (pt-BR). Simples e manual: você registra o que ganha e o que gasta, acompanha contas a pagar e define limites de gasto. **Nada se conecta a banco ou cartão** — todos os valores são digitados por você.

## Funcionalidades

- **Autenticação** — login, cadastro, verificação por código (OTP) e definição de senha.
- **Onboarding** — introdução guiada no primeiro acesso.
- **Home** — resumo do saldo, gauge, gráfico de gastos e transações recentes.
- **Transações** — registro de receitas e despesas com categoria, data, tags e recorrência mensal.
- **Contas a pagar** — valor fixo ou variável (luz, água…), recorrência mensal e lembretes por notificação.
- **Metas** — orçamento mensal total e limite por categoria, com status por cor.
- **Relatórios** — análise por período, gráficos e exportação em **PDF** e **XLSX**.
- **Perfil** e tela de limite.

## Stack

| Camada | Tecnologia |
|---|---|
| App | Expo SDK 58, React Native 0.88, React 19, TypeScript |
| Navegação | Expo Router (rotas em `src/app/`) |
| Dados / estado | TanStack Query, Zustand |
| Backend | Supabase (Postgres, Auth, RLS) |
| Gráficos | react-native-svg |
| Exportação | expo-print, fflate (XLSX), expo-sharing |
| Outros | expo-notifications, expo-local-authentication, expo-secure-store |

## Como rodar

Pré-requisitos: Node.js, e Docker para o Supabase local.

```bash
npm install
cp .env.example .env.local     # ajuste a URL e a chave do Supabase
npx supabase start             # sobe o Supabase local (veja a chave com `npx supabase status`)
npx expo start
```

Em `EXPO_PUBLIC_SUPABASE_URL`, use:

- **Celular físico:** o IP da sua máquina na rede Wi-Fi (ex.: `http://192.168.0.10:54321`)
- **Emulador Android:** `http://10.0.2.2:54321`
- **Web:** `http://127.0.0.1:54321`

Alguns recursos nativos (notificações, biometria) exigem um development build em vez do Expo Go:

```bash
npx expo run:android   # ou run:ios
```

## Scripts

```bash
npm start              # servidor de desenvolvimento
npm run android        # abre no Android
npm run ios            # abre no iOS
npm run web            # abre na web
npm run lint           # lint
npx tsc --noEmit       # checagem de tipos
```

## Estrutura

```
src/
  app/            Rotas (telas)
  components/     Componentes de UI reutilizáveis
  features/       Lógica por domínio: auth, bills, goals, home, onboarding, reports, transactions
  i18n/pt-BR.ts   Textos
  lib/supabase.ts Cliente Supabase
  theme/          Cores, fontes, raios
supabase/
  migrations/     Schema do banco
  templates/      E-mail com código de verificação
docs/             Política de privacidade
```

## Banco de dados

Migrations em [supabase/migrations/](supabase/migrations/): perfis, contas, categorias, transações, orçamentos, limites por categoria e contas a pagar. Todas as tabelas usam RLS, então cada usuário só acessa os próprios dados. No cadastro, um trigger cria o perfil, a carteira e as categorias padrão.

## Documentação

Detalhes de contexto, decisões e pendências estão em [PROJETO.md](PROJETO.md).

## Licença

[MIT](LICENSE)
