# IGA Gestão Cotação

PROMPT — APP DE COTAÇÃO RÁPIDA MOBILE

Crie um aplicativo web responsivo, com funcionamento prioritariamente em smartphones, destinado à realização de cotações rápidas de produtos e fornecedores em campo.

O objetivo principal do sistema é permitir que o usuário, durante uma visita, ligação, conversa por WhatsApp, pesquisa presencial ou consulta comercial, consiga registrar rapidamente:

o fornecedor;

os produtos pesquisados;

os preços encontrados;

condições comerciais;

interesse de compra;

observações importantes;

e posteriormente realizar comparações e análises simples das cotações realizadas.

O sistema deverá ser simples, rápido, intuitivo e mobile-first.

Não transformar este projeto em um ERP ou sistema completo de compras.

A prioridade absoluta é:

ABRIR → COTAR → REGISTRAR → COMPARAR → DECIDIR.

1. PRINCÍPIO DO SISTEMA

O aplicativo deverá funcionar como um caderno digital inteligente de cotações.

O usuário deverá conseguir registrar uma cotação mesmo estando:

dentro de uma loja;

em visita a um fornecedor;

falando ao telefone;

consultando preços pelo WhatsApp;

pesquisando preços na internet;

visitando uma feira;

realizando pesquisa presencial de mercado.

Evitar formulários extensos, excesso de campos obrigatórios, telas complexas ou etapas burocráticas.

2. EXPERIÊNCIA MOBILE-FIRST

Toda a experiência deverá ser projetada inicialmente para celular e depois adaptada para desktop/tablet.

Priorizar:

botões grandes;

campos de fácil toque;

textos legíveis;

poucos campos por tela;

carregamento rápido;

baixo número de cliques;

navegação simples;

ações principais fixas ou facilmente acessíveis;

teclado adequado ao tipo de informação;

preenchimento automático sempre que possível;

reaproveitamento de fornecedores e produtos já cadastrados.

A tela principal deverá possuir um botão destacado:

+ NOVA COTAÇÃO

Esse deverá ser o caminho mais rápido do sistema.

3. FLUXO IDEAL DE UMA NOVA COTAÇÃO

Ao clicar em:

+ Nova Cotação

o usuário deverá seguir um fluxo simples:

Etapa 1 — Fornecedor

Selecionar fornecedor já existente ou cadastrar rapidamente um novo fornecedor.

Etapa 2 — Produtos

Inserir um ou vários produtos pesquisados.

Etapa 3 — Condições

Registrar preço e demais condições comerciais.

Etapa 4 — Interesse

Classificar o interesse de compra.

Etapa 5 — Salvar

Salvar imediatamente a cotação.

Evitar obrigar o usuário a navegar por várias páginas.

Preferencialmente usar uma tela contínua ou formulário em etapas muito curtas.

4. CADASTRO DE FORNECEDORES

Criar cadastro simples de fornecedores.

Campos:

Obrigatórios

Nome do fornecedor

Contato do fornecedor

Segmento do fornecedor

Bairro

UF

Opcionais

Endereço

Cidade

Nome do vendedor/representante

Telefone

WhatsApp

E-mail

Site

Observações

O campo Contato do fornecedor poderá aceitar telefone, celular ou WhatsApp.

5. SEGMENTO DO FORNECEDOR

Permitir selecionar um segmento de uma lista e também criar novos segmentos.

Exemplos:

Alimentos

Bebidas

Informática

Iluminação

Material elétrico

Material de construção

Embalagens

Limpeza

Equipamentos

Ferramentas

Escritório

Distribuidor

Atacadista

Indústria

Outros

A estrutura deverá permitir inclusão de novos segmentos futuramente sem alteração do sistema.

6. CADASTRO DE PRODUTOS

Os produtos pesquisados deverão possuir:

Campos principais

Código — opcional

Descrição do produto — obrigatório

Valor cotado — obrigatório

Quantidade pesquisada/cotada

Unidade de medida

Exemplos de unidade:

UN

CX

KG

LT

PCT

FD

MT

KIT

Campos complementares

Marca — opcional

Modelo — opcional

Prazo de garantia — opcional

Prazo/Forma de pagamento

