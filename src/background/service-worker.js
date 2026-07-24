/**
 * ============================================================================
 * src/background/service-worker.js — Badge com contador (enhancement)
 * ----------------------------------------------------------------------------
 * @author Glauco Santos
 * ----------------------------------------------------------------------------
 * (O QUE) Mantem o "badge" (aquele numerinho sobre o icone da extensao) em dia
 *   com o total de cliques de pular realizados.
 *
 * (POR QUE) Content scripts nao podem alterar o icone/badge da barra de
 *   ferramentas — isso e privilegio do contexto de background. Este worker
 *   observa o contador no storage e reflete no badge, dando feedback visual
 *   sem o usuario precisar abrir o popup.
 *
 * (COMO) Este MESMO arquivo roda em dois contextos, conforme o navegador:
 *   - Chrome: como `service_worker` (efemero, dorme quando ocioso).
 *   - Firefox: como `background.scripts` (event page), porque o Firefox ainda
 *     nao habilita a chave service_worker por padrao — ele exige `scripts` e,
 *     sem ela, recusa carregar a extensao ("service_worker is currently
 *     disabled"). Por isso o manifest declara AS DUAS chaves apontando para
 *     este arquivo; cada navegador usa a que entende e ignora a outra.
 *   Como nao usamos APIs exclusivas de service worker (fetch/importScripts),
 *   o codigo funciona identico nos dois. Nao guardamos estado em memoria:
 *   sempre lemos do storage. A extensao FUNCIONA SEM este arquivo — ele e um
 *   extra; por isso todo acesso e defensivo.
 * ============================================================================
 */
const api = globalThis.browser ?? globalThis.chrome;

const STORAGE_COUNT_KEY = 'skipvideo_click_count';

/**
 * (O QUE) Escreve o total no badge.
 * (COMO) Acima de 999 mostramos "999+" para caber no espaco do icone.
 */
async function refreshBadge() {
  try {
    const data = await api.storage.local.get(STORAGE_COUNT_KEY);
    const count = Number(data[STORAGE_COUNT_KEY]) || 0;
    const text = count === 0 ? '' : count > 999 ? '999+' : String(count);
    await api.action.setBadgeText({ text });
    await api.action.setBadgeBackgroundColor({ color: '#2563eb' });
  } catch (_) {
    // Enhancement: qualquer falha aqui e irrelevante para a funcao principal.
  }
}

// (COMO) Atualiza o badge sempre que o contador mudar...
api.storage.onChanged.addListener((changes, area) => {
  if (area === 'local' && changes[STORAGE_COUNT_KEY]) refreshBadge();
});

// (COMO) ...e tambem quando o worker acorda (instalacao/inicio do navegador).
api.runtime.onInstalled.addListener(refreshBadge);
api.runtime.onStartup?.addListener?.(refreshBadge);
refreshBadge();
