use std::fmt;

#[derive(Debug)]
pub enum AppError {
    Git(String),
    Io(std::io::Error),
    Path(String),
    Usb(String),
}

impl fmt::Display for AppError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            AppError::Git(msg) => write!(f, "Git error: {msg}"),
            AppError::Io(err) => write!(f, "IO error: {err}"),
            AppError::Path(msg) => write!(f, "Path error: {msg}"),
            AppError::Usb(msg) => write!(f, "USB error: {msg}"),
        }
    }
}

impl std::error::Error for AppError {}

impl From<AppError> for String {
    fn from(err: AppError) -> String {
        err.to_string()
    }
}

impl From<std::io::Error> for AppError {
    fn from(err: std::io::Error) -> Self {
        AppError::Io(err)
    }
}
