import React from "react";
import { t } from "../../i18n/t";
import "./Footer.css";

const Footer = () => (
  <footer className="footer">
    <div className="footer__contenido">
      <p>{t("navegacion.pie")}</p>
    </div>
  </footer>
);

export default Footer;
