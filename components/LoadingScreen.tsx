
import React from 'react';

const LoadingScreen: React.FC = () => {
    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900">
            <div className="w-16 h-16 border-4 border-dashed rounded-full animate-spin border-blue-accent"></div>
            <p className="mt-4 text-lg text-white">Carregando dados...</p>
        </div>
    );
};

export default LoadingScreen;
