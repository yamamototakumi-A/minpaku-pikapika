# LINE Notification System Guide

## Overview

The LINE notification system automatically sends notifications to relevant users when cleaning staff upload images and submit reports. The system supports both "before clean" and "after clean" scenarios with different notification recipients.

## Features

### 🔔 **Automatic Notifications**
- **Before Clean**: Notifies both company presidents (including HQ president) and the client
- **After Clean**: Notifies only company presidents (including HQ president)

### 👥 **Recipient Management**
- Company presidents can register their LINE User ID
- Clients can register their LINE User ID
- All notifications are logged for tracking and debugging

### 📱 **LINE Integration**
- Uses official LINE Messaging API
- Supports Japanese text and emojis
- Automatic message formatting

## Setup Instructions

### 1. **Backend Configuration**
The system is pre-configured with your LINE channel credentials:
- **Channel ID**: `2007875999`
- **Channel Secret**: `425329e366e9362fb480788a1ef2ec52`
- **Channel Access Token**: `CjCL7f0hDcApXskGx6GmFnrS4P4BKSSB6Wk6v8H34k3GNcynoc6bnh+Vd5yye3hgpcz6o/AUkx/pwet5XqTYFaNCpZncnjW+d3pRcBc2VuxsGQAZI0vphcigHTLK9XpaOwbsThrlt0DJXal7UoOZ+AdB04t89/1O/w1cDnyilFU=`

### 2. **Database Schema**
The system automatically creates the necessary database tables:
- `users.line_user_id` - Stores LINE User IDs for each user
- `line_notifications` - Logs all notification attempts and results

### 3. **User Registration**
Users can register their LINE User ID during account creation or update it later:
- **Company Users**: Include LINE User ID during registration
- **Client Users**: Include LINE User ID during registration
- **Existing Users**: Update via staff dashboard settings

## How It Works

### **Notification Flow**

1. **Staff Uploads Images**
   - Staff selects facility, room type, and before/after status
   - Images are uploaded to Google Cloud Storage
   - System automatically triggers LINE notifications

2. **Recipient Determination**
   - **Before Clean**: Presidents + Client
   - **After Clean**: Presidents only

3. **Message Generation**
   - System generates appropriate Japanese message
   - Includes facility name, room type, staff name, and company
   - Uses emojis for better readability

4. **Delivery & Logging**
   - Messages sent via LINE Messaging API
   - All attempts logged with success/failure status
   - Error details captured for debugging

### **Message Examples**

#### Before Clean Notification
```
🧹 清掃開始のお知らせ

🏢 施設: テスト施設
🚪 部屋: トイレ
👷 担当者: 田中太郎
🏢 会社: テスト会社

清掃前の写真がアップロードされました。
清掃の進行状況をご確認ください。
```

#### After Clean Notification
```
✨ 清掃完了のお知らせ

🏢 施設: テスト施設
🚪 部屋: トイレ
👷 担当者: 田中太郎
🏢 会社: テスト会社

清掃後の写真がアップロードされました。
清掃の完了をご確認ください。
```

## API Endpoints

### **LINE Management**
- `POST /api/auth/line/update-user-id` - Update user's LINE User ID
- `GET /api/auth/line/user-id` - Get user's current LINE User ID
- `POST /api/auth/line/test` - Send test notification
- `GET /api/auth/line/history` - Get notification history

### **Automatic Notifications**
- Notifications are automatically sent when images are uploaded via:
  - `POST /api/auth/cleaning-images/upload`

## User Interface

### **Staff Dashboard**
- **LINE設定** button in header opens settings modal
- Users can set/update their LINE User ID
- Test notification functionality available
- Notification history display

### **Registration Forms**
- **Individual Register**: Optional LINE User ID field
- **Client Register**: Optional LINE User ID field
- All fields are optional and can be updated later

## Testing

### **Test Notifications**
1. Set your LINE User ID in the staff dashboard
2. Click "テスト送信" button
3. Check your LINE app for the test message

### **Real Notifications**
1. Upload cleaning images through the staff dashboard
2. System automatically sends notifications based on before/after status
3. Check notification logs for delivery status

## Troubleshooting

### **Common Issues**

#### **Notifications Not Sending**
- Verify LINE User ID is correctly set
- Check LINE channel credentials are valid
- Ensure user has proper permissions
- Review server logs for error details

#### **Invalid LINE User ID**
- LINE User IDs must be alphanumeric with underscores and hyphens
- Format: `U1234567890abcdef`
- Cannot contain special characters or spaces

#### **Permission Errors**
- Ensure user is authenticated
- Check user has access to the facility
- Verify company associations are correct

### **Debug Information**
- All notification attempts are logged in `line_notifications` table
- Check `status` field for success/failure
- `error` field contains detailed error messages
- `sentAt` timestamp shows when notification was attempted

## Security Considerations

### **Data Protection**
- LINE User IDs are stored encrypted in the database
- API endpoints require authentication
- All notification attempts are logged for audit purposes

### **Rate Limiting**
- LINE API has built-in rate limiting
- System handles multiple notifications gracefully
- Failed notifications are logged but don't block the upload process

## Future Enhancements

### **Planned Features**
- **Rich Media**: Support for images and carousels
- **Custom Templates**: User-configurable notification messages
- **Scheduling**: Delayed notifications for specific times
- **Multi-language**: Support for additional languages
- **Webhook Support**: Real-time notification delivery status

### **Integration Possibilities**
- **Slack**: Alternative notification channel
- **Email**: Fallback notification method
- **SMS**: Emergency notifications
- **Push Notifications**: Mobile app integration

## Support

For technical support or questions about the LINE notification system:
1. Check the notification logs in the database
2. Review server console output for error messages
3. Test with the `/api/auth/line/test` endpoint
4. Verify LINE channel configuration

---

**Last Updated**: January 2025
**Version**: 1.0.0
