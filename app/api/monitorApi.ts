const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3004';

export const monitorApi = {
  checkWebsite: async (websiteId: number): Promise<{ isActive: boolean }> => {
    const response = await fetch(`${API_BASE_URL}/monitoring/check/${websiteId}`, {
      method: 'POST',
    });
    if (!response.ok) throw new Error('Failed to check website');
    return response.json();
  },

  checkAllWebsites: async (): Promise<void> => {
    const response = await fetch(`${API_BASE_URL}/monitoring/check-all`, {
      method: 'POST',
    });
    if (!response.ok) throw new Error('Failed to check all websites');
  },
};
