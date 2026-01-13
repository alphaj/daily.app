const DB_ENDPOINT = process.env.EXPO_PUBLIC_RORK_DB_ENDPOINT;
const DB_NAMESPACE = process.env.EXPO_PUBLIC_RORK_DB_NAMESPACE;
const DB_TOKEN = process.env.EXPO_PUBLIC_RORK_DB_TOKEN;

if (!DB_ENDPOINT || !DB_NAMESPACE || !DB_TOKEN) {
  console.error("[db] Missing database configuration");
}

interface QueryResult<T> {
  result: T[];
  status: string;
}

export async function dbQuery<T>(query: string, vars?: Record<string, unknown>): Promise<T[]> {
  if (!DB_ENDPOINT || !DB_NAMESPACE || !DB_TOKEN) {
    throw new Error("Database not configured");
  }

  const url = `${DB_ENDPOINT}/sql`;
  
  console.log("[db] executing query:", query.substring(0, 100));

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Accept": "application/json",
      "Authorization": `Bearer ${DB_TOKEN}`,
      "Surreal-NS": DB_NAMESPACE,
      "Surreal-DB": "main",
    },
    body: vars ? JSON.stringify({ query, vars }) : query,
  });

  if (!response.ok) {
    const text = await response.text();
    console.error("[db] query failed:", response.status, text);
    throw new Error(`Database query failed: ${response.status}`);
  }

  const data = await response.json() as QueryResult<T>[];
  console.log("[db] query result:", JSON.stringify(data).substring(0, 200));
  
  if (Array.isArray(data) && data.length > 0) {
    return data[0].result || [];
  }
  
  return [];
}

export async function dbCreate<T>(table: string, data: Record<string, unknown>): Promise<T | null> {
  const fields = Object.keys(data);
  const values = fields.map(f => {
    const val = data[f];
    if (typeof val === "string") return `"${val.replace(/"/g, '\\"')}"`;
    return val;
  });
  
  const query = `CREATE ${table} SET ${fields.map((f, i) => `${f} = ${values[i]}`).join(", ")}`;
  const result = await dbQuery<T>(query);
  return result[0] || null;
}

export async function dbSelect<T>(table: string, where?: string): Promise<T[]> {
  const query = where ? `SELECT * FROM ${table} WHERE ${where}` : `SELECT * FROM ${table}`;
  return dbQuery<T>(query);
}

export async function dbUpdate<T>(table: string, id: string, data: Record<string, unknown>): Promise<T | null> {
  const fields = Object.keys(data);
  const updates = fields.map(f => {
    const val = data[f];
    if (typeof val === "string") return `${f} = "${val.replace(/"/g, '\\"')}"`;
    return `${f} = ${val}`;
  }).join(", ");
  
  const query = `UPDATE ${id} SET ${updates}`;
  const result = await dbQuery<T>(query);
  return result[0] || null;
}

export async function dbDelete(id: string): Promise<void> {
  await dbQuery(`DELETE ${id}`);
}
