import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";
import type { AppSettings } from "../types/index.ts";
import { loadSettings, saveSettings, DEFAULT_SETTINGS } from "../config/settings.ts";

interface SettingsContextValue {
  settings: AppSettings;
  updateSettings: (settings: AppSettings) => Promise<void>;
  loading: boolean;
}

const SettingsContext = createContext<SettingsContextValue | null>(null);

interface SettingsProviderProps {
  children: ReactNode;
}

export function SettingsProvider({ children }: SettingsProviderProps) {
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSettings()
      .then(setSettings)
      .finally(() => setLoading(false));
  }, []);

  const updateSettings = useCallback(async (newSettings: AppSettings) => {
    await saveSettings(newSettings);
    setSettings(newSettings);
  }, []);

  return (
    <SettingsContext.Provider value={{ settings, updateSettings, loading }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings(): SettingsContextValue {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error("useSettings must be used within SettingsProvider");
  }
  return context;
}
