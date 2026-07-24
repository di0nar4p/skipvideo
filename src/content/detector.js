/**
 * ============================================================================
 * src/content/detector.js — Varredura de botoes de "pular" no DOM (logica pura)
 * ----------------------------------------------------------------------------
 * @author Glauco Santos
 * ----------------------------------------------------------------------------
 * (O QUE) findSkipButtons(root) percorre o DOM e devolve os elementos clicaveis,
 *   VISIVEIS, cujo rotulo (texto/aria-label/title) e reconhecido como "pular".
 *
 * (POR QUE) Isolar a "leitura da tela" numa funcao pura (sem cliques, sem
 *   timers) permite testa-la exaustivamente com jsdom. Quem CLICA e o scanner;
 *   aqui so DECIDIMOS o que e clicavel — separacao que facilita testes e revisao.
 *
 * (COMO) Selecionamos candidatos por seletor CSS (elementos naturalmente
 *   clicaveis), extraimos os possiveis rotulos, filtramos por visibilidade
 *   (via getComputedStyle, que funciona tanto no navegador quanto no jsdom) e
 *   aplicamos isSkipText do matcher para a decisao final.
 * ============================================================================
 */

// (COMO) require nos testes (Node); no navegador usamos os globals expostos
//   pelos scripts carregados antes deste no manifest (mesma ordem, mesmo escopo).
const matcher =
  typeof require !== 'undefined'
    ? require('../shared/matcher')
    : globalThis.SkipVideoMatcher;
const config =
  typeof require !== 'undefined'
    ? require('../config/platforms')
    : globalThis.SkipVideoConfig;

// (O QUE) Seletor dos elementos que um usuario consegue clicar.
// (POR QUE) Restringir a esses tipos reduz drasticamente o ruido: nao varremos
//   a pagina inteira, so o que de fato e acionavel.
const CLICKABLE_SELECTOR =
  'button, a[href], [role="button"], [onclick], input[type="button"], input[type="submit"]';

/**
 * (O QUE) Diz se um elemento (e seus ancestrais) esta visivel.
 * (POR QUE) Players mantem varios botoes no DOM o tempo todo e apenas os
 *   exibem/ocultam via CSS. Clicar num botao oculto seria um bug — entao so
 *   consideramos os efetivamente visiveis.
 * (COMO) Subimos a arvore checando display/visibility/opacity computados.
 *   getComputedStyle reflete estilos inline e de folhas de estilo, e funciona
 *   no jsdom (para inline) e no navegador (completo). Evitamos depender de
 *   offsetParent/getBoundingClientRect porque o jsdom nao calcula layout.
 */
function isVisible(element) {
  let node = element;
  const view = (element.ownerDocument || document).defaultView || globalThis;
  while (node && node.nodeType === 1) {
    const style = view.getComputedStyle(node);
    if (
      style.display === 'none' ||
      style.visibility === 'hidden' ||
      style.visibility === 'collapse' ||
      style.opacity === '0'
    ) {
      return false;
    }
    node = node.parentElement;
  }
  return true;
}

/**
 * (O QUE) Coleta os rotulos textuais candidatos de um elemento.
 * (COMO) Um botao de pular pode se identificar por: texto visivel, aria-label
 *   (acessibilidade) ou title (tooltip). Retornamos os tres para o matcher
 *   avaliar cada um.
 */
function labelsOf(element) {
  return [
    element.textContent,
    element.getAttribute('aria-label'),
    element.getAttribute('title'),
  ].filter((v) => v && v.trim().length > 0);
}

/**
 * (O QUE) Diz se o texto visivel de um elemento cai na denylist.
 * (POR QUE) Rede de seguranca para a camada de SELETORES: mesmo que um seletor
 *   conhecido case, se o rotulo do elemento for algo proibido (ex.: "pular
 *   pagamento"), nao clicamos.
 * (COMO) Comparacao por substring do texto normalizado contra a denylist
 *   (ja normalizada). Texto vazio nunca contem um termo nao-vazio -> seguro.
 */
function isDenied(element) {
  const text = matcher.normalize(element.textContent);
  return (config.DENYLIST || []).some((banned) =>
    text.includes(matcher.normalize(banned))
  );
}

/**
 * (O QUE) Retorna todos os botoes de "pular" visiveis dentro de `root`,
 *   combinando DUAS estrategias complementares.
 * (POR QUE)
 *   1. Texto (multi-idioma): pega botoes rotulados ("Pular anuncio", "Skip ad").
 *   2. Seletores conhecidos: pega botoes SO COM ICONE, sem texto/aria (ex.: HBO
 *      Max/Paramount+, YouTube), que a estrategia de texto nao alcanca.
 * (COMO) Usamos um Set para deduplicar: um mesmo botao pode casar pelas duas
 *   vias e nao deve ser clicado duas vezes. A ordem de insercao e preservada.
 */
function findSkipButtons(root = document) {
  const results = new Set();

  // --- Estrategia 1: por texto/aria-label/title (multi-idioma) --------------
  for (const el of root.querySelectorAll(CLICKABLE_SELECTOR)) {
    if (!isVisible(el)) continue;
    const matched = labelsOf(el).some((label) =>
      matcher.isSkipText(label, config.SKIP_KEYWORDS, config.DENYLIST)
    );
    if (matched) results.add(el);
  }

  // --- Estrategia 2: por seletores conhecidos (botoes so com icone) ---------
  const selectors = config.SKIP_SELECTORS || [];
  if (selectors.length > 0) {
    for (const el of root.querySelectorAll(selectors.join(','))) {
      if (!isVisible(el)) continue;
      if (isDenied(el)) continue; // seguranca extra
      results.add(el);
    }
  }

  return [...results];
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { findSkipButtons, isVisible, CLICKABLE_SELECTOR };
} else {
  globalThis.SkipVideoDetector = { findSkipButtons, isVisible };
}
