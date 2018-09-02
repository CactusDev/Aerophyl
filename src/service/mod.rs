
pub mod packet;
mod platform;

use service::packet::*;

#[derive(Clone)]
pub enum ServiceStatus {
	Disconnected,
	Connecting,
	ConnectionFailed,
	Authenticating,
	AuthenticationFailed,
	Reconnecting,
	ReconnectionFailed,
	Connected,
	Ready
}

pub enum ServiceError {
}

pub enum MessageError {
}

/// Service is any socket-based platform that can send messages, and / or events.
pub trait Service {
	/// Attempt to connect to the service.
	fn connect(&mut self, channel: String, bot: BotInfo) -> Result<(), ServiceError>;
	/// Disconnect from the service, and cleanup the handler.
	fn disconnect(&mut self) -> Result<(), ()>;
	/// Reconnect to the service using whatever backoff-backend is set.
	fn reconnect(&mut self) -> Result<(), ServiceError>;

	/// Convert a service-specific message into our intermediate type.
	fn on_message(&self) -> Result<ServiceMessage, MessageError>;
	/// Convert a message from our intermediate type into a service-specific message, and send it.
	fn send_message(&self, msesage: ServiceMessage);

	/// Status of this service handler.
	///
	// This is sort-of a lie when this is not a single instance handler.
	fn status(&self) -> ServiceStatus;
	/// Can this handler only connect to one channel at a time?
	fn single_instance(&self) -> bool;
}