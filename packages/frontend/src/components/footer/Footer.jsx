import { FiHelpCircle } from 'react-icons/fi';
import './Footer.css';

const Footer = () => {
  return (
    <footer className="footer">
      <span>Desde Argentina, en comunidad.</span>
      <div className="footer-derecha">
        <a className="footer-ayuda" href="#ayuda">
          <FiHelpCircle />
          <span>¿Necesitás ayuda?</span>
        </a>
        <nav>
          <a href="#privacidad">Privacidad</a>
          <a href="#terminos">Términos de uso</a>
        </nav>
      </div>
    </footer>
  );
};

export default Footer;
