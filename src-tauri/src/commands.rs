use std::path::PathBuf;

use crate::git::{clone, dag, diff, log, refs, repository};
use crate::types::{CloneResult, CommitDag, CommitInfo, CommitLogPage, RefInfo, RepositoryInfo, UsbDevice};
use crate::usb::detect;

#[tauri::command]
pub async fn get_repository_info(path: String) -> Result<RepositoryInfo, String> {
    let path = PathBuf::from(&path);
    repository::get_repository_info(&path).map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn discover_repositories(root: String, max_depth: Option<usize>) -> Result<Vec<RepositoryInfo>, String> {
    let root = PathBuf::from(&root);
    let depth = max_depth.unwrap_or(3);
    let repo_paths = repository::discover_bare_repos(&root, depth).map_err(|e| e.to_string())?;

    let repos = repo_paths
        .iter()
        .filter_map(|p| repository::get_repository_info(p).ok())
        .collect();

    Ok(repos)
}

#[tauri::command]
pub async fn get_commit_log(
    repo_path: String,
    start_oid: Option<String>,
    limit: Option<usize>,
) -> Result<CommitLogPage, String> {
    let path = PathBuf::from(&repo_path);
    let limit = limit.unwrap_or(50);
    log::get_commit_log(&path, start_oid.as_deref(), limit).map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn get_commit_detail(repo_path: String, oid: String) -> Result<CommitInfo, String> {
    let path = PathBuf::from(&repo_path);
    log::get_commit_detail(&path, &oid).map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn list_refs(repo_path: String) -> Result<Vec<RefInfo>, String> {
    let path = PathBuf::from(&repo_path);
    refs::list_refs(&path).map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn get_commit_dag(
    repo_path: String,
    max_commits: Option<usize>,
    branch_oid: Option<String>,
) -> Result<CommitDag, String> {
    let path = PathBuf::from(&repo_path);
    let max = max_commits.unwrap_or(200);
    dag::build_commit_dag(&path, max, branch_oid.as_deref()).map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn get_diff_text(
    repo_path: String,
    old_oid: String,
    new_oid: String,
) -> Result<String, String> {
    let path = PathBuf::from(&repo_path);
    diff::generate_unified_diff_text(&path, &old_oid, &new_oid).map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn get_commit_diff_text(repo_path: String, oid: String) -> Result<String, String> {
    let path = PathBuf::from(&repo_path);
    diff::diff_commit_to_parent(&path, &oid).map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn list_usb_devices() -> Result<Vec<UsbDevice>, String> {
    detect::list_usb_devices().map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn scan_usb_device(mount_point: String) -> Result<UsbDevice, String> {
    detect::scan_device_for_repos(&mount_point).map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn clone_repository(
    source_path: String,
    destination_dir: String,
    repo_name: Option<String>,
) -> Result<CloneResult, String> {
    let source = PathBuf::from(&source_path);
    let dest = PathBuf::from(&destination_dir);
    clone::clone_bare_to_local(&source, &dest, repo_name.as_deref()).map_err(|e| e.to_string())
}
