let banisCache = null;
let databaseReadyPromise = null;

export function initDatabase() {
  if (databaseReadyPromise) return databaseReadyPromise;

  databaseReadyPromise = fetch('/data/banis.json')
    .then((res) => {
      if (!res.ok) {
        throw new Error(`Failed to load banis index: ${res.statusText}`);
      }
      return res.json();
    })
    .then((data) => {
      banisCache = data;
      console.log("Client: Database index loaded successfully!");
    })
    .catch((err) => {
      console.error("Client: Failed to initialize static JSON database:", err);
      // Reset so initialization can be retried if needed
      databaseReadyPromise = null;
      throw err;
    });

  return databaseReadyPromise;
}

export function getBaniList(languageSetting = 'ENGLISH') {
  return initDatabase().then(() => {
    return banisCache.map((row) => {
      let translitVal = "";
      try {
        const json = typeof row.Transliterations === 'string'
          ? JSON.parse(row.Transliterations)
          : row.Transliterations;

        if (json) {
          if (languageSetting === 'HINDI') translitVal = json.hi;
          else if (languageSetting === 'SHAHMUKHI') translitVal = json.ur;
          else if (languageSetting === 'IPA') translitVal = json.ipa;
          else translitVal = json.en;
        }
      } catch {
        translitVal = row.Transliterations;
      }

      return {
        id: row.ID,
        gurmukhi: row.Gurmukhi,
        translit: translitVal || ""
      };
    });
  });
}

export function getShabad(shabadID, lengthSetting = 'MEDIUM') {
  let lengthColumn = 'existsMedium';
  if (lengthSetting === 'EXTRA_LONG') lengthColumn = 'existsBuddhaDal';
  else if (lengthSetting === 'LONG') lengthColumn = 'existsTaksal';
  else if (lengthSetting === 'SHORT') lengthColumn = 'existsSGPC';

  return fetch(`/data/banis/${shabadID}.json`)
    .then((res) => {
      if (!res.ok) {
        throw new Error(`Failed to load Bani ${shabadID}: ${res.statusText}`);
      }
      return res.json();
    })
    .then((lines) => {
      // Replicate SQLite query logic:
      // WHERE Bani = ? AND ${lengthColumn} = 1 AND (MangalPosition IS NULL OR MangalPosition = 'current')
      // ORDER BY Seq ASC
      return lines
        .filter((line) => {
          const matchesLength = line[lengthColumn] === 1;
          const matchesMangal = line.MangalPosition === null || line.MangalPosition === 'current';
          return matchesLength && matchesMangal;
        })
        .sort((a, b) => a.Seq - b.Seq)
        .map((line) => {
          // Serialize JSON fields back to strings to remain 100% compatible with Reader.jsx parser
          return {
            ID: line.ID,
            Seq: line.Seq,
            header: line.header,
            Paragraph: line.Paragraph,
            Gurmukhi: line.Gurmukhi,
            Visraam: line.Visraam && typeof line.Visraam === 'object' ? JSON.stringify(line.Visraam) : line.Visraam,
            Transliterations: line.Transliterations && typeof line.Transliterations === 'object' ? JSON.stringify(line.Transliterations) : line.Transliterations,
            Translations: line.Translations && typeof line.Translations === 'object' ? JSON.stringify(line.Translations) : line.Translations
          };
        });
    });
}
