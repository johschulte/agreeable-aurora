// Vereinfachtes Verbindungsskript
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

// Lade Umgebungsvariablen
dotenv.config();

// Neue RecipeApp Verbindungsdetails
const supabaseUrl = "https://xwgimacebcllwnkktwqo.supabase.co";
const supabaseKey = process.env.SUPABASE_KEY || "";
const supabase = createClient(supabaseUrl, supabaseKey);

async function testConnection() {
  try {
    console.log(
      "Versuche eine Verbindung zur RecipeApp-Datenbank herzustellen..."
    );
    console.log("Supabase URL:", supabaseUrl);

    // Überprüfe die Verbindung mit einer einfachen RPC-Abfrage
    const { data: versionData, error: versionError } = await supabase.rpc(
      "get_pg_version"
    );

    if (versionError) {
      console.log("Supabase RPC nicht verfügbar, aber das ist in Ordnung.");
    } else {
      console.log("PostgreSQL Version:", versionData);
    }

    console.log("\nVerbindung erfolgreich!");
    console.log(
      "Die 'recipes' Tabelle existiert noch nicht, das ist normal für eine neue Datenbank."
    );

    console.log("\nListe alle vorhandenen Tabellen...");

    const { data: publicTablesData, error: publicTablesError } = await supabase
      .from("information_schema.tables")
      .select("table_name")
      .eq("table_schema", "public");

    if (publicTablesError) {
      console.log(
        "Konnte Tabellen nicht auflisten:",
        publicTablesError.message
      );
      console.log(
        "Dies ist normal, wenn Sie keine Berechtigung für die information_schema haben."
      );
    } else if (publicTablesData && publicTablesData.length > 0) {
      console.log("Tabellen im 'public' Schema:");
      publicTablesData.forEach((table) => {
        console.log(` - ${table.table_name}`);
      });
    } else {
      console.log(
        "Keine Tabellen im 'public' Schema gefunden. Datenbank ist leer."
      );
    }

    console.log("\nNächste Schritte:");
    console.log("1. Schema für die RecipeApp erstellen");
    console.log("2. Tabellen in der Supabase SQL Editor anlegen");
    console.log(
      "3. Die Anwendung mit den korrekten Modellen und Funktionen entwickeln"
    );
  } catch (error) {
    console.error("Fehler bei der Verbindung:", error.message);
    console.error("Error details:", error);
    console.log("\nBitte überprüfen Sie Folgendes:");
    console.log("1. Ist der API-Schlüssel in der .env-Datei korrekt?");
    console.log("2. Stimmt die Supabase-URL mit Ihrem Projekt überein?");
    console.log(
      "3. Haben Sie in der .env-Datei die richtigen Daten nicht auskommentiert?"
    );
  }
}

testConnection();
