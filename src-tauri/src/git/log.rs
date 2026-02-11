use std::path::Path;

use gix::ObjectId;

use crate::error::AppError;
use crate::git::repository::open_bare_repo;
use crate::types::{CommitInfo, CommitLogPage};

struct ParsedSignature {
    name: String,
    email: String,
    timestamp: i64,
}

fn parse_signature(raw: &str) -> ParsedSignature {
    match (raw.find('<'), raw.find('>')) {
        (Some(lt), Some(gt)) if lt < gt => {
            let name = raw[..lt].trim().to_string();
            let email = raw[lt + 1..gt].to_string();
            let timestamp = raw[gt + 1..]
                .split_whitespace()
                .next()
                .and_then(|t| t.parse().ok())
                .unwrap_or(0);
            ParsedSignature {
                name,
                email,
                timestamp,
            }
        }
        _ => ParsedSignature {
            name: raw.to_string(),
            email: String::new(),
            timestamp: 0,
        },
    }
}

fn parse_commit_from_repo(
    repo: &gix::Repository,
    oid: ObjectId,
) -> Result<CommitInfo, AppError> {
    let commit = repo
        .find_object(oid)
        .map_err(|e| AppError::Git(e.to_string()))?
        .into_commit();
    let commit_ref = commit.decode().map_err(|e| AppError::Git(e.to_string()))?;

    let short_oid = oid.to_hex_with_len(7).to_string();
    let author = parse_signature(&commit_ref.author.to_string());
    let committer = parse_signature(&commit_ref.committer.to_string());

    Ok(CommitInfo {
        oid: oid.to_string(),
        short_oid,
        message: commit_ref.message.to_string(),
        author_name: author.name,
        author_email: author.email,
        committer_name: committer.name,
        committer_email: committer.email,
        parent_oids: commit_ref.parents().map(|p| p.to_string()).collect(),
        timestamp: author.timestamp,
    })
}

pub fn get_commit_log(
    repo_path: &Path,
    start_oid: Option<&str>,
    limit: usize,
) -> Result<CommitLogPage, AppError> {
    let repo = open_bare_repo(repo_path)?;

    let start_id = match start_oid {
        Some(oid_str) => ObjectId::from_hex(oid_str.as_bytes())
            .map_err(|e| AppError::Git(format!("Invalid OID: {e}")))?,
        None => {
            let head = repo.head_commit().map_err(|e| AppError::Git(e.to_string()))?;
            head.id
        }
    };

    let walk = repo
        .rev_walk([start_id])
        .all()
        .map_err(|e| AppError::Git(e.to_string()))?;

    let mut commits = Vec::with_capacity(limit);
    let fetch_count = limit + 1;

    for info in walk {
        if commits.len() >= fetch_count {
            break;
        }
        let info = info.map_err(|e| AppError::Git(e.to_string()))?;
        commits.push(parse_commit_from_repo(&repo, info.id)?);
    }

    let has_more = commits.len() > limit;
    if has_more {
        commits.truncate(limit);
    }

    let cursor = commits.last().map(|c| c.oid.clone());

    Ok(CommitLogPage {
        commits,
        has_more,
        cursor,
    })
}

pub fn get_commit_detail(repo_path: &Path, oid_str: &str) -> Result<CommitInfo, AppError> {
    let repo = open_bare_repo(repo_path)?;
    let oid = ObjectId::from_hex(oid_str.as_bytes())
        .map_err(|e| AppError::Git(format!("Invalid OID: {e}")))?;

    parse_commit_from_repo(&repo, oid)
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::process::Command;
    use tempfile::TempDir;

    fn create_repo_with_commits() -> (TempDir, TempDir) {
        let work_dir = TempDir::new().unwrap();
        let bare_dir = TempDir::new().unwrap();

        Command::new("git")
            .args(["init"])
            .arg(work_dir.path())
            .output()
            .unwrap();

        let work_str = work_dir.path().to_string_lossy().to_string();

        let set_config = |key: &str, val: &str| {
            Command::new("git")
                .args(["-C", &work_str, "config", key, val])
                .output()
                .unwrap();
        };
        set_config("user.name", "Test");
        set_config("user.email", "test@test.com");

        std::fs::write(work_dir.path().join("file.txt"), "hello").unwrap();
        Command::new("git")
            .args(["-C", &work_str, "add", "."])
            .output()
            .unwrap();
        Command::new("git")
            .args(["-C", &work_str, "commit", "-m", "first commit"])
            .output()
            .unwrap();

        std::fs::write(work_dir.path().join("file.txt"), "world").unwrap();
        Command::new("git")
            .args(["-C", &work_str, "add", "."])
            .output()
            .unwrap();
        Command::new("git")
            .args(["-C", &work_str, "commit", "-m", "second commit"])
            .output()
            .unwrap();

        Command::new("git")
            .args([
                "clone",
                "--bare",
                &work_str,
                &bare_dir.path().to_string_lossy(),
            ])
            .output()
            .unwrap();

        (work_dir, bare_dir)
    }

    #[test]
    fn test_get_commit_log() {
        let (_work, bare) = create_repo_with_commits();
        let page = get_commit_log(bare.path(), None, 10).unwrap();
        assert_eq!(page.commits.len(), 2);
        assert!(!page.has_more);
    }

    #[test]
    fn test_get_commit_log_pagination() {
        let (_work, bare) = create_repo_with_commits();
        let page = get_commit_log(bare.path(), None, 1).unwrap();
        assert_eq!(page.commits.len(), 1);
        assert!(page.has_more);
    }

    #[test]
    fn test_parse_signature() {
        let sig = parse_signature("Test User <test@example.com> 1234567890 +0000");
        assert_eq!(sig.name, "Test User");
        assert_eq!(sig.email, "test@example.com");
        assert_eq!(sig.timestamp, 1234567890);
    }
}
