import "@testing-library/jest-dom";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import React, { useState } from "react";
import { useLogto } from "@logto/react";
import { obtenerSesion } from "../service/usuariosService";
import { AuthProvider, RESOURCE, useAuth } from "./useAuth.jsx";

jest.mock("@logto/react", () => ({
  useLogto: jest.fn(),
}));

jest.mock("../service/usuariosService", () => ({
  obtenerSesion: jest.fn(),
}));

const AccionesAuth = () => {
  const {
    iniciarSesion,
    registrarse,
    recargarSesion,
    errorSesion,
    obtenerEmailCuenta,
    cargando,
  } = useAuth();
  const [email, setEmail] = useState("");

  return (
    <>
      <button onClick={iniciarSesion}>Iniciar sesión</button>
      <button onClick={registrarse}>Crear cuenta</button>
      <button onClick={recargarSesion}>Verificar sesión</button>
      <button onClick={async () => setEmail(await obtenerEmailCuenta())}>
        Leer email
      </button>
      {email && <output>{email}</output>}
      <output data-testid="auth-loading">{String(cargando)}</output>
      {errorSesion && <output>{errorSesion}</output>}
    </>
  );
};

describe("flujo de autenticación", () => {
  const signIn = jest.fn();
  const getAccessToken = jest.fn();
  const fetchUserInfo = jest.fn();

  beforeEach(() => {
    sessionStorage.clear();
    jest.clearAllMocks();
    getAccessToken.mockResolvedValue("access-token");
    fetchUserInfo.mockResolvedValue({ email: "cuenta@example.com" });
    obtenerSesion.mockResolvedValue({ tienePerfil: true });
    useLogto.mockReturnValue({
      isAuthenticated: false,
      isLoading: false,
      signIn,
      signOut: jest.fn(),
      getAccessToken,
      fetchUserInfo,
    });
  });

  it("borra el tipo de alta anterior al iniciar sesión", () => {
    sessionStorage.setItem("tipoDeCuenta", "colectivo");
    render(
      <AuthProvider>
        <AccionesAuth />
      </AuthProvider>,
    );

    fireEvent.click(screen.getByText("Iniciar sesión"));

    expect(sessionStorage.getItem("tipoDeCuenta")).toBeNull();
    expect(signIn).toHaveBeenCalledWith({
      redirectUri: `${window.location.origin}/callback`,
      firstScreen: "identifier:sign_in",
      identifiers: ["email"],
      prompt: ["login", "consent"],
    });
  });

  it("comienza el registro en Logto sin conservar un tipo de cuenta anterior", () => {
    sessionStorage.setItem("tipoDeCuenta", "colectivo");
    render(
      <AuthProvider>
        <AccionesAuth />
      </AuthProvider>,
    );

    fireEvent.click(screen.getByText("Crear cuenta"));

    expect(sessionStorage.getItem("tipoDeCuenta")).toBeNull();
    expect(signIn).toHaveBeenCalledWith({
      redirectUri: `${window.location.origin}/callback`,
      interactionMode: "signUp",
    });
  });

  it("solicita a Logto el token del recurso de la API para consultar el perfil", async () => {
    render(
      <AuthProvider>
        <AccionesAuth />
      </AuthProvider>,
    );

    fireEvent.click(screen.getByText("Verificar sesión"));

    await waitFor(() =>
      expect(obtenerSesion).toHaveBeenCalledWith("access-token"),
    );
    expect(getAccessToken).toHaveBeenCalledWith(RESOURCE);
  });

  it("no consulta /me si Logto no devuelve un token", async () => {
    getAccessToken.mockResolvedValue(undefined);
    render(
      <AuthProvider>
        <AccionesAuth />
      </AuthProvider>,
    );

    fireEvent.click(screen.getByText("Verificar sesión"));

    await waitFor(() => expect(obtenerSesion).not.toHaveBeenCalled());
  });

  it("obtiene el email de la cuenta desde el endpoint de usuario de Logto", async () => {
    render(
      <AuthProvider>
        <AccionesAuth />
      </AuthProvider>,
    );

    fireEvent.click(screen.getByText("Leer email"));

    expect(await screen.findByText("cuenta@example.com")).toBeInTheDocument();
    expect(fetchUserInfo).toHaveBeenCalledTimes(1);
  });

  it("no bloquea una sesión autenticada por operaciones de Logto en curso", async () => {
    useLogto.mockReturnValue({
      isAuthenticated: true,
      isLoading: true,
      signIn,
      signOut: jest.fn(),
      getAccessToken,
      fetchUserInfo,
    });

    render(
      <AuthProvider>
        <AccionesAuth />
      </AuthProvider>,
    );

    await waitFor(() => {
      expect(screen.getByTestId("auth-loading")).toHaveTextContent("false");
    });
  });

  it("muestra el error de autenticación devuelto por el servidor", async () => {
    obtenerSesion.mockRejectedValue({
      response: {
        data: {
          error: "el token es invalido o vencio",
          codigo: "TOKEN_INVALIDO",
        },
      },
    });
    render(
      <AuthProvider>
        <AccionesAuth />
      </AuthProvider>,
    );

    fireEvent.click(screen.getByText("Verificar sesión"));

    expect(
      await screen.findByText("el token es invalido o vencio (TOKEN_INVALIDO)"),
    ).toBeInTheDocument();
  });

  it("muestra un error recuperable si la verificación de sesión agota el tiempo", async () => {
    obtenerSesion.mockRejectedValue({ code: "ECONNABORTED" });
    render(
      <AuthProvider>
        <AccionesAuth />
      </AuthProvider>,
    );

    fireEvent.click(screen.getByText("Verificar sesión"));

    expect(
      await screen.findByText(
        "El servidor tardó demasiado en verificar tu sesión. Reintentá.",
      ),
    ).toBeInTheDocument();
  });

  it("indica cuando no puede conectarse al backend", async () => {
    obtenerSesion.mockRejectedValue({ code: "ERR_NETWORK" });
    render(
      <AuthProvider>
        <AccionesAuth />
      </AuthProvider>,
    );

    fireEvent.click(screen.getByText("Verificar sesión"));

    expect(
      await screen.findByText(
        "No pudimos conectarnos con el servidor. Verificá que el backend esté iniciado.",
      ),
    ).toBeInTheDocument();
  });
});
