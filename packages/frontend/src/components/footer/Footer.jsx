import React from 'react';
import { FiHelpCircle } from 'react-icons/fi';
import { Link } from 'react-router-dom';
import { RUTA_AYUDA, irAAyuda } from '../../utils/rutasUI';
import { t } from '../../i18n/t';
import './Footer.css';

const Footer = () => (
  <footer className="footer">
    <div className="footer__contenido">
      <p>{t('navegacion.pie')}</p>
      <Link className="footer-ayuda" to={RUTA_AYUDA} onClick={irAAyuda}>
        <FiHelpCircle aria-hidden="true" />
        <span>{t('navegacion.ayuda')}</span>
      </Link>
    </div>
  </footer>
);

export default Footer;
