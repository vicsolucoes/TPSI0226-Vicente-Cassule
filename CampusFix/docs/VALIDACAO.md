# Resultado da validação

Validação de **04/11/2026** sobre as fontes do commit `8700da2` (branch `campusfix/mendix`). Há duas execuções independentes, com papéis diferentes.

## 1. GitHub Actions — Mendix 11.6.0 (versão oficial do projecto)

[execução 41867763370](https://github.com/vicsolucoes/TPSI0226-Vicente-Cassule/actions/runs/41867763370) na branch de desenvolvimento e [execução 41869073172](https://github.com/vicsolucoes/TPSI0226-Vicente-Cassule/actions/runs/41869073172) na integração em `main`, ambas concluídas com sucesso em Ubuntu 22.04, mxcli v0.28.0 (SHA256 verificado), MxBuild e runtime 11.6.0, Java 21, HSQLDB descartável.

| Verificação | Resultado | Evidência |
| --- | --- | --- |
| Mendix 11.6.0 / MxBuild | 0 erros | [mendix-check.log](../reports/mendix-check.log) |
| Regras no runtime Mendix | 16 testes, 45 verificações, 0 falhas | [testes.xml](../reports/testes.xml), [testes.log](../reports/testes.log) |
| Navegador Chromium, quatro sessões independentes | 21 verificações aprovadas | [testes-interface.json](evidencias/testes-interface.json) |
| Análise estática | 0 erros, 0 avisos, 5 notas informativas | [lint.txt](../reports/lint.txt) |
| Demonstração visual | 5 capturas reais (as actuais vêm da execução em `main`) | [Galeria](evidencias/README.md) |

Na CI as contas `cf_*` são contas demo efémeras com palavras-passe aleatórias, criadas apenas numa cópia descartável.

## 2. Execução local no computador do aluno — Windows 11

| Item | Valor |
| --- | --- |
| Sistema | Windows 11 Home 10.0.26300 |
| Ferramentas | mxcli v0.28.0 (SHA256 verificado), Java Temurin 21.0.13, Playwright 1.56.1 / Chromium |
| Mendix usado | **11.12.5** (único Studio Pro instalado), numa cópia privada descartável convertida com `mx convert` |
| Base de dados | HSQLDB local da cópia |
| Endereço | `http://127.0.0.1:8080` |

Procedimento: cópia privada fora do repositório; palavra-passe privada do `MxAdmin` definida com a função `strip_credentials` de `scripts/sanitize-model.py`; arranque com `mxcli run --local --db-type hsqldb`; criação do `MxAdmin` pela API M2EE `create_admin_user` (o passo que o Studio Pro faz ao executar). O teste `scripts/ui-test.cjs` correu com `CAMPUSFIX_CREATE_ACCOUNTS=1`: o administrador criou as contas `cf_aluno_a`, `cf_aluno_b` e `cf_tecnico` na página **Utilizadores e perfis**, sem contas demo.

Resultado: **22 verificações aprovadas**, incluindo a criação de contas e perfis pelo administrador. O login de cada perfil e a interface foram observados num navegador real. Nenhuma credencial foi registada no repositório.

Falhas reais encontradas e corrigidas nesta validação:

1. O detalhe do pedido não mostrava a categoria, exigida pelo enunciado (secção 7). Corrigido em `Pedido_Detalhe`. A área do técnico também passou a mostrar a categoria.
2. O botão **Cancelar** do formulário de categoria não fechava a página. Corrigido para `cancel changes close page`.
3. Num checkout Windows com CRLF, o mxcli duplicava regras de acesso com XPath multilinha. O repositório passou a fixar LF nos `.mdl` (`.gitattributes`). O modelo publicado não contém essas regras duplicadas: só mudaram as três páginas.

## Cenários mínimos verificados

| Cenário | CI 11.6.0 | Local |
| --- | --- | --- |
| A cria um pedido e consulta-o novamente | PASS | PASS |
| B não vê nem obtém o pedido de A (interface e consulta repetida) | PASS | PASS |
| Painel de B não conta pedidos de A | PASS | PASS |
| Utilizador comum sem menu nem acesso direto a categorias/administração | PASS | PASS |
| Administrador cria, edita e desativa categoria (valor persistido reaberto) | PASS | PASS |
| Categoria inativa não aparece num novo pedido | PASS | PASS |
| Técnico assume e fica identificado como responsável | PASS | PASS |
| Técnico inicia tratamento e conclui com nota | PASS | PASS |
| Conclusão regista data | PASS | PASS |
| Pedido resolvido sem Editar, Comentar nem Cancelar | PASS | PASS |
| Comentários com o pedido e autor corretos | PASS | PASS |
| Pesquisa por título e filtro por estado | PASS | PASS |
| Navegação dos três perfis sem diálogos de erro | PASS | PASS |
| Administrador cria contas e atribui perfis | — | PASS |

A ligação persistida dos comentários ao autor (`Comentario_Autor`) e ao pedido é verificada pelo teste de regras *RF06 comentário guarda pedido autor e data certos*. Na interface, os dados persistidos são relidos noutra sessão: o autor abre o pedido depois de o técnico o resolver.

## Limitações desta validação

- A execução local **não usou o Studio Pro 11.6.0**: o instalador oficial assinado está em `Downloads\Mendix-11.6.0-Setup.exe`, mas a instalação precisa de aprovação de administrador do Windows, que não foi dada nesta sessão. A versão 11.6.0 foi validada na CI; localmente foi usada a 11.12.5 numa cópia convertida, nunca no projecto entregue.
- Na execução local em 11.12.5, a coluna *Roles* da grelha do módulo Administration mostra o aviso *Unable to get filter store*. Pertence ao módulo Administration do Marketplace, não ao CampusFix, e não impediu a criação de contas. Não foi verificado em 11.6.0.
- As notas informativas do analisador referem os filtros XPath intencionais das listas e uma limitação da representação textual de um microflow. Não são erros.
- As limitações funcionais estão em [MODELO_E_SEGURANCA.md](MODELO_E_SEGURANCA.md).

O projecto versionado não tem palavra-passe administrativa nem definições de contas demo (`scripts/sanitize-model.py` confirma). Sem configurar o administrador no Studio Pro, o erro CE0129 é esperado.
