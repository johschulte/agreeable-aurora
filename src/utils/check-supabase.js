// Einfaches Skript zum Testen der Verbindung und Auflisten der Tabellen
import pg from "pg";
import dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";

// Lade Umgebungsvariablen
dotenv.config();

// Supabase Client initialisieren
const supabaseUrl = "https://vanrftomepwvzrhtbnzq.supabase.co";
const supabaseKey = process.env.SUPABASE_KEY
  ? process.env.SUPABASE_KEY.trim()
  : "";
const supabase = createClient(supabaseUrl, supabaseKey);

// Testen mit direkter Postgress-Verbindung
async function testPgConnection() {
  const pool = new pg.Pool({
    connectionString: process.env.DB_CONNECTION,
    ssl: {
      rejectUnauthorized: false,
    },
  });

  try {
    console.log(
      "Versuche, eine direkte Verbindung zur Datenbank herzustellen..."
    );
    const client = await pool.connect();
    console.log("Verbindung erfolgreich hergestellt!");

    // Überprüfe, ob Tabellen existieren
    const tablesResult = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `);

    console.log("Vorhandene Tabellen (via direkter PG-Verbindung):");
    if (tablesResult.rows.length === 0) {
      console.log("Keine Tabellen gefunden.");
    } else {
      tablesResult.rows.forEach((row) => {
        console.log(` - ${row.table_name}`);
      });
    }

    client.release();
  } catch (err) {
    console.error("Fehler bei der direkten Datenbankverbindung:", err.message);
  } finally {
    await pool.end();
  }
}

// Testen mit Supabase Client
async function testSupabaseConnection() {
  try {
    console.log(
      "Versuche, eine Verbindung via Supabase-Client herzustellen..."
    );

    // Versuche, die Liste von Tables zu bekommen
    const { data, error } = await supabase
      .from("pg_catalog.pg_tables")
      .select("tablename")
      .eq("schemaname", "public");

    if (error) {
      throw error;
    }

    console.log("Supabase-Verbindung erfolgreich hergestellt!");
    console.log("Vorhandene Tabellen (via Supabase-Client):");

    if (!data || data.length === 0) {
      console.log(
        "Keine Tabellen gefunden oder keine Berechtigung für die Abfrage."
      );

      // Versuche stattdessen eine einfache Abfrage an eine bekannte Tabelle
      console.log("Versuche, auf die 'lists' Tabelle zuzugreifen...");
      const { data: listsData, error: listsError } = await supabase
        .from("lists")
        .select("count")
        .limit(1);

      if (listsError) {
        if (listsError.code === "PGRST116") {
          console.log("Die 'lists' Tabelle existiert nicht.");
        } else {
          console.error(
            "Fehler beim Zugriff auf die 'lists' Tabelle:",
            listsError
          );
        }
      } else {
        console.log("Die 'lists' Tabelle existiert.");
      }
    } else {
      data.forEach((row) => {
        console.log(` - ${row.tablename}`);
      });
    }
  } catch (err) {
    console.error("Fehler bei der Supabase-Verbindung:", err.message);
  }
}

// Führe beide Tests aus
async function runTests() {
  console.log("=============================================");
  console.log("SUPABASE VERBINDUNGSTEST");
  console.log("=============================================");
  console.log("URL:", supabaseUrl);
  console.log("API-Key vorhanden:", supabaseKey ? "Ja" : "Nein");
  console.log(
    "Verbindungsstring:",
    process.env.DB_CONNECTION ? "Vorhanden" : "Nicht vorhanden"
  );

  await testSupabaseConnection();
  console.log("\n");
  await testPgConnection();
}

runTests();
