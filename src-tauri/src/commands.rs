use std::path::PathBuf;

use crate::git::{clone, dag, diff, init, log, refs, repository};
use crate::types::{AddRepoResult, CloneResult, CommitDag, CommitInfo, CommitLogPage, RefInfo, RepositoryInfo, SourceDetection, UsbDevice};
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
pub async fn detect_source_directory(source_path: String) -> Result<SourceDetection, String> {
    let path = PathBuf::from(&source_path);
    if !path.exists() {
        return Err(format!("Path does not exist: {source_path}"));
    }
    if !path.is_dir() {
        return Err(format!("Path is not a directory: {source_path}"));
    }

    let source_type = init::detect_source_type(&path);
    let suggested_name = init::suggest_repo_name(&path);

    Ok(SourceDetection {
        is_git_repo: matches!(source_type, init::SourceType::GitRepo),
        suggested_name,
        source_path,
    })
}

#[tauri::command]
pub async fn add_repository_to_usb(
    source_path: String,
    destination_dir: String,
    repo_name: String,
) -> Result<AddRepoResult, String> {
    let source = PathBuf::from(&source_path);
    let dest = PathBuf::from(&destination_dir);

    match init::detect_source_type(&source) {
        init::SourceType::GitRepo => {
            init::fork_repo_as_bare(&source, &dest, &repo_name).map_err(|e| e.to_string())
        }
        init::SourceType::PlainDirectory => {
            init::init_bare_from_directory(&source, &dest, &repo_name).map_err(|e| e.to_string())
        }
    }
}

#[tauri::command]
pub async fn remove_repository(repo_path: String) -> Result<(), String> {
    let path = PathBuf::from(&repo_path);
    if !path.exists() {
        return Err(format!("Path does not exist: {repo_path}"));
    }

    repository::open_bare_repo(&path).map_err(|e| e.to_string())?;

    std::fs::remove_dir_all(&path).map_err(|e| e.to_string())
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
