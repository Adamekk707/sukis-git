use std::collections::BTreeMap;
use std::path::Path;

use gix::ObjectId;
use similar::TextDiff;

use crate::error::AppError;
use crate::git::repository::open_bare_repo;

pub fn diff_commit_to_parent(repo_path: &Path, oid_str: &str) -> Result<String, AppError> {
    let repo = open_bare_repo(repo_path)?;
    let oid = ObjectId::from_hex(oid_str.as_bytes())
        .map_err(|e| AppError::Git(format!("Invalid OID: {e}")))?;

    let commit = repo
        .find_object(oid)
        .map_err(|e| AppError::Git(e.to_string()))?
        .into_commit();
    let commit_ref = commit.decode().map_err(|e| AppError::Git(e.to_string()))?;

    let new_tree_id = commit_ref.tree();

    let old_tree_id = commit_ref
        .parents()
        .next()
        .and_then(|parent_oid| {
            let parent_obj = repo.find_object(parent_oid).ok()?;
            let parent_commit = parent_obj.into_commit();
            let parent_ref = parent_commit.decode().ok()?;
            Some(parent_ref.tree())
        });

    diff_trees(&repo, old_tree_id, new_tree_id)
}

pub fn generate_unified_diff_text(
    repo_path: &Path,
    old_oid_str: &str,
    new_oid_str: &str,
) -> Result<String, AppError> {
    let repo = open_bare_repo(repo_path)?;

    let old_oid = ObjectId::from_hex(old_oid_str.as_bytes())
        .map_err(|e| AppError::Git(format!("Invalid OID: {e}")))?;
    let new_oid = ObjectId::from_hex(new_oid_str.as_bytes())
        .map_err(|e| AppError::Git(format!("Invalid OID: {e}")))?;

    let old_commit = repo
        .find_object(old_oid)
        .map_err(|e| AppError::Git(e.to_string()))?
        .into_commit();
    let old_ref = old_commit.decode().map_err(|e| AppError::Git(e.to_string()))?;

    let new_commit = repo
        .find_object(new_oid)
        .map_err(|e| AppError::Git(e.to_string()))?
        .into_commit();
    let new_ref = new_commit.decode().map_err(|e| AppError::Git(e.to_string()))?;

    diff_trees(&repo, Some(old_ref.tree()), new_ref.tree())
}

fn diff_trees(
    repo: &gix::Repository,
    old_tree_id: Option<ObjectId>,
    new_tree_id: ObjectId,
) -> Result<String, AppError> {
    let old_blobs = match old_tree_id {
        Some(id) => collect_tree_blobs(repo, id, "")?,
        None => BTreeMap::new(),
    };

    let new_blobs = collect_tree_blobs(repo, new_tree_id, "")?;

    let mut all_paths: Vec<String> = old_blobs
        .keys()
        .chain(new_blobs.keys())
        .cloned()
        .collect();
    all_paths.sort();
    all_paths.dedup();

    let mut output = String::new();

    for path in &all_paths {
        match (old_blobs.get(path), new_blobs.get(path)) {
            (None, Some(new_id)) => {
                let content = read_blob_text(repo, *new_id)?;
                write_addition_diff(&mut output, path, &content);
            }
            (Some(old_id), None) => {
                let content = read_blob_text(repo, *old_id)?;
                write_deletion_diff(&mut output, path, &content);
            }
            (Some(old_id), Some(new_id)) if old_id != new_id => {
                let old_content = read_blob_text(repo, *old_id)?;
                let new_content = read_blob_text(repo, *new_id)?;
                write_modification_diff(&mut output, path, &old_content, &new_content);
            }
            _ => {}
        }
    }

    Ok(output)
}

fn collect_tree_blobs(
    repo: &gix::Repository,
    tree_id: ObjectId,
    prefix: &str,
) -> Result<BTreeMap<String, ObjectId>, AppError> {
    let tree_obj = repo
        .find_object(tree_id)
        .map_err(|e| AppError::Git(e.to_string()))?
        .into_tree();
    let tree_ref = tree_obj.decode().map_err(|e| AppError::Git(e.to_string()))?;

    let mut blobs = BTreeMap::new();

    for entry in &tree_ref.entries {
        let name = entry.filename.to_string();
        let path = if prefix.is_empty() {
            name
        } else {
            format!("{prefix}/{name}")
        };

        if entry.mode.is_blob() {
            blobs.insert(path, entry.oid.to_owned());
        } else if entry.mode.is_tree() {
            let sub_blobs = collect_tree_blobs(repo, entry.oid.to_owned(), &path)?;
            blobs.extend(sub_blobs);
        }
    }

    Ok(blobs)
}

fn read_blob_text(repo: &gix::Repository, oid: ObjectId) -> Result<String, AppError> {
    let obj = repo
        .find_object(oid)
        .map_err(|e| AppError::Git(e.to_string()))?;
    Ok(String::from_utf8_lossy(&obj.data).to_string())
}

fn write_addition_diff(output: &mut String, path: &str, content: &str) {
    output.push_str(&format!(
        "diff --git a/{path} b/{path}\nnew file mode 100644\n--- /dev/null\n+++ b/{path}\n"
    ));
    let lines: Vec<&str> = content.lines().collect();
    let count = lines.len();
    output.push_str(&format!("@@ -0,0 +1,{count} @@\n"));
    for line in &lines {
        output.push_str(&format!("+{line}\n"));
    }
}

fn write_deletion_diff(output: &mut String, path: &str, content: &str) {
    output.push_str(&format!(
        "diff --git a/{path} b/{path}\ndeleted file mode 100644\n--- a/{path}\n+++ /dev/null\n"
    ));
    let lines: Vec<&str> = content.lines().collect();
    let count = lines.len();
    output.push_str(&format!("@@ -1,{count} +0,0 @@\n"));
    for line in &lines {
        output.push_str(&format!("-{line}\n"));
    }
}

fn write_modification_diff(output: &mut String, path: &str, old_content: &str, new_content: &str) {
    output.push_str(&format!("diff --git a/{path} b/{path}\n"));
    let diff = TextDiff::from_lines(old_content, new_content);
    output.push_str(&format!(
        "{}",
        diff.unified_diff()
            .header(&format!("a/{path}"), &format!("b/{path}"))
            .context_radius(3)
    ));
}
