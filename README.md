# Zakelijk Nieuws

Een persoonlijke nieuwsapp voor iPhone: het belangrijkste nieuws over startups en economie uit België, Europa en de rest van de wereld, uitgelegd in gewone taal, met wat het voor jou kan betekenen en altijd met de bronnen erbij.

## Starten op je iPhone

Je hebt een computer en een iPhone op hetzelfde wifi-netwerk nodig.

1. Installeer **Node.js** (LTS-versie) op je computer via https://nodejs.org, als dat nog niet gebeurd is.
2. Installeer **Expo Go** op je iPhone via de App Store.
3. Dubbelklik op `start.bat` in deze map. De eerste keer worden de pakketten geïnstalleerd; dat duurt enkele minuten. Vraagt Windows of Node.js door de firewall mag, kies dan "Toestaan".
4. Er verschijnt een QR-code. Scan die met de camera van je iPhone en open de link in Expo Go.
5. De briefing verschijnt vanzelf zodra er een is klaargezet. Je hoeft niets in te stellen.

Vindt je iPhone de computer niet? Sluit het venster en dubbelklik op `start-tunnel.bat`. Dat werkt ook als de toestellen elkaar op het netwerk niet zien.

De app werkt zolang het venster op je computer open blijft. Een versie die los van je computer draait, vraagt een Apple-ontwikkelaarsaccount of een Expo-account; dat is een volgende stap.

## Hoe het werkt

- **Koppen ophalen** doet je iPhone zelf, rechtstreeks bij de bronnen: bij het openen, telkens je terugkeert naar de app, en om de 15 minuten zolang ze open is.
- **De briefing** (uitleg, impact, kansen) wordt elke nacht klaargezet in `data/briefing.json`. Eerst haalt GitHub de koppen op (`.github/workflows/koppen.yml`), daarna schrijft Claude de briefing volgens `NACHT.md`. De app haalt het resultaat op.
- Wie overdag zelf een nieuwe analyse wil, kan in de app een eigen Anthropic API-sleutel invullen. Dat is niet nodig en kost geld per keer.

## Betrouwbaarheid

Geen enkele app kan garanderen dat nieuws volledig klopt. Deze app is zo gebouwd dat je alles kan nagaan:

- Nieuws komt alleen uit de vaste lijst in `src/lib/sources.ts`: gevestigde redacties, vakmedia en officiële instellingen.
- Links en bronnamen komen rechtstreeks uit de feed van de bron. Het model geeft alleen aan op welke artikels een verhaal steunt; een verwijzing naar een artikel dat niet bestaat, wordt weggegooid.
- "Wat gebeurt er" mag alleen feiten bevatten die in de aangeleverde artikels staan.
- Een groen label betekent dat minstens twee verschillende redacties hetzelfde melden. Twee feeds van dezelfde krant tellen als één bron.
- "Wat betekent dit voor jou" is interpretatie en staat in een apart kader.

## Voor ontwikkelaars

```bash
npm install
npm start          # ontwikkelserver
npm test           # logica: feeds lezen, planning, controle van het antwoord van Claude
npm run typecheck
npm run lint
```

| Bestand | Rol |
| --- | --- |
| `src/lib/sources.ts` | De lijst van bronnen |
| `src/lib/feeds.ts` | RSS/Atom ophalen en lezen |
| `src/lib/regels.ts` | De opdracht voor Claude en de controle van het antwoord |
| `src/lib/briefing.ts` | De klaargezette briefing ophalen |
| `scripts/` | De stappen van de nachtelijke briefing |
| `src/lib/schedule.ts` | Wanneer een analyse mag starten |
| `src/state/news.tsx` | Toestand van de app, automatisch verversen |
| `src/app/` | De drie schermen: Vandaag, Koppen, Instellingen |
