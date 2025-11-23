const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3003';

export interface Admin {
  id?: number;
  name: string;
  phoneNumber: string;
  email: string;
  isActive: boolean;
}

export const adminApi = {
  async getAll(): Promise<Admin[]> {
    const res = await fetch(`${API_URL}/admins`);
    if (!res.ok) throw new Error('Failed to fetch admins');
    return res.json();
  },

  async getById(id: number): Promise<Admin> {
    const res = await fetch(`${API_URL}/admins/${id}`);
    if (!res.ok) throw new Error('Failed to fetch admin');
    return res.json();
  },

  async create(admin: Omit<Admin, 'id'>): Promise<Admin> {
    const res = await fetch(`${API_URL}/admins`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(admin),
    });
    if (!res.ok) throw new Error('Failed to create admin');
    return res.json();
  },

  async update(id: number, admin: Partial<Admin>): Promise<Admin> {
    const res = await fetch(`${API_URL}/admins/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(admin),
    });
    if (!res.ok) throw new Error('Failed to update admin');
    return res.json();
  },

  async delete(id: number): Promise<void> {
    const res = await fetch(`${API_URL}/admins/${id}`, {
      method: 'DELETE',
    });
    if (!res.ok) throw new Error('Failed to delete admin');
  },
};
