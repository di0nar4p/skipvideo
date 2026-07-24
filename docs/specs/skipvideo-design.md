# SkipVideo — Documento de Design

**Autor:** Glauco Santos · **Status:** implementado · **Alvo:** Chrome + Firefox (MV3)

## 1. Problema

Durante maratonas em plataformas de streaming, o usuário clica repetidamente em
botões de **pular abertura**, **pular resumo/recap** e **pular anúncio**. A
extensão automatiza esses cliques e **continua vigiando** a tela: só "descansa"
quando não há mais botão de pular — e volta a agir assim que um novo aparece.

## 2. Requisitos (definidos com o usuário)

- **Escopo:** apenas plataformas de streaming conhecidas (lista fixa de domínios).
- **Detecção:** por **texto multi-idioma** (PT/EN/ES/FR/DE/IT), lendo texto
  visível, `aria-label` e `title`.
- **Comportamento:** clique **automático** + **popup on/off** com contador.
- **Distribuição:** MV3 unificado, instalável localmente, **sem build step**.

## 3. Decisões de arquitetura

### 3.1 Sem bundler, escopo compartilhado
Content scripts do MV3 são listados em ordem no `manifest.json` e **compartilham
o mesmo escopo**. Aproveitamos isso: cada arquivo publica seus símbolos em
`globalThis` (no navegador) e via `module.exports` (nos testes Node). Resultado:
a pasta **é** a extensão — carrega direto, sem transpilar. Ordem de carga:

```
api.js → platforms.js → matcher.js → detector.js → skip-scanner.js
```

### 3.2 Núcleo puro, casca com efeitos
| Camada | Arquivo | Efeitos colaterais? | Testado por |
|--------|---------|---------------------|-------------|
| Decisão de texto | `shared/matcher.js` | Não (puro) | Jest |
| Leitura da tela | `content/detector.js` | Não (puro, lê DOM) | Jest + jsdom |
| Orquestração | `content/skip-scanner.js` | Sim (clica, timers) | manual (browser) |
| UI | `popup/*` | Sim (storage/DOM) | manual (browser) |
| Badge | `background/service-worker.js` | Sim (action) | manual (browser) |

Concentrar as **decisões** em funções puras é o que torna a extensão testável
sem navegador e segura: toda a proteção contra clicar no botão errado vive no
`matcher`/`detector` e é exercitada por 25 testes automatizados.

### 3.3 Duas camadas de detecção (texto + seletores)
A detecção por **texto multi-idioma** é a base, mas players como HBO Max e
Paramount+ (framework "Fuse") usam botões **só com ícone** — o `<span>` de label
vem **vazio**, sem `aria-label`/`title`. Nada para casar por texto. Por isso há
uma **segunda camada** por **seletores conhecidos** (`SKIP_SELECTORS`), ex.:
`[data-testid="player-ux-skip-button"]` (HBO/Paramount), classes `ytp-ad-skip-*`
(YouTube), `data-uia="player-skip-*"` (Netflix). Cada seletor é **específico**
(identifica só o botão de pular daquela plataforma), então complementa o texto
sem risco de clique errado — um seletor específico demais que não casa nada é
inofensivo; o perigo seria um seletor amplo, que evitamos. As duas camadas são
unidas por um `Set` (dedupe → nunca clica duas vezes no mesmo botão), e a camada
de seletores ainda respeita visibilidade e denylist.

### 3.4 Detecção contínua: MutationObserver + intervalo
- **MutationObserver** (com debounce) reage no instante em que o player insere
  ou revela um botão — sem polling constante.
- **`setInterval` de 1s** é a rede de segurança para players que mudam via
  `<video>`/Shadow DOM sem disparar mutations observáveis.
- Após clicar, uma **rajada** (`runBurst`) re-escaneia até a tela ficar sem
  botões, com **teto de iterações** para nunca travar a aba.

### 3.5 Matching resistente a falso-positivo
- Texto e keywords são **normalizados** (minúsculo, sem acento, espaços colapsados).
- Comparação por **limite de palavra** (`\b…\b`), não substring: "skip" não casa
  em "skipper", "salta" não casa em "salário".
- **Denylist** com prioridade absoluta (ex.: "pular pagamento", "skip to content").
- **Limite de tamanho** do rótulo (~40 chars): parágrafos longos não são botões.

## 4. Segurança (Security by Design)

- **Menor privilégio:** só `storage` + `host_permissions` dos domínios de
  streaming. Sem `<all_urls>`, `tabs`, `scripting`, `webRequest`.
- **Sem código remoto, sem `eval`, sem `innerHTML`** com dado dinâmico (só
  `textContent`) — imune a XSS por construção.
- **Denylist + limite de palavra + limite de tamanho** evitam cliques perigosos.
- **Guarda anti-loop** protege contra travamento da página.
- Content script roda em *isolated world* (padrão MV3).

## 5. Cross-browser

Um shim (`shared/api.js`) resolve `browser ?? chrome`. O background é declarado
com **as duas chaves**: `service_worker` (Chrome) **e** `scripts` (Firefox, que
ainda não habilita `service_worker` por padrão e recusa carregar sem `scripts`).
Cada navegador usa a chave que entende. `browser_specific_settings.gecko` fixa o
id e `strict_min_version: 109.0` (MV3 estável). O background é **enhancement**:
se falhar, o clique automático continua funcionando (degradação graciosa).

## 6. Como testar

`npm test` cobre `matcher`, `detector` e as invariantes de `platforms`. O teste
end-to-end (carga local + vídeo real) está em [`../INSTALL.md`](../INSTALL.md).
