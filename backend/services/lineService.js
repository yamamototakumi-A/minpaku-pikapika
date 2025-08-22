const axios = require('axios');

class LineService {
	constructor() {
		this.channelId = process.env.LINE_CHANNEL_ID || '';
		this.channelSecret = process.env.LINE_CHANNEL_SECRET || '';
		this.channelAccessToken = process.env.LINE_CHANNEL_ACCESS_TOKEN || '';
		this.baseUrl = 'https://api.line.me/v2';
		this.dryRun = process.env.LINE_DRY_RUN === '1' || process.env.LINE_DRY_RUN === 'true';
	}

	// Send message to a single user
	async sendMessageToUser(lineUserId, message) {
		try {
			if (this.dryRun) {
				console.log(`[DRY_RUN] Would send LINE message to ${lineUserId}:`, message);
				return { success: true, data: { dryRun: true } };
			}

			if (!this.channelAccessToken) {
				throw new Error('LINE_CHANNEL_ACCESS_TOKEN is not configured');
			}

			const response = await axios.post(
				`${this.baseUrl}/bot/message/push`,
				{
					to: lineUserId,
					messages: [
						{
							type: 'text',
							text: message
						}
					]
				},
				{
					headers: {
						'Authorization': `Bearer ${this.channelAccessToken}`,
						'Content-Type': 'application/json'
					}
				}
			);

			console.log(`LINE message sent successfully to ${lineUserId}:`, response.data);
			return { success: true, data: response.data };
		} catch (error) {
			console.error(`Failed to send LINE message to ${lineUserId}:`, error.response?.data || error.message);
			return {
				success: false,
				error: error.response?.data?.message || error.message
			};
		}
	}

	// Send message to multiple users
	async sendMessageToMultipleUsers(lineUserIds, message) {
		const results = [];
		
		for (const lineUserId of lineUserIds) {
			if (lineUserId) {
				const result = await this.sendMessageToUser(lineUserId, message);
				results.push({ lineUserId, ...result });
			}
		}

		return results;
	}

	// Send notification for before clean
	async sendBeforeCleanNotification(facilityName, roomType, staffName, companyName) {
		const message = `🧹 清掃開始のお知らせ

🏢 施設: ${facilityName}
🚪 部屋: ${roomType}
👷 担当者: ${staffName}
🏢 会社: ${companyName}

清掃前の写真がアップロードされました。
清掃の進行状況をご確認ください。`;

		return message;
	}

	// Send notification for after clean
	async sendAfterCleanNotification(facilityName, roomType, staffName, companyName) {
		const message = `✨ 清掃完了のお知らせ

🏢 施設: ${facilityName}
🚪 部屋: ${roomType}
👷 担当者: ${staffName}
🏢 会社: ${companyName}

清掃後の写真がアップロードされました。
清掃の完了をご確認ください。`;

		return message;
	}

	// Send notification for report submission
	async sendReportNotification(facilityName, roomType, staffName, companyName, beforeAfter) {
		if (beforeAfter === 'before') {
			return this.sendBeforeCleanNotification(facilityName, roomType, staffName, companyName);
		} else {
			return this.sendAfterCleanNotification(facilityName, roomType, staffName, companyName);
		}
	}

	// Validate LINE user ID format
	validateLineUserId(lineUserId) {
		if (!lineUserId) return false;
		// LINE user IDs are typically alphanumeric and can be quite long
		return /^[a-zA-Z0-9_-]+$/.test(lineUserId);
	}
}

module.exports = new LineService();
