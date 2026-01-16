
import React, { useState, useMemo, useRef, useEffect } from 'react';

interface Option {
    id: string;
    name: string;
}

interface SearchableSelectProps {
    options: Option[];
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
}

const useOutsideClick = (ref: React.RefObject<HTMLDivElement>, callback: () => void) => {
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (ref.current && !ref.current.contains(event.target as Node)) {
                callback();
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [ref, callback]);
};


const SearchableSelect: React.FC<SearchableSelectProps> = ({ options, value, onChange, placeholder = "Selecione..." }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const wrapperRef = useRef<HTMLDivElement>(null);

    useOutsideClick(wrapperRef, () => setIsOpen(false));

    const selectedOption = useMemo(() => options.find(opt => opt.id === value), [options, value]);

    const filteredOptions = useMemo(() => {
        if (!searchTerm) return options;
        return options.filter(opt => opt.name.toLowerCase().includes(searchTerm.toLowerCase()));
    }, [options, searchTerm]);
    
    const handleSelectOption = (option: Option) => {
        onChange(option.id);
        setSearchTerm('');
        setIsOpen(false);
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearchTerm(e.target.value);
        if (!isOpen) {
            setIsOpen(true);
        }
    }

    const displayValue = isOpen ? searchTerm : selectedOption?.name || '';
    
    return (
        <div className="relative w-full" ref={wrapperRef}>
            <div className="relative">
                <input
                    type="text"
                    value={displayValue}
                    onChange={handleInputChange}
                    onClick={() => setIsOpen(!isOpen)}
                    placeholder={placeholder}
                    className="w-full px-3 py-2 pr-10 text-white bg-gray-700 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                     <svg className={`w-5 h-5 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                </div>
            </div>

            {isOpen && (
                <ul className="absolute z-10 w-full mt-1 overflow-y-auto bg-gray-700 border border-gray-600 rounded-md shadow-lg max-h-60">
                    {filteredOptions.length > 0 ? (
                        filteredOptions.map(option => (
                            <li
                                key={option.id}
                                onClick={() => handleSelectOption(option)}
                                className={`px-3 py-2 cursor-pointer hover:bg-blue-accent ${value === option.id ? 'bg-blue-accent' : ''}`}
                            >
                                {option.name}
                            </li>
                        ))
                    ) : (
                       <li className="px-3 py-2 text-gray-400">Nenhum resultado encontrado.</li>
                    )}
                </ul>
            )}
        </div>
    );
};

export default SearchableSelect;
