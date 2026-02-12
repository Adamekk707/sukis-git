use std::path::Path;

use gix::actor::Signature;
use gix::bstr::BStr;
use gix::date::Time;
use gix::objs::tree::EntryKind;
use gix::objs::{Commit, Tree, tree::Entry};
use gix::progress::Discard;

use crate::error::AppError;
use crate::types::AddRepoResult;

#[derive(Debug, PartialEq)]
pub enum SourceType {
    GitRepo,
    PlainDirectory,
}

pub fn detect_source_type(source: &Path) -> SourceType {
    let git_dir = source.join(".git");
    let has_git_dir = git_dir.is_dir();
    let is_bare = source.join("HEAD").is_file()
        && source.join("objects").is_dir()
        && source.join("refs").is_dir();

    if has_git_dir || is_bare {
        SourceType::GitRepo
    } else {
        SourceType::PlainDirectory
    }
}

pub fn fork_repo_as_bare(
    source: &Path,
    dest_dir: &Path,
    repo_name: &str,
) -> Result<AddRepoResult, AppError> {
    let dest_path = dest_dir.join(format!("{repo_name}.git"));

    if dest_path.exists()
        && std::fs::read_dir(&dest_path)
            .map(|mut d| d.next().is_some())
            .unwrap_or(false)
    {
        return Err(AppError::Init(format!(
            "Destination already exists and is not empty: {}",
            dest_path.display()
        )));
    }

    let url_str = format!(
        "file://{}",
        source.to_string_lossy().replace('\\', "/")
    );
    let url = gix::url::parse(BStr::new(url_str.as_bytes()))
        .map_err(|e| AppError::Init(e.to_string()))?;

    let mut prepare = gix::prepare_clone_bare(url, &dest_path)
        .map_err(|e| AppError::Init(e.to_string()))?;

    prepare
        .fetch_only(Discard, &gix::interrupt::IS_INTERRUPTED)
        .map_err(|e| AppError::Init(e.to_string()))?;

    add_remote_to_repo(source, &dest_path)?;

    Ok(AddRepoResult {
        source_path: source.to_string_lossy().to_string(),
        destination_path: dest_path.to_string_lossy().to_string(),
        repo_name: repo_name.to_string(),
        is_fork: true,
    })
}

pub fn init_bare_from_directory(
    source: &Path,
    dest_dir: &Path,
    repo_name: &str,
) -> Result<AddRepoResult, AppError> {
    let dest_path = dest_dir.join(format!("{repo_name}.git"));

    if dest_path.exists()
        && std::fs::read_dir(&dest_path)
            .map(|mut d| d.next().is_some())
            .unwrap_or(false)
    {
        return Err(AppError::Init(format!(
            "Destination already exists and is not empty: {}",
            dest_path.display()
        )));
    }

    let timestamp = std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .unwrap_or_default()
        .as_secs();

    let time = Time::new(timestamp as gix::date::SecondsSinceUnixEpoch, 0);
    let sig = Signature {
        name: "Suki's Git".into(),
        email: "sukis-git@local".into(),
        time,
    };

    let bare_repo = gix::init_bare(&dest_path)
        .map_err(|e| AppError::Init(e.to_string()))?;

    let tree_id = write_directory_as_tree(&bare_repo, source)?;

    let commit = Commit {
        tree: tree_id,
        parents: Default::default(),
        author: sig.clone(),
        committer: sig.clone(),
        encoding: None,
        message: "Initial commit\n".into(),
        extra_headers: vec![],
    };

    let commit_id = bare_repo
        .write_object(&commit)
        .map_err(|e| AppError::Init(e.to_string()))?
        .detach();

    let refs_heads = dest_path.join("refs").join("heads");
    std::fs::create_dir_all(&refs_heads)?;
    std::fs::write(
        refs_heads.join("master"),
        format!("{}\n", commit_id),
    )?;

    let head_path = dest_path.join("HEAD");
    std::fs::write(&head_path, "ref: refs/heads/master\n")?;

    init_local_repo(source, &dest_path, &sig)?;

    Ok(AddRepoResult {
        source_path: source.to_string_lossy().to_string(),
        destination_path: dest_path.to_string_lossy().to_string(),
        repo_name: repo_name.to_string(),
        is_fork: false,
    })
}

