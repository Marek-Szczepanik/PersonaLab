# PersonaLab

Webová aplikace pro porovnávání odpovědí AI osobností napříč jazykovými modely spuštěnými lokálně přes **Ollamu**. Uživatel položí jednu otázku a aplikace ji předá každé kombinaci vybrané osobnosti a modelu. Odpovědi se zobrazují průběžně v matici, kde řádky představují osobnosti a sloupce modely.

Jedná se o týmový školní projekt. Osobnosti jsou uložené v JSON souborech, aplikace nepotřebuje databázi ani cloudovou službu.

## Cíle projektu

- Porovnat, jak se liší odpovědi na stejnou otázku:
  - mezi osobnostmi se stejným modelem,
  - mezi modely se stejnou osobností.
- Umožnit snadné přidávání vlastních osobností a lokálních modelů bez úprav kódu.
- Nabídnout anonymní režim, který skryje jména osobností a omezí tak předpojatost při čtení odpovědí.
- Podložit odpovědi osobností vlastními dokumenty pomocí RAG (připravuje se).

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

# instalace Python závislostí
python -m pip install -r requirements.txt

# instalace frontendových závislostí
cd client
npm ci
cd ..

# stažení alespoň jednoho modelu do Ollamy
ollama pull qwen3.5:9b
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
  cd client
  npm run dev
  ```
- Otevřete [localhost:5173](http://localhost:5173).
- Pomocí **+** vyberte osobnosti a modely, štítky odeberete tlačítkem **×**. Napište otázku a klikněte na **Odeslat**.
- Každá buňka matice zobrazuje stav **Čeká**, **Generuje**, **Hotovo**, **Chyba**, **Přeskočeno** nebo **Zastaveno**. Text odpovědi se vypisuje průběžně.
- **Přeskočit** přeruší aktuální buňku a pokračuje další, **Zastavit** ukončí celé porovnání. Už získaný text zůstane zobrazený.
- **Anonymní režim** skryje jména a popisy osobností v matici.
- Aplikaci ukončíte pomocí `Ctrl+C` v terminálech backendu a frontendu.

## Přidání osobnosti

- V aplikaci klikněte na **+** u osobností a zvolte **Vytvořit novou osobnost**. Vyplňte název, popis a system prompt, který určuje chování osobnosti. Konfigurace se uloží do složky **personas/** a existující soubory se nikdy nepřepisují.
- Osobnost lze přidat také ručně, například souborem **personas/badatel.json**:
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

## Struktura projektu

- **api/** – backend FastAPI, správa osobností a komunikace s Ollamou
- **client/** – webové rozhraní v Reactu
- **personas/** – JSON konfigurace osobností
- **requirements.txt** – Python závislosti

## Použité technologie

- Python 3.14
- Node.js 24
- React 19.3 + TypeScript 6.0 – webové rozhraní
- Vite 8.3 – vývojový server a build frontendu
- ESLint 10 – kontrola kódu frontendu
- FastAPI 0.162 + Uvicorn 0.54 – backend a streamování odpovědí
- Pydantic 2.14 – validace požadavků a konfigurací osobností
- Ollama 0.6 – lokální běh a volání jazykových modelů
- LangChain Core 1.7 + LangChain Ollama 1.1 – základ pro práci s dokumenty a embeddings
