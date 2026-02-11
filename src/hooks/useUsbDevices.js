import { useEffect } from "react";
import useSWR from "swr";
import * as R from "ramda";
import { listen } from "@tauri-apps/api/event";
import { invoke } from "../lib/tauri";
import { SWR_KEYS } from "../lib/swr";

const fetchUsbDevices = () => invoke("list_usb_devices");

export function useUsbDevices() {
  const { data, error, isLoading, mutate } = useSWR(
    SWR_KEYS.USB_DEVICES,
    fetchUsbDevices,
  );

  useEffect(() => {
    const unlisten = listen("usb-device-changed", (event) => {
      mutate(R.prop("payload", event), { revalidate: false });
    });

    return () => {
      unlisten.then((fn) => fn());
    };
  }, [mutate]);

  const scanDevice = async (mountPoint) => {
    const scannedDevice = await invoke("scan_usb_device", { mountPoint });
    mutate(
      R.map(
        R.when(
          R.propEq(mountPoint, "mount_point"),
          R.always(scannedDevice),
        ),
      ),
      { revalidate: false },
    );
    return scannedDevice;
  };

  return {
    devices: R.defaultTo([], data),
    error,
    isLoading,
    refresh: mutate,
    scanDevice,
  };
}
