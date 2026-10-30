# CampusFix

Aplicação Mendix de gestão de suporte e manutenção escolar, baseada no enunciado `Projeto_Final_Mendix_CampusFix.docx`.

Aluno: Vicente Cassule · Turma: TPSI-CAS-0226.

Versões fixadas: Mendix Studio Pro **11.6.0**, mxcli **v0.28.0**, Java **21**.

## Entrega

Projecto Mendix nativo com modelo de domínio, páginas, microflows, permissões de entidades, quatro indicadores e testes automatizados. Os relatórios de execução ficam em `reports/` e as capturas reais em [docs/evidencias](docs/evidencias). O histórico de [GitHub Actions](https://github.com/vicsolucoes/TPSI0226-Vicente-Cassule/actions/workflows/campusfix.yml) conserva a compilação e os testes de cada alteração.

## Objectivo e perfis

- Utilizador: cria, consulta e corrige os próprios pedidos abertos; comenta e cancela.
- Técnico: consulta pedidos disponíveis ou atribuídos a si; assume, trata, comenta e conclui com nota de resolução.
- Administrador: consulta todos os pedidos e gere categorias e contas através do módulo Administration.

As fontes `mdlsource/*.mdl` usam `mdl 1;` e descrevem documentos Mendix nativos. O `.mpr` e a pasta `mprcontents/` são o projecto a abrir no Studio Pro; os scripts são fontes reproduzíveis.

## Abrir

1. Clonar ou descarregar o repositório completo. Manter `CampusFix.mpr`, `mprcontents/`, `theme/`, `widgets/` e as restantes pastas juntos; o `.mpr` isolado não chega.
2. Instalar o Mendix Studio Pro **11.6.0** e abrir `CampusFix/CampusFix.mpr`.
3. **Antes de executar**, em **App > Security > Administrator**, definir uma palavra-passe pessoal para o administrador `MxAdmin`, com pelo menos 12 caracteres e respeitando a política indicada pelo Studio Pro. O modelo entregue não guarda palavras-passe nem definições de contas demo. Até configurar este valor, o Studio Pro apresenta o erro de configuração CE0129.
4. Selecionar **Run locally** e **View App**. Entrar com `MxAdmin` e a palavra-passe que acabaste de definir.
5. Em **Categorias**, criar pelo menos uma categoria ativa. Em **Utilizadores e perfis**, criar as contas da demonstração, atribuindo o perfil **Utilizador** a um requerente e **Tecnico** a um técnico. Definir as palavras-passe dessas contas na tua base local.
6. Terminar sessão e entrar como utilizador para criar o primeiro pedido; depois entrar como técnico para o assumir, tratar e concluir.

Não guardar a configuração local com a tua palavra-passe no Git. Antes de versionar o modelo, fechar o Studio Pro e executar `python3 scripts/sanitize-model.py CampusFix.mpr` dentro da pasta CampusFix; voltar a definir a palavra-passe pessoal quando fores executar novamente.

Não editar o mesmo projecto simultaneamente no Studio Pro e no mxcli. Para regenerar por linha de comandos, fechar o Studio Pro e executar `bash scripts/build-ci.sh /caminho/para/mxcli` dentro da pasta CampusFix.

## Regras

Estado inicial Novo e data/autor definidos no servidor. Assumir inicia Em análise; segue-se Em tratamento ou resolução. Resolvido e Cancelado são terminais. DataConclusao é preenchida apenas na resolução. Categoria inativa não pode ser usada numa criação; pedidos antigos preservam-na. Edições usam um rascunho não persistente e verificam a versão guardada. Dados de autoria, datas, estado e técnico não têm escrita pelo cliente.

## Documentação e demonstração

- [Requisitos, testes e comandos para repetir](docs/REQUISITOS_E_TESTES.md)
- [Modelo, matriz de permissões, estados e limitações](docs/MODELO_E_SEGURANCA.md)
- [Guião para a defesa do projecto](docs/DEFESA.md)
- [Painel inicial](docs/evidencias/01-dashboard.png), [pedidos do utilizador](docs/evidencias/02-meus-pedidos.png), [detalhe e comentário](docs/evidencias/03-detalhe-com-comentario.png), [área técnica](docs/evidencias/04-area-tecnico.png) e [categorias](docs/evidencias/05-categorias.png)

A CI prepara palavras-passe aleatórias apenas durante as verificações e elimina-as do modelo antes da exportação, incluindo em caso de falha. Os testes no navegador usam uma cópia descartável, sessões independentes e dados fictícios. Não é necessário configurar segredos no GitHub para repetir o workflow.

## Limitações

A versão impede guardar um formulário desatualizado. A atribuição concorrente entre várias instâncias não tem um bloqueio atómico distribuído. Esta versão não inclui reabertura, anexos, notificações por email nem alojamento de produção.

## Referências

- [Mendix — projecto e compilação](https://docs.mendix.com/refguide/mx-command-line-tool/)
- [mxcli — código e documentação](https://github.com/mendixlabs/mxcli/tree/v0.28.0)

Este projecto não configura uma publicação em produção. Nenhuma palavra-passe pessoal ou token deve ser acrescentado ao repositório.
