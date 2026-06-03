importScripts('/sql-wasm.js');

let db = null;

async function initDatabase() {
  try {
    const SQL = await initSqlJs({
      locateFile: (file) => `/${file}`
    });
    
    console.log("Fetching database...");
    const response = await fetch('/gutka_v01.db');
    if (!response.ok) {
      throw new Error(`Failed to fetch database: ${response.statusText}`);
    }
    const arrayBuffer = await response.arrayBuffer();
    const u8Array = new Uint8Array(arrayBuffer);
    
    db = new SQL.Database(u8Array);
    console.log("Database initialized successfully!");
    postMessage({ type: 'ready' });
  } catch (error) {
    console.error("Database initialization failed:", error);
    postMessage({ type: 'error', error: error.message });
  }
}

self.onmessage = async (event) => {
  const { id, type, sql, params } = event.data;
  
  if (type === 'init') {
    await initDatabase();
    return;
  }
  
  if (!db) {
    postMessage({ id, error: 'Database not initialized' });
    return;
  }
  
  try {
    if (type === 'query') {
      const stmt = db.prepare(sql);
      stmt.bind(params || []);
      const results = [];
      while (stmt.step()) {
        results.push(stmt.getAsObject());
      }
      stmt.free();
      postMessage({ id, results });
    }
  } catch (error) {
    console.error("SQL Execution failed:", error);
    postMessage({ id, error: error.message });
  }
};
