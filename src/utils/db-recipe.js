// Utility-Funktionen für die RecipeApp mit Supabase
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

// Lade Umgebungsvariablen aus der .env-Datei
dotenv.config();

// Supabase Client initialisieren
const supabaseUrl = "https://xwgimacebcllwnkktwqo.supabase.co";
const supabaseKey = process.env.SUPABASE_KEY
  ? process.env.SUPABASE_KEY.trim()
  : "";

export const supabase = createClient(supabaseUrl, supabaseKey);

// Hilfsfunktion zum normalisieren von URLs
export function normalizeUrl(url) {
  if (!url) return url;

  const trimmedUrl = url.trim();

  if (trimmedUrl.startsWith("http://") || trimmedUrl.startsWith("https://")) {
    return trimmedUrl;
  }

  return `https://${trimmedUrl}`;
}

// Dateityp-Validierung für PDF-Uploads
export function isPdfFile(file) {
  return file && file.type === "application/pdf";
}

// Dateityp-Validierung für Bild-Uploads
export function isImageFile(file) {
  return file && file.type.startsWith("image/");
}

// Dateigrößenvalidierung (in Bytes, 10MB Standard)
export function isFileSizeValid(file, maxSize = 10 * 1024 * 1024) {
  return file && file.size <= maxSize;
}

/*
 * RECIPES FUNCTIONS (FR001-FR009)
 */

// Alle Rezepte eines Benutzers abrufen
export async function getUserRecipes(userId, options = {}) {
  const {
    sortBy = "created_at",
    sortOrder = "desc",
    limit = 100,
    tags = [],
  } = options;

  try {
    let query;

    // Filtern nach Tags, wenn vorhanden
    if (tags && tags.length > 0) {
      // Verwende eine spezifische Abfrage mit INNER JOIN für Tag-Filterung
      query = supabase
        .from("recipes")
        .select(
          `
          *,
          ingredients(*),
          instructions(*),
          recipe_tags!inner(
            tag_id,
            tags(*)
          )
        `
        )
        .eq("user_id", userId)
        .in("recipe_tags.tag_id", tags);

      const { data, error } = await query
        .order(sortBy, { ascending: sortOrder === "asc" })
        .limit(limit);

      if (error) {
        throw error;
      }

      return data || [];
    } else {
      // Standardabfrage ohne Tag-Filter, aber mit LEFT JOIN für Tag-Informationen
      query = supabase
        .from("recipes")
        .select(
          `
          *,
          ingredients(*),
          instructions(*),
          recipe_tags(
            tag_id,
            tags(*)
          )
        `
        )
        .eq("user_id", userId);

      const { data, error } = await query
        .order(sortBy, { ascending: sortOrder === "asc" })
        .limit(limit);

      if (error) {
        throw error;
      }

      return data || [];
    }
  } catch (error) {
    console.error("Fehler beim Abrufen der Rezepte:", error);
    throw error;
  }
}

// Ein einzelnes Rezept nach ID abrufen
export async function getRecipeById(recipeId, userId) {
  try {
    const { data, error } = await supabase
      .from("recipes")
      .select(
        `
        *,
        ingredients(*),
        instructions(*, order: step_number),
        recipe_tags(
          tags(*)
        )
      `
      )
      .eq("id", recipeId)
      .eq("user_id", userId)
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error("Fehler beim Abrufen des Rezepts:", error);
    throw error;
  }
}

