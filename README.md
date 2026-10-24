# PersonaLab

Školní aplikace pro porovnávání odpovědí AI osobností napříč modely z Ollamy. Řádky matice představují osobnosti, sloupce modely.

Frontend používá React, TypeScript a Vite, backend FastAPI. Osobnosti jsou uložené v JSON souborech, databáze není potřeba.

## Co potřebujete

- Python 3.14 a Node.js 24 — verze použité při vývoji.
- Nainstalovanou a spuštěnou [Ollamu](https://ollama.com/download).
- Alespoň jeden model stažený v Ollamě.

## Instalace

Naklonujte repozitář a otevřete jeho kořenovou složku. Následující příkazy jsou pro Windows PowerShell.

```powershell
python -m venv .venv
.\.venv\Scripts\python.exe -m pip install -r requirements.txt
npm --prefix client ci
```

## Spuštění

Ollama musí běžet na výchozí adrese `http://localhost:11434`. Ve Windows se obvykle spouští na pozadí; případně ji spusťte příkazem `ollama serve`.

V kořeni projektu spusťte backend:

```powershell
.\.venv\Scripts\python.exe -m uvicorn api.main:app --reload
```

Ve druhém terminálu, také z kořene projektu, spusťte frontend:

```powershell
npm --prefix client run dev
```

Otevřete [localhost:5173](http://localhost:5173), případně adresu vypsanou Vite. Backend běží na portu `8000` a frontend na něj přesměrovává požadavky `/api`.

## Použití

1. Pomocí **+** vyberte osobnosti a modely. Štítky odeberete tlačítkem **×**.
2. Napište otázku a klikněte na **Odeslat**.
3. V každé buňce uvidíte stav **Čeká**, **Generuje**, **Hotovo** nebo **Chyba**. Text odpovědi se zobrazuje průběžně.

Kombinace se zpracovávají postupně. **Přeskočit** přeruší aktuální buňku a pokračuje další. **Zastavit** ukončí celé porovnání a zachová už získaný text.

**Anonymní režim** skryje jména a popisy osobností v matici. Výběrové štítky zůstávají viditelné.

## Přidání osobnosti

Klikněte na **+** u osobností a zvolte **Vytvořit novou osobnost**. Vyplňte název, popis a system prompt, který určuje chování osobnosti.

Po uložení se osobnost rovnou vybere. Její konfigurace se uloží do složky `personas/` a zůstane dostupná i po obnovení stránky. Existující konfigurace se nepřepisují.

Osobnost lze přidat také ručně, například souborem `personas/badatel.json`:

```json
{
  "id": "badatel",
  "name": "Zvídavý badatel",
  "description": "Hledá důkazy a souvislosti",
  "system_prompt": "Odpovídej česky a stručně. Posuzuj otázky pomocí důkazů a jasně přiznávej nejistotu."
}
```

Název souboru musí odpovídat `id`. Používejte malá písmena bez diakritiky, číslice a pomlčky. Po ručním přidání obnovte stránku; restart backendu není potřeba.

## Přidání modelu

Modely se stahují přes Ollamu, například:

```powershell
ollama pull ministral-3:8b
ollama pull qwen3.5:9b
```

Další názvy najdete v [knihovně modelů Ollamy](https://ollama.com/library). Po stažení obnovte stránku a model vyberte přes **+** u modelů. Stahování modelů přímo v aplikaci není implementované.

## Struktura projektu

```text
api/              Backend a komunikace s Ollamou
client/           Webové rozhraní
personas/         JSON konfigurace osobností
requirements.txt  Python závislosti
```

Pokud aplikace hlásí nedostupnou Ollamu, ověřte, že běží a má stažený model. Rychlost a kvalita odpovědí závisí na vybraném modelu a hardwaru.
