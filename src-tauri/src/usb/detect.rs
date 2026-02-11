use std::path::PathBuf;

use sysinfo::Disks;

use crate::error::AppError;
use crate::git::repository::{discover_bare_repos, get_repository_info};
use crate::types::UsbDevice;

pub fn list_usb_devices() -> Result<Vec<UsbDevice>, AppError> {
    let disks = Disks::new_with_refreshed_list();
    let mut devices = Vec::new();

    for disk in disks.list() {
        if !disk.is_removable() {
            continue;
        }

        let mount_point = disk.mount_point().to_string_lossy().to_string();
        let label = disk.name().to_string_lossy().to_string();
        let uuid = None;

        devices.push(UsbDevice {
            label,
            mount_point,
            uuid,
            repositories: Vec::new(),
        });
    }

    Ok(devices)
}

pub fn scan_device_for_repos(mount_point: &str) -> Result<UsbDevice, AppError> {
    let path = PathBuf::from(mount_point);
    if !path.exists() {
        return Err(AppError::Usb(format!(
            "Mount point does not exist: {mount_point}"
        )));
    }

    let bare_repos = discover_bare_repos(&path, 3)?;
    let repositories = bare_repos
        .iter()
        .filter_map(|repo_path| get_repository_info(repo_path).ok())
        .collect();

    let disks = Disks::new_with_refreshed_list();
    let disk = disks
        .list()
        .iter()
        .find(|d| d.mount_point().to_string_lossy() == mount_point);

    let label = disk
        .map(|d| d.name().to_string_lossy().to_string())
        .unwrap_or_else(|| "Unknown".to_string());

    Ok(UsbDevice {
        label,
        mount_point: mount_point.to_string(),
        uuid: None,
        repositories,
    })
}
