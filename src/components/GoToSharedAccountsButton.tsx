'use client';
import { Users, ArrowRight, Sparkles, Heart, Calendar } from 'lucide-react';
import { useState } from 'react';

export default function ParcheButton() {
  const [isHovered, setIsHovered] = useState(false);

  const handleClick = () => {
    window.location.href = '/shared-accounts';
  };

  return (
    <div className="mt-8">
      {/* Desktop Version */}
      <div 
        onClick={handleClick}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className="hidden md:block cursor-pointer relative overflow-hidden bg-gradient-to-br from-purple-500 via-pink-500 to-orange-400 rounded-2xl shadow-xl hover:shadow-2xl transform hover:scale-[1.02] transition-all duration-500 group"
      >
        {/* Animated background elements */}
        <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -translate-y-16 translate-x-16 group-hover:scale-150 transition-transform duration-700"></div>
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full translate-y-12 -translate-x-12 group-hover:scale-125 transition-transform duration-700"></div>
        
        <div className="relative p-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-6">
              {/* Icon with animation */}
              <div className={`bg-white/20 backdrop-blur-sm rounded-2xl p-4 transition-all duration-300 ${isHovered ? 'scale-110 rotate-6' : ''}`}>
                <Users className="text-white w-10 h-10" />
              </div>
              
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="text-2xl font-bold text-white">El Parche</h3>
                  <div className="flex gap-1">
                    <Sparkles className="w-5 h-5 text-yellow-300 animate-pulse" />
                    <Heart className="w-5 h-5 text-red-300" />
                  </div>
                </div>
                <p className="text-white/90 text-base font-medium mb-1">
                  Gestiona gastos compartidos con tus parceros
                </p>
                <div className="flex items-center gap-4 text-white/80 text-sm">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    Viajes grupales
                  </span>
                  <span>•</span>
                  <span>Salidas con amigos</span>
                  <span>•</span>
                  <span>Compras compartidas</span>
                </div>
              </div>
            </div>
            
            {/* CTA Button */}
            <div className={`transition-all duration-300 ${isHovered ? 'translate-x-2' : ''}`}>
              <button className="bg-white text-purple-600 px-8 py-4 rounded-xl font-bold text-lg hover:bg-purple-50 transition-all duration-300 shadow-lg hover:shadow-xl flex items-center gap-3 group/btn">
                <span>Ir al Parche</span>
                <ArrowRight className="w-5 h-5 group-hover/btn:translate-x-1 transition-transform duration-300" />
              </button>
            </div>
          </div>
          
          {/* Bottom stats/features */}
          <div className="mt-6 pt-6 border-t border-white/20">
            <div className="flex items-center justify-between text-white/80 text-sm">
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                  <span>Cálculos automáticos</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
                  <span>División equitativa</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse"></div>
                  <span>Liquidación fácil</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Version */}
      <div 
        onClick={handleClick}
        className="md:hidden cursor-pointer relative overflow-hidden bg-gradient-to-br from-purple-500 via-pink-500 to-orange-400 rounded-2xl shadow-xl active:scale-95 transition-all duration-200"
      >
        {/* Mobile background decoration */}
        <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -translate-y-10 translate-x-10"></div>
        <div className="absolute bottom-0 left-0 w-16 h-16 bg-white/10 rounded-full translate-y-8 -translate-x-8"></div>
        
        <div className="relative p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="bg-white/20 backdrop-blur-sm rounded-xl p-3">
                <Users className="text-white w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-xl font-bold text-white">El Parche</h3>
                  <Sparkles className="w-4 h-4 text-yellow-300" />
                </div>
                <div className="flex items-center gap-1 mt-1">
                  <div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse"></div>
                  <span className="text-white/80 text-xs">Activo</span>
                </div>
              </div>
            </div>
            <ArrowRight className="w-5 h-5 text-white/80" />
          </div>
          
          {/* Description */}
          <div className="mb-6">
            <p className="text-white/90 text-sm font-medium mb-2">
              Gestiona gastos compartidos con tus parceros
            </p>
            <div className="flex flex-wrap gap-2 text-xs text-white/70">
              <span className="bg-white/10 px-2 py-1 rounded-full">🎯 Viajes</span>
              <span className="bg-white/10 px-2 py-1 rounded-full">🍕 Comidas</span>
              <span className="bg-white/10 px-2 py-1 rounded-full">🎉 Fiestas</span>
            </div>
          </div>
          
          {/* Features grid */}
          <div className="grid grid-cols-3 gap-3 mb-6">
            <div className="text-center">
              <div className="w-8 h-8 bg-white/15 rounded-lg flex items-center justify-center mx-auto mb-1">
                <span className="text-white text-xs">📊</span>
              </div>
              <span className="text-white/80 text-xs font-medium">Cálculos</span>
            </div>
            <div className="text-center">
              <div className="w-8 h-8 bg-white/15 rounded-lg flex items-center justify-center mx-auto mb-1">
                <span className="text-white text-xs">⚖️</span>
              </div>
              <span className="text-white/80 text-xs font-medium">División</span>
            </div>
            <div className="text-center">
              <div className="w-8 h-8 bg-white/15 rounded-lg flex items-center justify-center mx-auto mb-1">
                <span className="text-white text-xs">💸</span>
              </div>
              <span className="text-white/80 text-xs font-medium">Pagos</span>
            </div>
          </div>
          
          {/* CTA Button */}
          <button className="w-full bg-white text-purple-600 py-4 rounded-xl font-bold text-base hover:bg-purple-50 active:bg-purple-100 transition-colors shadow-lg flex items-center justify-center gap-2">
            <span>Entrar al Parche</span>
            <ArrowRight className="w-4 h-4" />
          </button>
          
          {/* Bottom indicator */}
          <div className="flex items-center justify-center mt-4 gap-2">
            <div className="flex gap-1">
              <div className="w-1 h-1 bg-white/60 rounded-full"></div>
              <div className="w-1 h-1 bg-white/60 rounded-full"></div>
              <div className="w-4 h-1 bg-white rounded-full"></div>
              <div className="w-1 h-1 bg-white/60 rounded-full"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}