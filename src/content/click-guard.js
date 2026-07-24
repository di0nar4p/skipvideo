/**
 * ============================================================================
 * src/content/click-guard.js — "Auto-cura": impede martelar o mesmo elemento
 * ----------------------------------------------------------------------------
 * @author Glauco Santos
 * ----------------------------------------------------------------------------
 * (O QUE) createClickGuard() devolve um pequeno cofre com dois metodos:
 *   - allow(el): pode clicar neste elemento?
 *   - record(el): registra que acabamos de clicar nele.
 *
 * (POR QUE) Bug real no Apple TV+: a extensao clicava num controle de +-10s e,
 *   como ele NAO some (diferente de um botao de pular de verdade), era clicado
 *   repetidamente -> o video ficava retrocedendo em loop. A observacao-chave:
 *   um botao de pular LEGITIMO desaparece apos o clique; um falso-positivo
 *   PERSISTE. Entao "clicou N vezes e ainda esta aqui" = quase certamente NAO
 *   era um pular. O guard traduz isso numa regra simples e independente do
 *   rotulo/idioma/plataforma: apos `maxClicksPerElement` cliques no MESMO
 *   elemento, ele entra numa lista de bloqueio e nunca mais e clicado.
 *
 * (COMO) Contamos cliques por elemento num WeakMap e mantemos os bloqueados num
 *   WeakSet. Usar WeakMap/WeakSet e importante: as chaves sao os proprios nós do
 *   DOM; quando o player os remove, o garbage collector limpa os registros
 *   sozinho — sem vazamento de memoria numa aba aberta por horas. Como o guard
 *   vive enquanto a pagina esta carregada, um botao GENUINAMENTE novo mais tarde
 *   e outro elemento (outra referencia) e comeca liberado.
 * ============================================================================
 */

/**
 * (O QUE) Cria um guard independente.
 * @param {{maxClicksPerElement?: number}} options
 *   maxClicksPerElement: quantos cliques toleramos no mesmo elemento antes de
 *   bloquea-lo. Padrao 2 — um pular real some no 1o clique, entao 2 da uma
 *   folga minima (ex.: clique perdido por animacao) sem deixar o loop escalar.
 */
function createClickGuard(options) {
  const maxClicksPerElement =
    (options && options.maxClicksPerElement) || 2;

  const clickCounts = new WeakMap(); // elemento -> nº de cliques
  const blocked = new WeakSet(); // elementos definitivamente bloqueados

  return {
    /** (O QUE) True se ainda podemos clicar neste elemento. */
    allow(element) {
      return !blocked.has(element);
    },

    /** (O QUE) Contabiliza um clique; bloqueia ao atingir o limite. */
    record(element) {
      const next = (clickCounts.get(element) || 0) + 1;
      clickCounts.set(element, next);
      if (next >= maxClicksPerElement) blocked.add(element);
    },
  };
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { createClickGuard };
} else {
  globalThis.SkipVideoClickGuard = { createClickGuard };
}