fn init_local_repo(
    source: &Path,
    bare_repo_path: &Path,
    sig: &Signature,
) -> Result<(), AppError> {
    let local_repo = gix::init(source)
        .map_err(|e| AppError::Init(e.to_string()))?;

    let local_tree_id = write_directory_as_tree(&local_repo, source)?;

    let local_commit = Commit {
        tree: local_tree_id,
        parents: Default::default(),
        author: sig.clone(),
        committer: sig.clone(),
        encoding: None,
        message: "Initial commit\n".into(),
        extra_headers: vec![],
    };

    let local_commit_id = local_repo
        .write_object(&local_commit)
        .map_err(|e| AppError::Init(e.to_string()))?
        .detach();

    let git_dir = source.join(".git");
    let local_refs = git_dir.join("refs").join("heads");
    std::fs::create_dir_all(&local_refs)?;
    std::fs::write(
        local_refs.join("master"),
        format!("{}\n", local_commit_id),
    )?;

    let remote_url = bare_repo_path.to_string_lossy().replace('\\', "/");
    let config_path = git_dir.join("config");
    let existing_config = std::fs::read_to_string(&config_path)?;
    std::fs::write(
        &config_path,
        format!(
            "{}\n[remote \"origin\"]\n\turl = {}\n\tfetch = +refs/heads/*:refs/remotes/origin/*\n",
            existing_config, remote_url
        ),
    )?;

    Ok(())
}

fn add_remote_to_repo(
    source: &Path,
    bare_repo_path: &Path,
) -> Result<(), AppError> {
    let git_dir = source.join(".git");
    if !git_dir.is_dir() {
        return Ok(());
    }

    let config_path = git_dir.join("config");
    let existing_config = std::fs::read_to_string(&config_path)?;

    let remote_name = if existing_config.contains("[remote \"origin\"]") {
        "usb"
    } else {
        "origin"
    };

    let remote_url = bare_repo_path.to_string_lossy().replace('\\', "/");
    std::fs::write(
        &config_path,
        format!(
            "{}\n[remote \"{}\"]\n\turl = {}\n\tfetch = +refs/heads/*:refs/remotes/{}/*\n",
            existing_config, remote_name, remote_url, remote_name
        ),
    )?;

    Ok(())
}

fn write_directory_as_tree(
    repo: &gix::Repository,
    dir: &Path,
) -> Result<gix::ObjectId, AppError> {
    let mut entries: Vec<Entry> = Vec::new();

    let mut dir_entries: Vec<_> = std::fs::read_dir(dir)?
        .filter_map(|e| e.ok())
        .collect();
    dir_entries.sort_by(|a, b| a.file_name().cmp(&b.file_name()));

    for entry in dir_entries {
        let file_name = entry.file_name();
        let name_str = file_name.to_string_lossy();

        if name_str.starts_with('.') {
            continue;
        }

        let path = entry.path();
        let file_type = entry.file_type()?;

        if file_type.is_file() {
            let content = std::fs::read(&path)?;
            let blob_id = repo
                .write_blob(&content)
                .map_err(|e| AppError::Init(e.to_string()))?
                .detach();

            entries.push(Entry {
                mode: EntryKind::Blob.into(),
                filename: name_str.as_bytes().into(),
                oid: blob_id,
            });
        } else if file_type.is_dir() {
            let sub_tree_id = write_directory_as_tree(repo, &path)?;

            entries.push(Entry {
                mode: EntryKind::Tree.into(),
                filename: name_str.as_bytes().into(),
                oid: sub_tree_id,
            });
        }
    }

    let tree = Tree { entries };
    let tree_id = repo
        .write_object(&tree)
        .map_err(|e| AppError::Init(e.to_string()))?
        .detach();

    Ok(tree_id)
}

