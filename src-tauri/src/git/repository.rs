use std::path::{Path, PathBuf};

use gix::open::Options;
use gix::ThreadSafeRepository;

use crate::error::AppError;
use crate::types::RepositoryInfo;

pub fn open_bare_repo(path: &Path) -> Result<gix::Repository, AppError> {
    let repo = ThreadSafeRepository::open_opts(path, Options::isolated().open_path_as_is(true))
        .map_err(|e| AppError::Git(e.to_string()))?
        .to_thread_local();

    if !repo.is_bare() {
        return Err(AppError::Git(format!(
            "Not a bare repository: {}",
            path.display()
        )));
    }

    Ok(repo)
}

pub fn get_repository_info(path: &Path) -> Result<RepositoryInfo, AppError> {
    let repo = open_bare_repo(path)?;
    let name = path
        .file_name()
        .map(|n| n.to_string_lossy().to_string())
        .unwrap_or_else(|| "unknown".to_string());

    let (head_oid, head_ref) = match repo.head_ref() {
        Ok(Some(reference)) => {
            let ref_name = reference.name().as_bstr().to_string();
            let oid = reference
                .into_fully_peeled_id()
                .ok()
                .map(|id| id.to_string());
            (oid, Some(ref_name))
        }
        _ => (None, None),
    };

    Ok(RepositoryInfo {
        path: path.to_string_lossy().to_string(),
        name,
        is_bare: true,
        head_oid,
        head_ref,
    })
}

pub fn discover_bare_repos(root: &Path, max_depth: usize) -> Result<Vec<PathBuf>, AppError> {
    let mut repos = Vec::new();
    discover_recursive(root, 0, max_depth, &mut repos)?;
    Ok(repos)
}

fn discover_recursive(
    dir: &Path,
    current_depth: usize,
    max_depth: usize,
    repos: &mut Vec<PathBuf>,
) -> Result<(), AppError> {
    if current_depth > max_depth {
        return Ok(());
    }

    if is_bare_repo(dir) {
        repos.push(dir.to_path_buf());
        return Ok(());
    }

    let entries = match std::fs::read_dir(dir) {
        Ok(entries) => entries,
        Err(_) => return Ok(()),
    };

    for entry in entries.flatten() {
        let path = entry.path();
        if path.is_dir() {
            discover_recursive(&path, current_depth + 1, max_depth, repos)?;
        }
    }

    Ok(())
}

fn is_bare_repo(dir: &Path) -> bool {
    dir.join("HEAD").is_file() && dir.join("objects").is_dir() && dir.join("refs").is_dir()
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::process::Command;
    use tempfile::TempDir;

    fn create_temp_bare_repo() -> TempDir {
        let tmp = TempDir::new().unwrap();
        Command::new("git")
            .args(["init", "--bare"])
            .arg(tmp.path())
            .output()
            .unwrap();
        tmp
    }

    #[test]
    fn test_is_bare_repo() {
        let tmp = create_temp_bare_repo();
        assert!(is_bare_repo(tmp.path()));
    }

    #[test]
    fn test_open_bare_repo() {
        let tmp = create_temp_bare_repo();
        let result = open_bare_repo(tmp.path());
        assert!(result.is_ok());
    }

    #[test]
    fn test_get_repository_info() {
        let tmp = create_temp_bare_repo();
        let info = get_repository_info(tmp.path()).unwrap();
        assert!(info.is_bare);
    }

    #[test]
    fn test_discover_bare_repos() {
        let root = TempDir::new().unwrap();
        let repo_dir = root.path().join("my-repo.git");
        std::fs::create_dir_all(&repo_dir).unwrap();
        Command::new("git")
            .args(["init", "--bare"])
            .arg(&repo_dir)
            .output()
            .unwrap();

        let repos = discover_bare_repos(root.path(), 3).unwrap();
        assert_eq!(repos.len(), 1);
    }
}
