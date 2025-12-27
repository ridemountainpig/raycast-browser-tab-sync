import { Form, ActionPanel, Action, showToast, Toast, LocalStorage, popToRoot } from "@raycast/api";
import { useState, useEffect } from "react";

export default function Command() {
  const [deviceName, setDeviceName] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadDeviceName();
  }, []);

  async function loadDeviceName() {
    const storedName = await LocalStorage.getItem<string>("deviceName");

    if (storedName) {
      setDeviceName(storedName);
    }
    setIsLoading(false);
  }

  async function handleSubmit(values: { deviceName: string }) {
    const name = values.deviceName;
    if (!name || name.trim() === "") {
      await showToast({
        style: Toast.Style.Failure,
        title: "Device Name Required",
        message: "Please enter a device name",
      });
      return;
    }

    try {
      await LocalStorage.setItem("deviceName", name.trim());
      await showToast({
        style: Toast.Style.Success,
        title: "Settings Saved",
        message: `Device name set to: ${name.trim()}`,
      });
      await popToRoot();
    } catch (error) {
      await showToast({
        style: Toast.Style.Failure,
        title: "Failed to Save",
        message: String(error),
      });
    }
  }

  if (isLoading) {
    return <Form isLoading={true} />;
  }

  return (
    <Form
      actions={
        <ActionPanel>
          <Action.SubmitForm title="Save Settings" onSubmit={handleSubmit} />
        </ActionPanel>
      }
    >
      <Form.TextField
        id="deviceName"
        title="Device Name"
        placeholder="e.g., MacBook Pro, Work PC"
        defaultValue={deviceName}
        info="This name identifies this device in the synced tabs list. It is stored locally and will not sync across devices."
      />
    </Form>
  );
}
