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
    console.error("[db] Database not configured - missing env vars");
    throw new Error("Database not configured");
  }

  const url = `${DB_ENDPOINT}/sql`;
  
  console.log("[db] executing query:", query.substring(0, 150));
  if (vars) {
    console.log("[db] with vars:", Object.keys(vars).join(", "));
  }

  try {
    let finalQuery = query;
    
    if (vars && Object.keys(vars).length > 0) {
      for (const [key, value] of Object.entries(vars)) {
        const placeholder = "$" + key;
        let replacement: string;
        
        if (typeof value === "string") {
          replacement = `"${value.replace(/"/g, '\\"')}"`;
        } else if (typeof value === "boolean") {
          replacement = value ? "true" : "false";
        } else if (value === null || value === undefined) {
          replacement = "null";
        } else {
          replacement = String(value);
        }
        
        finalQuery = finalQuery.split(placeholder).join(replacement);
      }
    }
    
    console.log("[db] final query:", finalQuery.substring(0, 200));
    
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "text/plain",
        "Accept": "application/json",
        "Authorization": `Bearer ${DB_TOKEN}`,
        "Surreal-NS": DB_NAMESPACE,
        "Surreal-DB": "main",
      },
      body: finalQuery,
    });

    if (!response.ok) {
      const text = await response.text();
      console.error("[db] query failed:", response.status, text);
      throw new Error(`Database query failed: ${response.status} - ${text}`);
    }

    const data = await response.json() as QueryResult<T>[];
    console.log("[db] query result:", JSON.stringify(data).substring(0, 300));
    
    if (Array.isArray(data) && data.length > 0) {
      const result = data[0];
      if (result.status === "ERR") {
        console.error("[db] query returned error:", result);
        throw new Error(`Database query error: ${JSON.stringify(result)}`);
      }
      return result.result || [];
    }
    
    return [];
  } catch (error) {
    console.error("[db] query exception:", error);
    throw error;
  }
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
