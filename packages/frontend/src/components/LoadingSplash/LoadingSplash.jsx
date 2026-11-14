import { CircularProgress } from '@mui/material';
import './LoadingSplash.css';

const LoadingSplash = ({ message = 'Cargando…' }) => {
  return (
    <div className="loading-splash" role="status">
      <CircularProgress />
      <p>{message}</p>
    </div>
  );
};

export default LoadingSplash;
