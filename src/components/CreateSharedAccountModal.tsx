'use client';
import { useState } from 'react';
import { X, Plus, Trash2, User, UserPlus } from 'lucide-react';

interface CreateSharedAccountModalProps {
    isOpen: boolean;
    onClose: () => void;
    onAccountCreated: () => void;
    token: string;
    user: any;
}

interface Participant {
    id: string;
    type: 'user' | 'guest';
    username?: string;
    guestName?: string;
}

export default function CreateSharedAccountModal({
    isOpen,
    onClose,
    onAccountCreated,
    token,
    user
}: CreateSharedAccountModalProps) {
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [participants, setParticipants] = useState<Participant[]>([]);
    const [newParticipant, setNewParticipant] = useState('');
    const [participantType, setParticipantType] = useState<'user' | 'guest'>('user');
    const [loading, setLoading] = useState(false);
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [searching, setSearching] = useState(false);

    const searchUsers = async (query: string) => {
        if (query.length < 3) {
            setSearchResults([]);
            return;
        }

        setSearching(true);
        try {
            const response = await fetch(`/api/users/search?q=${encodeURIComponent(query)}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await response.json();
            // Filtrar usuarios que ya están en la lista y el usuario actual
            const participantUsernames = new Set(
                participants
                    .filter(p => p.type === 'user')
                    .map(p => p.username)
            );
            const filtered = (data.users || []).filter((u: any) =>
                !participantUsernames.has(u.username) && u.id !== user.id
            );
            setSearchResults(filtered);
        } catch (error) {
            console.error('Error searching users:', error);
            setSearchResults([]);
        } finally {
            setSearching(false);
        }
    };

    const addParticipant = (participant: Participant) => {
        setParticipants([...participants, participant]);
        setNewParticipant('');
        setSearchResults([]);
    };

    const addUserParticipant = (user: any) => {
        addParticipant({
            id: `user_${user.id}`,
            type: 'user',
            username: user.username
        });
    };

    const addGuestParticipant = () => {
        if (newParticipant.trim() && !participants.some(p => p.guestName === newParticipant.trim())) {
            addParticipant({
                id: `guest_${Date.now()}`,
                type: 'guest',
                guestName: newParticipant.trim()
            });
        }
    };

    const removeParticipant = (id: string) => {
        setParticipants(participants.filter(p => p.id !== id));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim()) return;

        setLoading(true);
        try {
            const response = await fetch('/api/shared-accounts', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    name: name.trim(),
                    description: description.trim(),
                    participants: participants.map(p => ({
                        type: p.type,
                        username: p.username,
                        guestName: p.guestName
                    }))
                })
            });

            if (response.ok) {
                onAccountCreated();
                // Reset form
                setName('');
                setDescription('');
                setParticipants([]);
                setNewParticipant('');
            } else {
                console.error('Error creating shared account');
            }
        } catch (error) {
            console.error('Error creating shared account:', error);
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 backdrop-blur-sm bg-black/10 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="p-4 sm:p-6 border-b border-gray-200">
                    <div className="flex items-center justify-between">
                        <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Crear nuevo parche</h2>
                        <button
                            onClick={onClose}
                            className="cursor-pointer text-gray-400 hover:text-gray-600 transition-colors p-1"
                        >
                            <X className="w-6 h-6" />
                        </button>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-6">
                    {/* Información básica */}
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Nombre del parche *
                            </label>
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="ej: Camping en Guatapé, Salida a Medellín..."
                                className="text-gray-800 w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm sm:text-base"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Descripción (opcional)
                            </label>
                            <textarea
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                placeholder="Describe brevemente la actividad o evento..."
                                rows={3}
                                className="text-gray-800 w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm sm:text-base"
                            />
                        </div>
                    </div>

                    {/* Agregar participantes */}
                    <div className="space-y-4">
                        <h3 className="text-lg font-semibold text-gray-900">Agregar parceros</h3>

                        <div className="space-y-3">
                            {/* Tipo de participante */}
                            <div className="flex flex-col space-y-2 sm:flex-row sm:space-y-0 sm:space-x-3">
                                <button
                                    type="button"
                                    onClick={() => setParticipantType('user')}
                                    className={`cursor-pointer flex-1 flex items-center justify-center space-x-2 py-2 px-3 sm:px-4 rounded-lg border-2 transition-colors text-sm ${participantType === 'user'
                                            ? 'border-purple-500 bg-purple-50 text-purple-700'
                                            : 'border-gray-300 text-gray-600 hover:border-gray-400'
                                        }`}
                                >
                                    <User className="w-4 h-4 flex-shrink-0" />
                                    <span>Usuario registrado</span>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setParticipantType('guest')}
                                    className={`cursor-pointer flex-1 flex items-center justify-center space-x-2 py-2 px-3 sm:px-4 rounded-lg border-2 transition-colors text-sm ${participantType === 'guest'
                                            ? 'border-purple-500 bg-purple-50 text-purple-700'
                                            : 'border-gray-300 text-gray-600 hover:border-gray-400'
                                        }`}
                                >
                                    <UserPlus className="w-4 h-4 flex-shrink-0" />
                                    <span>Invitado</span>
                                </button>
                            </div>

                            {/* Input para agregar participante */}
                            <div className="flex space-x-2">
                                <div className="flex-1 relative">
                                    <input
                                        type="text"
                                        value={newParticipant}
                                        onChange={(e) => {
                                            setNewParticipant(e.target.value);
                                            if (participantType === 'user') {
                                                searchUsers(e.target.value);
                                            }
                                        }}
                                        placeholder={
                                            participantType === 'user'
                                                ? "Buscar usuario por nombre..."
                                                : "Nombre del invitado..."
                                        }
                                        className="text-gray-800 w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm sm:text-base"
                                    />

                                    {/* Resultados de búsqueda para usuarios */}
                                    {participantType === 'user' && (
                                        <div className="absolute top-full left-0 right-0 bg-white border border-gray-300 rounded-lg shadow-lg z-10 max-h-40 overflow-y-auto">
                                            {searching && (
                                                <div className="flex items-center justify-center py-3 text-purple-600">
                                                    <svg className="animate-spin h-5 w-5 mr-2 text-purple-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path>
                                                    </svg>
                                                    <span className="text-sm">Buscando usuarios...</span>
                                                </div>
                                            )}
                                            {!searching && searchResults.length > 0 && searchResults.map((user) => (
                                                <button
                                                    key={user.id}
                                                    type="button"
                                                    onClick={() => addUserParticipant(user)}
                                                    className="cursor-pointer w-full px-3 py-2 text-left hover:bg-gray-100 flex items-center space-x-2"
                                                >
                                                    <User className="w-4 h-4 text-gray-400 flex-shrink-0" />
                                                    <span className='text-gray-800 text-sm'>{user.username}</span>
                                                </button>
                                            ))}
                                            {!searching && searchResults.length === 0 && newParticipant.length >= 3 && (
                                                <div className="px-3 py-2 text-gray-500 text-sm">No se encontraron usuarios.</div>
                                            )}
                                        </div>
                                    )}
                                </div>

                                {participantType === 'guest' && (
                                    <button
                                        type="button"
                                        onClick={addGuestParticipant}
                                        disabled={!newParticipant.trim()}
                                        className="cursor-pointer px-3 sm:px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex-shrink-0"
                                    >
                                        <Plus className="w-4 h-4" />
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Lista de participantes agregados */}
                    {participants.length > 0 && (
                        <div className="space-y-3">
                            <h4 className="font-medium text-gray-900">Parceros agregados:</h4>
                            <div className="space-y-2 max-h-32 sm:max-h-40 overflow-y-auto">
                                {participants.map((participant) => (
                                    <div
                                        key={participant.id}
                                        className="flex items-center justify-between bg-gray-50 px-3 py-2 rounded-lg"
                                    >
                                        <div className="flex items-center space-x-2 min-w-0 flex-1">
                                            {participant.type === 'user' ? (
                                                <User className="w-4 h-4 text-blue-500 flex-shrink-0" />
                                            ) : (
                                                <UserPlus className="w-4 h-4 text-green-500 flex-shrink-0" />
                                            )}
                                            <span className="text-gray-500 font-medium text-sm truncate">
                                                {participant.username || participant.guestName}
                                            </span>
                                            <span className="text-xs text-gray-500 flex-shrink-0">
                                                ({participant.type === 'user' ? 'Usuario' : 'Invitado'})
                                            </span>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => removeParticipant(participant.id)}
                                            className="cursor-pointer text-red-500 hover:text-red-700 transition-colors p-1 flex-shrink-0"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Botones */}
                    <div className="flex flex-col space-y-3 sm:flex-row sm:space-y-0 sm:space-x-3 pt-4 border-t border-gray-200">
                        <button
                            type="button"
                            onClick={onClose}
                            className="cursor-pointer flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm sm:text-base"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={loading || !name.trim()}
                            className="cursor-pointer flex-1 px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:from-purple-600 hover:to-pink-600 transition-all shadow-lg disabled:bg-gray-300 disabled:cursor-not-allowed text-sm sm:text-base"
                        >
                            {loading ? 'Creando...' : 'Crear parche'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}