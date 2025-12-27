import { BrowserExtension, getPreferenceValues, showToast, Toast, LocalStorage } from "@raycast/api";
import { Client } from "pg";

export default async function command() {
  const deviceName = await LocalStorage.getItem<string>("deviceName");

  if (!deviceName) {
    await showToast({
      style: Toast.Style.Failure,
      title: "Device Name Not Set",
      message: "Please configure your device name in Settings first",
    });
    return;
  }

  const preferences = getPreferenceValues<Preferences>();
  const client = new Client({
    connectionString: preferences.postgresConnectionString,
  });

  try {
    await client.connect();

    // Initialize Schema
    await client.query(`
      CREATE TABLE IF NOT EXISTS browser_tabs (
        id SERIAL PRIMARY KEY,
        url TEXT NOT NULL UNIQUE,
        title TEXT,
        favicon TEXT,
        device_name TEXT NOT NULL,
        last_updated TIMESTAMP DEFAULT NOW()
      );
    `);

    const tabs = await BrowserExtension.getTabs();

    // Filter ignored URLs
    const ignoredList = (preferences.ignoredUrls || "")
      .split(",")
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    const activeTabs = tabs.filter((tab) => {
      if (!tab.url) return false;
      return !ignoredList.some((ignored) => tab.url.includes(ignored));
    });

    const activeUrls = activeTabs.map((t) => t.url);

    // 1. Remove closed tabs (tabs in DB that are NOT in current active list)
    // Only delete tabs belonging to this device
    if (activeUrls.length === 0) {
      await client.query("DELETE FROM browser_tabs WHERE device_name = $1", [deviceName]);
    } else {
      await client.query(
        `DELETE FROM browser_tabs WHERE device_name = $${activeUrls.length + 1} AND url NOT IN (${activeUrls.map((_, i) => `$${i + 1}`).join(",")})`,
        [...activeUrls, deviceName],
      );
    }

    // 2. Insert or update active tabs
    // Only insert if URL doesn't exist, only update if it belongs to this device
    for (const tab of activeTabs) {
      // Check if URL exists
      const existingTab = await client.query("SELECT device_name FROM browser_tabs WHERE url = $1", [tab.url]);

      if (existingTab.rows.length === 0) {
        // URL doesn't exist, insert new tab
        await client.query(
          `INSERT INTO browser_tabs (url, title, favicon, device_name) 
           VALUES ($1, $2, $3, $4)`,
          [tab.url, tab.title, tab.favicon, deviceName],
        );
      } else if (existingTab.rows[0].device_name === deviceName) {
        // URL exists and belongs to this device, update it
        await client.query(
          `UPDATE browser_tabs 
           SET title = $1, favicon = $2, last_updated = NOW() 
           WHERE url = $3 AND device_name = $4`,
          [tab.title, tab.favicon, tab.url, deviceName],
        );
      }
    }

    console.log(`Synced ${activeTabs.length} tabs to database.`);
  } catch (error) {
    console.error("Failed to sync tabs:", error);
    await showToast({
      style: Toast.Style.Failure,
      title: "Sync Failed",
      message: String(error),
    });
  } finally {
    await client.end();
  }
}
