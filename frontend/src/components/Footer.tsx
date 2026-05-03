export function Footer() {
  return (
    <footer className="bg-tif-black text-tif-white mt-16">
      <div className="section py-12 grid sm:grid-cols-3 gap-8">
        <div>
          <div className="font-display font-bold text-xl">TIF — Take Your Food</div>
          <p className="mt-2 text-sm opacity-70">Réservation et précommande de repas.</p>
        </div>
        <div className="text-sm space-y-1">
          <div className="font-semibold mb-2">Pour les restaurants</div>
          <a href="/pricing" className="block opacity-70 hover:opacity-100">Nos formules</a>
          <a href="/dashboard" className="block opacity-70 hover:opacity-100">Espace restaurant</a>
        </div>
        <div className="text-sm space-y-1">
          <div className="font-semibold mb-2">Légal</div>
          <a href="/cgu" className="block opacity-70 hover:opacity-100">Conditions d'utilisation</a>
          <a href="/privacy" className="block opacity-70 hover:opacity-100">Confidentialité</a>
        </div>
      </div>
      <div className="border-t border-white/10 py-4 text-center text-xs opacity-60">
        © {new Date().getFullYear()} TIF — Tous droits réservés.
      </div>
    </footer>
  );
}
