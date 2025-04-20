// Ein einfaches Skript zum Testen der Datenbankverbindung und zum Erstellen von Tabellen
import pkg from 'pg';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const { Pool } = pkg;

// Lade Umgebungsvariablen
dotenv.config();

// Für ESM: __filename äquivalent erhalten
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function testConnection() {
  const pool = new Pool({
    connectionString: process.env.DB_CONNECTION,
    ssl: process.env.DB_CONNECTION?.includes('supabase.co') ? {
      rejectUnauthorized: false
    } : undefined
  });

  try {
    console.log('Versuche, eine Verbindung zur Datenbank herzustellen...');
    const client = await pool.connect();
    console.log('Verbindung erfolgreich hergestellt!');
    
    // Überprüfe, ob Tabellen existieren
    const tablesResult = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `);
    
    console.log('Vorhandene Tabellen:');
    if (tablesResult.rows.length === 0) {
      console.log('Keine Tabellen gefunden.');
      
      // Schema aus Datei lesen und ausführen
      console.log('Versuche, Schema aus schema.sql zu erstellen...');
      const schemaPath = path.resolve(__dirname, '../../..', 'schema.sql');
      
      if (fs.existsSync(schemaPath)) {
        console.log(`Schema-Datei gefunden unter: ${schemaPath}`);
        const schemaSql = fs.readFileSync(schemaPath, 'utf8');
        await client.query(schemaSql);
        console.log('Schema erfolgreich erstellt!');
      } else {
        console.error(`Schema-Datei nicht gefunden: ${schemaPath}`);
        console.log('Versuche alternative Pfade...');
        
        const possiblePaths = [
          path.resolve(process.cwd(), 'schema.sql'),
          path.resolve(process.cwd(), '..', 'schema.sql'),
          path.resolve(__dirname, '../..', 'schema.sql')
        ];
        
        for (const altPath of possiblePaths) {
          console.log(`Prüfe: ${altPath}`);
          if (fs.existsSync(altPath)) {
            console.log(`Schema-Datei gefunden unter: ${altPath}`);
            const schemaSql = fs.readFileSync(altPath, 'utf8');
            await client.query(schemaSql);
            console.log('Schema erfolgreich erstellt!');
            break;
          }
        }
      }
    } else {
      tablesResult.rows.forEach(row => {
        console.log(` - ${row.table_name}`);
      });
    }
    
    client.release();
  } catch (err) {
    console.error('Fehler bei der Verbindung zur Datenbank:', err);
    if (err.stack) {
      console.error(err.stack);
    }
  } finally {
    await pool.end();
  }
}

testConnection();