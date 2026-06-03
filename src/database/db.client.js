let worker = null;
let nextRequestId = 1;
const pendingRequests = {};
let databaseReadyResolver = null;
const databaseReadyPromise = new Promise((resolve) => {
  databaseReadyResolver = resolve;
});

export function initDatabase() {
  if (worker) return databaseReadyPromise;

  // Initialize web worker as a classic worker to support importScripts.
  worker = new Worker(new URL('./db.worker.js', import.meta.url));

  worker.onerror = (err) => {
    console.error("Client: Web Worker error:", err);
  };

  worker.onmessage = (event) => {
    const { id, type, results, error } = event.data;

    if (type === 'ready') {
      console.log("Client: Database is ready!");
      databaseReadyResolver();
      return;
    }

    if (type === 'error') {
      console.error("Client: Database error:", error);
      return;
    }

    // Resolve or reject the request promise
    if (pendingRequests[id]) {
      const { resolve, reject } = pendingRequests[id];
      delete pendingRequests[id];
      if (error) {
        reject(new Error(error));
      } else {
        resolve(results);
      }
    }
  };

  worker.postMessage({ type: 'init' });
  return databaseReadyPromise;
}

export function executeQuery(sql, params = []) {
  return databaseReadyPromise.then(() => {
    return new Promise((resolve, reject) => {
      const id = nextRequestId++;
      pendingRequests[id] = { resolve, reject };
      worker.postMessage({ id, type: 'query', sql, params });
    });
  });
}

// Queries the Banis table to get all available prayers
export function getBaniList(languageSetting = 'ENGLISH') {
  return executeQuery("SELECT ID, Gurmukhi, Transliterations FROM Banis WHERE ID <= 107 OR ID = 1000")
    .then((results) => {
      return results.map((row) => {
        let translitVal = "";
        try {
          const json = JSON.parse(row.Transliterations);
          // Match the language setting (default to en)
          if (languageSetting === 'HINDI') translitVal = json.hi;
          else if (languageSetting === 'SHAHMUKHI') translitVal = json.ur;
          else if (languageSetting === 'IPA') translitVal = json.ipa;
          else translitVal = json.en;
        } catch (e) {
          translitVal = row.Transliterations;
        }

        return {
          id: row.ID,
          gurmukhi: row.Gurmukhi,
          translit: translitVal
        };
      });
    });
}

// Queries the shabad lines for a specific Bani ID and length setting
export function getShabad(shabadID, lengthSetting = 'MEDIUM') {
  let lengthColumn = 'existsMedium';
  if (lengthSetting === 'EXTRA_LONG') lengthColumn = 'existsBuddhaDal';
  else if (lengthSetting === 'LONG') lengthColumn = 'existsTaksal';
  else if (lengthSetting === 'SHORT') lengthColumn = 'existsSGPC';

  const sql = `
    SELECT ID, Seq, header, Paragraph, Gurmukhi, Visraam, Transliterations, Translations 
    FROM mv_Banis_Shabad 
    WHERE Bani = ? AND ${lengthColumn} = 1 AND (MangalPosition IS NULL OR MangalPosition = 'current')
    ORDER BY Seq ASC;
  `;

  return executeQuery(sql, [shabadID]);
}
