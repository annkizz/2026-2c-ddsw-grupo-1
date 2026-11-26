import React from "react";
import { Outlet } from "react-router-dom";
import Header from "../../components/headers/Header.jsx";
import Footer from "../../components/footer/Footer.jsx";
import { t } from "../../i18n/t";
import "./Layout.css";

// Landmarks: header (banner) → main → footer (contentinfo). El enlace de salto es lo primero tabulable.
const Layout = () => (
  <div className="layout">
    <a className="layout-saltar-contenido" href="#contenido-principal">
      {t("navegacion.saltarContenido")}
    </a>
    <Header />
    <main id="contenido-principal" className="layout-contenido" tabIndex="-1">
      <Outlet />
    </main>
    <Footer />
  </div>
);

export default Layout;
