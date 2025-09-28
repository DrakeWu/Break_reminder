import React, { useState, useEffect } from 'react';

interface Settings {
  reminderInterval: number; // minutes
  postureCheckInterval: number; // seconds
  enableNotifications: boolean;
  enableBreakAlerts: boolean;
}

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (settings: Settings) => void;
  currentSettings: Settings;
}

const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  onSave,
  currentSettings
}) => {
  const [settings, setSettings] = useState<Settings>(currentSettings);

  useEffect(() => {
    setSettings(currentSettings);
  }, [currentSettings]);

  const handleSave = () => {
    onSave(settings);
    onClose();
  };

  const handleReminderIntervalChange = (value: number) => {
    setSettings(prev => ({ ...prev, reminderInterval: value }));
  };

  const handlePostureCheckIntervalChange = (value: number) => {
    setSettings(prev => ({ ...prev, postureCheckInterval: value }));
  };

  const handleNotificationToggle = (enabled: boolean) => {
    setSettings(prev => ({ ...prev, enableNotifications: enabled }));
  };

  const handleBreakAlertsToggle = (enabled: boolean) => {
    setSettings(prev => ({ ...prev, enableBreakAlerts: enabled }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-800">Settings</h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 text-2xl"
            >
              ×
            </button>
          </div>

          <div className="space-y-6">
            {/* Reminder Interval */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-gray-800 mb-3">Break Reminders</h3>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Reminder Interval (minutes)
                  </label>
                  <div className="flex gap-2">
                    {[15, 30, 45, 60, 90, 120].map((interval) => (
                      <button
                        key={interval}
                        onClick={() => handleReminderIntervalChange(interval)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                          settings.reminderInterval === interval
                            ? 'bg-blue-600 text-white'
                            : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        {interval}m
                      </button>
                    ))}
                  </div>
                  <div className="mt-2">
                    <input
                      type="number"
                      min="5"
                      max="240"
                      value={settings.reminderInterval}
                      onChange={(e) => handleReminderIntervalChange(parseInt(e.target.value) || 30)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Custom interval"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Posture Check Interval */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-gray-800 mb-3">Posture Analysis</h3>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Posture Check Frequency (seconds)
                  </label>
                  <div className="flex gap-2">
                    {[15, 30, 45, 60, 90].map((interval) => (
                      <button
                        key={interval}
                        onClick={() => handlePostureCheckIntervalChange(interval)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                          settings.postureCheckInterval === interval
                            ? 'bg-green-600 text-white'
                            : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        {interval}s
                      </button>
                    ))}
                  </div>
                  <div className="mt-2">
                    <input
                      type="number"
                      min="1"
                      max="300"
                      value={settings.postureCheckInterval}
                      onChange={(e) => handlePostureCheckIntervalChange(parseInt(e.target.value) || 60)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                      placeholder="Custom interval"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Notifications */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-gray-800 mb-3">Notifications</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-sm font-medium text-gray-700">Browser Notifications</label>
                    <p className="text-xs text-gray-500">Show system notifications for break reminders</p>
                  </div>
                  <button
                    onClick={() => handleNotificationToggle(!settings.enableNotifications)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      settings.enableNotifications ? 'bg-blue-600' : 'bg-gray-200'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        settings.enableNotifications ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-sm font-medium text-gray-700">Break Alerts</label>
                    <p className="text-xs text-gray-500">Show alerts when it's time to take a break</p>
                  </div>
                  <button
                    onClick={() => handleBreakAlertsToggle(!settings.enableBreakAlerts)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      settings.enableBreakAlerts ? 'bg-green-600' : 'bg-gray-200'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        settings.enableBreakAlerts ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
              </div>
            </div>

            {/* Current Settings Summary */}
            <div className="bg-blue-50 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-blue-800 mb-3">Current Settings</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium text-blue-700">Break Reminders:</span>
                  <span className="ml-2 text-blue-600">{settings.reminderInterval} minutes</span>
                </div>
                <div>
                  <span className="font-medium text-blue-700">Posture Checks:</span>
                  <span className="ml-2 text-blue-600">Every {settings.postureCheckInterval} seconds</span>
                </div>
                <div>
                  <span className="font-medium text-blue-700">Notifications:</span>
                  <span className="ml-2 text-blue-600">{settings.enableNotifications ? 'Enabled' : 'Disabled'}</span>
                </div>
                <div>
                  <span className="font-medium text-blue-700">Break Alerts:</span>
                  <span className="ml-2 text-blue-600">{settings.enableBreakAlerts ? 'Enabled' : 'Disabled'}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 mt-6">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-lg transition-colors"
            >
              Save Settings
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;
