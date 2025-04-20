// Utility-Skript zum Einfügen von Testrezepten in die Datenbank
import { createRecipe, supabase, createTag } from "./db-recipe.js";
import dotenv from "dotenv";
import { v4 as uuidv4 } from "uuid";

// Lade Umgebungsvariablen aus der .env-Datei
dotenv.config();

// Der existierende Benutzer in der Datenbank
const DEMO_USER_ID = "ccce9083-2af5-49cf-90e4-f6e4d6e3fb98"; // test@example.com

// Beispiel-Tags für Rezepte
async function createTestTags(userId) {
  console.log("Erstelle Test-Tags...");
  const tags = [
    { name: "Vegetarisch" },
    { name: "Vegan" },
    { name: "Schnell" },
    { name: "Abendessen" },
    { name: "Mittagessen" },
    { name: "Dessert" },
    { name: "Frühstück" },
  ];

  const createdTags = [];
  for (const tag of tags) {
    try {
      // Prüfen, ob das Tag bereits existiert
      const { data: existingTag, error: checkError } = await supabase
        .from("tags")
        .select("*")
        .eq("name", tag.name)
        .eq("user_id", userId)
        .limit(1);

      if (!checkError && existingTag && existingTag.length > 0) {
        console.log(`Verwende existierendes Tag: ${tag.name}`);
        createdTags.push(existingTag[0]);
        continue;
      }

      const createdTag = await createTag(userId, tag.name);
      createdTags.push(createdTag);
      console.log(`Tag erstellt: ${tag.name}`);
    } catch (error) {
      console.error(`Fehler beim Erstellen des Tags:`, error);
      console.log(`Tag existiert möglicherweise bereits: ${tag.name}`);
    }
  }
  return createdTags;
}