// Ein neues Rezept erstellen
export async function createRecipe(
  recipeData,
  ingredients = [],
  instructions = [],
  tags = []
) {
  try {
    // Beginne eine Transaktion mit dem Rezept
    const { data: recipe, error: recipeError } = await supabase
      .from("recipes")
      .insert([recipeData])
      .select()
      .single();

    if (recipeError) throw recipeError;

    // Füge Zutaten hinzu
    if (ingredients.length > 0) {
      const ingredientsWithRecipeId = ingredients.map((ingredient) => ({
        ...ingredient,
        recipe_id: recipe.id,
      }));

      const { error: ingredientsError } = await supabase
        .from("ingredients")
        .insert(ingredientsWithRecipeId);

      if (ingredientsError) throw ingredientsError;
    }

    // Füge Anweisungen hinzu
    if (instructions.length > 0) {
      const instructionsWithRecipeId = instructions.map((instruction) => ({
        ...instruction,
        recipe_id: recipe.id,
      }));

      const { error: instructionsError } = await supabase
        .from("instructions")
        .insert(instructionsWithRecipeId);

      if (instructionsError) throw instructionsError;
    }

    // Füge Tags hinzu
    if (tags.length > 0) {
      const recipeTags = tags.map((tagId) => ({
        recipe_id: recipe.id,
        tag_id: tagId,
      }));

      const { error: tagsError } = await supabase
        .from("recipe_tags")
        .insert(recipeTags);

      if (tagsError) throw tagsError;
    }

    return recipe;
  } catch (error) {
    console.error("Fehler beim Erstellen des Rezepts:", error);
    throw error;
  }
}

// Ein Rezept aktualisieren
export async function updateRecipe(
  recipeId,
  recipeData,
  ingredients = [],
  instructions = [],
  tags = []
) {
  try {
    // Aktualisiere Rezeptdaten
    const { error: recipeError } = await supabase
      .from("recipes")
      .update(recipeData)
      .eq("id", recipeId);

    if (recipeError) throw recipeError;

    // Lösche alte Zutaten
    const { error: deleteIngredientsError } = await supabase
      .from("ingredients")
      .delete()
      .eq("recipe_id", recipeId);

    if (deleteIngredientsError) throw deleteIngredientsError;

    // Füge neue Zutaten hinzu
    if (ingredients.length > 0) {
      const ingredientsWithRecipeId = ingredients.map((ingredient) => ({
        ...ingredient,
        recipe_id: recipeId,
      }));

      const { error: ingredientsError } = await supabase
        .from("ingredients")
        .insert(ingredientsWithRecipeId);

      if (ingredientsError) throw ingredientsError;
    }

    // Lösche alte Anweisungen
    const { error: deleteInstructionsError } = await supabase
      .from("instructions")
      .delete()
      .eq("recipe_id", recipeId);

    if (deleteInstructionsError) throw deleteInstructionsError;

    // Füge neue Anweisungen hinzu
    if (instructions.length > 0) {
      const instructionsWithRecipeId = instructions.map((instruction) => ({
        ...instruction,
        recipe_id: recipeId,
      }));

      const { error: instructionsError } = await supabase
        .from("instructions")
        .insert(instructionsWithRecipeId);

      if (instructionsError) throw instructionsError;
    }

    // Lösche alte Tags
    const { error: deleteTagsError } = await supabase
      .from("recipe_tags")
      .delete()
      .eq("recipe_id", recipeId);

    if (deleteTagsError) throw deleteTagsError;

    // Füge neue Tags hinzu
    if (tags.length > 0) {
      const recipeTags = tags.map((tagId) => ({
        recipe_id: recipeId,
        tag_id: tagId,
      }));

      const { error: tagsError } = await supabase
        .from("recipe_tags")
        .insert(recipeTags);

      if (tagsError) throw tagsError;
    }

    return { id: recipeId };
  } catch (error) {
    console.error("Fehler beim Aktualisieren des Rezepts:", error);
    throw error;
  }
}

// Ein Rezept löschen
export async function deleteRecipe(recipeId) {
  try {
    // Durch ON DELETE CASCADE in der Datenbank werden auch alle verknüpften Einträge gelöscht
    const { error } = await supabase
      .from("recipes")
      .delete()
      .eq("id", recipeId);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error("Fehler beim Löschen des Rezepts:", error);
    throw error;
  }
}

