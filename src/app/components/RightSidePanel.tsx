'use client';

import { Drawer } from 'antd';
import JobForm from './forms/JobForm';
import PersonaForm from './forms/PersonaForm';
import CandidateForm from './forms/CandidateForm';
import type { Job, Persona } from '@/types';

type EntityType = 'job' | 'persona' | 'candidate';
type Mode = 'create' | 'edit';

interface Props {
  open: boolean;
  onClose: () => void;
  entityType: EntityType;
  mode: Mode;
  initialValues?: any;
  onSubmit: (values: any) => Promise<void>;
  personas?: Persona[];
  jobs?: Job[];
  loading?: boolean;
}

const RightSidePanel = ({
  open,
  onClose,
  entityType,
  mode,
  initialValues,
  onSubmit,
  personas = [],
  jobs = [],
  loading = false,
}: Props) => {
  const getTitle = () => {
    const action = mode === 'create' ? 'Create' : 'Edit';
    const entity = entityType.charAt(0).toUpperCase() + entityType.slice(1);
    return `${action} ${entity}`;
  };

  const renderForm = () => {
    const commonProps = {
      initialValues,
      onSubmit,
      onCancel: onClose,
      loading,
    };

    switch (entityType) {
      case 'job':
        return <JobForm {...commonProps} />;
      case 'persona':
        return <PersonaForm {...commonProps} />;
      case 'candidate':
        return (
          <CandidateForm
            {...commonProps}
            personas={personas}
            jobs={jobs}
          />
        );
      default:
        return null;
    }
  };

  return (
    <Drawer
      title={getTitle()}
      placement="right"
      width={600}
      onClose={onClose}
      open={open}
      destroyOnClose
    >
      {renderForm()}
    </Drawer>
  );
};

export default RightSidePanel;
