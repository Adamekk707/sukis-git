use std::path::Path;

use crate::error::AppError;
use crate::git::repository::open_bare_repo;
use crate::types::{RefInfo, RefType};

pub fn list_refs(repo_path: &Path) -> Result<Vec<RefInfo>, AppError> {
    let repo = open_bare_repo(repo_path)?;
    let mut refs = Vec::new();

    let references = repo
        .references()
        .map_err(|e| AppError::Git(e.to_string()))?;

    let all = references
        .all()
        .map_err(|e| AppError::Git(e.to_string()))?;

    for reference in all.flatten() {
        let full_name = reference.name().as_bstr().to_string();
        let (name, ref_type) = categorize_ref(&full_name);

        let target_oid = reference
            .into_fully_peeled_id()
            .map(|id| id.to_string())
            .unwrap_or_default();

        refs.push(RefInfo {
            name,
            full_name,
            target_oid,
            ref_type,
        });
    }

    Ok(refs)
}

fn categorize_ref(full_name: &str) -> (String, RefType) {
    if let Some(name) = full_name.strip_prefix("refs/heads/") {
        (name.to_string(), RefType::LocalBranch)
    } else if let Some(name) = full_name.strip_prefix("refs/remotes/") {
        (name.to_string(), RefType::RemoteBranch)
    } else if let Some(name) = full_name.strip_prefix("refs/tags/") {
        (name.to_string(), RefType::Tag)
    } else {
        (full_name.to_string(), RefType::LocalBranch)
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_categorize_ref_local_branch() {
        let (name, ref_type) = categorize_ref("refs/heads/main");
        assert_eq!(name, "main");
        assert_eq!(ref_type, RefType::LocalBranch);
    }

    #[test]
    fn test_categorize_ref_remote_branch() {
        let (name, ref_type) = categorize_ref("refs/remotes/origin/main");
        assert_eq!(name, "origin/main");
        assert_eq!(ref_type, RefType::RemoteBranch);
    }

    #[test]
    fn test_categorize_ref_tag() {
        let (name, ref_type) = categorize_ref("refs/tags/v1.0");
        assert_eq!(name, "v1.0");
        assert_eq!(ref_type, RefType::Tag);
    }
}
