import { Component, type ErrorInfo, type ReactNode } from "react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

/** Red de seguridad para toda la app: si algo revienta al renderizar (un
 * error de JS que React no puede recuperar), sin esto la página queda
 * completamente en negro y sin ningún mensaje — muy confuso para quien
 * la abre, sobre todo en el celular. Con esto, en cambio, se ve una
 * pantalla con un mensaje claro y un botón para reintentar. */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // eslint-disable-next-line no-console
    console.error("[ErrorBoundary] Error al renderizar:", error, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            minHeight: "100vh",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: "1rem",
            padding: "2rem",
            textAlign: "center",
            background: "#08070a",
            color: "#f8f7f4",
            fontFamily: "system-ui, sans-serif",
          }}
        >
          <p style={{ fontSize: "1.05rem", maxWidth: "22rem" }}>
            Algo no cargó bien. Probá recargar la página — si sigue pasando, escribinos por WhatsApp.
          </p>
          <button
            onClick={() => window.location.reload()}
            style={{
              background: "#c9a24b",
              color: "#08070a",
              border: "none",
              borderRadius: "999px",
              padding: "0.65rem 1.5rem",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Recargar
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
