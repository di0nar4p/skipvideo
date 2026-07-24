# SkipVideo ⏭

Extensão de navegador que **detecta e clica automaticamente** em botões de
**pular abertura**, **pular resumo/recap** e **pular anúncio** em plataformas de
streaming — e **continua verificando** a tela até não achar mais nenhum.

> **Autor:** Glauco Santos · **Manifest V3** · Chrome + Firefox · sem build step

## Recursos

- 🎯 Detecção por **texto multi-idioma** (PT/EN/ES/FR/DE/IT) em texto, `aria-label` e `title`.
- 🔁 Vigilância **contínua** (MutationObserver + intervalo de segurança).
- 🖱️ Clique **automático**; para de agir quando não há mais botão, sem travar a aba.
- 🎛️ **Popup** com interruptor liga/desliga e **contador** de cliques.
- 🔒 **Menor privilégio**: só roda nos domínios de streaming suportados.

## Plataformas suportadas

Netflix · YouTube · Prime Video · Disney+ · Max/HBO Max · Globoplay ·
Crunchyroll · Paramount+ · Apple TV+ · Star+
*(a lista fica em `manifest.json` e `src/config/platforms.js`)*

## Instalação local

Passo a passo para Chrome e Firefox em **[docs/INSTALL.md](docs/INSTALL.md)**.
Resumo: Chrome → `chrome://extensions` → *Carregar sem compactação* → pasta do
projeto. Firefox 121+ → `about:debugging` → *Carregar extensão temporária* →
`manifest.json`.

## Desenvolvimento

```bash
npm install        # instala o Jest (única dependência, só para testes)
npm test           # roda a suíte (matcher, detector, invariantes de config)
node scripts/generate-icons.js   # regenera os ícones PNG, se necessário
```

## Estrutura

```
src/config/platforms.js     domínios + dicionário de "pular" (multi-idioma)
src/shared/matcher.js       normalização + decisão "é um pular?" (puro, testado)
src/shared/api.js           shim browser/chrome
src/content/detector.js     varre o DOM e acha os botões (puro, testado)
src/content/skip-scanner.js observa a tela, clica e conta
src/popup/                  interface liga/desliga + contador
src/background/             badge no ícone (enhancement)
tests/                      testes Jest (jsdom)
docs/                       design + instalação
```

Detalhes de arquitetura e segurança em
**[docs/specs/skipvideo-design.md](docs/specs/skipvideo-design.md)**.

## Licença

MIT.
