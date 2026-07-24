/**
 * ============================================================================
 * src/content/skip-scanner.js — Orquestrador: observa a tela, clica, conta
 * ----------------------------------------------------------------------------
 * @author Glauco Santos
 * ----------------------------------------------------------------------------
 * (O QUE) Roda dentro da pagina de streaming. Usa o detector para achar botoes
 *   de "pular", clica em cada um, conta os cliques e NAO PARA de vigiar: enquanto
 *   houver botao, clica; quando some, fica em espera ate um novo aparecer.
 *
 * (POR QUE) Botoes de pular aparecem e somem dinamicamente (fim da abertura,
 *   inicio de anuncio...). Um unico scan nao basta. Combinamos duas estrategias
 *   complementares para cobrir todos os casos sem gastar CPU a toa.
 *
 * (COMO)
 *   - MutationObserver: reage quando o player insere/altera nós no DOM
 *     (deteccao "instantanea", sem polling constante).
 *   - setInterval de baixa frequencia: rede de seguranca para players que
 *     mudam via <video>/Shadow DOM sem disparar mutations observaveis.
 *   - Apos clicar, re-escaneia em rajada curta (com teto de iteracoes) para
 *     pegar botoes que aparecem em cascata — parando assim que nao achar mais.
 *   - Respeita o interruptor liga/desliga vindo do popup (chrome.storage).
 * ============================================================================
 */
