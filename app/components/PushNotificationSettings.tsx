'use client';

import { useState } from 'react';
import { usePushNotifications } from '../hooks/usePushNotifications';

interface Admin {
  id?: number;
  name: string;
  email: string;
  phoneNumber: string;
  isActive: boolean;
}

interface Props {
  admins: Admin[];
}

export default function PushNotificationSettings({ admins }: Props) {
  const [selectedAdminId, setSelectedAdminId] = useState<number | null>(null);
  const [testResult, setTestResult] = useState<string>('');

  const {
    isSupported,
    isSubscribed,
    isPermissionGranted,
    isLoading,
    error,
    subscribe,
    unsubscribe,
    sendTestNotification,
  } = usePushNotifications(selectedAdminId);

  const handleSubscribe = async () => {
    const success = await subscribe();
    if (success) {
      setTestResult('🟢 Subscribed to push notifications!');
    }
  };

  const handleUnsubscribe = async () => {
    const success = await unsubscribe();
    if (success) {
      setTestResult('⚪ Unsubscribed from push notifications');
    }
  };

  const handleTestNotification = async () => {
    setTestResult('⏳ Sending test notification...');
    const success = await sendTestNotification();
    setTestResult(success ? '🟢 Test notification sent!' : '🔴 Test notification failed');
    
    // Clear message after 3 seconds
    setTimeout(() => setTestResult(''), 3000);
  };

  if (!isSupported) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mt-6">
        <h3 className="font-semibold text-yellow-800">Push Notifications Not Supported</h3>
        <p className="text-yellow-700 text-sm mt-1">
          Your browser doesn't support push notifications. Try using Chrome, Firefox, or Safari on a supported device.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 border rounded-lg p-4 mt-6">
      <h3 className="font-semibold text-lg mb-4">🔔 Push Notifications</h3>
      
      {/* Admin Selection */}
      <div className="mb-4">
        <label className="block text-sm font-medium mb-2">Select Admin for Notifications:</label>
        <select
          value={selectedAdminId || ''}
          onChange={(e) => setSelectedAdminId(e.target.value ? parseInt(e.target.value) : null)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md"
        >
          <option value="">Choose an admin...</option>
          {admins.filter(admin => admin.id).map((admin) => (
            <option key={admin.id} value={admin.id!}>
              {admin.name} - {admin.email}
            </option>
          ))}
        </select>
      </div>

      {/* Permission Status */}
      <div className="mb-4">
        <div className="flex items-center gap-2 text-sm">
          <span>Permission:</span>
          <span className={`px-2 py-1 rounded text-xs font-medium ${
            isPermissionGranted 
              ? 'bg-green-100 text-green-800' 
              : 'bg-red-100 text-red-800'
          }`}>
            {isPermissionGranted ? 'Granted' : 'Not Granted'}
          </span>
        </div>
      </div>

      {/* Subscription Status */}
      <div className="mb-4">
        <div className="flex items-center gap-2 text-sm">
          <span>Subscription:</span>
          <span className={`px-2 py-1 rounded text-xs font-medium ${
            isSubscribed 
              ? 'bg-blue-100 text-blue-800' 
              : 'bg-gray-100 text-gray-800'
          }`}>
            {isSubscribed ? 'Active' : 'Not Active'}
          </span>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-2 mb-4">
        <button
          onClick={handleSubscribe}
          disabled={!selectedAdminId || isSubscribed || isLoading}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
        >
          {isLoading ? 'Loading...' : 'Enable Notifications'}
        </button>

        <button
          onClick={handleUnsubscribe}
          disabled={!selectedAdminId || !isSubscribed || isLoading}
          className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
        >
          Disable Notifications
        </button>

        <button
          onClick={handleTestNotification}
          disabled={!selectedAdminId || !isSubscribed || isLoading}
          className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
        >
          Test Notification
        </button>
      </div>

      {/* Status Messages */}
      {error && (
        <div className="text-red-600 text-sm mb-2">
          ⚠️ {error}
        </div>
      )}

      {testResult && (
        <div className="text-sm mb-2">
          {testResult}
        </div>
      )}

      {/* Info */}
      <div className="text-xs text-gray-600 mt-4 p-3 bg-blue-50 rounded">
        <p><strong>Lưu ý:</strong></p>
        <ul className="list-disc list-inside mt-1 space-y-1">
          <li>Push notifications sẽ hoạt động ngay cả khi browser đang đóng</li>
          <li>Bạn sẽ nhận được thông báo ngay lập tức khi website down</li>
          <li>Thông báo push hoạt động trên mobile và desktop</li>
          <li>Cần kết nối internet để nhận thông báo</li>
        </ul>
      </div>
    </div>
  );
}