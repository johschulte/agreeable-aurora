// Skript zur Überprüfung der RecipeApp-Tabellen
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

// Lade Umgebungsvariablen
dotenv.config();

// RecipeApp Supabase-Client
const supabaseUrl = "https://xwgimacebcllwnkktwqo.supabase.co";
const supabaseKey = process.env.SUPABASE_KEY || "";
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkRecipeTables() {
  console.log("Überprüfe RecipeApp-Tabellen...");

  // Liste der Tabellen, die wir erwarten
  const expectedTables = [
    "recipes",
    "ingredients",
    "instructions",
    "tags",
    "recipe_tags",
    "meal_plans",
    "meal_plan_items",
    "shopping_lists",
    "shopping_list_items",
  ];

  // Ergebnisse sammeln
  const results = {
    foundTables: [],
    missingTables: [],
  };

  // Jede Tabelle prüfen
  for (const tableName of expectedTables) {
    try {
      // Versuche, aus der Tabelle zu selektieren (nur Anzahl, kein Inhalt)
      const { data, error } = await supabase
        .from(tableName)
        .select("*", { count: "exact", head: true });

      if (error) {
        if (error.code === "PGRST116") {
          // Tabelle existiert nicht
          results.missingTables.push(tableName);
          console.log(`❌ Tabelle '${tableName}' nicht gefunden`);
        } else {
          // Anderer Fehler
          console.log(`⚠️ Fehler bei Tabelle '${tableName}':`, error.message);
          results.missingTables.push(tableName);
        }
      } else {
        // Tabelle existiert!
        results.foundTables.push(tableName);
        console.log(`✅ Tabelle '${tableName}' existiert`);
      }
    } catch (e) {
      console.error(`⚠️ Ausnahme bei Tabelle '${tableName}':`, e.message);
      results.missingTables.push(tableName);
    }
  }

  // Zusammenfassung
  console.log("\n--- ZUSAMMENFASSUNG ---");
  console.log(
    `Gefundene Tabellen: ${results.foundTables.length}/${expectedTables.length}`
  );

  if (results.foundTables.length === expectedTables.length) {
    console.log(
      "🎉 Alle erwarteten Tabellen wurden gefunden! Das Schema wurde erfolgreich erstellt."
    );
  } else {
    console.log(
      "⚠️ Einige Tabellen fehlen. Möglicherweise gab es Probleme beim Ausführen des Schemas."
    );
  }
}

// Führe die Prüfung aus
checkRecipeTables();
