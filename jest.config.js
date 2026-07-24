/**
 * ============================================================================
 * jest.config.js — Configuracao do Jest para a extensao SkipVideo
 * ----------------------------------------------------------------------------
 * @author Glauco Santos
 * ----------------------------------------------------------------------------
 * (O QUE) Define como os testes sao executados.
 *
 * (POR QUE) A logica central da extensao (normalizacao de texto, deteccao de
 *   botoes no DOM) precisa rodar num ambiente que simule um navegador. Um teste
 *   Node.js "puro" nao tem `document`/`window`, entao usamos o ambiente jsdom,
 *   que emula o DOM em memoria. Assim testamos `findSkipButtons` sem abrir um
 *   navegador de verdade.
 *
 * (COMO) `testEnvironment: 'jsdom'` faz o Jest injetar um DOM falso porem
 *   fiel o suficiente (elementos, atributos, getComputedStyle) para validarmos
 *   nossa deteccao. `testMatch` restringe a busca a pasta tests/.
 * ============================================================================
 */
module.exports = {
  testEnvironment: 'jsdom',
  testMatch: ['**/tests/**/*.test.js'],
  // Saida limpa: falha o build se um teste ficar sem asserts por engano.
  verbose: true,
};
