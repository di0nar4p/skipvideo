/**
 * ============================================================================
 * tests/detector.test.js — Testes da varredura de botoes no DOM
 * ----------------------------------------------------------------------------
 * @author Glauco Santos
 * ----------------------------------------------------------------------------
 * (O QUE) Valida `findSkipButtons(root)`: dado um DOM, retorna apenas os
 *   elementos clicaveis, VISIVEIS, cujo rotulo e um "pular".
 *
 * (POR QUE) E a ponte entre a logica pura (matcher) e a pagina real. Precisamos
 *   garantir que: pega botoes por texto, por aria-label e por title; ignora
 *   botoes escondidos; e nao retorna elementos que so parecem conter a palavra.
 *
 * (COMO) Montamos DOMs de teste com jsdom. Como o jsdom nao calcula layout real,
 *   simulamos "invisivel" via style inline (display:none) — que o detector deve
 *   respeitar atraves de getComputedStyle / checagem de dimensoes.
 * ============================================================================
 */
const { findSkipButtons } = require('../src/content/detector');

/** Helper: injeta HTML no body e devolve o document para inspecao. */
function render(html) {
  document.body.innerHTML = html;
  return document;
}

describe('findSkipButtons', () => {
  test('encontra um <button> com texto "Pular Anúncio"', () => {
    render('<button>Pular Anúncio</button>');
    const found = findSkipButtons(document);
    expect(found).toHaveLength(1);
    expect(found[0].textContent).toBe('Pular Anúncio');
  });

  test('encontra botao identificado por aria-label (sem texto visivel)', () => {
    render('<button aria-label="Skip Intro"><svg></svg></button>');
    const found = findSkipButtons(document);
    expect(found).toHaveLength(1);
  });

  test('encontra elemento com role="button" e title', () => {
    render('<div role="button" title="Saltar">›</div>');
    const found = findSkipButtons(document);
    expect(found).toHaveLength(1);
  });

  test('ignora botoes escondidos (display:none)', () => {
    render('<button style="display:none">Skip Ad</button>');
    const found = findSkipButtons(document);
    expect(found).toHaveLength(0);
  });

  test('nao retorna botoes que nao sao de pular', () => {
    render('<button>Comprar agora</button><a href="#">Ajuda</a>');
    const found = findSkipButtons(document);
    expect(found).toHaveLength(0);
  });

  test('nao retorna botao da denylist ("Pular pagamento")', () => {
    render('<button>Pular pagamento</button>');
    const found = findSkipButtons(document);
    expect(found).toHaveLength(0);
  });

  test('encontra multiplos botoes de pular na mesma tela', () => {
    render(`
      <button>Skip Intro</button>
      <div role="button" aria-label="Pular anúncio"></div>
      <button>Continuar assistindo</button>
    `);
    const found = findSkipButtons(document);
    expect(found).toHaveLength(2);
  });

  test('nao casa "skipper" (falso-positivo por substring)', () => {
    render('<button>Skipper Mode</button>');
    const found = findSkipButtons(document);
    expect(found).toHaveLength(0);
  });
});

describe('findSkipButtons — seletores conhecidos (botoes so com icone)', () => {
  test('encontra o botao do HBO Max/Paramount por data-testid, mesmo sem texto', () => {
    // (POR QUE) Caso real reportado: player Fuse (HBO Max) usa botao so com icone
    //   SVG e um <span> de label VAZIO. Nao ha texto/aria-label/title para casar,
    //   entao a deteccao por texto sozinha falha. O data-testid e a ancora estavel.
    render(
      '<button data-testid="player-ux-skip-button"><svg></svg><span></span></button>'
    );
    expect(findSkipButtons(document)).toHaveLength(1);
  });

  test('encontra o botao de pular anuncio do YouTube por classe', () => {
    render('<button class="ytp-ad-skip-button-modern ytp-button"></button>');
    expect(findSkipButtons(document)).toHaveLength(1);
  });

  test('NAO casa um data-testid nao relacionado', () => {
    render('<button data-testid="player-ux-play-button"></button>');
    expect(findSkipButtons(document)).toHaveLength(0);
  });

  test('ignora botao de seletor conhecido se estiver escondido', () => {
    render(
      '<button data-testid="player-ux-skip-button" style="display:none"></button>'
    );
    expect(findSkipButtons(document)).toHaveLength(0);
  });

  test('nao duplica botao que casa por texto E por seletor', () => {
    render('<button data-testid="player-ux-skip-button">Skip Intro</button>');
    expect(findSkipButtons(document)).toHaveLength(1);
  });
});

describe('findSkipButtons — controles de seek NAO sao pular (bug Apple TV+)', () => {
  // (POR QUE) Caso real: no Apple TV+ os controles de +-10s tem aria-label
  //   "Skip Back"/"Skip Forward"/"Skip Ahead". O keyword generico "skip" casava
  //   a palavra "skip" dentro deles -> clicar retrocedia o video em loop. A
  //   denylist tem prioridade e deve barrar todos esses.
  test('nao retorna "Skip Back" (retroceder 10s)', () => {
    render('<button aria-label="Skip Back 10 Seconds"></button>');
    expect(findSkipButtons(document)).toHaveLength(0);
  });

  test('nao retorna "Skip Forward" (avancar 10s)', () => {
    render('<button aria-label="Skip Forward 10 Seconds"></button>');
    expect(findSkipButtons(document)).toHaveLength(0);
  });

  test('nao retorna "Skip Ahead"', () => {
    render('<button aria-label="Skip Ahead"></button>');
    expect(findSkipButtons(document)).toHaveLength(0);
  });

  test('nao retorna controles de seek em ES/IT ("Saltar atrás", "Salta avanti")', () => {
    render(
      '<button aria-label="Saltar atrás"></button>' +
        '<button aria-label="Salta avanti"></button>'
    );
    expect(findSkipButtons(document)).toHaveLength(0);
  });

  test('ainda reconhece o botao de pular real ("Skip Intro")', () => {
    render('<button aria-label="Skip Intro"></button>');
    expect(findSkipButtons(document)).toHaveLength(1);
  });
});
