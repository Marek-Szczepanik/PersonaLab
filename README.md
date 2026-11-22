# PersonaLab

Webová aplikace pro porovnávání odpovědí AI osobností napříč jazykovými modely spuštěnými lokálně přes **Ollamu**. Uživatel položí jednu otázku a aplikace ji předá každé kombinaci vybrané osobnosti a modelu. Odpovědi se zobrazují průběžně v matici, kde řádky představují osobnosti a sloupce modely.

Jedná se o týmový školní projekt. Osobnosti jsou uložené v JSON souborech, aplikace nepotřebuje databázi ani cloudovou službu.

## Cíle projektu

- Porovnat, jak se liší odpovědi na stejnou otázku:
  - mezi osobnostmi se stejným modelem,
  - mezi modely se stejnou osobností.
- Umožnit snadné přidávání vlastních osobností a lokálních modelů bez úprav kódu.
- Nabídnout anonymní režim, který skryje jména osobností a omezí tak předpojatost při čtení odpovědí.
- Podložit odpovědi osobností vlastními dokumenty pomocí RAG.

## Instalace

Je potřeba mít nainstalovaný Git, Python 3.14, Node.js 24 a [Ollamu](https://ollama.com/download). Pro Python závislosti doporučuji použít virtuální prostředí **.venv**, aby byly oddělené od ostatních projektů a systémové instalace Pythonu. Instalace se provádí jen jednou.

```bash
# naklonování repozitáře
git clone https://github.com/Marek-Szczepanik/PersonaLab.git
cd PersonaLab

# vytvoření a aktivace virtuálního prostředí
# Windows (PowerShell):
python -m venv .venv
.\.venv\Scripts\Activate.ps1
# Linux/macOS:
python3 -m venv .venv
source .venv/bin/activate

# instalace Python závislostí včetně samotného projektu
python -m pip install -r requirements.txt

# instalace frontendových závislostí
cd src/client
npm ci
cd ../..

# stažení alespoň jednoho modelu do Ollamy
ollama pull qwen3.5:9b

# stažení embedding modelu a vytvoření indexu podkladů
ollama pull bge-m3
python -m api.rag
```

Pokud PowerShell odmítne spustit **Activate.ps1** kvůli zásadám spouštění skriptů, povolte skripty jen pro aktuální terminál a aktivaci zopakujte:

```bash
# Windows (PowerShell):
Set-ExecutionPolicy -Scope Process -ExecutionPolicy RemoteSigned
.\.venv\Scripts\Activate.ps1
```

## Použití projektu

Ollama, backend a frontend se spouštějí v tomto pořadí, každý ve vlastním terminálu otevřeném v kořeni repozitáře.

- Spusťte Ollamu:
  ```bash
  # ve Windows obvykle běží na pozadí, pak tento krok přeskočte
  ollama serve
  ```
- Spusťte backend:
  ```bash
  # Windows (PowerShell):
  .\.venv\Scripts\Activate.ps1
  # Linux/macOS:
  source .venv/bin/activate

  python -m uvicorn api.main:app --reload
  ```
- Spusťte frontend:
  ```bash
  cd src/client
  npm run dev
  ```
- Otevřete [localhost:5173](http://localhost:5173).
- Pomocí **+** vyberte osobnosti a modely, štítky odeberete tlačítkem **×**. Napište otázku a klikněte na **Odeslat**.
- Každá buňka matice zobrazuje stav **Čeká**, **Generuje**, **Hotovo**, **Chyba**, **Přeskočeno** nebo **Zastaveno**. Text odpovědi se vypisuje průběžně.
- **Přeskočit** přeruší aktuální buňku a pokračuje další, **Zastavit** ukončí celé porovnání. Už získaný text zůstane zobrazený.
- U každé odpovědi je uvedeno, z jakých souborů model dostal podklady, případně **Bez podkladů**.
- **Anonymní režim** skryje jména a popisy osobností v matici a u podkladů ukáže jen počet souborů.
- Aplikaci ukončíte pomocí `Ctrl+C` v terminálech backendu a frontendu.

## Přidání osobnosti

- V aplikaci klikněte na **+** u osobností a zvolte **Vytvořit novou osobnost**. Vyplňte název, popis a system prompt, který určuje chování osobnosti. Konfigurace se uloží do složky **data/personas/** a existující soubory se nikdy nepřepisují.
- Osobnost lze přidat také ručně, například souborem **data/personas/badatel.json**:
  ```json
  {
    "id": "badatel",
    "name": "Zvídavý badatel",
    "description": "Hledá důkazy a souvislosti",
    "system_prompt": "Odpovídej česky a stručně. Posuzuj otázky pomocí důkazů a jasně přiznávej nejistotu."
  }
  ```
- Název souboru musí odpovídat `id`. Používejte malá písmena bez diakritiky, číslice a pomlčky. Po ručním přidání stačí obnovit stránku, restart backendu není potřeba.

## Přidání modelu

- Modely se stahují přes Ollamu, další názvy najdete v [knihovně modelů Ollamy](https://ollama.com/library):
  ```bash
  ollama pull ministral-3:8b
  ollama pull qwen3.5:9b
  ```
- Po stažení obnovte stránku a model vyberte přes **+** u modelů. Stahování modelů přímo v aplikaci není implementované.

## Podklady osobností

- Podklady se ukládají jako textové soubory **.txt** v kódování UTF-8 do složky pojmenované podle `id` osobnosti:
  ```text
  data/documents/
  ├── kant/
  │   └── demo.txt
  └── dalajlama/
      └── demo.txt
  ```
- Soubory **demo.txt** jsou demonstrační texty pro ověření funkčnosti, nejde o autentické citace. Lze je libovolně nahradit nebo doplnit dalšími soubory bez úprav kódu.
- Po každém přidání, změně nebo odstranění dokumentu spusťte indexaci znovu:
  ```bash
  # spouštějte z kořene projektu s aktivovaným virtuálním prostředím
  python -m api.rag
  ```
- Indexace rozdělí dokumenty na úryvky, vytvoří jejich embeddings v Ollamě a uloží je do **data/rag_index/index.json**. Index se pokaždé sestaví celý znovu, takže neobsahuje duplicity ani smazané dokumenty. Složka **data/rag_index/** se do Gitu neukládá a lze ji kdykoli smazat a indexací vytvořit znovu.
- Výchozí embedding model je **bge-m3**. Jiný model nastavíte proměnnou prostředí před indexací:
  ```bash
  # Windows (PowerShell):
  $env:PERSONALAB_EMBED_MODEL = "jiny-model"
  # Linux/macOS:
  export PERSONALAB_EMBED_MODEL=jiny-model

  ollama pull jiny-model
  python -m api.rag
  ```
- Název použitého modelu se ukládá do indexu, aby vyhledávání vždy používalo stejný model jako indexace.
- Před každou odpovědí se v indexu vyhledají nejrelevantnější úryvky dané osobnosti a předají se modelu spolu s otázkou. Všechny modely v jednom řádku matice dostanou stejné podklady.
- Osobnost bez dokumentů funguje jako dřív. Pokud dokumenty existují, ale index chybí nebo nejde použít, zobrazí se u odpovědi chyba s návodem. Pokud se dokumenty od poslední indexace změnily, zobrazí se upozornění.

## Struktura projektu

- **src/api/** – backend FastAPI: **routers/** endpointy, **schemas/** datové třídy, **repositories/** práce se soubory person, **rag/** indexace podkladů
- **src/client/** – webové rozhraní v Reactu
- **data/personas/** – JSON konfigurace osobností
- **data/documents/** – textové podklady osobností
- **data/rag_index/** – vygenerovaný index podkladů, vzniká po indexaci
- **docs/** – dokumentace projektu
- **requirements.txt** – Python závislosti
- **pyproject.toml** – registrace složky src, aby šly příkazy spouštět z kořene projektu

## Použité technologie

- Python 3.14
- Node.js 24
- React 19.3 + TypeScript 6.0 – webové rozhraní
- Vite 8.3 – vývojový server a build frontendu
- ESLint 10 – kontrola kódu frontendu
- FastAPI 0.162 + Uvicorn 0.54 – backend a streamování odpovědí
- Pydantic 2.14 – validace požadavků a konfigurací osobností
- Ollama 0.6 – lokální běh a volání jazykových modelů
- LangChain Core 1.7 + LangChain Ollama 1.1 + LangChain Text Splitters 1.1 – dělení dokumentů, embeddings a vektorové úložiště
- NumPy 2.5 – výpočet podobnosti embeddings
