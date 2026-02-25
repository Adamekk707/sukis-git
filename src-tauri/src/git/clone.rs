use std::path::Path;

use tauri::AppHandle;

use crate::error::AppError;
use crate::git::repository::open_bare_repo;
use crate::progress::emit_progress;
use crate::types::CloneResult;

pub fn clone_bare_to_local(
    source: &Path,
    destination_dir: &Path,
    repo_name: Option<&str>,
    app_handle: Option<&AppHandle>,
) -> Result<CloneResult, AppError> {
    emit_progress(app_handle, "clone-progress", "clone.validating_source");
    open_bare_repo(source)?;

    let name = repo_name
        .map(String::from)
        .unwrap_or_else(|| {
            let raw = source
                .file_name()
                .map(|n| n.to_string_lossy().to_string())
                .unwrap_or_else(|| "repo".to_string());
            raw.strip_suffix(".git")
                .map(String::from)
                .unwrap_or(raw)
        });

    let dest_path = destination_dir.join(&name);

    if dest_path.exists()
        && std::fs::read_dir(&dest_path)
            .map(|mut d| d.next().is_some())
            .unwrap_or(false)
    {
        return Err(AppError::Clone(format!(
            "Destination already exists and is not empty: {}",
            dest_path.display()
        )));
    }

    emit_progress(app_handle, "clone-progress", "clone.preparing");
    let mut prepare = gix::prepare_clone(source, &dest_path)
        .map_err(|e| AppError::Clone(e.to_string()))?;

    emit_progress(app_handle, "clone-progress", "clone.fetching");
    let (mut prepare_checkout, _outcome) = {
        #[cfg(not(test))]
        {
            let progress = crate::progress::TauriProgress::new(app_handle, "clone-progress");
            prepare
                .fetch_then_checkout(progress, &gix::interrupt::IS_INTERRUPTED)
                .map_err(|e| AppError::Clone(e.to_string()))?
        }
        #[cfg(test)]
        {
            prepare
                .fetch_then_checkout(gix::progress::Discard, &gix::interrupt::IS_INTERRUPTED)
                .map_err(|e| AppError::Clone(e.to_string()))?
        }
    };

    emit_progress(app_handle, "clone-progress", "clone.checkout");
    {
        #[cfg(not(test))]
        {
            let progress = crate::progress::TauriProgress::new(app_handle, "clone-progress");
            prepare_checkout
                .main_worktree(progress, &gix::interrupt::IS_INTERRUPTED)
                .map_err(|e| AppError::Clone(e.to_string()))?;
        }
        #[cfg(test)]
        {
            prepare_checkout
                .main_worktree(gix::progress::Discard, &gix::interrupt::IS_INTERRUPTED)
                .map_err(|e| AppError::Clone(e.to_string()))?;
        }
    }

    emit_progress(app_handle, "clone-progress", "clone.complete");
    Ok(CloneResult {
        source_path: source.to_string_lossy().to_string(),
        destination_path: dest_path.to_string_lossy().to_string(),
        repo_name: name,
    })
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::process::Command;
    use tempfile::TempDir;

    fn create_bare_repo_with_commit() -> TempDir {
        let work_dir = TempDir::new().unwrap();
        Command::new("git")
            .args(["init"])
            .arg(work_dir.path())
            .output()
            .unwrap();
        Command::new("git")
            .args([
                "-C",
                &work_dir.path().to_string_lossy(),
                "config",
                "user.email",
                "test@test.com",
            ])
            .output()
            .unwrap();
        Command::new("git")
            .args([
                "-C",
                &work_dir.path().to_string_lossy(),
                "config",
                "user.name",
                "Test",
            ])
            .output()
            .unwrap();

        let test_file = work_dir.path().join("README.md");
        std::fs::write(&test_file, "hello").unwrap();

        Command::new("git")
            .args(["-C", &work_dir.path().to_string_lossy(), "add", "."])
            .output()
            .unwrap();
        Command::new("git")
            .args([
                "-C",
                &work_dir.path().to_string_lossy(),
                "commit",
                "-m",
                "initial",
            ])
            .output()
            .unwrap();

        let bare_dir = TempDir::new().unwrap();
        Command::new("git")
            .args([
                "clone",
                "--bare",
                &work_dir.path().to_string_lossy(),
                &bare_dir.path().to_string_lossy(),
            ])
            .output()
            .unwrap();

        bare_dir
    }

    #[test]
    fn test_clone_bare_to_local_success() {
        let bare_repo = create_bare_repo_with_commit();
        let dest_dir = TempDir::new().unwrap();

        let result = clone_bare_to_local(bare_repo.path(), dest_dir.path(), Some("my-clone"), None);
        assert!(result.is_ok(), "Clone failed: {:?}", result.err());

        let clone_result = result.unwrap();
        let cloned_path = std::path::Path::new(&clone_result.destination_path);
        assert!(cloned_path.join(".git").is_dir());
        assert!(cloned_path.join("README.md").is_file());
    }

    #[test]
    fn test_clone_destination_not_empty() {
        let bare_repo = create_bare_repo_with_commit();
        let dest_dir = TempDir::new().unwrap();
        let occupied = dest_dir.path().join("my-clone");
        std::fs::create_dir_all(&occupied).unwrap();
        std::fs::write(occupied.join("file.txt"), "existing").unwrap();

        let result = clone_bare_to_local(bare_repo.path(), dest_dir.path(), Some("my-clone"), None);
        assert!(result.is_err());
    }

    #[test]
    fn test_clone_invalid_source() {
        let dest_dir = TempDir::new().unwrap();
        let fake_source = dest_dir.path().join("nonexistent");

        let result = clone_bare_to_local(&fake_source, dest_dir.path(), Some("test"), None);
        assert!(result.is_err());
    }
}
