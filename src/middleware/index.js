// Das ist eine Middleware zur Diagnose von Formularanfragen
export const onRequest = async (context, next) => {
  // Nur POST-Anfragen überwachen
  if (context.request.method === "POST") {
    const url = new URL(context.request.url);
    console.log(`Middleware: Verarbeite POST-Anfrage an ${url.pathname}`);

    // Prüfe den Content-Type Header
    const contentType = context.request.headers.get("content-type");
    console.log(`Middleware: Content-Type: ${contentType}`);

    // Klone die Anfrage, damit wir sie lesen können, ohne die Original-Anfrage zu konsumieren
    const clonedRequest = context.request.clone();

    try {
      // Versuche, die Formulardaten zu lesen
      const formData = await clonedRequest.formData();
      console.log("Middleware: FormData erfolgreich geparst");

      // Debug: Gib die Formularfelder aus
      const formEntries = {};
      for (const [key, value] of formData.entries()) {
        if (!formEntries[key]) {
          formEntries[key] = [];
        }
        formEntries[key].push(value);
      }
      console.log(
        "Middleware: Formularfelder:",
        JSON.stringify(formEntries, null, 2)
      );

      // Setze einige nützliche Diagnostikdaten in locals
      context.locals.formDataParsed = true;
      context.locals.formEntries = formEntries;
    } catch (error) {
      console.error(
        "Middleware: Fehler beim Parsen der FormData:",
        error.message
      );

      // Versuche, den Rohinhalt der Anfrage zu lesen
      try {
        const rawText = await clonedRequest.clone().text();
        console.log("Middleware: Rohdaten der Anfrage:", rawText);

        // Setze Fehlerinformationen in locals
        context.locals.formDataParsed = false;
        context.locals.formDataError = error.message;
        context.locals.rawRequestData = rawText;

        // Wenn dies ein URL-kodiertes Formular sein sollte, versuche, es manuell zu parsen
        if (contentType?.includes("application/x-www-form-urlencoded")) {
          try {
            const params = new URLSearchParams(rawText);
            const manualEntries = {};
            for (const [key, value] of params.entries()) {
              if (!manualEntries[key]) {
                manualEntries[key] = [];
              }
              manualEntries[key].push(value);
            }
            console.log(
              "Middleware: Manuell geparste Formularfelder:",
              JSON.stringify(manualEntries, null, 2)
            );
            context.locals.manualFormEntries = manualEntries;
          } catch (e) {
            console.error(
              "Middleware: Konnte Daten nicht manuell parsen:",
              e.message
            );
          }
        }
      } catch (textError) {
        console.error(
          "Middleware: Konnte Rohtext nicht lesen:",
          textError.message
        );
      }
    }
  }

  // Fahre mit der nächsten Middleware oder Route fort
  return next();
};
