AXIS MARKETING E COMERCIAL
Funil GOOGLE
Funil Meta
Funil Parcerias

Comercial:
MQL-> Qualificação -> SQL -> SPIN -> Apresentação -> Call/Proposta ->
Ferramenta: Central comercial

AXIS OPERAÇÃO


RECRUTAMENTO
ADS -> verba baixa -> formulário -> banco de dados -> Aparece no CENTRAL/WEB -> Mapa operacional -> dados operacionais -> acionar


O ERP deve ter 3 paginas, abas; Do Profissional, da Familia, Painel Central Administrativo. 


O objetivo é automatizar as tarefas de "BackOffice", centralizar informações e processos para ter mais eficiência, menos custo e mais produtividade. 

Central: WEB 
-Adicionar paciente; colocamos informações, necessidades em categorias (que gera um Plano de Cuidado)
- Adicionar profissional e login dele (depois vamos querer importar direto do forms [fluxo será; Ads -> formulário -> banco de dados -> central])
- Adicionar familiares
- Adicionar plantão (avulso e recorrente) e atribuir a pacientes/familiares e profissionais; Para controlar valores a receber, valores a pagar. 
-Painel financeiro; Dashboard
-Dashboard operacional; Com KPI como no-show, atrasos, furos de escala, % de furos etc.
-Gestão de escala, o profissional que faz checkin aparerece aqui, conseguimos ver todos os pacientes e profissionais alocados e se quem foi ou não foi, e e ele mostra os profissionais da região, e tem um botão 'botão SOS' para acionar, ele envia uma mensagem para o profissional no whatsapp. - Quero que tenha uma ABA com um MAPA onde tenha os PACIENTE COM PONTOS AZUIS e tenha PONTOS VERDES que os PROFISSIONAIS com o RAIO de local de atendimento. E as informações do lado, junto com o botão sos, para enviar uma mensagem pronta de 'Convite para Plantão, com as informações do plantão', no whatsapp.  
**Auditoria de EVV (Electronic Visit Verification):** Monitoramento em tempo real dos plantões ativos, confirmando se o profissional realizou o check-in no local correto e no horário estipulado.
* **Supervisão do Controle de Insumos:** Visão consolidada do consumo por paciente, identificando desvios ou necessidades de compra urgente.


Aba do Profissional MOBILE
-Rotina, com checklist de cuidados (baseado no Plano de cuidado do paciente gerado)
-Checkin/checkout com geolocalização, aparece na central o horário,data,localização. - Só permitir dentro de um raio aceitável de proximidade, caso não consiga fazer pode enviar localização via whatsapp. 
-Diário de bordo e evoluções.
-Protocolos de emergência e POPs
-Relatórios.
-Perfil do cuidador

Aba Familia MOBILE
-Consegue ver os relatórios e diários de bordo.
-Consegue avaliar o cuidador e dar NPS (e avaliação no google)
-Consegue ver a visão de medicamentos, insumos
-Calendário de consultas, exames e vacinas. 
-Conexão com plano de saúde (?)
-Marketplace (?)
-Criar tambem grupo de whatsapp para comunicação direta. 

