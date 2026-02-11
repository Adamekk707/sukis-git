use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CommitInfo {
    pub oid: String,
    pub short_oid: String,
    pub message: String,
    pub author_name: String,
    pub author_email: String,
    pub committer_name: String,
    pub committer_email: String,
    pub parent_oids: Vec<String>,
    pub timestamp: i64,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
pub enum RefType {
    LocalBranch,
    RemoteBranch,
    Tag,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RefInfo {
    pub name: String,
    pub full_name: String,
    pub target_oid: String,
    pub ref_type: RefType,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RepositoryInfo {
    pub path: String,
    pub name: String,
    pub is_bare: bool,
    pub head_oid: Option<String>,
    pub head_ref: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DagNode {
    pub oid: String,
    pub short_oid: String,
    pub message: String,
    pub author_name: String,
    pub timestamp: i64,
    pub refs: Vec<RefInfo>,
    pub column: usize,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DagEdge {
    pub from_oid: String,
    pub to_oid: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CommitDag {
    pub nodes: Vec<DagNode>,
    pub edges: Vec<DagEdge>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CommitLogPage {
    pub commits: Vec<CommitInfo>,
    pub has_more: bool,
    pub cursor: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UsbDevice {
    pub label: String,
    pub mount_point: String,
    pub uuid: Option<String>,
    pub repositories: Vec<RepositoryInfo>,
}
