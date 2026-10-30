# Resultado da validação

Execução verificada em **30/10/2026**, no workflow [CampusFix Mendix, execução 13](https://github.com/vicsolucoes/TPSI0226-Vicente-Cassule/actions/runs/41108379982), concluído com sucesso.

| Verificação | Resultado | Evidência |
| --- | --- | --- |
| Mendix 11.6.0 / MxBuild | 0 erros | [mendix-check.log](../reports/mendix-check.log) |
| Regras no runtime Mendix, base HSQLDB descartável | 16 testes, 45 verificações, 0 falhas | [testes.xml](../reports/testes.xml), [testes.log](../reports/testes.log) |
| Navegador Chromium, quatro sessões independentes | 11 verificações aprovadas | [testes-interface.json](evidencias/testes-interface.json) |
| Análise estática final | 0 erros, 0 avisos, 5 notas informativas | [lint.txt](../reports/lint.txt) |
| Demonstração visual | 5 capturas reais | [Galeria](evidencias/README.md) |

O percurso no navegador criou uma categoria, registou e comentou um pedido, confirmou que outro utilizador não o vê nem o conta no painel, repetiu uma consulta administrativa com a sessão desse utilizador e confirmou o isolamento por Entity Access. O técnico assumiu, iniciou tratamento e concluiu o pedido com nota; o autor consultou a resolução e já não podia editar nem comentar.

A verificação nativa e os testes foram executados com configuração administrativa efémera. O projecto versionado é exportado **sem palavra-passe administrativa nem definições de contas demo**. É necessário definir a própria palavra-passe no Studio Pro antes de executar; sem essa configuração, o erro CE0129 é esperado. O acesso anónimo e os utilizadores demo permanecem desativados no modelo entregue. O módulo de fixtures e o endpoint temporário dos testes não fazem parte do modelo exportado.

Foram conferidos os hashes dos 424 ficheiros `.mxunit` com o índice SQLite do `.mpr`: sem divergências. O modelo e as páginas usados nos testes são documentos Mendix nativos.

As notas do analisador incluem quatro referências aos filtros XPath intencionais nas listas e uma limitação da representação textual `DESCRIBE` de um grafo de validação. Não indicam erros de compilação. As limitações funcionais e de concorrência estão em [MODELO_E_SEGURANCA.md](MODELO_E_SEGURANCA.md).
