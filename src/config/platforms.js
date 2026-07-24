/**
 * ============================================================================
 * src/config/platforms.js — Configuracao: plataformas e dicionario de "pular"
 * ----------------------------------------------------------------------------
 * @author Glauco Santos
 * ----------------------------------------------------------------------------
 * (O QUE) Centraliza os dois dados que definem o alcance da extensao:
 *   - STREAMING_MATCHES: em quais dominios ela roda.
 *   - SKIP_KEYWORDS / DENYLIST: quais rotulos contam (ou nunca contam) como "pular".
 *
 * (POR QUE) Manter esses dados num unico lugar (e nao espalhados pelo codigo)
 *   torna trivial adicionar uma nova plataforma ou idioma sem tocar na logica.
 *   Tambem e a fonte da verdade usada tanto pelo manifest quanto pelos scripts.
 *
 * (COMO) As keywords ja vem NORMALIZADAS (minusculas, sem acento) porque o
 *   matcher normaliza o texto da pagina antes de comparar; guardar a versao
 *   canonica evita divergencias e acelera a comparacao.
 * ============================================================================
 */

// (O QUE) Padroes de host no formato aceito por `content_scripts.matches` do MV3.
// (POR QUE) Restringir a essas plataformas e o principio do MENOR PRIVILEGIO: a
//   extensao nunca ve paginas de banco, e-mail, etc. — so streaming.
const STREAMING_MATCHES = [
  '*://*.netflix.com/*',
  '*://*.youtube.com/*',
  '*://*.primevideo.com/*',
  '*://*.disneyplus.com/*',
  '*://*.max.com/*',
  '*://*.hbomax.com/*',
  '*://globoplay.globo.com/*',
  '*://*.crunchyroll.com/*',
  '*://*.paramountplus.com/*',
  '*://*.starplus.com/*',
];

// (O QUE) Rotulos que indicam um botao de pular, por idioma (ja normalizados).
// (POR QUE) Cobrir varios idiomas atende ao requisito multi-idioma e a
//   plataformas que trocam o texto conforme a conta/regiao do usuario.
const SKIP_KEYWORDS = [
  // Portugues
  'pular', 'pular abertura', 'pular introducao', 'pular recap',
  'pular recapitulacao', 'pular resumo', 'pular anuncio', 'pular propaganda',
  'pular vinheta', 'ignorar anuncio', 'pular credito', 'pular creditos',
  // Ingles
  'skip', 'skip intro', 'skip recap', 'skip ad', 'skip ads', 'skip advert',
  'skip preview', 'skip credits', 'skip sponsor',
  // Espanhol
  'saltar', 'saltar intro', 'omitir', 'omitir intro', 'saltar anuncio',
  'saltar resumen',
  // Frances
  'passer', 'ignorer', "passer l'intro",
  // Alemao (normalizado: sem trema)
  'uberspringen', 'intro uberspringen',
  // Italiano
  'salta', 'salta intro',
];

// (O QUE) Seletores CSS de botoes de "pular" que NAO expoem texto legivel
//   (sao apenas icone) e por isso escapam da deteccao por texto.
// (POR QUE) Caso real: HBO Max e Paramount+ usam o player "Fuse", cujo botao tem
//   um <span> de label VAZIO — sem texto, aria-label ou title. Restou o
//   data-testid, que e uma ancora estavel e semantica ("skip-button"). Cada
//   seletor aqui e ESPECIFICO (identifica so o botao de pular daquela
//   plataforma), entao complementa o texto sem risco de clicar no lugar errado:
//   um seletor especifico demais que nao casa nada e inofensivo; o perigo seria
//   um seletor amplo — que evitamos.
const SKIP_SELECTORS = [
  '[data-testid="player-ux-skip-button"]', // HBO Max, Paramount+ (player Fuse)
  '[data-uia="player-skip-intro"]', // Netflix - pular abertura
  '[data-uia="player-skip-recap"]', // Netflix - pular recapitulacao
  '.ytp-ad-skip-button', // YouTube - pular anuncio (classico)
  '.ytp-ad-skip-button-modern', // YouTube - pular anuncio (novo)
  '.ytp-skip-ad-button', // YouTube - variacao
];

// (O QUE) Rotulos que JAMAIS devem ser clicados, mesmo contendo "skip"/"pular".
// (POR QUE) Seguranca: impede que um falso-positivo dispare uma acao indesejada
//   como pular uma etapa de pagamento ou o link de acessibilidade "pular para o
//   conteudo", que existe em muitas paginas.
const DENYLIST = [
  // Etapas/links perigosos que contem "skip"/"pular"/"saltar".
  'skip payment',
  'pular pagamento',
  'skip to content',
  'skip to main content',
  'saltar al contenido',
  'skip navigation',
  // (POR QUE) Controles de avancar/retroceder 10s dos players (bug real no
  //   Apple TV+): seus rotulos contem a palavra "skip"/"salta"/"saltar", entao
  //   colidiam com os keywords genericos e faziam o video retroceder em loop.
  //   Como a denylist casa por limite de palavra, "skip back 10 seconds" e
  //   barrado por conter a frase "skip back".
  'skip back',
  'skip backward',
  'skip forward',
  'skip ahead',
  'skip back 10 seconds',
  'skip forward 10 seconds',
  'saltar adelante',
  'saltar atras',
  'salta avanti',
  'salta indietro',
];

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { STREAMING_MATCHES, SKIP_KEYWORDS, SKIP_SELECTORS, DENYLIST };
} else {
  globalThis.SkipVideoConfig = {
    STREAMING_MATCHES,
    SKIP_KEYWORDS,
    SKIP_SELECTORS,
    DENYLIST,
  };
}
