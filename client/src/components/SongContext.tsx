import React, { createContext, useState, useContext, ReactNode } from 'react';

// Define the type for the song context
interface SongContextType {
  selectedSongs: string[];
  setSelectedSongs: React.Dispatch<React.SetStateAction<string[]>>;
}

// Create the context
const SongContext = createContext<SongContextType | undefined>(undefined);

// Context Provider component
export const SongProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [selectedSongs, setSelectedSongs] = useState<string[]>([]);

  return (
    <SongContext.Provider value={{ selectedSongs, setSelectedSongs }}>
      {children}
    </SongContext.Provider>
  );
};

// Custom hook to use the song context
export const useSongContext = () => {
  const context = useContext(SongContext);
  if (context === undefined) {
    throw new Error('useSongContext must be used within a SongProvider');
  }
  return context;
};
