'use client';

import { useState, useEffect } from 'react';
import { websiteApi, type Website } from './api/websiteApi';
import { adminApi, type Admin } from './api/adminApi';
import { monitorApi } from './api/monitorApi';
import PushNotificationSettings from './components/PushNotificationSettings';

export default function Home() {
  const [websites, setWebsites] = useState<Website[]>([]);
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [websiteInput, setWebsiteInput] = useState('');
  const [editingWebsite, setEditingWebsite] = useState<Website | null>(null);
  
  // Admin popup state
  const [showAdminPopup, setShowAdminPopup] = useState(false);
  const [adminForm, setAdminForm] = useState({ name: '', phoneNumber: '', email: '' });
  const [editingAdmin, setEditingAdmin] = useState<Admin | null>(null);

  // PWA Status
  const [isStandalone, setIsStandalone] = useState(false);

  // Fetch data
  useEffect(() => {
    fetchWebsites();
    fetchAdmins();
    
    // Check if running as PWA
    setIsStandalone(
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true
    );
    
    // Check all websites every minute
    const interval = setInterval(async () => {
      try {
        await monitorApi.checkAllWebsites();
        fetchWebsites(); // Refresh to get updated status
      } catch (error) {
        console.error('Error checking websites:', error);
      }
    }, 10000); // 10000ms = 10 seconds

    return () => clearInterval(interval);
  }, []);

  const fetchWebsites = async () => {
    try {
      const data = await websiteApi.getAll();
      setWebsites(data);
    } catch (error) {
      console.error('Error fetching websites:', error);
    }
  };

  const fetchAdmins = async () => {
    try {
      const data = await adminApi.getAll();
      setAdmins(data);
    } catch (error) {
      console.error('Error fetching admins:', error);
    }
  };

  // Website CRUD
  const addWebsite = async () => {
    if (!websiteInput.trim()) return;
    try {
      await websiteApi.create({ domain: websiteInput, isActive: true });
      setWebsiteInput('');
      fetchWebsites();
    } catch (error) {
      console.error('Error adding website:', error);
    }
  };

  const updateWebsite = async (id: number, domain: string) => {
    try {
      await websiteApi.update(id, { domain });
      setEditingWebsite(null);
      fetchWebsites();
    } catch (error) {
      console.error('Error updating website:', error);
    }
  };

  const deleteWebsite = async (id: number) => {
    if (!confirm('Bạn có chắc muốn xóa website này?')) return;
    try {
      await websiteApi.delete(id);
      fetchWebsites();
    } catch (error) {
      console.error('Error deleting website:', error);
    }
  };

  // Admin CRUD
  const openAdminPopup = (admin?: Admin) => {
    if (admin) {
      setEditingAdmin(admin);
      setAdminForm({
        name: admin.name,
        phoneNumber: admin.phoneNumber,
        email: admin.email,
      });
    } else {
      setEditingAdmin(null);
      setAdminForm({ name: '', phoneNumber: '', email: '' });
    }
    setShowAdminPopup(true);
  };

  const closeAdminPopup = () => {
    setShowAdminPopup(false);
    setEditingAdmin(null);
    setAdminForm({ name: '', phoneNumber: '', email: '' });
  };

  const saveAdmin = async () => {
    if (!adminForm.name.trim() || !adminForm.phoneNumber.trim() || !adminForm.email.trim()) {
      alert('Vui lòng điền đầy đủ thông tin');
      return;
    }

    try {
      if (editingAdmin) {
        await adminApi.update(editingAdmin.id!, {
          name: adminForm.name,
          phoneNumber: adminForm.phoneNumber,
          email: adminForm.email,
        });
      } else {
        await adminApi.create({
          name: adminForm.name,
          phoneNumber: adminForm.phoneNumber,
          email: adminForm.email,
          isActive: true,
        });
      }
      closeAdminPopup();
      fetchAdmins();
    } catch (error) {
      console.error('Error saving admin:', error);
    }
  };

  const deleteAdmin = async (id: number) => {
    if (!confirm('Bạn có chắc muốn xóa người phụ trách này?')) return;
    try {
      await adminApi.delete(id);
      fetchAdmins();
    } catch (error) {
      console.error('Error deleting admin:', error);
    }
  };

  return (
    <div className="min-h-screen bg-white p-8">
      <div className="max-w-6xl mx-auto">
        {/* PWA Status Indicator */}
        <div className="mb-4 flex justify-between items-center">
          <h1 className="text-3xl font-bold">Down Detector</h1>
          {isStandalone && (
            <div className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
              📱 PWA Mode
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">{/* List Web Section */}
          <div>
            <h2 className="text-2xl font-bold mb-4">List Web</h2>
            <div className="mb-6 flex gap-2">
              <input
                type="text"
                value={websiteInput}
                onChange={(e) => setWebsiteInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && addWebsite()}
                placeholder="http://...."
                className="flex-1 px-4 py-3 border-2 border-black text-lg"
              />
              <button
                onClick={addWebsite}
                className="px-6 py-3 bg-blue-600 text-white font-semibold hover:bg-blue-700"
              >
                Add
              </button>
            </div>
            <div className="space-y-2">
              {websites.map((website) => (
                <div
                  key={website.id}
                  className="flex justify-between items-center text-xl py-2 border-b"
                >
                  <div className="flex items-center gap-3 flex-1">
                    {/* Status indicator */}
                    <span 
                      className={`w-3 h-3 rounded-full ${website.isActive ? 'bg-green-500' : 'bg-red-500'}`}
                      title={website.isActive ? 'Đang hoạt động' : 'Không hoạt động'}
                    ></span>
                    
                    {editingWebsite?.id === website.id ? (
                      <input
                        type="text"
                        defaultValue={website.domain}
                        onBlur={(e) => updateWebsite(website.id!, e.target.value)}
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            updateWebsite(website.id!, e.currentTarget.value);
                          }
                        }}
                        className="flex-1 px-2 py-1 border-2 border-blue-500"
                        autoFocus
                      />
                    ) : (
                      <div className="flex-1">
                        <span className={website.isActive ? '' : 'text-red-600 font-semibold'}>
                          {website.domain}
                        </span>
                        <span className={`ml-3 text-sm font-medium ${website.isActive ? 'text-green-600' : 'text-red-600'}`}>
                          {website.isActive ? '🟢 Đang hoạt động' : '🔴 Không hoạt động'}
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setEditingWebsite(website)}
                      className="text-blue-600 hover:text-blue-800 px-2"
                    >
                      ✏️
                    </button>
                    <button
                      onClick={() => website.id && deleteWebsite(website.id)}
                      className="text-red-600 hover:text-red-800 text-2xl"
                    >
                      ×
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Người phụ trách Section */}
          <div>
            <h2 className="text-2xl font-bold mb-4">Người phụ trách</h2>
            <div className="mb-6">
              <button
                onClick={() => openAdminPopup()}
                className="w-full px-6 py-3 bg-green-600 text-white font-semibold hover:bg-green-700 text-lg"
              >
                + Thêm người phụ trách
              </button>
            </div>
            <div className="space-y-3">
              {admins.map((admin) => (
                <div
                  key={admin.id}
                  className="flex justify-between items-start py-3 border-b"
                >
                  <div className="flex-1">
                    <div className="font-bold text-lg">{admin.name}</div>
                    <div className="text-gray-700">{admin.phoneNumber}</div>
                    <div className="text-gray-600 text-sm">{admin.email}</div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => openAdminPopup(admin)}
                      className="text-blue-600 hover:text-blue-800 px-2"
                    >
                      ✏️
                    </button>
                    <button
                      onClick={() => admin.id && deleteAdmin(admin.id)}
                      className="text-red-600 hover:text-red-800 text-2xl"
                    >
                      ×
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Push Notification Settings */}
        <PushNotificationSettings admins={admins} />
      </div>

      {/* Admin Popup Modal */}
      {showAdminPopup && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4">
            <h2 className="text-2xl font-bold mb-6">
              {editingAdmin ? 'Sửa người phụ trách' : 'Thêm người phụ trách'}
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Tên</label>
                <input
                  type="text"
                  value={adminForm.name}
                  onChange={(e) => setAdminForm({ ...adminForm, name: e.target.value })}
                  className="w-full px-4 py-2 border-2 border-gray-300 rounded"
                  placeholder="Nhập tên"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Số điện thoại</label>
                <input
                  type="text"
                  value={adminForm.phoneNumber}
                  onChange={(e) => setAdminForm({ ...adminForm, phoneNumber: e.target.value })}
                  className="w-full px-4 py-2 border-2 border-gray-300 rounded"
                  placeholder="Nhập số điện thoại"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Email</label>
                <input
                  type="email"
                  value={adminForm.email}
                  onChange={(e) => setAdminForm({ ...adminForm, email: e.target.value })}
                  className="w-full px-4 py-2 border-2 border-gray-300 rounded"
                  placeholder="Nhập email"
                />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={saveAdmin}
                className="flex-1 px-6 py-3 bg-blue-600 text-white font-semibold rounded hover:bg-blue-700"
              >
                {editingAdmin ? 'Cập nhật' : 'Thêm'}
              </button>
              <button
                onClick={closeAdminPopup}
                className="flex-1 px-6 py-3 bg-gray-300 text-gray-700 font-semibold rounded hover:bg-gray-400"
              >
                Hủy
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
