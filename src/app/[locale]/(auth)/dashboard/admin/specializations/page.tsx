'use client';

import type {
  CreateSpecializationInput,
  UpdateSpecializationInput,
} from '@/validations/specialization.validation';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Card, CardBody, CardHeader } from '@/components/ui/Card';

type Specialization = {
  id: string;
  tenantId: string;
  name: string;
  category: string;
  description: string | null;
  isActive: boolean | null;
  createdAt: Date;
};

export default function SpecializationsPage() {
  const [specializations, setSpecializations] = useState<Specialization[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSpecialization, setEditingSpecialization] = useState<Specialization | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('');

  // Form state
  const [formData, setFormData] = useState<CreateSpecializationInput>({
    name: '',
    category: 'behavioral_approach',
    description: '',
    isActive: true,
  });

  const resetForm = (): void => {
    setFormData({
      name: '',
      category: 'behavioral_approach',
      description: '',
      isActive: true,
    });
    setEditingSpecialization(null);
  };

  const fetchSpecializations = async (): Promise<void> => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await fetch('/api/admin/specializations');
      if (!response.ok) {
        throw new Error('Failed to fetch specializations');
      }
      const data = await response.json();
      setSpecializations(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreate = async (): Promise<void> => {
    try {
      const response = await fetch('/api/admin/specializations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create specialization');
      }

      await fetchSpecializations();
      setIsModalOpen(false);
      resetForm();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    }
  };

  const handleUpdate = async (): Promise<void> => {
    if (!editingSpecialization) {
      return;
    }

    try {
      const updateData: UpdateSpecializationInput = {
        name: formData.name,
        category: formData.category,
        description: formData.description,
        isActive: formData.isActive,
      };

      const response = await fetch(`/api/admin/specializations/${editingSpecialization.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update specialization');
      }

      await fetchSpecializations();
      setIsModalOpen(false);
      resetForm();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    }
  };

  const handleDelete = async (id: string): Promise<void> => {
    // eslint-disable-next-line no-alert
    if (!window.confirm('Are you sure you want to deactivate this specialization?')) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/specializations/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete specialization');
      }

      await fetchSpecializations();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    }
  };

  const openCreateModal = (): void => {
    setEditingSpecialization(null);
    resetForm();
    setIsModalOpen(true);
  };

  const openEditModal = (specialization: Specialization): void => {
    setEditingSpecialization(specialization);
    setFormData({
      name: specialization.name,
      category: specialization.category as any,
      description: specialization.description || '',
      isActive: specialization.isActive ?? true,
    });
    setIsModalOpen(true);
  };

  useEffect(() => {
    fetchSpecializations();
  }, []);

  const filteredSpecializations = specializations.filter((spec) => {
    const matchesSearch = spec.name.toLowerCase().includes(searchTerm.toLowerCase())
      || spec.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = !categoryFilter || spec.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const categoryLabels: Record<string, string> = {
    behavioral_approach: 'Behavioral Approach',
    communication: 'Communication',
    population: 'Population',
    age_group: 'Age Group',
    modality: 'Modality',
    cultural: 'Cultural',
  };

  return (
    <div className="container mx-auto p-8">
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-3xl font-bold">Specialization Management</h1>
        <Button onClick={openCreateModal}>
          Add Specialization
        </Button>
      </div>

      {error && (
        <div className="mb-4 rounded-lg bg-red-50 p-4 text-red-800">
          {error}
        </div>
      )}

      <Card className="mb-6">
        <CardBody>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label htmlFor="search" className="mb-2 block text-sm font-medium">
                Search
              </label>
              <input
                id="search"
                type="text"
                placeholder="Search by name or description..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-4 py-2"
              />
            </div>
            <div>
              <label htmlFor="category" className="mb-2 block text-sm font-medium">
                Filter by Category
              </label>
              <select
                id="category"
                value={categoryFilter}
                onChange={e => setCategoryFilter(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-4 py-2"
              >
                <option value="">All Categories</option>
                {Object.entries(categoryLabels).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </div>
          </div>
        </CardBody>
      </Card>

      {isLoading
        ? (
            <div className="py-8 text-center">Loading...</div>
          )
        : (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredSpecializations.map(spec => (
                <Card key={spec.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="text-lg font-semibold">{spec.name}</h3>
                        <span className="inline-block rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-800">
                          {categoryLabels[spec.category] || spec.category}
                        </span>
                      </div>
                      <span
                        className={`inline-block rounded-full px-2 py-1 text-xs ${
                          spec.isActive
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {spec.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  </CardHeader>
                  <CardBody>
                    <p className="mb-4 text-sm text-gray-600">
                      {spec.description || 'No description'}
                    </p>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => openEditModal(spec)}
                      >
                        Edit
                      </Button>
                      {spec.isActive && (
                        <Button
                          size="sm"
                          variant="danger"
                          onClick={() => handleDelete(spec.id)}
                        >
                          Deactivate
                        </Button>
                      )}
                    </div>
                  </CardBody>
                </Card>
              ))}
            </div>
          )}

      {filteredSpecializations.length === 0 && !isLoading && (
        <div className="py-8 text-center text-gray-500">
          No specializations found
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-md rounded-lg bg-white p-6">
            <h2 className="mb-4 text-2xl font-bold">
              {editingSpecialization ? 'Edit Specialization' : 'Create Specialization'}
            </h2>
            <div className="space-y-4">
              <div>
                <label htmlFor="name" className="mb-2 block text-sm font-medium">
                  Name
                  {' '}
                  <span className="text-red-500">*</span>
                </label>
                <input
                  id="name"
                  type="text"
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2"
                  required
                />
              </div>

              <div>
                <label htmlFor="form-category" className="mb-2 block text-sm font-medium">
                  Category
                  {' '}
                  <span className="text-red-500">*</span>
                </label>
                <select
                  id="form-category"
                  value={formData.category}
                  onChange={e => setFormData({ ...formData, category: e.target.value as any })}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2"
                  required
                >
                  {Object.entries(categoryLabels).map(([value, label]) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="description" className="mb-2 block text-sm font-medium">
                  Description
                </label>
                <textarea
                  id="description"
                  value={formData.description || ''}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2"
                  rows={3}
                />
              </div>

              <div className="flex items-center">
                <input
                  id="isActive"
                  type="checkbox"
                  checked={formData.isActive}
                  onChange={e => setFormData({ ...formData, isActive: e.target.checked })}
                  className="h-4 w-4 rounded border-gray-300"
                />
                <label htmlFor="isActive" className="ml-2 text-sm font-medium">
                  Active
                </label>
              </div>
            </div>

            <div className="mt-6 flex gap-2">
              <Button
                onClick={editingSpecialization ? handleUpdate : handleCreate}
                fullWidth
              >
                {editingSpecialization ? 'Update' : 'Create'}
              </Button>
              <Button
                variant="secondary"
                onClick={() => {
                  setIsModalOpen(false);
                  resetForm();
                }}
                fullWidth
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
