/**
 * ============================================================================
 * src/popup/popup.js — Logica do popup
 * ----------------------------------------------------------------------------
 * @author Glauco Santos
 * ----------------------------------------------------------------------------
 * (O QUE) Liga o switch e o contador aos dados persistidos em chrome.storage.
 *
 * (POR QUE) O popup e apenas uma "janela" para o estado; a fonte da verdade e o
 *   storage, que tambem e lido pelo content script. Assim, mudar o switch aqui
 *   afeta imediatamente a pagina (o scanner escuta onChanged), e o contador
 *   reflete o trabalho real feito la.
 *
 * (COMO) Sem innerHTML com dado dinamico — usamos textContent (previne XSS por
 *   principio, mesmo que aqui os dados sejam numeros proprios). API via shim
 *   cross-browser.
 * ============================================================================
 */
(function initPopup() {
  'use strict';

  const api = globalThis.browser ?? globalThis.chrome;

  const STORAGE_ENABLED_KEY = 'skipvideo_enabled';
  const STORAGE_COUNT_KEY = 'skipvideo_click_count';

  const toggle = document.getElementById('toggle-enabled');
  const countEl = document.getElementById('click-count');
  const resetBtn = document.getElementById('reset-count');

  /** (O QUE) Mostra a contagem. (COMO) textContent, nunca innerHTML. */
  function renderCount(value) {
    countEl.textContent = String(Number(value) || 0);
  }

  // ---- Estado inicial ------------------------------------------------------
  api.storage.local
    .get([STORAGE_ENABLED_KEY, STORAGE_COUNT_KEY])
    .then((data) => {
      // Default ligado quando nunca foi definido.
      toggle.checked =
        data[STORAGE_ENABLED_KEY] === undefined
          ? true
          : Boolean(data[STORAGE_ENABLED_KEY]);
      renderCount(data[STORAGE_COUNT_KEY]);
    })
    .catch(() => {
      toggle.checked = true;
      renderCount(0);
    });

  // ---- Interacoes ----------------------------------------------------------
  // (COMO) Gravar no storage propaga para o content script (via onChanged).
  toggle.addEventListener('change', () => {
    api.storage.local.set({ [STORAGE_ENABLED_KEY]: toggle.checked });
  });

  resetBtn.addEventListener('click', () => {
    api.storage.local.set({ [STORAGE_COUNT_KEY]: 0 });
  });

  // (COMO) Mantem o numero vivo enquanto o popup esta aberto e o usuario assiste.
  api.storage.onChanged.addListener((changes, area) => {
    if (area === 'local' && changes[STORAGE_COUNT_KEY]) {
      renderCount(changes[STORAGE_COUNT_KEY].newValue);
    }
  });
})();