// Beispiel-Rezepte
async function insertTestRecipes(userId, tags) {
  console.log("Füge Testrezepte hinzu...");

  // Sammle Tag IDs nach Namen für einfacheren Zugriff
  const tagMap = {};
  tags.forEach((tag) => {
    tagMap[tag.name.toLowerCase()] = tag.id;
  });

  // Rezept 1: Spaghetti Carbonara
  const spaghetti = {
    user_id: userId,
    title: "Spaghetti Carbonara",
    description:
      "Ein klassisches italienisches Pastagericht mit Ei, Käse, Pancetta und schwarzem Pfeffer.",
    prep_time_minutes: 10,
    cook_time_minutes: 20,
    servings: 4,
    notes: "Verwende Pecorino Romano für einen authentischeren Geschmack.",
    created_at: new Date(),
    updated_at: new Date(),
  };

  const spaghettiIngredients = [
    { name: "Spaghetti", quantity: 400, unit: "g" },
    { name: "Eier", quantity: 4, unit: "St" },
    { name: "Pancetta oder Guanciale", quantity: 150, unit: "g" },
    { name: "Pecorino Romano", quantity: 50, unit: "g" },
    { name: "Parmigiano Reggiano", quantity: 50, unit: "g" },
    { name: "Schwarzer Pfeffer", quantity: 2, unit: "TL" },
    { name: "Salz", quantity: 1, unit: "TL" },
  ];

  const spaghettiInstructions = [
    {
      step_number: 1,
      description:
        "Bringe einen großen Topf Salzwasser zum Kochen und gare die Spaghetti nach Packungsanweisung.",
    },
    {
      step_number: 2,
      description:
        "Schneide den Pancetta in kleine Würfel und brate ihn in einer großen Pfanne bei mittlerer Hitze, bis er knusprig ist.",
    },
    {
      step_number: 3,
      description:
        "Schlage in einer Schüssel die Eier auf und rühre die geriebenen Käsesorten und reichlich schwarzen Pfeffer ein.",
    },
    {
      step_number: 4,
      description:
        "Wenn die Pasta fertig ist, hebe einen halben Schöpflöffel Nudelwasser auf, gieße die Pasta ab und gib sie direkt in die Pfanne mit dem Pancetta.",
    },
    {
      step_number: 5,
      description:
        "Nimm die Pfanne vom Herd, gib die Ei-Käse-Mischung darüber und vermenge alles schnell. Das Ei sollte eine cremige Sauce bilden, aber nicht stocken.",
    },
    {
      step_number: 6,
      description:
        "Falls die Sauce zu dick ist, gib etwas von dem aufgehobenen Nudelwasser hinzu. Serviere sofort mit zusätzlichem geriebenem Käse und schwarzem Pfeffer.",
    },
  ];

  const spaghettiTags = [tagMap["abendessen"], tagMap["mittagessen"]].filter(
    Boolean
  );

  try {
    const carbonaraRecipe = await createRecipe(
      spaghetti,
      spaghettiIngredients,
      spaghettiInstructions,
      spaghettiTags
    );
    console.log(`Rezept erstellt: ${spaghetti.title}`);
  } catch (error) {
    console.error("Fehler beim Erstellen des Rezepts:", error);
  }

  // Rezept 2: Avocado-Toast
  const avocadoToast = {
    user_id: userId,
    title: "Avocado-Toast mit pochiertem Ei",
    description:
      "Ein nahrhaftes Frühstück mit cremiger Avocado und einem perfekt pochierten Ei.",
    prep_time_minutes: 10,
    cook_time_minutes: 5,
    servings: 2,
    notes:
      "Für eine vegane Variante das Ei weglassen und mit gerösteten Kichererbsen toppen.",
    created_at: new Date(),
    updated_at: new Date(),
  };

  const avocadoIngredients = [
    { name: "Vollkornbrot", quantity: 2, unit: "Scheiben" },
    { name: "Reife Avocado", quantity: 1, unit: "St" },
    { name: "Eier", quantity: 2, unit: "St" },
    { name: "Zitronensaft", quantity: 1, unit: "TL" },
    { name: "Chiliflocken", quantity: 0.5, unit: "TL" },
    { name: "Salz", quantity: 1, unit: "Prise" },
    { name: "Frischer Koriander", quantity: 1, unit: "EL" },
  ];

  const avocadoInstructions = [
    {
      step_number: 1,
      description: "Toaste das Brot in einem Toaster oder im Ofen.",
    },
    {
      step_number: 2,
      description:
        "Halbiere die Avocado, entferne den Kern und löffle das Fruchtfleisch in eine Schüssel.",
    },
    {
      step_number: 3,
      description:
        "Zerdrücke die Avocado mit einer Gabel, füge Zitronensaft, Salz und etwas Chiliflocken hinzu.",
    },
    {
      step_number: 4,
      description:
        "Bringe Wasser in einem Topf zum köcheln, füge einen Schuss Essig hinzu und schaukle mit einem Löffel das Wasser, um einen Wirbel zu erzeugen.",
    },
    {
      step_number: 5,
      description:
        "Schlage das Ei in eine kleine Schale, gleite es vorsichtig in den Wasserstrudel und pochiere es für 3-4 Minuten.",
    },
    {
      step_number: 6,
      description:
        "Streiche die Avocado-Mischung auf das getoastete Brot, lege das pochierte Ei darauf und garniere mit Koriander und weiteren Chiliflocken.",
    },
  ];

  const avocadoTags = [
    tagMap["vegetarisch"],
    tagMap["frühstück"],
    tagMap["schnell"],
  ].filter(Boolean);

  try {
    const avocadoRecipe = await createRecipe(
      avocadoToast,
      avocadoIngredients,
      avocadoInstructions,
      avocadoTags
    );
    console.log(`Rezept erstellt: ${avocadoToast.title}`);
  } catch (error) {
    console.error("Fehler beim Erstellen des Rezepts:", error);
  }

  // Rezept 3: Veganer Schokoladenkuchen
  const chocolateCake = {
    user_id: userId,
    title: "Veganer Schokoladenkuchen",
    description:
      "Ein saftiger, veganer Schokoladenkuchen, der ohne Eier und Milchprodukte auskommt.",
    prep_time_minutes: 15,
    cook_time_minutes: 30,
    servings: 8,
    notes:
      "Der Kuchen lässt sich gut einfrieren. Für zusätzlichen Geschmack eine Handvoll Schokoladenstückchen in den Teig geben.",
    created_at: new Date(),
    updated_at: new Date(),
  };

  const cakeIngredients = [
    { name: "Mehl", quantity: 300, unit: "g" },
    { name: "Zucker", quantity: 200, unit: "g" },
    { name: "Backkakao", quantity: 50, unit: "g" },
    { name: "Backpulver", quantity: 2, unit: "TL" },
    { name: "Natron", quantity: 1, unit: "TL" },
    { name: "Salz", quantity: 0.5, unit: "TL" },
    { name: "Pflanzenmilch", quantity: 300, unit: "ml" },
    { name: "Pflanzenöl", quantity: 100, unit: "ml" },
    { name: "Apfelessig", quantity: 1, unit: "EL" },
    { name: "Vanilleextrakt", quantity: 2, unit: "TL" },
  ];

  const cakeInstructions = [
    {
      step_number: 1,
      description:
        "Heize den Ofen auf 180°C vor und fette eine Kuchenform (etwa 20 cm Durchmesser) ein.",
    },
    {
      step_number: 2,
      description:
        "Vermische in einer großen Schüssel Mehl, Zucker, Kakao, Backpulver, Natron und Salz.",
    },
    {
      step_number: 3,
      description:
        "In einer separaten Schüssel vermische Pflanzenmilch, Öl, Essig und Vanilleextrakt.",
    },
    {
      step_number: 4,
      description:
        "Gieße die flüssigen Zutaten zu den trockenen und rühre alles gut durch, bis ein glatter Teig entsteht.",
    },
    {
      step_number: 5,
      description:
        "Gieße den Teig in die vorbereitete Kuchenform und backe ihn etwa 30 Minuten, oder bis ein Zahnstocher, den du in die Mitte steckst, sauber herauskommt.",
    },
    {
      step_number: 6,
      description:
        "Lass den Kuchen in der Form 10 Minuten abkühlen, dann stürze ihn auf ein Kuchengitter und lass ihn vollständig auskühlen.",
    },
  ];

  const cakeTags = [tagMap["vegan"], tagMap["dessert"]].filter(Boolean);

  try {
    const chocolateRecipe = await createRecipe(
      chocolateCake,
      cakeIngredients,
      cakeInstructions,
      cakeTags
    );
    console.log(`Rezept erstellt: ${chocolateCake.title}`);
  } catch (error) {
    console.error("Fehler beim Erstellen des Rezepts:", error);
  }
}

// Hauptfunktion zum Ausführen des Skripts
async function main() {
  try {
    console.log("Starte Einfügen der Testdaten...");

    // Prüfe die Supabase-Verbindung
    const { data, error } = await supabase.from("tags").select("count");
    if (error) {
      console.error("Fehler bei der Verbindung zur Datenbank:", error);
      return;
    }

    console.log("Datenbankverbindung erfolgreich!");
    console.log(`Verwende Benutzer-ID: ${DEMO_USER_ID}`);

    // Erstelle Test-Tags
    const tags = await createTestTags(DEMO_USER_ID);

    // Füge Testrezepte hinzu
    if (tags && tags.length > 0) {
      await insertTestRecipes(DEMO_USER_ID, tags);
    } else {
      console.log("Keine Tags erstellt oder gefunden, überspringe Rezepte");
    }

    console.log("Testdaten-Einfügevorgang abgeschlossen!");
  } catch (error) {
    console.error("Fehler beim Einfügen der Testdaten:", error);
  } finally {
    // Beende den Prozess
    process.exit(0);
  }
}

// Führe das Skript aus
main();
