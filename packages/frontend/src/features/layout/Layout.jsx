import { Outlet, useLocation } from 'react-router-dom';
import Header from '../../components/headers/Header.jsx';
import Footer from '../../components/footer/Footer.jsx';
import { useAuth } from '../../hooks/useAuth.jsx';
import './Layout.css';

const Layout = () => {
  const { sesion } = useAuth();
  const { pathname } = useLocation();
  const esDashboardColectivo =
    pathname === '/' &&
    (sesion?.rol === 'COLECTIVO' || sesion?.rol === 'COLABORADOR') &&
    sesion?.tienePerfil;

  return (
    <div className="layout">
      <a className="layout-saltar-contenido" href="#contenido-principal">
        Saltar al contenido
      </a>
      <Header />
      <main
        id="contenido-principal"
        className={`layout-contenido${esDashboardColectivo ? ' layout-contenido--dashboard' : ''}`}
        tabIndex="-1"
      >
        <Outlet />
      </main>
      <Footer />
    </div>
  );
};

export default Layout;
