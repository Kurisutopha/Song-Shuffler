import React, { useState, useEffect } from 'react';
import { Search } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const GenreSearch = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [genres, setGenres] = useState<string[]>([]);
    const [filteredGenres, setFilteredGenres] = useState<string[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchGenres = async () => {
            try {
                const response = await fetch('http://localhost:8000/api/genres');
    
                if (!response.ok) {
                    throw new Error('failed to fetch genres');
                }
                const data = await response.json();
                setGenres(data);
                setFilteredGenres(data);
            } catch (error) {
                console.error('Error fetching genres:', error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchGenres();
    }, []);

    const handleSearch = (event: React.ChangeEvent<HTMLInputElement>) => {
        const term = event.target.value.toLowerCase();
        setSearchTerm(term);

        const filtered = genres.filter(genre =>
            genre.toLowerCase().includes(term)
        );
        setFilteredGenres(filtered);
    };

    const handleGenreSelect = async (genre: string) => {
        try {
            const response = await fetch(`http://localhost:8000/api/songs?genre=${encodeURIComponent(genre)}`);
            if (!response.ok) {
                throw new Error('Failed to fetch songs');
            }
            const songs = await response.json;
            console.log('Fetched songs:', songs);
        } catch (error) {
            console.error('Error fetching songs:', error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="w-full max-w-md- mx-auto p-4">
            <div className="relative">
                <div className="relative">
                    <input
                    type="text"
                    value={searchTerm}
                    onChange={handleSearch}
                    placeholder='Search for a genre...'
                    className="w-full p-2 pl-10 border rounded-log focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                </div>

                {searchTerm && (
                    <div className="absolute w-full mt-1 max-h-60 overflow-auto bg-white border rounded-lg shadow-lg">
                        {isLoading ? (
                            <div className="p-4 text-center text-gray-500">Loading genres...</div>
                        ) : filteredGenres.length > 0 ? (
                            filteredGenres.map((genre, index) => (
                                <button
                                key={index}
                                onClick={() => handleGenreSelect(genre)}
                                className="w-full text-left px-4 py-2 hover:bg-gray-100 focus:bg-gray-100 focus:outline-none"
                                >
                                    {genre}
                                </button>
                            ))   
                        ) : (
                            <div className="p-4 text-center text-gray-500">No genres found</div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default GenreSearch;