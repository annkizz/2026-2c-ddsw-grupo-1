import { Card, CardContent } from '@mui/material';

const DashboardCard = ({ className = '', icon, title, description, children }) => (
  <Card className={`dashboard-card ${className}`.trim()}>
    <CardContent>
      {icon && (
        <span className="dashboard-icono" aria-hidden="true">
          {icon}
        </span>
      )}
      {title && <h2>{title}</h2>}
      {description && <p>{description}</p>}
      {children}
    </CardContent>
  </Card>
);

export default DashboardCard;
