'use client';

import { AlertTriangle, RefreshCw } from 'lucide-react';

interface DatabaseErrorMessageProps {
  onReturnToLogin: () => void;
}

export default function DatabaseErrorMessage({ onReturnToLogin }: DatabaseErrorMessageProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md text-center">
        <div className="flex justify-center mb-6">
          <div className="bg-red-100 rounded-full p-4">
            <AlertTriangle className="w-12 h-12 text-red-500" />
          </div>
        </div>
        
        <h1 className="text-2xl font-bold text-gray-800 mb-4">
          ⚠️ Fallo Temporal del Sistema
        </h1>
        
        <div className="text-gray-600 mb-6 space-y-3">
          <p>
            Hemos experimentado un fallo técnico con nuestro proveedor de base de datos y tuvimos que reiniciar el proyecto completamente.
          </p>
          <p>
            <strong>Lamentamos profundamente los inconvenientes causados.</strong>
          </p>
          <p>
            Para continuar usando Platita Paisa, necesitarás registrarte nuevamente. Todos tus datos anteriores se han perdido debido a este incidente técnico.
            Es un fallo que no volverá a ocurrir, ya que hemos implementado medidas para evitarlo en el futuro.
          </p>
        </div>

        <div className="space-y-4">
          <button
            onClick={onReturnToLogin}
            className="w-full bg-gradient-to-r from-green-500 to-blue-600 text-white py-3 rounded-lg font-semibold flex items-center justify-center space-x-2 hover:from-green-600 hover:to-blue-700 transition-all duration-200"
          >
            <RefreshCw className="w-5 h-5" />
            <span>Ir al Registro</span>
          </button>
        </div>
        
        <div className="mt-6 pt-6 border-t border-gray-200">
          <p className="text-xs text-gray-400">
            Si tienes preguntas sobre este incidente, por favor contáctanos.
          </p>
        </div>
      </div>
    </div>
  );
}
