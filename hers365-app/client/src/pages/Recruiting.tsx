
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Search,
  Filter,
  MapPin,
  GraduationCap,
  Star,
  Heart,
  MessageSquare,
  Eye,
  TrendingUp,
  Award,
  Target,
  Users,
  Calendar
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface Athlete {
  id: number;
  name: string;
  school: string;
  position: string;
  rating: number;
  location: string;
  graduationYear: number;
  height: string;
  weight: number;
  stats: {
    speed: number;
    strength: number;
    agility: number;
    technique: number;
  };
  achievements: string[];
  isFavorited: boolean;
  avatar: string;
  lastActive: string;
}

interface SearchFilters {
  position: string;
  location: string;
  graduationYear: string;
  rating: string;
  sortBy: string;
}

export const Recruiting = () => {
  const navigate = useNavigate();
  const [athletes, setAthletes] = useState<Athlete[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filters, setFilters] = useState<SearchFilters>({
    position: 'All',
    location: 'All',
    graduationYear: 'All',
    rating: 'All',
    sortBy: 'rating'
  });
  const [showFilters, setShowFilters] = useState<boolean>(false);

  useEffect(() => {
    // Mock data - in real app, fetch from API
    const mockAthletes: Athlete[] = [
      {
        id: 1,
        name: 'Sarah Johnson',
        school: 'Lincoln High School',
        position: 'QB',
        rating: 98.5,
        location: 'California',
        graduationYear: 2026,
        height: '5\'8"',
        weight: 145,
        stats: { speed: 95, strength: 88, agility: 92, technique: 97 },
        achievements: ['State Champion', 'Team Captain', 'Academic All-Star'],
        isFavorited: false,
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah',
        lastActive: '2 hours ago'
      },
      {
        id: 2,
        name: 'Emma Davis',
        school: 'Washington Prep',
        position: 'WR',
        rating: 97.8,
        location: 'Texas',
        graduationYear: 2026,
        height: '5\'6"',
        weight: 130,
        stats: { speed: 98, strength: 85, agility: 96, technique: 94 },
        achievements: ['All-Conference', 'Speed Champion', 'Scholar Athlete'],
        isFavorited: true,
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Emma',
        lastActive: '1 day ago'
      },
      {
        id: 3,
        name: 'Olivia Brown',
        school: 'Jefferson Academy',
        position: 'RB',
        rating: 97.2,
        location: 'Florida',
        graduationYear: 2027,
        height: '5\'4"',
        weight: 125,
        stats: { speed: 97, strength: 90, agility: 95, technique: 92 },
        achievements: ['Regional MVP', 'Touchdown Leader', 'Perfect Attendance'],
        isFavorited: false,
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Olivia',
        lastActive: '5 hours ago'
      },
      {
        id: 4,
        name: 'Ava Wilson',
        school: 'Roosevelt High',
        position: 'QB',
        rating: 96.9,
        location: 'New York',
        graduationYear: 2026,
        height: '5\'7"',
        weight: 140,
        stats: { speed: 93, strength: 89, agility: 91, technique: 96 },
        achievements: ['Team MVP', 'Leadership Award', 'Honor Roll'],
        isFavorited: true,
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Ava',
        lastActive: '3 days ago'
      }
    ];
    setAthletes(mockAthletes);
  }, []);

  const positions = ['All', 'QB', 'RB', 'WR', 'TE', 'OL', 'DL', 'LB', 'DB', 'K'];
  const locations = ['All', 'California', 'Texas', 'Florida', 'New York', 'Illinois', 'Pennsylvania'];
  const graduationYears = ['All', '2025', '2026', '2027', '2028'];
  const ratingRanges = ['All', '95+', '90-94', '85-89', '80-84'];

  const filteredAthletes = athletes
    .filter(athlete => {
      const matchesSearch = searchQuery === '' ||
        athlete.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        athlete.school.toLowerCase().includes(searchQuery.toLowerCase()) ||
        athlete.position.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesPosition = filters.position === 'All' || athlete.position === filters.position;
      const matchesLocation = filters.location === 'All' || athlete.location === filters.location;
      const matchesYear = filters.graduationYear === 'All' || athlete.graduationYear.toString() === filters.graduationYear;

      let matchesRating = true;
      if (filters.rating !== 'All') {
        const rating = athlete.rating;
        switch (filters.rating) {
          case '95+': matchesRating = rating >= 95; break;
          case '90-94': matchesRating = rating >= 90 && rating <= 94; break;
          case '85-89': matchesRating = rating >= 85 && rating <= 89; break;
          case '80-84': matchesRating = rating >= 80 && rating <= 84; break;
        }
      }

      return matchesSearch && matchesPosition && matchesLocation && matchesYear && matchesRating;
    })
    .sort((a, b) => {
      switch (filters.sortBy) {
        case 'rating': return b.rating - a.rating;
        case 'name': return a.name.localeCompare(b.name);
        case 'school': return a.school.localeCompare(b.school);
        case 'location': return a.location.localeCompare(b.location);
        default: return 0;
      }
    });

  const toggleFavorite = (athleteId: number) => {
    setAthletes(prev =>
      prev.map(athlete =>
        athlete.id === athleteId
          ? { ...athlete, isFavorited: !athlete.isFavorited }
          : athlete
      )
    );
  };

  return (
    <div className="max-w-7xl mx-auto py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-black text-white uppercase tracking-tighter mb-4">
          Athlete Recruiting
        </h1>
        <p className="text-dark-300 text-lg">
          Discover and connect with top female high school athletes
        </p>
      </div>

      {/* Search and Filters */}
      <div className="glass-card p-6 mb-8">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search Bar */}
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-dark-400" size={20} />
            <input
              type="text"
              placeholder="Search athletes, schools, or positions..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-dark-800 border border-white/10 rounded-xl py-4 pl-12 pr-4 text-white placeholder:text-dark-500 focus:outline-none focus:border-brand-500"
            />
          </div>

          {/* Filter Toggle */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-6 py-4 rounded-xl font-bold uppercase tracking-widest transition-all ${
              showFilters
                ? 'bg-brand-500 text-white'
                : 'bg-dark-800 border border-white/10 text-dark-300 hover:text-white'
            }`}
          >
            <Filter size={18} />
            Filters
          </button>
        </div>

        {/* Expanded Filters */}
        {showFilters && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-6 pt-6 border-t border-white/5"
          >
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <select
                value={filters.position}
                onChange={(e) => setFilters(prev => ({ ...prev, position: e.target.value }))}
                className="bg-dark-800 border border-white/10 rounded-lg py-3 px-4 text-white focus:outline-none focus:border-brand-500"
              >
                <option value="All">All Positions</option>
                {positions.slice(1).map(pos => (
                  <option key={pos} value={pos}>{pos}</option>
                ))}
              </select>

              <select
                value={filters.location}
                onChange={(e) => setFilters(prev => ({ ...prev, location: e.target.value }))}
                className="bg-dark-800 border border-white/10 rounded-lg py-3 px-4 text-white focus:outline-none focus:border-brand-500"
              >
                <option value="All">All Locations</option>
                {locations.slice(1).map(loc => (
                  <option key={loc} value={loc}>{loc}</option>
                ))}
              </select>

              <select
                value={filters.graduationYear}
                onChange={(e) => setFilters(prev => ({ ...prev, graduationYear: e.target.value }))}
                className="bg-dark-800 border border-white/10 rounded-lg py-3 px-4 text-white focus:outline-none focus:border-brand-500"
              >
                <option value="All">All Years</option>
                {graduationYears.slice(1).map(year => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>

              <select
                value={filters.rating}
                onChange={(e) => setFilters(prev => ({ ...prev, rating: e.target.value }))}
                className="bg-dark-800 border border-white/10 rounded-lg py-3 px-4 text-white focus:outline-none focus:border-brand-500"
              >
                <option value="All">All Ratings</option>
                {ratingRanges.slice(1).map(range => (
                  <option key={range} value={range}>{range}</option>
                ))}
              </select>

              <select
                value={filters.sortBy}
                onChange={(e) => setFilters(prev => ({ ...prev, sortBy: e.target.value }))}
                className="bg-dark-800 border border-white/10 rounded-lg py-3 px-4 text-white focus:outline-none focus:border-brand-500"
              >
                <option value="rating">Sort by Rating</option>
                <option value="name">Sort by Name</option>
                <option value="school">Sort by School</option>
                <option value="location">Sort by Location</option>
              </select>
            </div>
          </motion.div>
        )}
      </div>

      {/* Results Summary */}
      <div className="flex items-center justify-between mb-6">
        <p className="text-dark-300">
          Showing {filteredAthletes.length} of {athletes.length} athletes
        </p>
        <div className="flex items-center gap-4 text-sm text-dark-400">
          <div className="flex items-center gap-1">
            <Users size={16} />
            {athletes.filter(a => a.isFavorited).length} favorited
          </div>
          <div className="flex items-center gap-1">
            <Eye size={16} />
            Active this week
          </div>
        </div>
      </div>

      {/* Athletes Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredAthletes.map((athlete) => (
          <motion.div
            key={athlete.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card p-6 group cursor-pointer hover:scale-105 transition-all"
            onClick={() => navigate(`/athlete/${athlete.id}`)}
          >
            {/* Header */}
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-brand-500 to-accent p-0.5">
                  <div className="w-full h-full rounded-[14px] bg-dark-800 overflow-hidden">
                    <img src={athlete.avatar} alt={athlete.name} />
                  </div>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white group-hover:text-brand-400 transition-colors">
                    {athlete.name}
                  </h3>
                  <p className="text-sm text-dark-400">{athlete.position}</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleFavorite(athlete.id);
                  }}
                  className={`p-2 rounded-lg transition-colors ${
                    athlete.isFavorited
                      ? 'text-red-500 bg-red-500/10'
                      : 'text-dark-400 hover:text-red-500 hover:bg-red-500/10'
                  }`}
                >
                  <Heart size={18} className={athlete.isFavorited ? 'fill-current' : ''} />
                </button>
              </div>
            </div>

            {/* Rating */}
            <div className="flex items-center gap-2 mb-4">
              <Star className="text-yellow-500 fill-current" size={16} />
              <span className="text-2xl font-black text-white">{athlete.rating}</span>
            </div>

            {/* Info */}
            <div className="space-y-2 mb-4">
              <div className="flex items-center gap-2 text-sm text-dark-400">
                <GraduationCap size={14} />
                {athlete.school} • Class of {athlete.graduationYear}
              </div>
              <div className="flex items-center gap-2 text-sm text-dark-400">
                <MapPin size={14} />
                {athlete.location}
              </div>
              <div className="text-sm text-dark-400">
                {athlete.height} • {athlete.weight} lbs
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-2 mb-4">
              <div className="text-center p-2 bg-dark-800/50 rounded-lg">
                <div className="text-xs text-dark-500 uppercase tracking-widest">Speed</div>
                <div className="text-lg font-bold text-white">{athlete.stats.speed}</div>
              </div>
              <div className="text-center p-2 bg-dark-800/50 rounded-lg">
                <div className="text-xs text-dark-500 uppercase tracking-widest">Strength</div>
                <div className="text-lg font-bold text-white">{athlete.stats.strength}</div>
              </div>
              <div className="text-center p-2 bg-dark-800/50 rounded-lg">
                <div className="text-xs text-dark-500 uppercase tracking-widest">Agility</div>
                <div className="text-lg font-bold text-white">{athlete.stats.agility}</div>
              </div>
              <div className="text-center p-2 bg-dark-800/50 rounded-lg">
                <div className="text-xs text-dark-500 uppercase tracking-widest">Technique</div>
                <div className="text-lg font-bold text-white">{athlete.stats.technique}</div>
              </div>
            </div>

            {/* Achievements */}
            <div className="mb-4">
              <div className="flex flex-wrap gap-1">
                {athlete.achievements.slice(0, 2).map((achievement, idx) => (
                  <span key={idx} className="px-2 py-1 bg-accent/20 text-accent rounded-full text-xs font-bold">
                    {achievement}
                  </span>
                ))}
                {athlete.achievements.length > 2 && (
                  <span className="px-2 py-1 bg-dark-800 text-dark-400 rounded-full text-xs">
                    +{athlete.achievements.length - 2} more
                  </span>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  navigate(`/messages?to=${athlete.id}`);
                }}
                className="flex-1 flex items-center justify-center gap-2 py-2 bg-dark-800 hover:bg-dark-700 text-dark-300 hover:text-white rounded-lg transition-colors"
              >
                <MessageSquare size={16} />
                Message
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  // Handle profile view
                }}
                className="flex-1 flex items-center justify-center gap-2 py-2 bg-brand-500 hover:bg-brand-600 text-white rounded-lg transition-colors"
              >
                <Eye size={16} />
                View Profile
              </button>
            </div>

            {/* Last Active */}
            <div className="mt-4 pt-4 border-t border-white/5">
              <div className="flex items-center gap-2 text-xs text-dark-500">
                <div className="w-2 h-2 bg-accent rounded-full"></div>
                Active {athlete.lastActive}
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Empty State */}
      {filteredAthletes.length === 0 && (
        <div className="text-center py-16">
          <Target className="mx-auto text-dark-500 mb-4" size={48} />
          <h3 className="text-xl font-bold text-white mb-2">No athletes found</h3>
          <p className="text-dark-400">Try adjusting your search criteria or filters</p>
        </div>
      )}
    </div>
  );
};