*registro de presença/plantão (EVV
*Modo Offline Resiliente:** Fila de sincronização local via `AsyncStorage` com reconexão automática, permitindo registrar evoluções e uso de insumos mesmo em locais sem sinal de internet, sem duplicação de dados.

1. **Modelagem de Dados e Segurança no Supabase:**
* Estruturação de 17 tabelas relacionais em PostgreSQL cobrindo usuários, vínculos, escalas, plantões, check-ins/check-outs, evoluções clínicas, checagem de itens, exames/consultas e gestão de estoque.
* Implementação de regras estritas de Row Level Security (RLS) para isolar acessos entre perfis (**Administrador**, **Profissional/Cuidador** e **Familiar/Paciente**).
* Criação de Stored Procedures e RPCs seguras (ex: `registrar_consumo_insumo`) para garantir atomicidade, prevenção de concorrência e integridade de saldo em operações críticas de estoque.


 **Polimento, Qualidade e Homologação:**
* Tratamento de estados de tela (skeleton loaders para carregamento, empty states ilustrados e error boundaries com ação de recuperação).
* Correção de rotas, redirecionamento por papéis (Role-Based Access) no middleware e remoção de código órfão/templates padrão do Expo e Next.js.
* Suíte de testes automatizados e testes de fumaça manuais aprovados (29/29 validações no backend/RLS, `tsc --noEmit` zerado e `lint` zerado em Web e Mobile).



---

## O Projeto Home Care OS: Visão Geral e Especificidades

O **Home Care OS** foi idealizado para resolver os principais gargalos da assistência à saúde domiciliar: falta de rastreabilidade de plantões, falha na comunicação entre cuidadores e familiares, desperdício/extravio de insumos e complexidade no controle de escalas.

### Arquitetura Tecnológica

* **Backend & Banco de Dados:** Supabase (PostgreSQL, Auth, Storage, Edge Functions e RLS).
* **Frontend Web:** Next.js (TypeScript, Tailwind CSS, Server & Client Components).
* **Aplicativo Mobile:** React Native com Expo (Expo Router, TypeScript).
* **Camida de Estado & Offline:** React Query / Context API + `AsyncStorage` para enfileiramento offline.

---

### Módulos e Funcionalidades por Perfil de Usuário

```
                             ┌────────────────────────┐
                             │      Home Care OS      │
                             └───────────┬────────────┘
                                         │
        ┌────────────────────────────────┼────────────────────────────────┐
        ▼                                ▼                                ▼
┌──────────────┐                 ┌──────────────┐                 ┌──────────────┐
│   ADMIN/GE   │                 │ PROFISSIONAL │                 │   FAMILIAR   │
└───────┬──────┘                 └───────┬──────┘                 └───────┬──────┘
        │                                │                                │
        ├─ Gestão de Pacientes           ├─ Check-in/Out (EVV)            ├─ Agenda & Calendário
        ├─ Escalas & Plantões            ├─ Evolução Clínica              ├─ Visão Geral do Turno
        ├─ Gestão de Vínculos            ├─ Check-item (Remédios)         ├─ Gestão de Insumos
        └─ Relatórios & Auditoria        ├─ Registro de Consumo           └─ Compras / Reposições
                                         └─ Fila Offline (AsyncStorage)

```

#### 1. Painel Administrativo / Gestão (`/admin`)
#### 2. App do Profissional / Cuidador (`/profissional`)


---

### Fluxos Integrados do Sistema

1. **Fluxo de Atendimento e EVV:**

$$\text{Administrador cria Escala} \longrightarrow \text{Profissional visualiza no App} \longrightarrow \text{Check-in ao chegar}$$


$$\longrightarrow \text{Execução da Rotina \& Evolução} \longrightarrow \text{Check-out ao finalizar}$$


2. **Fluxo de Insumos e Estoque:**

$$\text{Familiar cadastra Insumo (Quantidade Inicial/Mínima)}$$


$$\Downarrow$$


$$\text{Profissional registra Consumo via RPC } (\text{Estoque atual} - \text{Quantidade usada})$$


$$\Downarrow$$


$$\text{Nível cai para Amarelo/Vermelho} \longrightarrow \text{Alerta exibido no Portal do Familiar}$$


$$\Downarrow$$


$$\text{Familiar compra o item} \longrightarrow \text{Clica em "Registrar reposição" (Incrementa Saldo)}$$


3. **Fluxo de Sincronização Offline:**

$$\text{Sem conexão no celular} \longrightarrow \text{Ação salva no Storage Local} \longrightarrow \text{Detector de Conexão ativo}$$


$$\Downarrow$$


$$\text{Conexão Reestabelecida} \longrightarrow \text{Envio da Fila em Lote} \longrightarrow \text{Confirmação no Supabase}$$



---

### Segurança e Regras de Negócio (RLS)

* **Privacidade dos Dados Clínicos:** Um familiar só enxerga os dados, agendas e insumos dos pacientes com os quais possui vínculo confirmado na tabela `vinculos_familiares`.
* **Escopo de Atuação do Profissional:** O profissional de saúde só tem permissão de leitura e registro de dados para os pacientes cujas escalas estejam atribuídas a ele.
* **Proteção contra Sobregravação:** O UPDATE direto na tabela de estoque é bloqueado para profissionais; toda baixa obrigatoriamente passa pela função armazenada `registrar_consumo_insumo`, impedindo saldos negativos fictícios e mantendo o histórico de auditoria (`historico_consumo_insumos`) inviolável.

---
Compliance
