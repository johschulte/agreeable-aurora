// API-Route zum Überprüfen der Supabase-Datenbankverbindung
import { createClient } from "@supabase/supabase-js";

// Supabase Client initialisieren
const supabaseUrl = "https://vanrftomepwvzrhtbnzq.supabase.co";
const supabaseKey = process.env.SUPABASE_KEY
  ? process.env.SUPABASE_KEY.trim()
  : "";
const supabase = createClient(supabaseUrl, supabaseKey);

export async function GET() {
  try {
    // Überprüfe zuerst, ob die Verbindung grundsätzlich funktioniert
    const { data: pingData, error: pingError } = await supabase
      .from("lists")
      .select("count");

    let connectionStatus = {
      connected: pingError ? false : true,
      error: pingError ? pingError.message : null,
      errorCode: pingError ? pingError.code : null,
      tables: [],
    };

    // Wenn die Verbindung funktioniert, versuche alle Tabellen zu ermitteln
    if (!pingError || pingError.code === "PGRST116") {
      connectionStatus.connected = true;

      try {
        // Supabase RPC erlaubt es uns, eine PostgreSQL-Funktion aufzurufen
        const { data, error } = await supabase.rpc("get_all_tables");

        if (!error && data) {
          connectionStatus.tables = data;
        } else {
          // Fallback: Versuche, die Tabellen über eine direkte Abfrage zu ermitteln
          const { data: tablesData, error: tablesError } = await supabase
            .from("pg_tables")
            .select("tablename")
            .eq("schemaname", "public");

          if (!tablesError && tablesData) {
            connectionStatus.tables = tablesData.map((t) => t.tablename);
          }
        }
      } catch (e) {
        // Ignoriere Fehler bei der Tabellenabfrage, fokussiere auf die grundlegende Verbindung
        connectionStatus.tablesError = e.message;
      }
    }

    // Wenn keine Tabellen, prüfe spezifische Tabellen
    if (connectionStatus.tables.length === 0) {
      // Liste der zu prüfenden Tabellen
      const tablesToCheck = ["lists", "links"];

      for (const tableName of tablesToCheck) {
        const { error } = await supabase
          .from(tableName)
          .select("count")
          .limit(1);

        if (!error) {
          connectionStatus.tables.push(tableName);
        }
      }
    }

    return new Response(JSON.stringify(connectionStatus), {
      status: connectionStatus.connected ? 200 : 500,
      headers: {
        "Content-Type": "application/json",
      },
    });
  } catch (err) {
    return new Response(
      JSON.stringify({
        connected: false,
        error: err.message,
      }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
  }
}
