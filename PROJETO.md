# Âncora — Resumo do Projeto

> Última atualização: 04/11/2026

## 1. Contexto

**Âncora** é um aplicativo mobile de **finanças pessoais** em português (pt-BR). A ideia é ser simples e manual: o usuário registra o que ganha e o que gasta, acompanha contas a pagar e define limites de gasto. **Nada se conecta a banco ou cartão** — todos os valores são digitados pelo próprio usuário.

O design vem do Figma (as telas citam os nós, ex.: Splash `25:4`, Orçamentos e Limites `43:416`).

## 2. Objetivo

Dar ao usuário uma visão clara da própria vida financeira:

- Saber **quanto entrou e saiu** (transações, saldo, gráfico de gastos).
- Não esquecer **contas a pagar** (luz, água, aluguel…), com lembretes por notificação.
- Controlar o gasto com **orçamento mensal** e **limite por categoria**.
- Entender para onde vai o dinheiro com **relatórios** e poder **exportar** (PDF e planilha).

## 3. Stack

| Camada | Tecnologia |
|---|---|
| App | Expo SDK 58, React Native 0.88, React 19, TypeScript |
| Navegação | Expo Router (rotas em `src/app/`) |
| Dados / estado | TanStack Query, Zustand |
| Backend | Supabase (Postgres + Auth + RLS), rodando local via `supabase/config.toml` |
| Gráficos | react-native-svg |
| Exportação | expo-print (PDF), planilha `.xlsx` gerada com fflate, expo-sharing |
| Outros | expo-notifications, expo-local-authentication, expo-secure-store, fontes Inter e Hanken Grotesk |

## 4. Estrutura do código

```
src/
  app/            Rotas (telas)
  components/     Componentes de UI reutilizáveis (Button, Card, DateField, Toggle…)
  features/       Lógica por domínio: auth, bills, goals, home, onboarding, reports, transactions
  i18n/pt-BR.ts   Textos
  lib/supabase.ts Cliente Supabase
  theme/          Cores, fontes, raios
supabase/
  migrations/     Schema do banco
  templates/otp.html  E-mail com código de verificação
```

## 5. Banco de dados (Supabase)

Migrations já criadas:

1. `init_finora` — `profiles`, `accounts`, `categories`, `transactions`, `budgets`, `category_limits`, RLS em todas as tabelas (cada usuário só vê o que é seu), saldo por conta e trigger `handle_new_user` (cria perfil, carteira e categorias padrão no cadastro).
2. `email_registered` — função que informa se um e-mail já tem conta, para barrar cadastro duplicado (devolve só um booleano).
3. `bills` — tabela de contas a pagar e função `pay_bill`, que registra a despesa, marca a conta como paga e cria a próxima se for mensal, tudo numa transação.
4. `flexible_bills` — contas de valor variável (luz, água…): o valor é só previsão e o real é informado ao pagar. A próxima conta usa a média das últimas 3 pagas.

## 6. Onde estamos

### Pronto

- **Splash e onboarding** (wizard), com decisão automática: sessão ativa → Home; senão → Login ou Onboarding.
- **Autenticação**: login, cadastro, verificação por código (OTP) e definição de senha.
- **Home**: resumo, gauge, gráfico de gastos e transações recentes.
- **Nova transação**: tela completa (receita/despesa).
- **Transações**: lista das transações dos últimos 12 meses.
- **Contas a pagar**: listar, criar, editar, pagar, com notificações e suporte a valor fixo/variável e recorrência mensal.
- **Orçamentos e Limites** (aba Metas): orçamento mensal total e teto por categoria, com status por cor.
- **Relatórios**: análise por período, gráficos e exportação em PDF e XLSX.
- **Perfil** e tela de **limite**.

### Pendências / pontos de atenção

- A aba **Transações** é uma lista simples, sem design no Figma (sem filtros, busca ou edição).
- O componente `ComingSoon` existe como placeholder, mas hoje nenhuma tela o usa.
- Não há testes automatizados no projeto.
- Falta validar os fluxos em build de desenvolvimento no celular físico e na web, em especial notificações, biometria e exportação de arquivos.
- Nada foi publicado: sem build EAS, sem projeto Supabase em nuvem (hoje só local).
- O repositório tem só o commit inicial e os arquivos do app ainda **não foram commitados**.

## 7. Como rodar

```bash
npm install
cp .env.example .env.local     # ajuste URL e chave do Supabase
npx supabase start             # Supabase local (ver chave com `npx supabase status`)
npx expo start
```

Para celular físico, use o IP da máquina na rede Wi-Fi em `EXPO_PUBLIC_SUPABASE_URL`. No emulador Android, use `http://10.0.2.2:54321`.

Antes de concluir qualquer tarefa: `npx expo lint` e `npx tsc --noEmit`.

## 8. Próximos passos sugeridos

1. Commitar o estado atual do app.
2. Rodar lint e typecheck e corrigir o que aparecer.
3. Testar o fluxo completo em dispositivo (cadastro → transação → conta a pagar → relatório).
4. Evoluir a aba Transações (filtros, busca, editar/excluir).
5. Criar projeto Supabase na nuvem e configurar builds com EAS.
