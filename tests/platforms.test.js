/**
 * ============================================================================
 * tests/platforms.test.js — Invariantes da configuracao
 * ----------------------------------------------------------------------------
 * @author Glauco Santos
 * ----------------------------------------------------------------------------
 * (O QUE) Garante que o dicionario e a lista de dominios respeitam as regras
 *   que o resto do codigo assume: keywords normalizadas, sem duplicatas, e
 *   padroes de host bem-formados.
 *
 * (POR QUE) O matcher compara texto ja normalizado contra as keywords. Se
 *   alguem adicionar "Pular Anúncio" (com acento/maiuscula) por engano, o match
 *   silenciosamente falharia. Este teste transforma essa regra implicita numa
 *   verificacao automatica — pega o erro no CI, nao em producao.
 * ============================================================================
 */
const {
  STREAMING_MATCHES,
  SKIP_KEYWORDS,
  SKIP_SELECTORS,
  DENYLIST,
} = require('../src/config/platforms');
const { normalize } = require('../src/shared/matcher');

describe('SKIP_KEYWORDS', () => {
  test('todas as keywords ja estao normalizadas (minusculo, sem acento)', () => {
    for (const kw of SKIP_KEYWORDS) {
      expect(kw).toBe(normalize(kw));
    }
  });

  test('nao ha keywords duplicadas', () => {
    expect(new Set(SKIP_KEYWORDS).size).toBe(SKIP_KEYWORDS.length);
  });
});

describe('SKIP_SELECTORS', () => {
  test('nao ha seletores duplicados', () => {
    expect(new Set(SKIP_SELECTORS).size).toBe(SKIP_SELECTORS.length);
  });

  test('todos sao seletores CSS sintaticamente validos', () => {
    // (COMO) querySelector lanca se o seletor for invalido; se nao lancar, e valido.
    for (const selector of SKIP_SELECTORS) {
      expect(() => document.querySelector(selector)).not.toThrow();
    }
  });
});

describe('DENYLIST', () => {
  test('todos os termos da denylist estao normalizados', () => {
    for (const term of DENYLIST) {
      expect(term).toBe(normalize(term));
    }
  });
});

describe('STREAMING_MATCHES', () => {
  test('todos os padroes de host tem o formato de match do MV3', () => {
    // (COMO) Formato esperado: esquema://host/caminho, ex.: *://*.netflix.com/*
    const pattern = /^\*:\/\/[^/]+\/\*$/;
    for (const match of STREAMING_MATCHES) {
      expect(match).toMatch(pattern);
    }
  });

  test('nao ha dominios duplicados', () => {
    expect(new Set(STREAMING_MATCHES).size).toBe(STREAMING_MATCHES.length);
  });
});
