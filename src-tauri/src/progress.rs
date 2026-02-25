use tauri::{AppHandle, Emitter};

use crate::types::ProgressEvent;

pub fn emit_progress(app_handle: Option<&AppHandle>, event_name: &str, step: &str) {
    if let Some(handle) = app_handle {
        let _ = handle.emit(event_name, &ProgressEvent {
            step: step.to_string(),
            is_error: false,
            detail: None,
        });
    }
}

pub fn emit_error(app_handle: Option<&AppHandle>, event_name: &str, step: &str) {
    if let Some(handle) = app_handle {
        let _ = handle.emit(event_name, &ProgressEvent {
            step: step.to_string(),
            is_error: true,
            detail: None,
        });
    }
}

#[cfg(not(test))]
mod tauri_progress {
    use std::sync::atomic::{AtomicUsize, Ordering};
    use std::sync::{Arc, Mutex};
    use std::time::Instant;

    use gix::progress::{Count, Id, MessageLevel, NestedProgress, Progress, Step, StepShared, Unit, UNKNOWN};
    use tauri::{AppHandle, Emitter};

    use crate::types::ProgressEvent;

    const THROTTLE_MS: u128 = 200;

    pub struct TauriProgress {
        handle: Option<AppHandle>,
        event_name: String,
        name: Mutex<String>,
        step: Arc<AtomicUsize>,
        max: Mutex<Option<usize>>,
        last_emit: Mutex<Instant>,
    }

    impl TauriProgress {
        pub fn new(handle: Option<&AppHandle>, event_name: &str) -> Self {
            Self {
                handle: handle.cloned(),
                event_name: event_name.to_string(),
                name: Mutex::new(String::new()),
                step: Arc::new(AtomicUsize::new(0)),
                max: Mutex::new(None),
                last_emit: Mutex::new(Instant::now()),
            }
        }

        fn emit_detail(&self, detail: &str) {
            if let Some(ref handle) = self.handle {
                let _ = handle.emit(&self.event_name, ProgressEvent {
                    step: "git_progress".to_string(),
                    is_error: false,
                    detail: Some(detail.to_string()),
                });
            }
        }

        fn format_progress(&self) -> Option<String> {
            let name = self.name.lock().unwrap_or_else(|e| e.into_inner()).clone();
            if name.is_empty() {
                return None;
            }
            let current = self.step.load(Ordering::Relaxed);
            let max = *self.max.lock().unwrap_or_else(|e| e.into_inner());
            match max {
                Some(m) if m > 0 => {
                    let pct = (current as f64 / m as f64 * 100.0).min(100.0) as u32;
                    Some(format!("{name}: {pct}% ({current}/{m})"))
                }
                _ => Some(format!("{name}: {current}")),
            }
        }

        fn try_emit_throttled(&self) {
            let mut last = self.last_emit.lock().unwrap_or_else(|e| e.into_inner());
            if last.elapsed().as_millis() < THROTTLE_MS {
                return;
            }
            *last = Instant::now();
            drop(last);

            if let Some(detail) = self.format_progress() {
                self.emit_detail(&detail);
            }
        }
    }

    impl Count for TauriProgress {
        fn set(&self, step: Step) {
            self.step.store(step, Ordering::Relaxed);
            self.try_emit_throttled();
        }

        fn step(&self) -> Step {
            self.step.load(Ordering::Relaxed)
        }

        fn inc_by(&self, step: Step) {
            self.step.fetch_add(step, Ordering::Relaxed);
            self.try_emit_throttled();
        }

        fn counter(&self) -> StepShared {
            self.step.clone()
        }
    }

    impl Progress for TauriProgress {
        fn init(&mut self, max: Option<Step>, _unit: Option<Unit>) {
            self.step.store(0, Ordering::Relaxed);
            *self.max.lock().unwrap_or_else(|e| e.into_inner()) = max;
            if let Some(detail) = self.format_progress() {
                self.emit_detail(&detail);
            }
        }

        fn set_name(&mut self, name: String) {
            if !name.is_empty() {
                self.emit_detail(&name);
            }
            *self.name.lock().unwrap_or_else(|e| e.into_inner()) = name;
        }

        fn name(&self) -> Option<String> {
            let n = self.name.lock().unwrap_or_else(|e| e.into_inner()).clone();
            if n.is_empty() { None } else { Some(n) }
        }

        fn id(&self) -> Id {
            UNKNOWN
        }

        fn message(&self, level: MessageLevel, message: String) {
            if let Some(ref handle) = self.handle {
                let is_error = matches!(level, MessageLevel::Failure);
                let _ = handle.emit(&self.event_name, ProgressEvent {
                    step: "git_message".to_string(),
                    is_error,
                    detail: Some(message),
                });
            }
        }
    }

    impl NestedProgress for TauriProgress {
        type SubProgress = Self;

        fn add_child(&mut self, name: impl Into<String>) -> Self {
            let child_name = name.into();
            let child = Self {
                handle: self.handle.clone(),
                event_name: self.event_name.clone(),
                name: Mutex::new(child_name.clone()),
                step: Arc::new(AtomicUsize::new(0)),
                max: Mutex::new(None),
                last_emit: Mutex::new(Instant::now()),
            };
            if !child_name.is_empty() {
                child.emit_detail(&child_name);
            }
            child
        }

        fn add_child_with_id(&mut self, name: impl Into<String>, _id: Id) -> Self {
            self.add_child(name)
        }
    }
}

#[cfg(not(test))]
pub use tauri_progress::TauriProgress;