pub fn suggest_repo_name(source: &Path) -> String {
    source
        .file_name()
        .map(|n| n.to_string_lossy().to_string())
        .unwrap_or_else(|| "repo".to_string())
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::process::Command;
    use tempfile::TempDir;

    #[test]
    fn test_detect_plain_directory() {
        let tmp = TempDir::new().unwrap();
        std::fs::write(tmp.path().join("hello.txt"), "hello").unwrap();
        assert_eq!(detect_source_type(tmp.path()), SourceType::PlainDirectory);
    }

    #[test]
    fn test_detect_git_repo() {
        let tmp = TempDir::new().unwrap();
        Command::new("git")
            .args(["init"])
            .arg(tmp.path())
            .output()
            .unwrap();
        assert_eq!(detect_source_type(tmp.path()), SourceType::GitRepo);
    }

    #[test]
    fn test_detect_bare_repo() {
        let tmp = TempDir::new().unwrap();
        Command::new("git")
            .args(["init", "--bare"])
            .arg(tmp.path())
            .output()
            .unwrap();
        assert_eq!(detect_source_type(tmp.path()), SourceType::GitRepo);
    }

    #[test]
    fn test_init_bare_from_directory() {
        let source = TempDir::new().unwrap();
        std::fs::write(source.path().join("README.md"), "# Hello").unwrap();
        std::fs::create_dir(source.path().join("src")).unwrap();
        std::fs::write(source.path().join("src").join("main.rs"), "fn main() {}").unwrap();
        std::fs::write(source.path().join(".hidden"), "secret").unwrap();

        let dest = TempDir::new().unwrap();
        let result = init_bare_from_directory(source.path(), dest.path(), "test-repo");
        assert!(result.is_ok(), "Init failed: {:?}", result.err());

        let res = result.unwrap();
        assert!(!res.is_fork);

        let repo_path = std::path::Path::new(&res.destination_path);
        assert!(repo_path.join("HEAD").is_file());
        assert!(repo_path.join("objects").is_dir());
        assert!(repo_path.join("refs").is_dir());
        assert!(repo_path.join("refs").join("heads").join("master").is_file());

        let local_git = source.path().join(".git");
        assert!(local_git.is_dir(), "Local .git should be created");
        assert!(
            local_git.join("refs").join("heads").join("master").is_file(),
            "Local master ref should exist"
        );

        let config = std::fs::read_to_string(local_git.join("config")).unwrap();
        assert!(
            config.contains("[remote \"origin\"]"),
            "Remote origin should be configured"
        );
    }

    #[test]
    fn test_fork_repo_as_bare() {
        let work_dir = TempDir::new().unwrap();
        Command::new("git")
            .args(["init"])
            .arg(work_dir.path())
            .output()
            .unwrap();
        Command::new("git")
            .args(["-C", &work_dir.path().to_string_lossy(), "config", "user.email", "test@test.com"])
            .output()
            .unwrap();
        Command::new("git")
            .args(["-C", &work_dir.path().to_string_lossy(), "config", "user.name", "Test"])
            .output()
            .unwrap();
        std::fs::write(work_dir.path().join("README.md"), "hello").unwrap();
        Command::new("git")
            .args(["-C", &work_dir.path().to_string_lossy(), "add", "."])
            .output()
            .unwrap();
        Command::new("git")
            .args(["-C", &work_dir.path().to_string_lossy(), "commit", "-m", "initial"])
            .output()
            .unwrap();

        let dest = TempDir::new().unwrap();
        let result = fork_repo_as_bare(work_dir.path(), dest.path(), "forked-repo");
        assert!(result.is_ok(), "Fork failed: {:?}", result.err());

        let res = result.unwrap();
        assert!(res.is_fork);

        let repo_path = std::path::Path::new(&res.destination_path);
        assert!(repo_path.join("HEAD").is_file());
        assert!(repo_path.join("objects").is_dir());
    }

    #[test]
    fn test_init_destination_not_empty() {
        let source = TempDir::new().unwrap();
        std::fs::write(source.path().join("file.txt"), "hi").unwrap();

        let dest = TempDir::new().unwrap();
        let repo_dir = dest.path().join("test-repo.git");
        std::fs::create_dir_all(&repo_dir).unwrap();
        std::fs::write(repo_dir.join("existing.txt"), "occupied").unwrap();

        let result = init_bare_from_directory(source.path(), dest.path(), "test-repo");
        assert!(result.is_err());
    }

    #[test]
    fn test_suggest_repo_name() {
        let path = Path::new("/some/path/my-project");
        assert_eq!(suggest_repo_name(path), "my-project");
    }
}
