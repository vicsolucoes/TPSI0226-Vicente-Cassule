# CampusFix

Aplicação Mendix de gestão de suporte e manutenção escolar, baseada no enunciado `Projeto_Final_Mendix_CampusFix.docx`.

Aluno: Vicente Cassule · Turma: TPSI-CAS-0226.

Versões fixadas: Mendix Studio Pro **11.6.0**, mxcli **v0.28.0**, Java **21**.

## Estado de implementação

O projecto nativo `CampusFix.mpr` foi criado no GitHub Actions. O modelo de domínio e as regras estão a ser acrescentados e validados por etapas. A aplicação só deve ser considerada pronta depois de concluída a verificação de permissões, compilação, testes de regras e navegação dos três perfis. A evidência fica em `reports/` e no histórico de Actions.

## Objectivo e perfis

- Utilizador: cria, consulta e corrige os próprios pedidos abertos; comenta e cancela.
- Técnico: consulta pedidos disponíveis ou atribuídos a si; assume, trata, comenta e conclui com nota de resolução.
- Administrador: consulta todos os pedidos e gere categorias e contas através do módulo Administration.

As fontes `mdlsource/*.mdl` usam `mdl 1;` e descrevem documentos Mendix nativos. O `.mpr` e a pasta `mprcontents/` são o projecto a abrir no Studio Pro; os scripts são fontes reproduzíveis.

## Abrir

1. Descarregar a branch `campusfix/mendix` deste repositório.
2. Instalar/usar o Studio Pro 11.6.0.
3. Abrir `CampusFix/CampusFix.mpr` e executar localmente.
4. Definir a palavra-passe do administrador na configuração local do Mendix; não a colocar no Git.

Não editar o mesmo projecto simultaneamente no Studio Pro e no mxcli. Para regenerar por linha de comandos, fechar o Studio Pro e executar `bash scripts/build-ci.sh /caminho/para/mxcli` dentro da pasta CampusFix.

## Regras

Estado inicial Novo e data/autor definidos no servidor. Assumir inicia Em análise; segue-se Em tratamento ou resolução. Resolvido e Cancelado são terminais. DataConclusao é preenchida apenas na resolução. Categoria inativa não pode ser usada numa criação; pedidos antigos preservam-na. Edições usam um rascunho não persistente e verificam a versão guardada. Dados de autoria, datas, estado e técnico não têm escrita pelo cliente.

## Referências

- [Mendix — projecto e compilação](https://docs.mendix.com/refguide/mx-command-line-tool/)
- [mxcli — código e documentação](https://github.com/mendixlabs/mxcli/tree/v0.28.0)

Este projecto não configura uma publicação em produção. Nenhuma palavra-passe pessoal ou token deve ser acrescentado ao repositório.
