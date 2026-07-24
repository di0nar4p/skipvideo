/**
 * ============================================================================
 * src/shared/api.js — Shim de compatibilidade entre navegadores
 * ----------------------------------------------------------------------------
 * @author Glauco Santos
 * ----------------------------------------------------------------------------
 * (O QUE) Expoe um objeto `SkipVideoApi` apontando para a API de extensoes do
 *   navegador atual (Firefox usa `browser`, Chrome usa `chrome`).
 *
 * (POR QUE) O mesmo codigo precisa rodar nos dois navegadores sem duplicacao.
 *   Firefox implementa a API baseada em Promises no namespace `browser`;
 *   Chrome usa `chrome` (com callbacks, mas `storage`/`action` tambem aceitam
 *   Promises em MV3). Escolher o namespace uma unica vez evita `if (chrome...)`
 *   espalhado pelo projeto.
 *
 * (COMO) `globalThis.browser ?? globalThis.chrome` pega o que existir. Como este
 *   arquivo e o PRIMEIRO na lista de content scripts do manifest, o global fica
 *   disponivel para todos os scripts seguintes (mesmo escopo compartilhado).
 * ============================================================================
 */
const SkipVideoApi = globalThis.browser ?? globalThis.chrome;

// (COMO) No navegador o objeto ja fica no escopo compartilhado. O bloco abaixo
//   so serve para eventuais testes Node que importem este arquivo.
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { SkipVideoApi };
}
