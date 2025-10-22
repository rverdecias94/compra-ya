import React, { useEffect, useState } from 'react';

const slides = [
  {
    title: 'Ofertas de la semana',
    subtitle: 'Electrodomésticos, electrónicos y hogar con descuentos especiales',
  },
  {
    title: 'Entrega rápida',
    subtitle: 'Recogida en tienda o entrega a domicilio en tu zona',
  },
  {
    title: 'Compra inteligente',
    subtitle: 'Productos seleccionados con la mejor relación calidad/precio',
  },
];

export default function HeroSlider() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setIndex((i) => (i + 1) % slides.length), 4000);
    return () => clearInterval(t);
  }, []);

  return (
    <section className="relative w-full">
      <div className="max-w-6xl mx-auto px-4 py-10 sm:py-16">
        <div className="grid sm:grid-cols-2 gap-6 items-center">
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">
              {slides[index].title}
            </h1>
            <p className="mt-3 text-neutral-600 dark:text-neutral-300">
              {slides[index].subtitle}
            </p>
            <div className="mt-6 flex gap-3">
              <a href="#productos" className="px-4 py-2 rounded-md bg-green-600 text-white">Ver productos</a>
              <a href="/carrito" className="px-4 py-2 rounded-md border border-neutral-200 dark:border-neutral-700">Ver carrito</a>
            </div>
          </div>
          <div className="rounded-xl bg-gradient-to-br from-green-100 to-teal-100 dark:from-neutral-800 dark:to-neutral-700 h-48 sm:h-64 flex items-center justify-center">
            <div className="text-center">
              <img src="/images/hero.png" alt="" srcset="" className="w-100 sm:w-80" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}