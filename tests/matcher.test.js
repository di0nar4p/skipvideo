/**
 * ============================================================================
 * tests/matcher.test.js — Testes da logica pura de correspondencia de texto
 * ----------------------------------------------------------------------------
 * @author Glauco Santos
 * ----------------------------------------------------------------------------
 * (O QUE) Valida `normalize` e `isSkipText` — o coracao da deteccao.
 *
 * (POR QUE) Toda a seguranca da extensao depende de acertar QUANDO um texto e
 *   um botao de "pular". Um falso-positivo pode clicar num botao errado
 *   (ex.: "pular pagamento"); um falso-negativo deixa o anuncio passar. Por
 *   isso essa unidade e a mais testada do projeto.
 *
 * (COMO) Testamos a funcao pura isoladamente, com dicionarios de keywords e
 *   denylist controlados, cobrindo varios idiomas e armadilhas de acento/caixa.
 * ============================================================================
 */
const { normalize, isSkipText } = require('../src/shared/matcher');

// Dicionario minimo, ja normalizado (minusculo, sem acento), usado nos testes.
const KEYWORDS = [
  'pular', 'pular abertura', 'pular resumo', 'pular anuncio', // PT
  'skip', 'skip intro', 'skip recap', 'skip ad', // EN
  'saltar', 'omitir', // ES
  'passer', // FR
  'uberspringen', // DE (ja normalizado: sem trema)
  'salta', // IT
];

const DENYLIST = ['skip payment', 'pular pagamento', 'skip to content'];

describe('normalize', () => {
  test('coloca em minusculo', () => {
    expect(normalize('SKIP Intro')).toBe('skip intro');
  });

  test('remove acentos (diacriticos)', () => {
    expect(normalize('Pular Anúncio')).toBe('pular anuncio');
    expect(normalize('Überspringen')).toBe('uberspringen');
  });

  test('colapsa espacos e apara as bordas', () => {
    expect(normalize('  pular   abertura  ')).toBe('pular abertura');
  });

  test('lida com entrada nula/indefinida sem quebrar', () => {
    expect(normalize(null)).toBe('');
    expect(normalize(undefined)).toBe('');
  });
});

describe('isSkipText', () => {
  test('reconhece "Pular Anúncio" (PT com acento e caixa mista)', () => {
    expect(isSkipText('Pular Anúncio', KEYWORDS, DENYLIST)).toBe(true);
  });

  test('reconhece "Skip Intro" (EN)', () => {
    expect(isSkipText('Skip Intro', KEYWORDS, DENYLIST)).toBe(true);
  });

  test('reconhece variacoes ES/FR/DE/IT', () => {
    expect(isSkipText('Saltar', KEYWORDS, DENYLIST)).toBe(true);
    expect(isSkipText('Passer', KEYWORDS, DENYLIST)).toBe(true);
    expect(isSkipText('Überspringen', KEYWORDS, DENYLIST)).toBe(true);
    expect(isSkipText('Salta', KEYWORDS, DENYLIST)).toBe(true);
  });

  test('NAO casa "skipper" (falso-positivo por substring)', () => {
    expect(isSkipText('skipper', KEYWORDS, DENYLIST)).toBe(false);
  });

  test('NAO casa "salário" (parece "salta"/"saltar" mas nao e)', () => {
    expect(isSkipText('salário', KEYWORDS, DENYLIST)).toBe(false);
  });

  test('respeita a denylist mesmo contendo "skip"/"pular"', () => {
    expect(isSkipText('Skip payment', KEYWORDS, DENYLIST)).toBe(false);
    expect(isSkipText('Pular pagamento', KEYWORDS, DENYLIST)).toBe(false);
    expect(isSkipText('Skip to content', KEYWORDS, DENYLIST)).toBe(false);
  });

  test('ignora textos longos (provavelmente nao sao rotulos de botao)', () => {
    const paragrafo =
      'Pular esta introducao pode fazer voce perder detalhes importantes da trama e por isso...';
    expect(isSkipText(paragrafo, KEYWORDS, DENYLIST)).toBe(false);
  });

  test('trata entrada vazia/nula como nao-skip', () => {
    expect(isSkipText('', KEYWORDS, DENYLIST)).toBe(false);
    expect(isSkipText(null, KEYWORDS, DENYLIST)).toBe(false);
  });
});
