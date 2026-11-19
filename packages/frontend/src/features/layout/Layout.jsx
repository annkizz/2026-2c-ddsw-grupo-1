import { Outlet } from 'react-router-dom';
import Header from '../../components/headers/Header.jsx';
import Footer from '../../components/footer/Footer.jsx';
import './Layout.css';

const Layout = () => {
  return (
    <div className="layout">
      <Header />
      <main className="layout-contenido">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
};

export default Layout;