// Rezept aus URL importieren (FR001)
export async function importRecipeFromUrl(url, userId) {
  try {
    // Normalisiere URL
    const normalizedUrl = normalizeUrl(url);

    // Hier würde in einer vollständigen Implementation ein Webhook-Aufruf
    // an einen Service erfolgen, der die URL parst und Rezeptdaten extrahiert
    // Für diesen Prototyp geben wir ein Muster zurück

    return {
      success: true,
      message: "URL empfangen, Parsing läuft...",
      data: {
        url: normalizedUrl,
        user_id: userId,
        title: "Importiertes Rezept",
        description: "Automatisch importierte Beschreibung",
        prep_time_minutes: 15,
        cook_time_minutes: 30,
        servings: 4,
        source_url: normalizedUrl,
        ingredients: [
          { name: "Zutat 1", quantity: 100, unit: "g" },
          { name: "Zutat 2", quantity: 2, unit: "EL" },
        ],
        instructions: [
          { step_number: 1, description: "Erster Schritt" },
          { step_number: 2, description: "Zweiter Schritt" },
        ],
      },
    };
  } catch (error) {
    console.error("Fehler beim Importieren des Rezepts:", error);
    return {
      success: false,
      message: "Fehler beim Importieren des Rezepts: " + error.message,
    };
  }
}

/*
 * TAGS FUNCTIONS (FR016)
 */

// Alle Tags eines Benutzers abrufen
export async function getUserTags(userId) {
  try {
    const { data, error } = await supabase
      .from("tags")
      .select("*")
      .eq("user_id", userId)
      .order("name");

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error("Fehler beim Abrufen der Tags:", error);
    throw error;
  }
}

// Ein neues Tag erstellen
export async function createTag(userId, name) {
  try {
    const { data, error } = await supabase
      .from("tags")
      .insert([{ user_id: userId, name }])
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error("Fehler beim Erstellen des Tags:", error);
    throw error;
  }
}

/*
 * MEAL PLAN FUNCTIONS (FR010-FR015)
 */

