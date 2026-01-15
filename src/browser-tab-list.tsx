import { List, Action, ActionPanel, open, getPreferenceValues, Icon, showToast, Toast } from "@raycast/api";
import { Client } from "pg";
import { useEffect, useState, useCallback } from "react";

interface BrowserTab {
  id: number;
  url: string;
  title: string;
  favicon: string | null;
  device_name: string;
  last_updated: Date;
}

interface Preferences {
  postgresConnectionString: string;
}

function DeviceDropdown(props: { devices: string[]; onDeviceChange: (device: string) => void }) {
  const { devices, onDeviceChange } = props;
  return (
    <List.Dropdown tooltip="Filter by Device" storeValue={true} onChange={onDeviceChange}>
      <List.Dropdown.Item key="all" title="All Devices" value="all" icon={Icon.Devices} />
      <List.Dropdown.Section title="Devices">
        {devices.map((device) => (
          <List.Dropdown.Item key={device} title={device} value={device} icon={Icon.Devices} />
        ))}
      </List.Dropdown.Section>
    </List.Dropdown>
  );
}

export default function Command() {
  const [tabs, setTabs] = useState<BrowserTab[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDevice, setSelectedDevice] = useState<string>("all");

  const fetchTabs = useCallback(async () => {
    const preferences = getPreferenceValues<Preferences>();
    const client = new Client({
      connectionString: preferences.postgresConnectionString,
    });

    try {
      setIsLoading(true);
      await client.connect();

      const result = await client.query<BrowserTab>("SELECT * FROM browser_tabs ORDER BY last_updated DESC");

      setTabs(result.rows);
      setError(null);
    } catch (err) {
      console.error("Failed to fetch tabs:", err);
      setError(String(err));
      await showToast({
        style: Toast.Style.Failure,
        title: "Failed to fetch tabs",
        message: String(err),
      });
    } finally {
      await client.end();
      setIsLoading(false);
    }
  }, []);

  const deleteTab = useCallback(async (tabId: number) => {
    const preferences = getPreferenceValues<Preferences>();
    const client = new Client({
      connectionString: preferences.postgresConnectionString,
    });

    try {
      await client.connect();
      await client.query("DELETE FROM browser_tabs WHERE id = $1", [tabId]);
      setTabs((prevTabs) => prevTabs.filter((tab) => tab.id !== tabId));
      await showToast({
        style: Toast.Style.Success,
        title: "Tab deleted",
      });
    } catch (err) {
      console.error("Failed to delete tab:", err);
      await showToast({
        style: Toast.Style.Failure,
        title: "Failed to delete tab",
        message: String(err),
      });
    } finally {
      await client.end();
    }
  }, []);

  useEffect(() => {
    fetchTabs();
  }, [fetchTabs]);

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

  const filteredTabsByDevice =
    selectedDevice === "all" ? tabsByDevice : { [selectedDevice]: tabsByDevice[selectedDevice] || [] };

  const filteredDeviceNames = Object.keys(filteredTabsByDevice).sort();

  if (error) {
    return (
      <List>
        <List.EmptyView
          icon={Icon.XMarkCircle}
          title="Error Loading Tabs"
          description={error}
          actions={
            <ActionPanel>
              <Action title="Retry" icon={Icon.ArrowClockwise} onAction={fetchTabs} />
            </ActionPanel>
          }
        />
      </List>
    );
  }

  return (
    <List
      isLoading={isLoading}
      searchBarPlaceholder="Search synced tabs..."
      searchBarAccessory={<DeviceDropdown devices={deviceNames} onDeviceChange={setSelectedDevice} />}
    >
      {tabs.length === 0 && !isLoading ? (
        <List.EmptyView
          icon={Icon.Globe}
          title="No Synced Tabs"
          description="Your synced browser tabs will appear here"
        />
      ) : (
        filteredDeviceNames.map((deviceName) => (
          <List.Section
            key={deviceName}
            title={deviceName}
            subtitle={`${filteredTabsByDevice[deviceName]?.length || 0} tabs`}
          >
            {filteredTabsByDevice[deviceName]?.map((tab) => (
              <List.Item
                key={tab.id}
                icon={tab.favicon || Icon.Link}
                title={tab.title || tab.url}
                subtitle={tab.url}
                accessories={[{ tag: { value: deviceName } }]}
                actions={
                  <ActionPanel>
                    <Action title="Open in Browser" icon={Icon.Globe} onAction={() => open(tab.url)} />
                    <Action.CopyToClipboard title="Copy URL" content={tab.url} />
                    <Action.CopyToClipboard title="Copy Title" content={tab.title || tab.url} />
                    <Action
                      title="Delete Tab"
                      icon={Icon.Trash}
                      style={Action.Style.Destructive}
                      shortcut={{ modifiers: ["cmd"], key: "d" }}
                      onAction={() => deleteTab(tab.id)}
                    />
                    <Action
                      title="Refresh Tabs"
                      icon={Icon.ArrowClockwise}
                      shortcut={{ modifiers: ["cmd"], key: "r" }}
                      onAction={fetchTabs}
                    />
                  </ActionPanel>
                }
              />
            ))}
          </List.Section>
        ))
      )}
    </List>
  );
}
