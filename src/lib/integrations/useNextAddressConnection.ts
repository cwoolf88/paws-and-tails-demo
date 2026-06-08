"use client";

import { useEffect, useRef, useState } from "react";
import { runNextAddressBridge } from "@/lib/integrations/primaryBridgePopup";
import {
  createNextAddressIntegration,
  type IntegrationSimulationScenario,
  type NextAddressIntegrationHandle,
  type NextAddressIntegrationState,
} from "next-address-server-js/embed";
import { armIntegrationSimulationScenario } from "@/lib/integrations/armSimulationScenario";
import { fetchNextAddressConnection } from "@/lib/integrations/fetchNextAddressConnection";

const initialState: NextAddressIntegrationState = {
  connection: {
    loading: true,
    error: null,
    info: null,
    connected: false,
    signedIntoPrimary: false,
    primaryEmail: null,
    merchantSettingsPath: null,
    statusLoading: false,
  },
  sync: { status: "idle" },
  syncBusy: false,
  tenantName: "Paws and Tails",
  sessionPoll: { active: false, timedOut: false, phase: null },
  addressChangeHold: null,
};

export function useNextAddressConnection() {
  const integrationRef = useRef<NextAddressIntegrationHandle | null>(null);
  const [state, setState] = useState<NextAddressIntegrationState>(initialState);

  useEffect(() => {
    const integration = createNextAddressIntegration({
      tenantName: "Paws and Tails",
      fetchConnection: () => fetchNextAddressConnection(),
      simulation: { armScenario: armIntegrationSimulationScenario },
      navigateToPrimary: (url, onComplete) => {
        runNextAddressBridge(url, async () => {
          await integration.refreshSession();
          await onComplete?.();
        });
      },
      onChange: setState,
    });
    integrationRef.current = integration;

    return () => {
      integration.destroy();
      integrationRef.current = null;
    };
  }, []);

  const { connection, sync, syncBusy, sessionPoll } = state;

  return {
    info: connection.info,
    connected: connection.connected,
    signedIntoPrimary: connection.signedIntoPrimary,
    primaryEmail: connection.primaryEmail,
    merchantSettingsPath: connection.merchantSettingsPath,
    loading: connection.loading,
    statusLoading: connection.statusLoading,
    err: connection.error,
    syncState: sync,
    syncBusy,
    sessionPoll,
    isSessionPollRefreshVisible: () =>
      integrationRef.current?.isSessionPollRefreshVisible() ?? false,
    retryConnectSession: () => integrationRef.current?.retryConnectSession(),
    canArmSimulationScenario: () =>
      integrationRef.current?.canArmSimulationScenario() ?? false,
    armSimulationScenario: (scenario: IntegrationSimulationScenario) =>
      integrationRef.current?.armSimulationScenario(scenario),
    goToConnectAccount: () => integrationRef.current?.connectAccount(),
    goToDisconnect: () => integrationRef.current?.disconnect(),
    goToSettings: () => integrationRef.current?.openSettings(),
    refreshWidget: () => integrationRef.current?.refreshSession(),
    refresh: () => integrationRef.current?.refresh(),
    canConnectAccount: () => integrationRef.current?.canConnectAccount() ?? false,
    canDisconnect: () => integrationRef.current?.canDisconnect() ?? false,
    canOpenSettings: () => integrationRef.current?.canOpenSettings() ?? false,
    getSettingsUrl: () => integrationRef.current?.getSettingsUrl() ?? null,
    setSyncState: (next: typeof sync) => integrationRef.current?.setSyncState(next),
    reportSyncResult: (result: Parameters<NextAddressIntegrationHandle["reportSyncResult"]>[0]) =>
      integrationRef.current?.reportSyncResult(result),
    reportSyncError: (error: unknown) => integrationRef.current?.reportSyncError(error),
    sync: () => integrationRef.current?.sync(),
  };
}