// Alle Speisepläne eines Benutzers abrufen
export async function getUserMealPlans(userId) {
  try {
    const { data, error } = await supabase
      .from("meal_plans")
      .select("*")
      .eq("user_id", userId)
      .order("start_date", { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error("Fehler beim Abrufen der Speisepläne:", error);
    throw error;
  }
}

// Einen Speiseplan erstellen
export async function createMealPlan(userId, name, startDate, endDate) {
  try {
    const { data, error } = await supabase
      .from("meal_plans")
      .insert([
        {
          user_id: userId,
          name,
          start_date: startDate,
          end_date: endDate,
        },
      ])
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error("Fehler beim Erstellen des Speiseplans:", error);
    throw error;
  }
}

// Einen Speiseplan abrufen mit allen Einträgen
export async function getMealPlanWithItems(mealPlanId, userId) {
  try {
    const { data: mealPlan, error: mealPlanError } = await supabase
      .from("meal_plans")
      .select("*")
      .eq("id", mealPlanId)
      .eq("user_id", userId)
      .single();

    if (mealPlanError) throw mealPlanError;

    const { data: mealItems, error: itemsError } = await supabase
      .from("meal_plan_items")
      .select(
        `
        *,
        recipes(*)
      `
      )
      .eq("meal_plan_id", mealPlanId);

    if (itemsError) throw itemsError;

    return {
      ...mealPlan,
      items: mealItems || [],
    };
  } catch (error) {
    console.error("Fehler beim Abrufen des Speiseplans:", error);
    throw error;
  }
}

// Ein Rezept zum Speiseplan hinzufügen
export async function addRecipeToMealPlan(
  mealPlanId,
  recipeId,
  mealDate,
  mealType
) {
  try {
    const { data, error } = await supabase
      .from("meal_plan_items")
      .insert([
        {
          meal_plan_id: mealPlanId,
          recipe_id: recipeId,
          meal_date: mealDate,
          meal_type: mealType,
        },
      ])
      .select()
      .single();

    if (error) throw error;

    // Aktualisiere das "last_used_at" Datum im Rezept
    const { error: updateError } = await supabase
      .from("recipes")
      .update({ last_used_at: new Date() })
      .eq("id", recipeId);

    if (updateError) throw updateError;

    return data;
  } catch (error) {
    console.error("Fehler beim Hinzufügen des Rezepts zum Speiseplan:", error);
    throw error;
  }
}

// Ein Rezept aus dem Speiseplan entfernen
export async function removeRecipeFromMealPlan(mealPlanItemId) {
  try {
    const { error } = await supabase
      .from("meal_plan_items")
      .delete()
      .eq("id", mealPlanItemId);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error("Fehler beim Entfernen des Rezepts vom Speiseplan:", error);
    throw error;
  }
}

/*
 * SHOPPING LIST FUNCTIONS (FR017-FR018)
 */

// Alle Einkaufslisten eines Benutzers abrufen
export async function getUserShoppingLists(userId) {
  try {
    const { data, error } = await supabase
      .from("shopping_lists")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error("Fehler beim Abrufen der Einkaufslisten:", error);
    throw error;
  }
}

// Eine Einkaufsliste erstellen
export async function createShoppingList(userId, name, mealPlanId = null) {
  try {
    const { data, error } = await supabase
      .from("shopping_lists")
      .insert([
        {
          user_id: userId,
          meal_plan_id: mealPlanId,
          name,
        },
      ])
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error("Fehler beim Erstellen der Einkaufsliste:", error);
    throw error;
  }
}

// Eine Einkaufsliste mit Einträgen abrufen
export async function getShoppingListWithItems(shoppingListId, userId) {
  try {
    const { data: shoppingList, error: listError } = await supabase
      .from("shopping_lists")
      .select("*")
      .eq("id", shoppingListId)
      .eq("user_id", userId)
      .single();

    if (listError) throw listError;

    const { data: items, error: itemsError } = await supabase
      .from("shopping_list_items")
      .select("*")
      .eq("shopping_list_id", shoppingListId)
      .order("is_checked", { ascending: true })
      .order("display_order", { ascending: true });

    if (itemsError) throw itemsError;

    return {
      ...shoppingList,
      items: items || [],
    };
  } catch (error) {
    console.error("Fehler beim Abrufen der Einkaufsliste:", error);
    throw error;
  }
}

// Ein Element zur Einkaufsliste hinzufügen
export async function addItemToShoppingList(shoppingListId, item) {
  try {
    // Bestimme die nächste display_order
    const { data: maxOrderData, error: maxOrderError } = await supabase
      .from("shopping_list_items")
      .select("display_order")
      .eq("shopping_list_id", shoppingListId)
      .order("display_order", { ascending: false })
      .limit(1)
      .single();

    const nextOrder = maxOrderData ? maxOrderData.display_order + 1 : 0;

    const { data, error } = await supabase
      .from("shopping_list_items")
      .insert([
        {
          shopping_list_id: shoppingListId,
          name: item.name,
          quantity: item.quantity,
          unit: item.unit,
          category: item.category,
          display_order: nextOrder,
        },
      ])
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error(
      "Fehler beim Hinzufügen des Elements zur Einkaufsliste:",
      error
    );
    throw error;
  }
}

// Ein Element in der Einkaufsliste aktualisieren
export async function updateShoppingListItem(itemId, updates) {
  try {
    const { data, error } = await supabase
      .from("shopping_list_items")
      .update(updates)
      .eq("id", itemId)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error(
      "Fehler beim Aktualisieren des Elements in der Einkaufsliste:",
      error
    );
    throw error;
  }
}

// Ein Element von der Einkaufsliste entfernen
export async function removeItemFromShoppingList(itemId) {
  try {
    const { error } = await supabase
      .from("shopping_list_items")
      .delete()
      .eq("id", itemId);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error(
      "Fehler beim Entfernen des Elements von der Einkaufsliste:",
      error
    );
    throw error;
  }
}

// Einkaufsliste aus einem Speiseplan generieren
export async function generateShoppingListFromMealPlan(
  userId,
  mealPlanId,
  name = "Einkaufsliste"
) {
  try {
    // Erstelle eine neue Einkaufsliste
    const { data: shoppingList, error: listError } = await supabase
      .from("shopping_lists")
      .insert([
        {
          user_id: userId,
          meal_plan_id: mealPlanId,
          name,
        },
      ])
      .select()
      .single();

    if (listError) throw listError;

    // Hole alle Rezepte aus dem Speiseplan
    const { data: mealItems, error: mealItemsError } = await supabase
      .from("meal_plan_items")
      .select(
        `
        meal_plan_id,
        recipes(id)
      `
      )
      .eq("meal_plan_id", mealPlanId);

    if (mealItemsError) throw mealItemsError;

    // Extrahiere die Rezept-IDs
    const recipeIds = mealItems.map((item) => item.recipes.id);

    // Hole alle Zutaten für diese Rezepte
    const { data: ingredients, error: ingredientsError } = await supabase
      .from("ingredients")
      .select("*")
      .in("recipe_id", recipeIds);

    if (ingredientsError) throw ingredientsError;

    // Gruppiere und aggregiere Zutaten
    const groupedIngredients = {};
    ingredients.forEach((ingredient) => {
      const key = `${ingredient.name}-${ingredient.unit}`;
      if (!groupedIngredients[key]) {
        groupedIngredients[key] = {
          name: ingredient.name,
          quantity: 0,
          unit: ingredient.unit,
        };
      }
      groupedIngredients[key].quantity += ingredient.quantity || 0;
    });

    // Füge die aggregierten Zutaten zur Einkaufsliste hinzu
    let displayOrder = 0;
    const shoppingItems = Object.values(groupedIngredients).map(
      (ingredient) => ({
        shopping_list_id: shoppingList.id,
        name: ingredient.name,
        quantity: ingredient.quantity,
        unit: ingredient.unit,
        display_order: displayOrder++,
        is_checked: false,
      })
    );

    if (shoppingItems.length > 0) {
      const { error: insertError } = await supabase
        .from("shopping_list_items")
        .insert(shoppingItems);

      if (insertError) throw insertError;
    }

    return {
      ...shoppingList,
      itemCount: shoppingItems.length,
    };
  } catch (error) {
    console.error("Fehler beim Generieren der Einkaufsliste:", error);
    throw error;
  }
}

// Datei-Upload für Rezeptbilder
export async function uploadRecipeImage(userId, recipeId, file) {
  try {
    const filePath = `${userId}/recipes/${recipeId}/${Date.now()}_image`;

    const { data, error } = await supabase.storage
      .from("recipe-images")
      .upload(filePath, file, {
        upsert: true,
        contentType: file.type,
      });

    if (error) throw error;

    // Generiere die öffentliche URL für das Bild
    const { data: publicURL } = supabase.storage
      .from("recipe-images")
      .getPublicUrl(filePath);

    return {
      path: filePath,
      url: publicURL.publicUrl,
    };
  } catch (error) {
    console.error("Fehler beim Hochladen des Bildes:", error);
    throw error;
  }
}

// Funktion zum Speichern eines externen Bildlinks für ein Rezept
export async function saveRecipeImageUrl(recipeId, imageUrl) {
  try {
    // Validiere die URL (einfache Prüfung)
    const validUrl = normalizeUrl(imageUrl);

    if (!validUrl) {
      throw new Error("Ungültige Bild-URL");
    }

    // Aktualisiere nur das image_path Feld in der Datenbank
    const { error } = await supabase
      .from("recipes")
      .update({
        image_path: validUrl,
      })
      .eq("id", recipeId);

    if (error) throw error;

    return {
      url: validUrl,
    };
  } catch (error) {
    console.error("Fehler beim Speichern der Bild-URL:", error);
    throw error;
  }
}

// Datei-Upload für Rezept-PDFs
export async function uploadRecipePdf(userId, recipeId, file) {
  try {
    const filePath = `${userId}/recipes/${recipeId}/${Date.now()}_document.pdf`;

    const { data, error } = await supabase.storage
      .from("recipe-documents")
      .upload(filePath, file, {
        upsert: true,
        contentType: "application/pdf",
      });

    if (error) throw error;

    // Generiere die öffentliche URL für das PDF
    const { data: publicURL } = supabase.storage
      .from("recipe-documents")
      .getPublicUrl(filePath);

    return {
      path: filePath,
      url: publicURL.publicUrl,
    };
  } catch (error) {
    console.error("Fehler beim Hochladen des PDFs:", error);
    throw error;
  }
}
