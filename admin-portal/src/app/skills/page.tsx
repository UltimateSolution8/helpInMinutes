'use client';

import { useState } from 'react';
import { Plus, Edit2, Trash2, ChevronRight, Search } from 'lucide-react';
import { cn } from '@/lib/utils';

// Mock skills data
const mockCategories = [
  {
    id: 'cat-1',
    name: 'Home Services',
    icon: '🏠',
    color: '#3b82f6',
    skills: [
      { id: 's1', name: 'Plumbing', helpersCount: 45, basePrice: 300 },
      { id: 's2', name: 'Electrical', helpersCount: 38, basePrice: 350 },
      { id: 's3', name: 'Carpentry', helpersCount: 28, basePrice: 400 },
      { id: 's4', name: 'Painting', helpersCount: 22, basePrice: 500 },
    ],
  },
  {
    id: 'cat-2',
    name: 'Cleaning',
    icon: '✨',
    color: '#22c55e',
    skills: [
      { id: 's5', name: 'Deep Cleaning', helpersCount: 56, basePrice: 800 },
      { id: 's6', name: 'Regular Cleaning', helpersCount: 72, basePrice: 400 },
      { id: 's7', name: 'Sofa Cleaning', helpersCount: 31, basePrice: 600 },
    ],
  },
  {
    id: 'cat-3',
    name: 'Appliances',
    icon: '🔧',
    color: '#f59e0b',
    skills: [
      { id: 's8', name: 'AC Repair', helpersCount: 25, basePrice: 500 },
      { id: 's9', name: 'Washing Machine', helpersCount: 18, basePrice: 450 },
      { id: 's10', name: 'Refrigerator', helpersCount: 15, basePrice: 450 },
    ],
  },
  {
    id: 'cat-4',
    name: 'Outdoor',
    icon: '🌳',
    color: '#8b5cf6',
    skills: [
      { id: 's11', name: 'Gardening', helpersCount: 12, basePrice: 350 },
      { id: 's12', name: 'Pest Control', helpersCount: 8, basePrice: 800 },
    ],
  },
];

export default function SkillsPage() {
  const [expandedCategories, setExpandedCategories] = useState<string[]>(['cat-1']);
  const [searchTerm, setSearchTerm] = useState('');

  const toggleCategory = (categoryId: string) => {
    setExpandedCategories((prev) =>
      prev.includes(categoryId)
        ? prev.filter((id) => id !== categoryId)
        : [...prev, categoryId]
    );
  };

  const filteredCategories = mockCategories.map((cat) => ({
    ...cat,
    skills: cat.skills.filter((skill) =>
      skill.name.toLowerCase().includes(searchTerm.toLowerCase())
    ),
  })).filter((cat) => cat.skills.length > 0);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Skills Management</h1>
          <p className="text-muted-foreground">
            Manage skill categories and service offerings
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button className="btn-outline">
            Import Skills
          </button>
          <button className="btn-primary">
            <Plus className="h-4 w-4 mr-2" />
            Add Category
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input
          type="text"
          placeholder="Search skills..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2 rounded-lg border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
        />
      </div>

      {/* Skills Tree */}
      <div className="bg-card rounded-lg border">
        {filteredCategories.map((category) => (
          <div key={category.id}>
            {/* Category Header */}
            <button
              onClick={() => toggleCategory(category.id)}
              className="w-full flex items-center gap-3 p-4 hover:bg-accent transition-colors"
            >
              <span className="text-2xl">{category.icon}</span>
              <div className="flex-1 text-left">
                <h3 className="font-semibold">{category.name}</h3>
                <p className="text-sm text-muted-foreground">
                  {category.skills.length} skills
                </p>
              </div>
              <ChevronRight
                className={cn(
                  'h-5 w-5 text-muted-foreground transition-transform',
                  expandedCategories.includes(category.id) && 'rotate-90'
                )}
              />
            </button>

            {/* Skills List */}
            {expandedCategories.includes(category.id) && (
              <div className="bg-muted/30 border-t">
                {category.skills.map((skill, index) => (
                  <div
                    key={skill.id}
                    className={cn(
                      'flex items-center justify-between p-4 hover:bg-accent transition-colors',
                      index !== category.skills.length - 1 && 'border-b'
                    )}
                  >
                    <div className="flex items-center gap-4">
                      <div
                        className="w-1 h-8 rounded-full"
                        style={{ backgroundColor: category.color }}
                      />
                      <div>
                        <p className="font-medium">{skill.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {skill.helpersCount} helpers • Base: ₹{skill.basePrice}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button className="p-2 rounded hover:bg-accent">
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <button className="p-2 rounded hover:bg-accent text-destructive">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
                <button className="w-full flex items-center gap-2 p-4 text-sm text-primary hover:bg-accent transition-colors">
                  <Plus className="h-4 w-4" />
                  Add new skill
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {filteredCategories.length === 0 && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No skills found matching your search</p>
        </div>
      )}
    </div>
  );
}
