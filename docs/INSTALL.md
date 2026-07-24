# Instalação local — SkipVideo

Este guia mostra como carregar a extensão **sem loja**, direto do código, no
Chrome e no Firefox. Não há passo de build: a pasta do projeto **é** a extensão.

> Pré-requisito (apenas para rodar os testes): `npm install`. Para **usar** a
> extensão no navegador, nada precisa ser instalado — basta apontar para a pasta.

---

## Google Chrome / Edge / Brave (Chromium)

1. Abra `chrome://extensions` (no Edge: `edge://extensions`).
2. Ative o **Modo do desenvolvedor** (canto superior direito).
3. Clique em **Carregar sem compactação** (*Load unpacked*).
4. Selecione a **pasta raiz** do projeto (`skipvideo/`, a que contém o
   `manifest.json`).
5. O ícone ⏭ azul aparece na barra. Pronto.

**Testar:** abra a Netflix ou o YouTube, inicie um vídeo com abertura/anúncio e
observe o botão "Pular" ser clicado sozinho. Clique no ícone para ver o contador
e o interruptor liga/desliga.

**Atualizou o código?** Volte em `chrome://extensions` e clique no ícone de
recarregar (↻) do card da extensão.

---

## Mozilla Firefox

> Requer **Firefox 109+** (MV3 estável). O background roda como *event page* via
> `background.scripts` — o `manifest.json` declara tanto `scripts` (Firefox)
> quanto `service_worker` (Chrome), então a mesma pasta carrega nos dois.

### Carregamento temporário (some ao fechar o navegador)

1. Abra `about:debugging#/runtime/this-firefox`.
2. Clique em **Carregar extensão temporária…** (*Load Temporary Add-on*).
3. Selecione o arquivo **`manifest.json`** dentro da pasta do projeto.
4. O ícone aparece na barra. Pronto.

**Atualizou o código?** No mesmo painel, clique em **Recarregar** no card.

### Instalação persistente (opcional)

O Firefox exige que extensões instaladas de forma permanente sejam **assinadas**.
Para uso pessoal sem passar pela AMO, use o **Firefox Developer Edition** ou o
**Nightly** e defina `xpinstall.signatures.required = false` em `about:config`;
então empacote a pasta em um `.zip` (renomeável para `.xpi`) e instale via
`about:addons`. Para uso diário, o carregamento temporário acima costuma bastar.

---

## Solução de problemas

| Sintoma | Causa provável | O que fazer |
|--------|----------------|-------------|
| Não clica em nada | Site fora da lista suportada | Ver domínios em `manifest.json` → `content_scripts.matches` |
| Contador não sobe | `storage` bloqueado / worker dormindo | Recarregue a extensão; confira o console da página |
| Firefox recusa carregar | Versão < 109 | Atualize o Firefox |
| Clicou no botão errado | Falso-positivo de texto | Adicione o rótulo à `DENYLIST` em `src/config/platforms.js` |

## Adicionar uma nova plataforma ou idioma

- **Novo site:** inclua o padrão de host em **dois** lugares do `manifest.json`
  (`host_permissions` **e** `content_scripts.matches`) e também em
  `STREAMING_MATCHES` (`src/config/platforms.js`).
- **Novo rótulo/idioma:** acrescente a palavra **já normalizada** (minúscula, sem
  acento) em `SKIP_KEYWORDS` (`src/config/platforms.js`). Rode `npm test` — o
  teste de invariantes valida o formato.
