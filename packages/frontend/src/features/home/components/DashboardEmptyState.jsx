import { Button } from '@mui/material';
import { FiArrowRight } from 'react-icons/fi';

const DashboardEmptyState = ({
  icon,
  title,
  description,
  actionLabel,
  onAction,
  className = '',
  actionVariant = 'outlined',
}) => (
  <div className={`dashboard-empty-state ${className}`.trim()}>
    {icon && (
      <span className="dashboard-empty-state__icono" aria-hidden="true">
        {icon}
      </span>
    )}
    <div className="dashboard-empty-state__texto">
      <strong>{title}</strong>
      <p>{description}</p>
    </div>
    {actionLabel && (
      <Button variant={actionVariant} onClick={onAction} endIcon={<FiArrowRight />}>
        {actionLabel}
      </Button>
    )}
  </div>
);

export default DashboardEmptyState;
