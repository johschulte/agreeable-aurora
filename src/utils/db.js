// Utility zur Verbindung mit der PostgreSQL-Datenbank und Supabase
import pg from "pg";
import dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";

// Lade Umgebungsvariablen aus der .env-Datei
dotenv.config();

// Supabase Client initialisieren
const supabaseUrl = "https://vanrftomepwvzrhtbnzq.supabase.co";
const supabaseKey = process.env.SUPABASE_KEY ? process.env.SUPABASE_KEY.trim() : "";

// Debug-Log für API-Schlüssel
console.log("Supabase URL:", supabaseUrl);
console.log("Supabase Key Länge:", supabaseKey.length);
console.log("Supabase Key Anfang:", supabaseKey.substring(0, 10) + "...");

export const supabase = createClient(supabaseUrl, supabaseKey);

// Originaler PostgreSQL-Pool als Fallback
const { Pool } = pg;

// Datenbank-Verbindungspool erstellen (als Fallback)
const pool = new Pool({
  connectionString:
    process.env.DB_CONNECTION ||
    "postgresql://jschulte@localhost:5432/theurllist",
  // Bei Verbindungen zu externen Datenbanken SSL aktivieren, wenn der Provider dies erfordert
  ...(process.env.DB_CONNECTION?.includes("amazonaws.com") ||
  process.env.DB_CONNECTION?.includes("elephantsql.com") ||
  process.env.DB_CONNECTION?.includes("supabase.co")
    ? { ssl: { rejectUnauthorized: false } }
    : {}),
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
  try {
    // Verwende Supabase-Client statt direkter SQL-Abfrage
    const { data, error } = await supabase
      .from("lists")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error("Fehler beim Abrufen aller Listen mit Supabase:", error);
    // Fallback zur alten Methode
    const result = await query("SELECT * FROM lists ORDER BY created_at DESC");
    return result.rows;
  }
}

export async function getListBySlug(slug) {
  try {
    // Verwende Supabase-Client für die Liste
    const { data: list, error: listError } = await supabase
      .from("lists")
      .select("*")
      .eq("slug", slug)
      .single();

    if (listError) throw listError;
    if (!list) return null;

    // Rufe Links für diese Liste ab
    const { data: links, error: linksError } = await supabase
      .from("links")
      .select("*")
      .eq("list_id", list.id)
      .order("position", { ascending: true });

    if (linksError) throw linksError;

    // Liste mit Links zurückgeben
    return {
      ...list,
      links: links || [],
    };
  } catch (error) {
    console.error(
      "Fehler beim Abrufen der Liste nach Slug mit Supabase:",
      error
    );
    // Fallback zur alten Methode
    return getListBySlugFallback(slug);
  }
}

// Fallback-Methode für getListBySlug (alte Implementierung)
async function getListBySlugFallback(slug) {
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
  try {
    // Verwende Supabase-Client
    const { data, error } = await supabase
      .from("lists")
      .insert([{ title, description, slug }])
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error("Fehler beim Erstellen einer Liste mit Supabase:", error);
    // Fallback zur alten Methode
    const result = await query(
      "INSERT INTO lists (title, description, slug) VALUES ($1, $2, $3) RETURNING *",
      [title, description, slug]
    );
    return result.rows[0];
  }
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
  try {
    // Bestimme die höchste Position in der Liste mit Supabase
    const { data: positionData, error: positionError } = await supabase
      .from('links')
      .select('position')
      .eq('list_id', listId)
      .order('position', { ascending: false })
      .limit(1);
    
    if (positionError) throw positionError;
    
    // Bestimme die nächste Position
    const position = positionData && positionData.length > 0 ? positionData[0].position + 1 : 0;
    
    // Füge den Link mit Supabase hinzu
    const { data, error } = await supabase
      .from('links')
      .insert([{ 
        list_id: listId, 
        url, 
        title, 
        description, 
        image,
        position
      }])
      .select()
      .single();
    
    if (error) throw error;
    return data;
  } catch (error) {
    console.error("Fehler beim Hinzufügen eines Links mit Supabase:", error);
    // Fallback zur alten Methode
    return addLinkToListFallback(listId, url, title, description, image);
  }
}

// Fallback-Methode für addLinkToList (alte Implementierung)
async function addLinkToListFallback(
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
  try {
    // Verwende Supabase für das Update
    const { data, error } = await supabase
      .from('links')
      .update({ url, title, description, image, updated_at: new Date() })
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  } catch (error) {
    console.error("Fehler beim Aktualisieren eines Links mit Supabase:", error);
    // Fallback zur alten Methode
    const result = await query(
      "UPDATE links SET url = $1, title = $2, description = $3, image = $4, updated_at = CURRENT_TIMESTAMP WHERE id = $5 RETURNING *",
      [url, title, description, image, id]
    );
    return result.rows[0];
  }
}

export async function deleteLink(id) {
  try {
    // Verwende Supabase zum Löschen
    const { error } = await supabase
      .from('links')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
    return true;
  } catch (error) {
    console.error("Fehler beim Löschen eines Links mit Supabase:", error);
    // Fallback zur alten Methode
    await query("DELETE FROM links WHERE id = $1", [id]);
    return true;
  }
}

export async function updateLinkPosition(id, newPosition) {
  try {
    // Zuerst Link-Informationen mit Supabase abrufen
    const { data: linkData, error: linkError } = await supabase
      .from('links')
      .select('list_id')
      .eq('id', id)
      .single();
    
    if (linkError) throw linkError;
    if (!linkData) throw new Error("Link not found");
    
    const listId = linkData.list_id;
    
    // Position des Links aktualisieren
    const { error: updateError } = await supabase
      .from('links')
      .update({ position: newPosition, updated_at: new Date() })
      .eq('id', id);
    
    if (updateError) throw updateError;
    
    // Alle Links in der Liste abrufen
    const { data: allLinks, error: allLinksError } = await supabase
      .from('links')
      .select('id')
      .eq('list_id', listId)
      .order('position', { ascending: true });
    
    if (allLinksError) throw allLinksError;
    
    // Positionen normalisieren
    for (let i = 0; i < allLinks.length; i++) {
      const { error: posError } = await supabase
        .from('links')
        .update({ position: i })
        .eq('id', allLinks[i].id);
      
      if (posError) throw posError;
    }
    
    return true;
  } catch (error) {
    console.error("Fehler beim Aktualisieren der Link-Position mit Supabase:", error);
    // Fallback zur alten Methode
    return updateLinkPositionFallback(id, newPosition);
  }
}

// Fallback-Methode für updateLinkPosition (alte Implementierung)
async function updateLinkPositionFallback(id, newPosition) {
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
