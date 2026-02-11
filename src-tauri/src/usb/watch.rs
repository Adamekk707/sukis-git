use std::sync::{Arc, Mutex};
use std::thread;
use std::time::Duration;

use tauri::{AppHandle, Emitter};

use crate::usb::detect::list_usb_devices;

pub fn start_usb_watcher(app_handle: AppHandle) {
    let previous_mounts: Arc<Mutex<Vec<String>>> = Arc::new(Mutex::new(Vec::new()));

    thread::spawn(move || {
        loop {
            thread::sleep(Duration::from_secs(3));

            let current_devices = match list_usb_devices() {
                Ok(devices) => devices,
                Err(_) => continue,
            };

            let current_mounts: Vec<String> = current_devices
                .iter()
                .map(|d| d.mount_point.clone())
                .collect();

            let mut prev = previous_mounts.lock().unwrap();
            if *prev != current_mounts {
                *prev = current_mounts;
                let _ = app_handle.emit("usb-device-changed", &current_devices);
            }
        }
    });
}
