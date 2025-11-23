const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3003';

export interface Website {
  id?: number;
  domain: string;
  isActive: boolean;
}

export const websiteApi = {
  async getAll(): Promise<Website[]> {
    const res = await fetch(`${API_URL}/websites`);
    if (!res.ok) throw new Error('Failed to fetch websites');
    return res.json();
  },

  async getById(id: number): Promise<Website> {
    const res = await fetch(`${API_URL}/websites/${id}`);
    if (!res.ok) throw new Error('Failed to fetch website');
    return res.json();
  },

  async create(website: Omit<Website, 'id'>): Promise<Website> {
    const res = await fetch(`${API_URL}/websites`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(website),
    });
    if (!res.ok) throw new Error('Failed to create website');
    return res.json();
  },

  async update(id: number, website: Partial<Website>): Promise<Website> {
    const res = await fetch(`${API_URL}/websites/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(website),
    });
    if (!res.ok) throw new Error('Failed to update website');
    return res.json();
  },

  async delete(id: number): Promise<void> {
    const res = await fetch(`${API_URL}/websites/${id}`, {
      method: 'DELETE',
    });
    if (!res.ok) throw new Error('Failed to delete website');
  },
};
