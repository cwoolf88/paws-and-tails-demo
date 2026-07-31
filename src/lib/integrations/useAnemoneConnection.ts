"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { runAnemoneBridge } from "@/lib/integrations/primaryBridgePopup";
import {
  createAnemoneIntegration,
  type ContactSyncDisplayState,
  type IntegrationSimulationScenario,
  type AnemoneIntegrationHandle,
  type AnemoneIntegrationState,
} from "anemone-server-js/embed";
import { armIntegrationSimulationScenario } from "@/lib/integrations/armSimulationScenario";
import { fetchAnemoneConnection } from "@/lib/integrations/fetchAnemoneConnection";
import { PLATFORM_NAME, TENANT_NAME } from "@/lib/config";

const initialState: AnemoneIntegrationState = {
  connection: {
    loading: true,
    error: null,
    info: null,
    connected: false,
    autoConnected: false,
    signedIntoPrimary: false,
    primaryEmail: null,
    merchantSettingsPath: null,
    statusLoading: false,
  },
  sync: { status: "idle" },
  syncBusy: false,
  tenantName: TENANT_NAME,
  productName: PLATFORM_NAME,
  sessionPoll: { active: false, timedOut: false, phase: null },
  addressChangeHold: null,
};

type Options = {
  enableSync?: boolean;
};

export function useAnemoneConnection(options: Options = {}) {
  const integrationRef = useRef<AnemoneIntegrationHandle | null>(null);
  const syncRetryRef = useRef<(() => Promise<void> | void) | null>(null);
  const [state, setState] = useState<AnemoneIntegrationState>(initialState);

  useEffect(() => {
    const integration = createAnemoneIntegration({
      tenantName: TENANT_NAME,
      productName: PLATFORM_NAME,
      fetchConnection: () => fetchAnemoneConnection(),
      simulation: { armScenario: armIntegrationSimulationScenario },
      navigateToPrimary: (url, onComplete) => {
        runAnemoneBridge(url, async () => {
          await integration.refreshSession();
          await onComplete?.();
        });
      },
      sync: options.enableSync
        ? {
            initialState: { status: "idle" },
            onRetry: async () => {
              await syncRetryRef.current?.();
            },
          }
        : undefined,
      onChange: setState,
    });
    integrationRef.current = integration;

    return () => {
      integration.destroy();
      integrationRef.current = null;
    };
  }, [options.enableSync]);

  const setSyncState = useCallback((next: ContactSyncDisplayState) => {
    integrationRef.current?.setSyncState(next);
  }, []);

  const bindSyncRetry = useCallback((handler: (() => Promise<void> | void) | null) => {
    syncRetryRef.current = handler;
  }, []);

  const runSync = useCallback(() => integrationRef.current?.sync(), []);

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
    setSyncState,
    bindSyncRetry,
    reportSyncResult: (result: Parameters<AnemoneIntegrationHandle["reportSyncResult"]>[0]) =>
      integrationRef.current?.reportSyncResult(result),
    reportSyncError: (error: unknown) => integrationRef.current?.reportSyncError(error),
    sync: runSync,
  };
}
