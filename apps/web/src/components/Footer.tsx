import { Logo } from "./Logo";

export function Footer() {
  return (
    <footer className="px-5 py-10">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 text-sm text-paper/40 md:flex-row">
        <Logo className="opacity-80" />
        <p>© {new Date().getFullYear()} IL BRAVO. Todos los derechos reservados.</p>
        <a href="/admin" className="hover:text-gold">
          Panel del local
        </a>
      </div>
    </footer>
  );
}