(function initSkipScanner() {
  'use strict';

  // (COMO) Globals expostos pelos scripts carregados antes deste (ordem do manifest).
  const api = globalThis.SkipVideoApi || globalThis.browser || globalThis.chrome;
  const { findSkipButtons } = globalThis.SkipVideoDetector;
  const { createClickGuard } = globalThis.SkipVideoClickGuard;

  // (O QUE) Guard de auto-cura: um pular real some apos o clique; um
  //   falso-positivo (ex.: controle de +-10s do Apple TV+) persiste. O guard
  //   bloqueia quem persiste depois de poucos cliques, matando o loop. Vive por
  //   toda a sessao da pagina (um botao novo mais tarde e outro elemento).
  const clickGuard = createClickGuard();

  // ---- Constantes de ajuste (documentadas para facilitar tuning) -----------
  // (POR QUE) Teto de iteracoes por rajada: impede um laco infinito caso um
  //   botao "de pular" reapareca sozinho apos o clique (defesa contra travar a aba).
  const MAX_BURST_ITERATIONS = 10;
  // (POR QUE) Intervalo da rede de seguranca. 1s e imperceptivel para o usuario
  //   e leve para a CPU, mas rapido o bastante para nao deixar anuncio passar.
  const FALLBACK_INTERVAL_MS = 1000;
  // (POR QUE) Debounce do observer: agrupa rajadas de mutations num unico scan.
  const OBSERVER_DEBOUNCE_MS = 150;

  // Chaves usadas no armazenamento (compartilhadas com o popup/background).
  const STORAGE_ENABLED_KEY = 'skipvideo_enabled';
  const STORAGE_COUNT_KEY = 'skipvideo_click_count';

  let enabled = true; // default ligado; sobrescrito pelo storage abaixo.
  let observer = null;
  let intervalId = null;
  let debounceTimer = null;

  /**
   * (O QUE) Incrementa o contador de cliques persistido.
   * (COMO) Le o valor atual e grava +1. Usamos storage.local (nao sync) para
   *   nao poluir a conta do usuario e evitar limites de cota de sincronizacao.
   */
  async function bumpClickCount(by) {
    try {
      const data = await api.storage.local.get(STORAGE_COUNT_KEY);
      const current = Number(data[STORAGE_COUNT_KEY]) || 0;
      await api.storage.local.set({ [STORAGE_COUNT_KEY]: current + by });
    } catch (_) {
      // (POR QUE) Falha de storage nunca deve impedir o clique: degradamos em
      //   silencio (o essencial — pular — ja aconteceu).
    }
  }

  /**
   * (O QUE) Executa uma rajada de scan+clique ate a tela nao ter mais botoes NOVOS.
   * (POR QUE) Cumpre o requisito central ("so pare quando nao achar mais o botao")
   *   SEM cair no loop do Apple TV+: antes, um botao que persistia apos o clique
   *   (controle de seek) era reclicado ate 10x por rajada e a cada 1s -> video
   *   retrocedendo sem parar.
   * (COMO) Duas defesas:
   *   - Set `clickedThisBurst`: nunca reclica o MESMO elemento na mesma rajada;
   *     a re-varredura serve so para pegar botoes NOVOS em cascata. Se um scan
   *     nao traz nada novo, a rajada encerra.
   *   - `clickGuard`: se um elemento persiste entre rajadas e ja foi clicado
   *     alem do limite, e bloqueado de vez (auto-cura, independe do rotulo).
   */
  function runBurst() {
    if (!enabled) return;
    const clickedThisBurst = new Set();
    let clickCount = 0;

    for (let i = 0; i < MAX_BURST_ITERATIONS; i++) {
      // So consideramos botoes ainda permitidos e nao clicados nesta rajada.
      const buttons = findSkipButtons(document).filter(
        (el) => clickGuard.allow(el) && !clickedThisBurst.has(el)
      );
      if (buttons.length === 0) break; // nada NOVO para pular -> para.

      for (const button of buttons) {
        try {
          button.click();
        } catch (_) {
          // Elemento pode ter saido do DOM entre achar e clicar: ignoramos.
          continue;
        }
        clickedThisBurst.add(button);
        clickGuard.record(button); // conta o clique (pode bloquear se persistir).
        clickCount++;
      }
    }

    if (clickCount > 0) bumpClickCount(clickCount);
  }

  /** (COMO) Agenda um runBurst com debounce para nao disparar por cada mutation. */
  function scheduleBurst() {
    if (debounceTimer) return;
    debounceTimer = setTimeout(() => {
      debounceTimer = null;
      runBurst();
    }, OBSERVER_DEBOUNCE_MS);
  }

  /** (O QUE) Liga a vigilancia (observer + intervalo de seguranca). */
  function start() {
    if (observer) return; // ja rodando.
    observer = new MutationObserver(scheduleBurst);
    observer.observe(document.documentElement, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['style', 'class', 'hidden', 'aria-hidden'],
    });
    intervalId = setInterval(runBurst, FALLBACK_INTERVAL_MS);
    runBurst(); // primeira varredura imediata.
  }

  /** (O QUE) Desliga toda a vigilancia (quando o usuario desativa no popup). */
  function stop() {
    if (observer) {
      observer.disconnect();
      observer = null;
    }
    if (intervalId) {
      clearInterval(intervalId);
      intervalId = null;
    }
    if (debounceTimer) {
      clearTimeout(debounceTimer);
      debounceTimer = null;
    }
  }

  /** (O QUE) Aplica o estado ligado/desligado. */
  function applyEnabled(next) {
    enabled = next;
    if (enabled) start();
    else stop();
  }

  // ---- Bootstrap -----------------------------------------------------------
  // (COMO) Le o estado inicial do storage (default: ligado) e comeca a vigiar.
  api.storage.local
    .get(STORAGE_ENABLED_KEY)
    .then((data) => {
      const stored = data[STORAGE_ENABLED_KEY];
      applyEnabled(stored === undefined ? true : Boolean(stored));
    })
    .catch(() => applyEnabled(true));

  // (COMO) Reage em tempo real quando o popup liga/desliga a extensao.
  api.storage.onChanged.addListener((changes, area) => {
    if (area === 'local' && changes[STORAGE_ENABLED_KEY]) {
      applyEnabled(Boolean(changes[STORAGE_ENABLED_KEY].newValue));
    }
  });
})();
