import React from 'react';
import { MapPin } from 'lucide-react';

export const AppHeader: React.FC = () => {
  return (
    <header className="bg-green-800 text-white p-4 shadow-md z-10">
      <div className="container mx-auto flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <MapPin className="h-6 w-6" />
          <h1 className="text-xl font-semibold">Hamilton Map Editor</h1>
        </div>
        <div className="text-sm hidden md:block">
          <span>Hamilton, New Zealand</span>
        </div>
      </div>
    </header>
  );
};