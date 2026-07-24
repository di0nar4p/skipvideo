/**
 * ============================================================================
 * src/shared/matcher.js — Correspondencia de texto (logica pura)
 * ----------------------------------------------------------------------------
 * @author Glauco Santos
 * ----------------------------------------------------------------------------
 * (O QUE) Duas funcoes puras:
 *   - normalize(text): padroniza um texto para comparacao.
 *   - isSkipText(text, keywords, denylist): decide se o texto e o rotulo de
 *     um botao de "pular".
 *
 * (POR QUE) Separar a decisao "isto e um skip?" em funcoes puras (sem DOM, sem
 *   efeitos colaterais) e o que torna a extensao TESTAVEL e SEGURA. Toda a
 *   protecao contra clicar no botao errado mora aqui e pode ser exercitada por
 *   testes automatizados sem abrir o navegador.
 *
 * (COMO) Normalizamos texto e keywords para o mesmo formato canonico (minusculo,
 *   sem acento, espacos colapsados) e comparamos por TOKENS/limite de palavra —
 *   nunca por substring crua — para nao casar "skipper" com "skip" nem
 *   "salário" com "saltar". Uma denylist tem prioridade absoluta.
 * ============================================================================
 */

/**
 * (O QUE) Converte qualquer texto para um formato canonico comparavel.
 * (COMO) Unicode NFD separa a letra de seu acento (ex.: "á" -> "a" + "◌́");
 *   removemos os diacriticos (faixa U+0300–U+036F), passamos para minusculo e
 *   colapsamos espacos. Entrada nula/indefinida vira string vazia (defensivo).
 */
function normalize(text) {
  if (text === null || text === undefined) return '';
  return String(text)
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '') // remove os diacriticos separados pelo NFD
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
}

// (O QUE) Tamanho maximo (em caracteres) que um rotulo de botao plausivel tem.
// (POR QUE) Rotulos reais sao curtos ("Pular anuncio"). Um paragrafo longo que
//   por acaso contenha "pular" quase certamente NAO e um botao — descartamos.
const MAX_LABEL_LENGTH = 40;

/**
 * (O QUE) Verifica se `phrase` (ja normalizada) aparece em `haystack`
 *   (ja normalizado) respeitando limites de palavra.
 * (POR QUE) Evita o classico falso-positivo de substring: "skip" NAO deve casar
 *   dentro de "skipper", e "salta" NAO deve casar dentro de "salário".
 * (COMO) Construimos um regex com \b (limite de palavra) escapando caracteres
 *   especiais da frase. Frases com multiplas palavras (ex.: "skip intro")
 *   tambem funcionam porque \b delimita apenas as bordas externas.
 */
function containsWord(haystack, phrase) {
  if (!phrase) return false;
  const escaped = phrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp(`\\b${escaped}\\b`).test(haystack);
}

/**
 * (O QUE) Decide se `text` representa um botao de "pular".
 * (COMO)
 *   1. Normaliza o texto.
 *   2. Descarta vazio ou longo demais (nao parece rotulo de botao).
 *   3. Denylist tem prioridade: se casar algo proibido, retorna false na hora.
 *   4. Caso contrario, retorna true se casar QUALQUER keyword por limite de palavra.
 */
function isSkipText(text, keywords, denylist = []) {
  const normalized = normalize(text);
  if (!normalized) return false;
  if (normalized.length > MAX_LABEL_LENGTH) return false;

  // Denylist vence sempre (seguranca antes de conveniencia).
  for (const banned of denylist) {
    if (containsWord(normalized, normalize(banned))) return false;
  }

  for (const keyword of keywords) {
    if (containsWord(normalized, normalize(keyword))) return true;
  }
  return false;
}

// (COMO) Export duplo: CommonJS para os testes Jest e, no navegador (onde
//   `module` nao existe), as funcoes ficam disponiveis no escopo compartilhado
//   dos content scripts, expostas via globalThis para uso pelos demais arquivos.
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { normalize, isSkipText, MAX_LABEL_LENGTH };
} else {
  globalThis.SkipVideoMatcher = { normalize, isSkipText, MAX_LABEL_LENGTH };
}
