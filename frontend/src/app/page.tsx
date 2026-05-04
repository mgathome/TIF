'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import type { Restaurant } from '@/lib/types';
import { RestaurantCard } from '@/components/RestaurantCard';
import { Mascot } from '@/components/Mascot';
import { Loading } from '@/components/Loading';
import { EmptyState } from '@/components/EmptyState';

export default function HomePage() {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    api<{ items: Restaurant[] }>('/restaurants?limit=20', { auth: false })
      .then(({ items }) => setRestaurants(items))
      .finally(() => setLoading(false));
  }, []);

  const filtered = restaurants.filter((r) =>
    !search || r.name.toLowerCase().includes(search.toLowerCase())
                || r.cuisineType?.toLowerCase().includes(search.toLowerCase())
                || r.address.city.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <>
      {/* ========== HERO ========== */}
      <section className="bg-tif-violet text-white relative overflow-hidden">
        {/* Decoration : gros cercle jaune en arrière-plan */}
        <div className="absolute -right-32 -top-32 w-96 h-96 rounded-full bg-tif-yellow/20 blur-3xl pointer-events-none" />
        <div className="absolute -left-20 -bottom-20 w-80 h-80 rounded-full bg-white/10 blur-3xl pointer-events-none" />

        <div className="section py-16 sm:py-24 grid md:grid-cols-2 gap-8 items-center relative z-10">
          <div className="animate-slide-up">
            <h1 className="font-display font-bold text-4xl sm:text-6xl leading-[1.05]">
              Précommandez. <br />
              <span className="text-tif-yellow">Choisissez.</span> <br />
              Dégustez.
            </h1>
            <p className="mt-6 text-lg sm:text-xl opacity-90 max-w-md">
              À emporter ou livré chez vous, réservez votre repas dans les restaurants
              que vous aimez et savourez quand ça vous arrange.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="#restaurants" className="btn-primary text-base">
                Voir les restaurants
              </Link>
              <Link href="#restaurateurs" className="btn-ghost text-white hover:bg-white/10 text-base">
                Je suis restaurateur →
              </Link>
            </div>
          </div>
          <div className="hidden md:flex justify-center">
            <Mascot variant="tiffy" size={360} animated />
          </div>
        </div>
      </section>

      {/* ========== RECHERCHE ========== */}
      <section className="section -mt-8 relative z-20">
        <div className="card p-2 flex items-center gap-2 max-w-2xl mx-auto shadow-tif-lg">
          <span className="text-xl pl-3">🔎</span>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Restaurant, cuisine, ville..."
            className="flex-1 px-2 py-3 outline-none text-tif-black bg-transparent"
          />
        </div>
      </section>

      {/* ========== COMMENT CA MARCHE ========== */}
      <section className="section py-16 sm:py-20">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <h2 className="font-display font-bold text-3xl sm:text-4xl text-tif-black">
            Comment ça marche ?
          </h2>
          <p className="mt-3 text-tif-gray-700">
            Trois étapes, deux minutes, et votre repas est réservé.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          <Step
            number="1"
            mascot="bite"
            title="Choisissez votre restaurant"
            desc="Parcourez les restos près de chez vous, regardez le menu, repérez les plats qui vous tentent."
          />
          <Step
            number="2"
            mascot="flamy"
            title="Précommandez et payez"
            desc="Sélectionnez votre créneau et réglez en ligne en toute sécurité avec Stripe."
          />
          <Step
            number="3"
            mascot="tibo"
            title="Récupérez ou faites-vous livrer"
            desc="Passez le chercher au resto à l'heure pile, ou laissez le restaurant vous livrer."
          />
        </div>
      </section>

      {/* ========== POURQUOI TIF ========== */}
      <section className="bg-tif-gray-50 py-16 sm:py-20 border-y border-tif-gray-100">
        <div className="section">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="font-display font-bold text-3xl sm:text-4xl text-tif-black">
              Pourquoi <span className="text-tif-violet">TIF</span> ?
            </h2>
            <p className="mt-3 text-tif-gray-700">
              On a repensé la précommande pour être agréable des deux côtés.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <Feature icon="⏱️" title="Votre repas à l'heure pile">
              Plus d'attente au comptoir : votre commande est préparée pour le créneau que vous choisissez.
            </Feature>
            <Feature icon="🔒" title="Paiement 100% sécurisé">
              Réglez en ligne en toute confiance : vos coordonnées bancaires sont protégées de bout en bout.
            </Feature>
            <Feature icon="📍" title="Les pépites près de chez vous">
              Découvrez et redécouvrez les meilleures adresses de votre quartier.
            </Feature>
            <Feature icon="🎯" title="Choisissez votre créneau">
              Midi, soir, demain, samedi prochain : vous décidez quand récupérer ou être livré.
            </Feature>
            <Feature icon="📦" title="À emporter ou livraison">
              Selon les options du resto, vous choisissez entre passer le chercher ou être livré chez vous.
            </Feature>
            <Feature icon="🏷️" title="Codes promo">
              Profitez de réductions régulièrement sur vos restaurants préférés.
            </Feature>
          </div>
        </div>
      </section>

      {/* ========== RESTAURATEURS ========== */}
      <section id="restaurateurs" className="section py-16 sm:py-20">
        <div className="grid md:grid-cols-2 gap-10 items-center">
          <div className="order-2 md:order-1">
            <span className="inline-block bg-tif-violet text-white text-xs font-bold px-3 py-1 rounded-full mb-4 uppercase tracking-wide">
              Pour les restaurateurs
            </span>
            <h2 className="font-display font-bold text-3xl sm:text-4xl text-tif-black">
              Gardez 100% de vos recettes.
            </h2>
            <p className="mt-4 text-tif-gray-700 text-lg">
              Contrairement aux plateformes classiques, TIF ne prend <strong>aucune commission</strong> sur vos commandes.
              Un abonnement mensuel fixe, et tout ce qui rentre est à vous.
            </p>

            <div className="mt-6 grid grid-cols-3 gap-3">
              <PriceBox name="Starter" price="79" features="Jusqu'à 50 commandes/mois" />
              <PriceBox name="Growth" price="149" features="Jusqu'à 250 commandes/mois" highlight />
              <PriceBox name="Pro" price="299" features="Commandes illimitées" />
            </div>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/register" className="btn-primary">Créer mon restaurant →</Link>
              <Link href="/dashboard" className="btn-ghost">J'ai déjà un compte</Link>
            </div>
          </div>

          <div className="order-1 md:order-2 flex justify-center">
            <Mascot variant="chef" size={300} />
          </div>
        </div>
      </section>

      {/* ========== RESTAURANTS DISPO ========== */}
      <section id="restaurants" className="bg-tif-gray-50 py-16 sm:py-20 border-t border-tif-gray-100">
        <div className="section">
          <h2 className="font-display font-bold text-3xl sm:text-4xl text-tif-black mb-2">
            Restaurants à découvrir
          </h2>
          <p className="text-tif-gray-700 mb-8">
            {restaurants.length} restaurant{restaurants.length > 1 ? 's' : ''} disponible{restaurants.length > 1 ? 's' : ''} près de chez vous
          </p>

          {loading ? (
            <Loading />
          ) : filtered.length === 0 ? (
            <EmptyState
              title={search ? 'Aucun résultat' : 'Bientôt des restaurants !'}
              description={
                search
                  ? "Essayez avec d'autres mots-clés."
                  : "Les premiers restaurants seront bientôt en ligne. Revenez vite."
              }
            />
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filtered.map((r) => <RestaurantCard key={r.id} restaurant={r} />)}
            </div>
          )}
        </div>
      </section>

      {/* ========== CTA FINAL ========== */}
      <section className="bg-tif-violet text-white py-16 relative overflow-hidden">
        <div className="absolute -right-20 -top-20 w-72 h-72 rounded-full bg-tif-yellow/20 blur-3xl pointer-events-none" />
        <div className="section text-center relative z-10">
          <Mascot variant="flamy" size={120} className="mx-auto mb-4" animated />
          <h2 className="font-display font-bold text-3xl sm:text-4xl">
            Prêt à précommander ?
          </h2>
          <p className="mt-3 opacity-90 max-w-md mx-auto">
            Créez votre compte en 30 secondes et commandez votre premier repas.
          </p>
          <div className="mt-6 flex flex-wrap gap-3 justify-center">
            <Link href="/register" className="btn-primary">Créer mon compte</Link>
            <Link href="#restaurants" className="btn-ghost text-white hover:bg-white/10">Voir les restos</Link>
          </div>
        </div>
      </section>
    </>
  );
}

