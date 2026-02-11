use std::collections::HashMap;
use std::path::Path;

use gix::ObjectId;
use petgraph::graph::{DiGraph, NodeIndex};

use crate::error::AppError;
use crate::git::refs::list_refs;
use crate::git::repository::open_bare_repo;
use crate::types::{CommitDag, DagEdge, DagNode, RefInfo};

fn parse_author_info(raw: &str) -> (String, i64) {
    match (raw.find('<'), raw.find('>')) {
        (Some(lt), Some(gt)) if lt < gt => {
            let name = raw[..lt].trim().to_string();
            let timestamp = raw[gt + 1..]
                .split_whitespace()
                .next()
                .and_then(|t| t.parse().ok())
                .unwrap_or(0);
            (name, timestamp)
        }
        _ => (raw.to_string(), 0),
    }
}

pub fn build_commit_dag(
    repo_path: &Path,
    max_commits: usize,
) -> Result<CommitDag, AppError> {
    let repo = open_bare_repo(repo_path)?;
    let refs = list_refs(repo_path)?;

    let mut ref_map: HashMap<String, Vec<RefInfo>> = HashMap::new();
    for r in &refs {
        ref_map
            .entry(r.target_oid.clone())
            .or_default()
            .push(r.clone());
    }

    let tip_oids: Vec<ObjectId> = refs
        .iter()
        .filter_map(|r| ObjectId::from_hex(r.target_oid.as_bytes()).ok())
        .collect();

    if tip_oids.is_empty() {
        return Ok(CommitDag {
            nodes: vec![],
            edges: vec![],
        });
    }

    let walk = repo
        .rev_walk(tip_oids)
        .all()
        .map_err(|e| AppError::Git(e.to_string()))?;

    let mut graph = DiGraph::<DagNode, ()>::new();
    let mut oid_to_node: HashMap<String, NodeIndex> = HashMap::new();
    let mut parent_edges: Vec<(String, String)> = Vec::new();
    let mut count = 0;

    for info in walk {
        if count >= max_commits {
            break;
        }
        let info = info.map_err(|e| AppError::Git(e.to_string()))?;
        let oid_str = info.id.to_string();

        if oid_to_node.contains_key(&oid_str) {
            continue;
        }

        let commit = repo
            .find_object(info.id)
            .map_err(|e| AppError::Git(e.to_string()))?
            .into_commit();
        let commit_ref = commit.decode().map_err(|e| AppError::Git(e.to_string()))?;

        let short_oid = info.id.to_hex_with_len(7).to_string();
        let node_refs = ref_map.remove(&oid_str).unwrap_or_default();

        let author_raw = commit_ref.author.to_string();
        let (author_name, timestamp) = parse_author_info(&author_raw);

        let node = DagNode {
            oid: oid_str.clone(),
            short_oid,
            message: commit_ref.message.to_string(),
            author_name,
            timestamp,
            refs: node_refs,
            column: 0,
        };

        let idx = graph.add_node(node);
        oid_to_node.insert(oid_str.clone(), idx);

        for parent_oid in commit_ref.parents() {
            parent_edges.push((oid_str.clone(), parent_oid.to_string()));
        }

        count += 1;
    }

    let mut edges = Vec::new();
    for (child, parent) in &parent_edges {
        if let (Some(&child_idx), Some(&parent_idx)) =
            (oid_to_node.get(child), oid_to_node.get(parent))
        {
            graph.add_edge(child_idx, parent_idx, ());
            edges.push(DagEdge {
                from_oid: child.clone(),
                to_oid: parent.clone(),
            });
        }
    }

    assign_columns(&mut graph);

    let nodes: Vec<DagNode> = graph
        .node_indices()
        .map(|idx| graph[idx].clone())
        .collect();

    Ok(CommitDag { nodes, edges })
}

fn assign_columns(graph: &mut DiGraph<DagNode, ()>) {
    let mut sorted_nodes: Vec<NodeIndex> = graph.node_indices().collect();
    sorted_nodes.sort_by(|a, b| graph[*b].timestamp.cmp(&graph[*a].timestamp));

    let mut active_columns: Vec<Option<String>> = Vec::new();

    for idx in sorted_nodes {
        let oid = graph[idx].oid.clone();

        let existing_col = active_columns
            .iter()
            .position(|slot| slot.as_ref() == Some(&oid));

        let column = match existing_col {
            Some(col) => {
                active_columns[col] = None;
                col
            }
            None => {
                let free = active_columns.iter().position(|slot| slot.is_none());
                match free {
                    Some(col) => col,
                    None => {
                        active_columns.push(None);
                        active_columns.len() - 1
                    }
                }
            }
        };

        graph[idx].column = column;

        let parent_oids: Vec<String> = graph
            .neighbors(idx)
            .map(|n| graph[n].oid.clone())
            .collect();

        for (i, parent_oid) in parent_oids.iter().enumerate() {
            let already_assigned = active_columns
                .iter()
                .any(|slot| slot.as_ref() == Some(parent_oid));
            if !already_assigned {
                if i == 0 && column < active_columns.len() {
                    active_columns[column] = Some(parent_oid.clone());
                } else {
                    let free = active_columns.iter().position(|slot| slot.is_none());
                    match free {
                        Some(col) => active_columns[col] = Some(parent_oid.clone()),
                        None => active_columns.push(Some(parent_oid.clone())),
                    }
                }
            }
        }
    }
}
