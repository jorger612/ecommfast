export function Footer() {
  return (
    <footer className="bg-card border-t border-gray-100 mt-auto">
      <div className="max-w-7xl mx-auto px-4 py-8 text-center text-text-muted text-sm">
        © {new Date().getFullYear()} EcommFast. Todos los derechos reservados.
      </div>
    </footer>
  );
}