Quantidade mínima de compra — opcional

Prazo de entrega — opcional

Frete — opcional

Observações

7. CADASTRO RÁPIDO DE PRODUTO

Durante a cotação, não obrigar o usuário a acessar previamente um cadastro formal de produtos.

Permitir simplesmente digitar:

Descrição → Valor → Quantidade

e continuar.

Caso o produto já tenha sido usado anteriormente, apresentar sugestões automaticamente.

Exemplo:

Usuário começa a digitar:

"Lâmpada LED..."

O sistema poderá sugerir:

Lâmpada LED 9W

Lâmpada LED 12W

Lâmpada LED 15W

Isso deverá reduzir retrabalho.

8. COTAÇÃO COM VÁRIOS PRODUTOS

Uma mesma cotação deverá permitir registrar diversos produtos do mesmo fornecedor.

Exemplo:

Fornecedor: ABC Distribuidora

Produtos:

Lâmpada LED 9W — R$ 7,90

Lâmpada LED 12W — R$ 10,50

Refletor LED 50W — R$ 42,00

Fita LED — R$ 18,90

Adicionar botão destacado:

+ Adicionar Produto

9. DUPLICAR PRODUTO PARA OUTRO FORNECEDOR

Para facilitar comparação, disponibilizar posteriormente função:

Cotar este produto em outro fornecedor

Ao utilizar essa função, o sistema deverá reaproveitar automaticamente:

descrição;

código;

marca;

unidade;

quantidade;

permitindo alterar apenas:

fornecedor;

preço;

condições comerciais.

Esse recurso deverá reduzir significativamente o tempo de pesquisa.

10. INTERESSE DE COMPRA

Para cada produto cotado, incluir uma classificação simples:

Interesse de Compra

Opções sugeridas:

Muito alto

Alto

Médio

Baixo

Sem interesse

Outra possibilidade visual:

★★★★★ Muito alto
★★★★ Alto
★★★ Médio
★★ Baixo
★ Sem interesse

A classificação deverá ser muito fácil de selecionar pelo celular.

11. STATUS DA COTAÇÃO

Cada cotação deverá possuir um status simples:

Em pesquisa

Cotação concluída

Em análise

Compra provável

Compra realizada

Não comprar

Arquivada

O usuário poderá alterar o status posteriormente.

12. TELA DE COTAÇÕES

Criar uma tela denominada:

Cotações

Exibir cards ou lista contendo:

Data

Fornecedor

Segmento

Quantidade de produtos

Valor total estimado

Status

Interesse predominante

Permitir pesquisa por:

fornecedor;

produto;

segmento;

período;

status.

13. COMPARADOR DE PREÇOS

Criar tela:

Comparar Preços

Ao selecionar um produto, mostrar todos os fornecedores que já cotaram aquele item.

Exemplo:

Lâmpada LED 9W

FornecedorPreçoPagamentoCompra mínimaDataFornecedor AR$ 7,5028 dias100 un.20/08Fornecedor BR$ 7,90PIX20 un.20/08Fornecedor CR$ 8,4030 dias10 un.19/08

Destacar visualmente:

MENOR PREÇO

e

MAIOR PREÇO

14. NÃO CONSIDERAR APENAS PREÇO

Embora o preço seja o principal indicador nesta primeira versão, estruturar os dados para permitir comparação considerando posteriormente:

preço;

quantidade mínima;

prazo de pagamento;

prazo de entrega;

frete;

garantia.

Não implementar cálculos excessivamente complexos nesta versão.

Entretanto, mostrar as condições junto ao preço para evitar decisões equivocadas.

Exemplo:

Fornecedor A:

R$ 9,00
Compra mínima: 500 unidades

Fornecedor B:

R$ 9,50
Compra mínima: 20 unidades

Dessa forma, o usuário consegue perceber que o menor preço nem sempre representa a melhor condição comercial.

15. DASHBOARD SIMPLES

Criar uma tela inicial enxuta.

Indicadores principais:

Cotações realizadas

Quantidade no período.

Fornecedores pesquisados

Quantidade de fornecedores diferentes.

Produtos pesquisados

Quantidade de produtos diferentes.

Menores preços encontrados

