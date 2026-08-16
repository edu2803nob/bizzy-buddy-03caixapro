# Aura Business Suite

Crie um sistema SaaS de gestão empresarial multiempresa (multi-tenant), moderno e minimalista, inspirado em dashboards como ERP e CRM.

O sistema deve ter isolamento total de dados por empresa (empresa_id em todas as tabelas).

### PERFIS DE USUÁRIO:

- Administrador: acesso total

- Vendedor: acesso limitado

---

### MÓDULOS:

1. EMPRESAS (somente super admin)

- nome

- cnpj

- logo

- email

- telefone

---

2. USUÁRIOS

- nome

- email

- senha

- tipo (admin ou vendedor)

- empresa_id

---

3. CLIENTES

- nome

- telefone

- email

- cpf

- origem

- observação

---

4. COMERCIAL

PRODUTOS:

- nome

- preço

- custo

- categoria

- estoque

- foto

- ativo

CATEGORIAS:

- nome

---

5. VENDAS (PDV)

Criar uma tela estilo ponto de venda com:

- lista de produtos

- botão de adicionar produto

- controle de quantidade

- atualização de valor total em tempo real no topo

Regras:

- ao vender, diminuir estoque

- não permitir venda sem estoque (opcional)

- permitir remover item antes de finalizar

---

6. FECHAMENTO DE CAIXA

- acumular vendas do dia

- botão "Fechar Caixa"

- ao fechar:

  - salvar total no financeiro

  - registrar data

  - zerar contador diário

---

7. FINANCEIRO

ENTRADAS:

- vendas automáticas

- receitas manuais

SAÍDAS:

- despesas:

  - nome

  - valor

  - categoria

  - data

---

8. DASHBOARD FINANCEIRO

Exibir:

- receita do dia, mês e ano

- despesas

- lucro

- gráficos:

  - linha (receita ao longo do tempo)

  - barras (receitas x despesas)

  - pizza (categorias)

---

### UI/UX:

- layout com sidebar à esquerda

- dashboard com cards financeiros

- design moderno, minimalista

- cores:

  - verde (positivo)

  - vermelho (negativo)

  - cinza

---

### REGRAS IMPORTANTES:

- todas as tabelas devem ter empresa_id

- usuários só acessam dados da própria empresa

- sistema deve ser responsivo

- foco em performance e simplicidade

---

### FUTURO:

- integração com landing pages

- integração com pagamento

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/d65a8fbb-83db-45b7-ad0d-6d3b9a390503).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
