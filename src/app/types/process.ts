export interface ProcessStep {
  id: string;
  name: string;
  description: string;
  order: number;
  status: 'active' | 'inactive';
  createdAt: string;
  updatedAt: string;
}