Quantidade de oportunidades identificadas.

Produtos com maior interesse

Produtos mais classificados como Alto ou Muito Alto.

16. ANÁLISE DE FORNECEDORES

Criar uma análise simples denominada:

Fornecedores

Mostrar:

fornecedores mais pesquisados;

fornecedores com maior quantidade de produtos cotados;

fornecedores que apresentaram mais vezes o menor preço;

fornecedores que apresentaram mais vezes o maior preço;

segmentos mais pesquisados;

última cotação realizada com cada fornecedor.

Exemplo:

Fornecedor ABC

18 produtos pesquisados
7 menores preços
3 maiores preços
Última cotação: 20/08/2026

17. ANÁLISE DE PRODUTOS

Criar tela:

Produtos Pesquisados

Mostrar:

produtos mais cotados;

produtos com maior interesse de compra;

produtos com menor interesse;

menor preço encontrado;

maior preço encontrado;

preço médio;

quantidade de fornecedores consultados.

Exemplo:

Refletor LED 100W

5 fornecedores consultados

Menor preço: R$ 58,00
Maior preço: R$ 76,00
Preço médio: R$ 64,90

Interesse:

Muito Alto

18. HISTÓRICO DE PREÇOS

Quando houver várias cotações do mesmo produto ao longo do tempo, manter histórico.

Mostrar:

data;

fornecedor;

preço.

Isso permitirá perceber aumento ou redução de preço.

Não substituir cotações antigas.

Cada nova pesquisa deverá gerar um novo registro histórico.

19. COTAÇÃO FAVORITA / OPORTUNIDADE

Permitir marcar determinado produto ou condição comercial como:

⭐ Oportunidade

Isso permitirá ao usuário registrar rapidamente uma condição considerada interessante para análise ou compra posterior.

Criar uma área:

Oportunidades

contendo os produtos marcados.

20. OBSERVAÇÃO RÁPIDA

Permitir registrar notas simples.

Exemplo:

"Vendedor informou que o preço pode cair para R$ 8,50 acima de 100 unidades."

ou:

"Fornecedor entrega gratuitamente na região."

Essas informações devem aparecer no detalhe da cotação.

21. RECURSO IMPORTANTE — COMPARTILHAR PELO WHATSAPP

Quando houver telefone/WhatsApp do fornecedor, disponibilizar botão:

WhatsApp

Ao clicar, abrir conversa com o fornecedor.

Não enviar mensagens automaticamente.

22. DATA AUTOMÁTICA

Toda cotação deverá registrar automaticamente:

data;

hora de criação;

última atualização.

Evitar obrigar o usuário a digitar essas informações.

23. LOCALIZAÇÃO

Endereço deverá permanecer opcional.

Campos sugeridos:

Endereço

Bairro

Cidade

UF

Nesta primeira versão não é necessário implementar mapas ou geolocalização.

Manter apenas a estrutura preparada para futura integração.

24. FILTROS

Permitir filtros rápidos por:

período;

fornecedor;

segmento;

produto;

bairro;

UF;

status;

interesse de compra.

Os filtros precisam funcionar bem no celular.

25. PESQUISA GLOBAL

Adicionar uma busca geral na parte superior.

O usuário poderá pesquisar:

nome do fornecedor;

produto;

código;

marca;

segmento.

26. ESTRUTURA DE NAVEGAÇÃO

Manter menu enxuto.

Sugestão:

Início

Nova Cotação

Cotações

Comparar

Produtos

Fornecedores

Oportunidades

Evitar submenu excessivo.

No celular, utilizar menu inferior ou navegação equivalente de fácil acesso.

O botão:

+ Cotação

deverá receber destaque visual.

27. TELA INICIAL MOBILE

Priorizar algo semelhante:

Cotação Rápida

[ + NOVA COTAÇÃO ]

Hoje:

12 produtos pesquisados
4 fornecedores
3 oportunidades encontradas

Abaixo:

Cotações recentes

Fornecedor ABC
5 produtos
Hoje — 10:42

Fornecedor XYZ
8 produtos
Hoje — 09:10

28. FUNCIONALIDADE "COTAR NOVAMENTE"

