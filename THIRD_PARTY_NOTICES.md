# Componenti di terze parti

Sibilla è distribuita con licenza [MIT](LICENSE). Alcuni componenti dell'interfaccia vengono da altri progetti e restano sotto la loro licenza, riportata qui sotto.

## Rare UI

Di [Swami Malode](https://github.com/swamimalode07) — <https://rareui.com> ([sorgente](https://github.com/swamimalode07/rare-ui)).

File in `web/src/components/ui/`: `prompt-box.tsx`, `ai-status.tsx`, `streaming-response.tsx`, `toast.tsx`, `delete-button.tsx`, `animated-counter.tsx`, `password-input.tsx`, `bounce-sidebar.tsx`, `theme-selector.tsx`.

Adattati per Sibilla: testi in italiano, colori e caratteri del tema dell'app, e piccole aggiunte segnate nel codice con «Sibilla:» (invio con soli allegati in PromptBox, variante compatta di DeleteButton, testo a destra delle righe e pallino che segue la lista in BounceSidebar, pulsanti di giudizio solo se registrati in StreamingResponse).

La licenza consente l'uso in un'applicazione, anche commerciale, ma **non** la vendita o la ridistribuzione dei componenti in sé, da soli o in raccolta.

```text
MIT + Commons Clause License Condition v1.0 + Attribution

Copyright (c) 2026 Swami Malode

Permission is hereby granted, free of charge, to any person obtaining a copy of
this software and associated documentation files (the "Software"), to deal in
the Software without restriction, including without limitation the rights to
use, copy, modify, merge, publish, and distribute the Software as part of an
application, website, or product, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

Attribution Requirement

Any project that ships any part of the Software must credit Rare UI with a
visible link to https://rareui.com, placed where a visitor or user can find it,
such as a site footer, an about page, a credits screen or a README. The credit
and the copyright notice above must not be removed from the source you copied.

Commons Clause Restriction

You may use this Software, including for any commercial purpose, so long as you
do not sell, sublicense, or redistribute the components themselves, whether
alone, in a bundle, or as a ported version.

No Warranty

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

## orbkit (SHDR-21)

Di [zzzzshawn](https://github.com/zzzzshawn) — <https://orbkit.vercel.app> ([sorgente](https://github.com/zzzzshawn/orbkit)).

File in `web/src/components/ui/`: `orbkit-core.tsx`, `shdr-21.tsx`. È la sfera di Sibilla, con i colori ambra dell'app (`web/src/Orb.tsx`).

```text
MIT License

Copyright (c) 2026 zzzzshawn

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```
