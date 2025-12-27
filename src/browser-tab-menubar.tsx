import { MenuBarExtra, open, getPreferenceValues, Icon, Color } from "@raycast/api";
import { Client } from "pg";
import { useEffect, useState } from "react";

interface BrowserTab {
  id: number;
  url: string;
  title: string;
  favicon: string | null;
  device_name: string;
  last_updated: Date;
}

export default function Command() {
  const [tabs, setTabs] = useState<BrowserTab[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchTabs();
  }, []);

  async function fetchTabs() {
    const preferences = getPreferenceValues<Preferences>();
    const client = new Client({
      connectionString: preferences.postgresConnectionString,
    });

    try {
      await client.connect();

      const result = await client.query<BrowserTab>("SELECT * FROM browser_tabs ORDER BY last_updated DESC");

      setTabs(result.rows);
      setError(null);
    } catch (err) {
      console.error("Failed to fetch tabs:", err);
      setError(String(err));
    } finally {
      await client.end();
      setIsLoading(false);
    }
  }

  if (error) {
    return (
      <MenuBarExtra
        icon={{ source: Icon.XMarkCircle, tintColor: Color.Red }}
        isLoading={false}
        tooltip="Error loading tabs"
      >
        <MenuBarExtra.Item title="Error loading tabs" />
        <MenuBarExtra.Item title={error} />
      </MenuBarExtra>
    );
  }

  const tabsByDevice = tabs.reduce(
    (acc, tab) => {
      if (!acc[tab.device_name]) {
        acc[tab.device_name] = [];
      }
      acc[tab.device_name].push(tab);
      return acc;
    },
    {} as Record<string, BrowserTab[]>,
  );

  const deviceNames = Object.keys(tabsByDevice).sort();

  return (
    <MenuBarExtra icon={{ source: "extension-icon.png" }} isLoading={isLoading} tooltip={`${tabs.length} synced tabs`}>
      {tabs.length === 0 ? (
        <MenuBarExtra.Item title="No synced tabs" />
      ) : (
        deviceNames.map((deviceName) => (
          <MenuBarExtra.Section key={deviceName} title={deviceName}>
            {tabsByDevice[deviceName].map((tab) => (
              <MenuBarExtra.Item
                key={tab.id}
                icon={tab.favicon || Icon.Link}
                title={tab.title || tab.url}
                tooltip={tab.url}
                onAction={() => open(tab.url)}
              />
            ))}
          </MenuBarExtra.Section>
        ))
      )}
      <MenuBarExtra.Separator />
      <MenuBarExtra.Item
        title="Refresh"
        icon={Icon.ArrowClockwise}
        shortcut={{ macOS: { modifiers: ["cmd"], key: "r" }, Windows: { modifiers: ["ctrl"], key: "r" } }}
        onAction={() => {
          setIsLoading(true);
          fetchTabs();
        }}
      />
    </MenuBarExtra>
  );
}