Dentro de uma cotação anterior, criar:

Cotar novamente

O sistema deverá copiar:

fornecedor;

produtos;

unidades;

quantidades;

criando uma nova cotação para preenchimento dos preços atuais.

Nunca substituir o histórico anterior.

29. EVITAR CADASTROS DUPLICADOS

Ao digitar fornecedor ou produto já existente, sugerir registros correspondentes.

Exemplo:

Digitado:

"ABC"

Sugestão:

"ABC Distribuidora — Tatuapé/SP"

Isso deverá minimizar duplicidades.

30. VALIDAÇÕES

Campos obrigatórios mínimos para salvar uma cotação:

Fornecedor:

nome;

contato;

segmento;

bairro;

UF.

Produto:

descrição;

valor.

Não exigir informações desnecessárias para concluir rapidamente a operação.

31. BANCO DE DADOS

Estruturar o banco de forma organizada e preparada para evolução futura.

Entidades principais:

usuários

fornecedores

segmentos

produtos

cotações

itens_cotacao

interesses

oportunidades

Preservar relacionamentos entre fornecedor, produto e histórico de cotação.

32. PREPARAÇÃO PARA EVOLUÇÃO

Embora seja um aplicativo emergencial e simples, construir de forma modular para permitir futuramente:

usuários e equipes;

empresas diferentes;

anexos;

fotos;

leitura de código de barras;

OCR de orçamento;

importação por Excel;

exportação;

pedidos de compra;

aprovação;

comparação avançada;

inteligência artificial;

localização de fornecedores;

integração com WhatsApp;

integração com o Sistema de Gestão de Compras principal.

Não implementar esses recursos agora, salvo quando forem tecnicamente simples e não aumentarem a complexidade da experiência.

33. NÃO IMPLEMENTAR NESTA PRIMEIRA VERSÃO

Evitar neste momento:

ERP completo;

controle financeiro;

contas a pagar;

emissão fiscal;

estoque;

recebimento de mercadoria;

workflows complexos;

múltiplos níveis de aprovação;

portal do fornecedor;

marketplace;

logística complexa;

automações excessivas.

Esses recursos pertencem ao Sistema de Gestão Inteligente de Compras principal.

Este projeto possui outra finalidade:

capturar informações de mercado rapidamente.

34. DESIGN

Utilizar interface profissional, moderna e limpa.

Características:

fundo claro;

cards;

boa hierarquia visual;

tipografia legível;

botões grandes;

indicadores simples;

ícones intuitivos;

excelente funcionamento em telas pequenas.

Evitar:

excesso de cores;

dashboards poluídos;

tabelas muito largas no celular;

fontes pequenas;

telas carregadas.

35. PRINCÍPIO DE UX

Sempre que houver escolha entre:

mais funcionalidades

e

mais velocidade na cotação

priorizar:

MAIS VELOCIDADE NA COTAÇÃO.

A inserção de uma cotação simples deverá poder ocorrer em poucos segundos.

36. CRITÉRIO DE SUCESSO

Considerar o aplicativo adequado quando um usuário conseguir, utilizando apenas o celular:

abrir o aplicativo;

selecionar ou cadastrar fornecedor;

inserir um produto;

informar preço;

adicionar outros produtos;

salvar;

posteriormente comparar aquele produto com outros fornecedores;

sem precisar de treinamento técnico.

37. ENTREGA DA PRIMEIRA VERSÃO

Antes de adicionar funcionalidades complementares, entregar inicialmente:

estrutura do banco de dados;

cadastro rápido de fornecedor;

cadastro/reaproveitamento de produtos;

nova cotação mobile;

múltiplos produtos por cotação;

histórico;

comparação de preços;

classificação de interesse;

oportunidades;

dashboard básico;

filtros;

interface totalmente responsiva.

Após essa versão funcionar corretamente, interromper novas expansões e apresentar:

o que foi implementado;

estrutura criada;

telas disponíveis;

regras adotadas;

limitações;

sugestões para uma eventual Fase 2.

Não transformar automaticamente o aplicativo em um sistema maior sem nova autorização.

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://iga-gestao-cotacao.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/5464b03f-4965-44a7-95c8-19d0831b38f0).

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
