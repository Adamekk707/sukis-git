mod commands;
mod error;
mod git;
mod types;
mod usb;

use commands::*;
use usb::watch::start_usb_watcher;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_dialog::init())
        .setup(|app| {
            start_usb_watcher(app.handle().clone());
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            get_repository_info,
            discover_repositories,
            get_commit_log,
            get_commit_detail,
            list_refs,
            get_commit_dag,
            get_diff_text,
            get_commit_diff_text,
            list_usb_devices,
            scan_usb_device,
            clone_repository,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
