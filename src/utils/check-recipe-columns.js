// Mini-Skript zur Überprüfung der Spaltenstruktur der Rezepte-Tabelle
import { supabase } from "./db-recipe.js";
import dotenv from "dotenv";

// Lade Umgebungsvariablen
dotenv.config();

async function checkRecipeColumns() {
  console.log("Überprüfe Spaltenstruktur der Rezepte-Tabelle...");

  try {
    // Eine Abfrage ausführen, die Metadaten zurückgibt
    const { data, error } = await supabase.from("recipes").select("*").limit(1);

    if (error) {
      console.error("Fehler beim Abrufen der Testdaten:", error);
      return;
    }

    // Wenn wir einen Datensatz haben, können wir die Spalten sehen
    if (data && data.length > 0) {
      console.log("Spalten der Rezepte-Tabelle:");
      console.log(Object.keys(data[0]));
    } else {
      console.log(
        "Keine Daten in der Rezepte-Tabelle gefunden. Versuche, die Spalten aus der Fehlerbehandlung zu bekommen."
      );

      // Versuche, eine nicht existierende Spalte abzufragen, um Metadaten zu erhalten
      const { data: metaTest, error: metaError } = await supabase
        .from("recipes")
        .select("id, title, description, non_existent_column")
        .limit(1);

      if (metaError) {
        console.log("Fehler bei Metadaten-Test:", metaError);
      }
    }
  } catch (e) {
    console.error("Fehler beim Abrufen der Spaltenstruktur:", e);
  }
}

// Führe die Prüfung aus
checkRecipeColumns();
