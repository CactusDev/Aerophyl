
use std::vec::Vec;

#[derive(Clone)]
pub struct OAuthInfo {
	access: String,
	refresh: Option<String>,
	expires: Option<String>
}

#[derive(Clone)]
pub struct BotInfo {
	username: String,
	bot_id: u32  // Revisit: Maybe should should change this to `String`? Some services might not use numeric ids
}

#[derive(Clone)]
pub struct ConnectionInfo {
	bot: BotInfo,
	oauth: OAuthInfo
}

impl OAuthInfo {

	pub fn new(access: String, refresh: Option<String>, expires: Option<String>) -> Self {
		OAuthInfo {
			access, refresh, expires
		}
	}
}

impl BotInfo {

	pub fn new(username: String, bot_id: u32) -> Self {
		BotInfo {
			username, bot_id
		}
	}
}

impl ConnectionInfo {

	pub fn new(oauth: OAuthInfo, bot: BotInfo) -> Self {
		ConnectionInfo {
			bot,
			oauth
		}
	}
}

#[derive(Clone)]
pub struct ServiceMessage {
	parts: Vec<String>,
	role: String,
	action: bool,
	target: Option<String>,

	source: String,
	channel: String,
	bot: BotInfo,
	service: String
}