// =================== Sous-composants ===================

function Step({
  number, mascot, title, desc,
}: { number: string; mascot: 'bite' | 'flamy' | 'tibo' | 'chef'; title: string; desc: string }) {
  return (
    <div className="card p-6 text-center hover:shadow-tif-lg transition-shadow">
      <div className="relative inline-block mb-3">
        <Mascot variant={mascot} size={140} />
        <span className="absolute -top-1 -left-1 bg-tif-yellow text-tif-black w-10 h-10 rounded-full flex items-center justify-center font-display font-bold text-xl shadow-tif">
          {number}
        </span>
      </div>
      <h3 className="font-display font-bold text-xl text-tif-black mt-2">{title}</h3>
      <p className="text-sm text-tif-gray-700 mt-2">{desc}</p>
    </div>
  );
}

function Feature({ icon, title, children }: { icon: string; title: string; children: React.ReactNode }) {
  return (
    <div className="card p-6">
      <div className="text-3xl mb-3">{icon}</div>
      <h3 className="font-display font-bold text-lg text-tif-black">{title}</h3>
      <p className="text-sm text-tif-gray-700 mt-2">{children}</p>
    </div>
  );
}

function PriceBox({
  name, price, features, highlight = false,
}: { name: string; price: string; features: string; highlight?: boolean }) {
  return (
    <div className={`rounded-tif p-3 text-center border-2 ${highlight ? 'border-tif-violet bg-tif-violet/5' : 'border-tif-gray-200'}`}>
      <div className="text-xs font-bold uppercase tracking-wide text-tif-gray-500">{name}</div>
      <div className="font-display font-bold text-2xl text-tif-black mt-1">
        {price}€<span className="text-xs text-tif-gray-500 font-normal">/mois</span>
      </div>
      <div className="text-xs text-tif-gray-700 mt-1">{features}</div>
    </div>
  );
}
