# Publicação — SkipVideo (Chrome Web Store + Firefox AMO)

Este guia cobre **publicar nas lojas oficiais**. Para instalar localmente (dev/teste),
veja [INSTALL.md](INSTALL.md).

> **Antes de tudo:** rode `npm test` (deve dar tudo verde) e teste manualmente nas
> plataformas. Depois gere o pacote:
>
> ```bash
> npm run package
> ```
>
> Isso cria **`dist/skipvideo.zip`** contendo **apenas os arquivos de runtime**
> (`manifest.json`, `src/`, `icons/`, `LICENSE`) — sem `node_modules`, testes, docs ou
> scripts. É esse zip que você envia para as duas lojas.

---

## Parte 1 — Chrome Web Store

### 1. Conta de desenvolvedor (uma vez)
- Acesse o **Developer Dashboard**: https://chrome.google.com/webstore/devconsole
- Pague a **taxa única de US$ 5** (registro vitalício de desenvolvedor).

### 2. Enviar o item
1. No dashboard, clique **"Add new item"**.
2. Faça upload de **`dist/skipvideo.zip`**.
3. Preencha a **Store listing**:
   - **Descrição** (pode reaproveitar a do `README.md`).
   - **Ícone da loja** 128×128 (já temos em `icons/icon-128.png`).
   - **Screenshots** 1280×800 ou 640×400 (capturas do popup e da extensão pulando um
     vídeo — pelo menos 1, idealmente 3–5).
   - **Categoria** (ex.: *Productivity* ou *Fun*) e idioma.
3. **Privacy practices** (obrigatório): declare que a extensão **não coleta dados**.
   Justifique as permissões:
   - `storage`: salvar o estado liga/desliga e o contador **localmente**.
   - `host_permissions` (domínios de streaming): necessário para detectar e clicar nos
     botões de pular **apenas nesses sites**.
   - Marque que **não há transmissão de dados a terceiros** e adicione um link de
     política de privacidade se o formulário exigir (uma página simples dizendo "não
     coletamos nada" costuma bastar).

### 3. Revisão e publicação
- Envie para revisão. A análise leva de **algumas horas a poucos dias**.
- Aprovado → fica público na loja. Você recebe um link `chromewebstore.google.com/...`.

> ✅ Já estamos em **Manifest V3**, exigência atual da Chrome Web Store.

---

## Parte 2 — Firefox Add-ons (AMO)

Conta gratuita em https://addons.mozilla.org/developers/ . Duas rotas:

### Rota A — Listada (pública, na loja) — recomendada
1. **Developer Hub → Submit a New Add-on**.
2. Escolha **"On this site"** (listada).
3. Faça upload de **`dist/skipvideo.zip`** (o mesmo zip serve; o `manifest.json` já tem
   `browser_specific_settings.gecko.id`, que o Firefox exige).
4. Preencha listing (descrição, ícone, categorias) e envie para revisão.
5. Aprovado → a Mozilla **assina** e publica; usuários instalam com 1 clique.

### Rota B — Autodistribuição (você hospeda o `.xpi` assinado)
Útil para distribuir fora da loja (ex.: link direto). O Firefox **exige assinatura**
mesmo assim. Com a ferramenta oficial `web-ext`:

```bash
# lint (recomendado antes de enviar) — usa o pacote de runtime
npm run build:pkg
npx web-ext lint --source-dir dist/skipvideo

# assinar (gera um .xpi assinado em dist/) — precisa de credenciais da AMO
npx web-ext sign --source-dir dist/skipvideo --artifacts-dir dist --channel unlisted \
  --api-key SEU_JWT_ISSUER --api-secret SEU_JWT_SECRET
```

- Gere `--api-key`/`--api-secret` em **AMO → Manage API Keys**
  (https://addons.mozilla.org/developers/addon/api/key/).
- O `.xpi` assinado resultante pode ser instalado/distribuído permanentemente.
- (Há atalhos prontos no `package.json`: `npm run lint:ext` e `npm run sign:firefox` —
  este último requer as variáveis/flags de credencial da AMO.)

---

## Checklist antes de enviar

- [ ] `npm test` verde.
- [ ] Testado manualmente em Netflix/YouTube/HBO/Paramount etc.
- [ ] `npm run package` gerou `dist/skipvideo.zip` limpo.
- [ ] `version` no `manifest.json` está correta (veja abaixo).
- [ ] Ícones 16/48/128 presentes.
- [ ] Descrição e screenshots prontos.
- [ ] Permissões justificadas no formulário de privacidade.

## Publicar uma atualização

1. Incremente a **`version`** no `manifest.json` (ex.: `1.0.0` → `1.0.1`). As lojas
   **recusam** um upload com versão igual ou menor que a já publicada.
2. `npm run package`.
3. Reenvie o novo `dist/skipvideo.zip` no dashboard da loja correspondente (nova versão
   passa por revisão novamente).

## Dica: manter as duas lojas em sincronia
O **mesmo** `dist/skipvideo.zip` funciona no Chrome e no Firefox porque o `manifest.json`
já é compatível com ambos (MV3 + `background.scripts`/`service_worker` + `gecko.id`).
Basta subir o mesmo arquivo nas duas.
