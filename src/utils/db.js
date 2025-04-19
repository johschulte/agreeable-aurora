// Utility zur Verbindung mit der PostgreSQL-Datenbank
import pg from "pg";
const { Pool } = pg;

// Datenbank-Verbindungspool erstellen
const pool = new Pool({
  connectionString:
    process.env.DB_CONNECTION ||
    "postgresql://jschulte@localhost:5432/theurllist",
});

// Grundlegende Funktion zum Ausführen von SQL-Abfragen
export async function query(text, params) {
  try {
    const client = await pool.connect();
    try {
      const result = await client.query(text, params);
      return result;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("Datenbankfehler:", error);
    throw error;
  }
}

// FR001, FR011: Funktionen für Listen
export async function getAllLists() {
  const result = await query("SELECT * FROM lists ORDER BY created_at DESC");
  return result.rows;
}

export async function getListBySlug(slug) {
  const listResult = await query("SELECT * FROM lists WHERE slug = $1", [slug]);

  if (listResult.rows.length === 0) {
    return null;
  }

  const list = listResult.rows[0];

  // Abrufen aller Links für diese Liste
  const linksResult = await query(
    "SELECT * FROM links WHERE list_id = $1 ORDER BY position ASC",
    [list.id]
  );

  // Liste mit allen Links zurückgeben
  return {
    ...list,
    links: linksResult.rows,
  };
}

export async function createList(title, description, slug) {
  const result = await query(
    "INSERT INTO lists (title, description, slug) VALUES ($1, $2, $3) RETURNING *",
    [title, description, slug]
  );

  return result.rows[0];
}

export async function updateList(id, title, description, slug) {
  const result = await query(
    "UPDATE lists SET title = $1, description = $2, slug = $3, updated_at = CURRENT_TIMESTAMP WHERE id = $4 RETURNING *",
    [title, description, slug, id]
  );

  return result.rows[0];
}

// FR012: Löschen einer Liste
export async function deleteList(id) {
  await query("DELETE FROM lists WHERE id = $1", [id]);
  return true;
}

// FR002, FR003, FR004, FR005: Funktionen für Links
export async function addLinkToList(
  listId,
  url,
  title,
  description,
  image = null
) {
  // Bestimme die höchste Position in der Liste
  const positionResult = await query(
    "SELECT COALESCE(MAX(position), -1) + 1 as next_position FROM links WHERE list_id = $1",
    [listId]
  );
  const position = positionResult.rows[0].next_position || 0;

  const result = await query(
    "INSERT INTO links (list_id, url, title, description, image, position) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *",
    [listId, url, title, description, image, position]
  );

  return result.rows[0];
}

export async function updateLink(id, url, title, description, image = null) {
  const result = await query(
    "UPDATE links SET url = $1, title = $2, description = $3, image = $4, updated_at = CURRENT_TIMESTAMP WHERE id = $5 RETURNING *",
    [url, title, description, image, id]
  );

  return result.rows[0];
}

export async function deleteLink(id) {
  await query("DELETE FROM links WHERE id = $1", [id]);
  return true;
}

export async function updateLinkPosition(id, newPosition) {
  const linkResult = await query("SELECT list_id FROM links WHERE id = $1", [
    id,
  ]);

  if (linkResult.rows.length === 0) {
    throw new Error("Link not found");
  }

  const listId = linkResult.rows[0].list_id;

  // Aktualisiere die Position des Links
  await query(
    "UPDATE links SET position = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2",
    [newPosition, id]
  );

  // Normalisiere alle Positionen in der Liste, um Lücken zu vermeiden
  const allLinks = await query(
    "SELECT id FROM links WHERE list_id = $1 ORDER BY position ASC",
    [listId]
  );

  // Aktualisiere die Positionen aller Links in der Liste
  for (let i = 0; i < allLinks.rows.length; i++) {
    await query("UPDATE links SET position = $1 WHERE id = $2", [
      i,
      allLinks.rows[i].id,
    ]);
  }

  return true;
}
