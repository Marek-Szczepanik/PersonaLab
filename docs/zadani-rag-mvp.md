# PersonaLab — zadání pro Codex: doplnění RAG MVP

## Kontext

Pracuj v existujícím školním projektu PersonaLab:

E:\Uni\PersonaLab

Na projektu pracuje více lidí. Skutečné zdrojové dokumenty mohou dodat spolupracovníci později. Nyní potřebujeme malé funkční RAG MVP ověřitelné na několika krátkých demonstračních textech.

Nejdříve prohlédni aktuální projekt, jeho instrukce a necommitnuté změny. Pracuj přímo v souborech projektu a zachovej existující úpravy.

## Porovnání s původním zadáním

Původní iterace řešila především GUI a výběr person/modelů. Tento základ už je implementovaný.

| Oblast | Aktuální stav |
|---|---|
| Responzivní GUI a dynamická matice | Implementované |
| Výběr a odebírání person/modelů | Implementované |
| Vyhledávatelné nabídky přes `+` | Implementované |
| Vytváření person a ukládání do JSON | Implementované |
| Načítání modelů z Ollamy | Implementované |
| Generování odpovědí | Implementované nad rámec původní iterace |
| Streamování textu a stav každé buňky | Implementované |
| Přeskočení kombinace a zastavení běhu | Implementované |
| Anonymní režim | Skrývá jména a popisy v matici |
| Hodnocení 1–5 hvězdičkami | Neimplementované, nyní mimo rozsah |
| Plný anonymní kvíz | Neimplementovaný, nyní mimo rozsah |
| LangChain | Část závislostí nainstalovaná, zatím se nepoužívá |
| Embeddings, vektorové úložiště a RAG | Neimplementované, nový úkol |

Původní omezení „neimplementuj generování, RAG ani databázi“ patřilo první iteraci. Generování už funguje a novým úkolem je RAG s lokálním vektorovým úložištěm. Aplikační databázi pro účty nebo historii nyní nepřidávej.

## Současná architektura

- `client/` — React, TypeScript a Vite.
- Vite přesměrovává `/api` na FastAPI na portu 8000.
- `api/main.py` — registrace endpointů.
- `api/personas.py` — načítání a vytváření person.
- `api/comparison.py` — komunikace s Ollamou a streamování odpovědí.
- `personas/*.json` — konfigurace person.
- Jeden Python `.venv` a jeden `requirements.txt` v kořeni.
- Vývojové verze: Python 3.14 a Node.js 24.
- `langchain-core` a `langchain-ollama` už jsou v závislostech.
- Generování zatím používá přímo knihovnu `ollama`.

Existující API:

- `GET /api/health`
- `GET /api/models`
- `GET /api/personas`
- `POST /api/personas`
- `POST /api/compare`

`POST /api/compare` vrací proud NDJSON se stavy a textem odpovědi.

Frontend nyní volá jednotlivé kombinace persona × model samostatně a postupně. Každá buňka má vlastní stav:

- Čeká
- Generuje
- Hotovo
- Chyba
- Přeskočeno
- Zastaveno

Přeskočení a zastavení ruší HTTP požadavek. Backend při odpojení ruší probíhající operaci a uzavírá spojení s Ollamou. Již získaný text zůstává zobrazený.

Podporované přemýšlení modelu se nyní vypíná pro rychlejší odpovědi. Zachovej tuto funkčnost a respektuj možnosti jednotlivých modelů.

## Úkol této iterace

Doplň jednoduchý postup:

Otázka → vyhledání podkladů konkrétní persony → generování odpovědi s podklady.

Použij vhodné části LangChain pro práci s dokumenty, embeddings a vyhledávání. Funkční generování přes Ollamu není potřeba celé přepisovat.

### 1. Dokumenty přiřazené k personám

Použij strukturu:

```text
documents/
├── kant/
│   └── demo.txt
└── dalajlama/
    └── demo.txt
```

- Název podsložky odpovídá ID existující persony.
- Pro MVP podporuj pouze UTF-8 soubory `.txt`.
- Přidej několik krátkých demonstračních textů pro ověření.
- Jasně je označ jako demonstrační obsah, nikoli autentické citace osobností.
- Skutečné dokumenty musí jít později přidat nebo nahradit bez změny kódu.
- Nyní nehledej rozsáhlé zdrojové materiály; tuto práci mohou dělat ostatní členové týmu.

### 2. Indexace a embeddings

Přidej jeden příkaz spustitelný z kořene projektu, který:

1. Načte dokumenty.
2. Rozdělí je na menší úryvky.
3. Vytvoří embeddings přes vhodný embedding model v Ollamě.
4. Uloží úryvky a jejich embeddings do lokálního persistentního vektorového úložiště.

Požadavky:

- Zvol jednoduché řešení kompatibilní s Pythonem projektu.
- Bez dalšího databázového serveru nebo cloudové služby.
- Embedding model musí být konfigurovatelný a popsaný v README.
- Ke každému úryvku ulož ID persony, název souboru a identifikátor úryvku.
- Opakované spuštění indexace nesmí vytvářet duplicity.
- Změny a odstranění dokumentů se musí projevit po nové indexaci.
- Dokumenty neindexuj znovu při každé otázce.
- Generovaný index přidej do `.gitignore`.

### 3. Vyhledávání před generováním

- Pro otázku vyhledej několik relevantních úryvků.
- Vyhledávání vždy omez na konkrétní personu.
- Kant nesmí dostat dokumenty Dalajlamy a naopak.
- Úryvky přidej k existujícím instrukcím persony a otázce.
- Odděl obsah podkladů od instrukcí aplikace.
- Pokud podklady odpověď nepokrývají, model má tuto nejistotu přiznat.

Pro stejnou otázku a personu musí všechny porovnávané modely dostat stejné podklady.

Zohledni současné samostatné požadavky pro každou buňku. Vyhledávání a embeddings zbytečně neopakuj pro každý model. Použij jednoduché řešení bez rozsáhlého systému správy běhů.

### 4. Zobrazení podkladů

- U odpovědi stručně zobraz názvy souborů předaných modelu.
- Údaje o podkladech musí pocházet z backendového vyhledávání.
- Nespoléhej na názvy nebo citace vymyšlené modelem.
- Pro MVP nejsou potřeba náhledy dokumentů ani pokročilé citace.
- Existující stream rozšiř pouze o potřebná metadata.

### 5. Chybějící podklady a chyby

- Persona bez dokumentů dál funguje současným způsobem.
- Taková odpověď bude stručně označená „Bez podkladů“.
- Rozliš chybějící podklady od technické chyby.
- Pokud dokumenty existují, ale index není připravený, zobraz srozumitelnou informaci.
- Nedostupný embedding model nebo chyba úložiště nesmí být potichu vydávána za funkční RAG.
- Chyba jedné kombinace nesmí zablokovat ostatní.
- Přeskočení a zastavení musí fungovat i během přípravy podkladů.

## Zachování současného GUI

Zachovej:

- světlé jednoduché rozhraní s fialovým akcentem,
- řádky person a sloupce modelů,
- dynamický počet řádků a sloupců,
- použitelnost na mobilu,
- výběry přes `+` a odebírání přes `×`,
- vytváření person,
- průběžný text a stavy jednotlivých buněk,
- přeskočení a zastavení,
- současný anonymní režim.

Nepřidávej slogany, úvodní marketingové bloky, boční návody, dekorativní štítky ani patičku. Tyto části byly na přání uživatele odstraněné.

## Pravidla implementace

- Každá React komponenta má vlastní `.tsx`.
- Typy, interface a props patří do `types/*Types.ts`.
- Požadavky frontendu centralizuj v `services/api.ts`.
- `App.tsx` slouží ke skládání komponent a sdílenému stavu.
- Komentáře a dokumentační komentáře piš česky.
- Názvy proměnných, funkcí a souborů nech anglicky.
- Zachovej jeden `.venv` a jeden `requirements.txt`.
- Přidávej jen nezbytné závislosti.
- Nevytvářej rozsáhlý refactoring.
- Zachovej bezpečné zacházení s ID a cestami k souborům.
- Nepřidávej do repozitáře regresní testy.
- Funkčnost přesto prakticky ověř.
- Po ověřování ukonči vlastní dočasné servery; neukončuj servery spuštěné uživatelem.

## Co nyní neimplementovat

- Upload a správu dokumentů přes UI.
- PDF, OCR nebo web scraping.
- Agenty, složité řetězce a pokročilý reranking.
- Fine-tuning modelů.
- Hodnocení odpovědí.
- Plný anonymní kvíz.
- Historii, export porovnání nebo uživatelské účty.
- Stahování generativních modelů přes UI.
- Redesign aplikace.

## README

Zachovej a podle potřeby aktualizuj:

- doporučení používat virtuální prostředí,
- vytvoření a aktivaci `.venv` pro Windows i Linux/macOS,
- instalaci závislostí,
- spuštění backendu a frontendu v oddělených terminálech,
- přidávání person a modelů.

Doplň:

- kam umístit dokumenty,
- jak stáhnout potřebný embedding model,
- jak spustit indexaci,
- kdy indexaci zopakovat,
- kde se ukládá index a jak ho případně obnovit.

## Akceptační kritéria

- Ukázkové dokumenty lze jedním příkazem zaindexovat.
- Index přetrvá restart backendu.
- Opakovaná indexace nevytváří duplicity.
- Změněné a odstraněné dokumenty se po nové indexaci správně projeví.
- Vyhledávání vrací pouze dokumenty dané persony.
- Nalezené úryvky se skutečně předávají generativnímu modelu.
- Modely ve stejném řádku porovnání dostanou stejné podklady.
- U odpovědi jsou zobrazené skutečně předané zdrojové soubory.
- Persona bez dokumentů funguje s označením „Bez podkladů“.
- Technické chyby RAG jsou srozumitelně odlišené.
- Streamování, přeskočení a zastavení zůstávají funkční.
- Frontend projde buildem a lintem.
- README obsahuje reprodukovatelný postup zprovoznění RAG.

Na konci stručně vypiš změněné soubory, výsledek ověření
a případná skutečně zbývající omezení MVP.
