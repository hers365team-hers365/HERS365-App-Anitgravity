import React from 'react';
import { motion } from 'framer-motion';
import { 
  Heart, 
  MessageCircle, 
  Share2, 
  MoreHorizontal, 
  Zap, 
  Trophy, 
  Calendar,
  PlayCircle,
  Award
} from 'lucide-react';

const PostCard = ({ user, time, content, image, likes, comments, highlights }: any) => (
  <motion.div 
    initial={{ opacity: 0, y: 20 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }}
    className="glass-card mb-8 group"
  >
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-brand-500 to-accent p-0.5 shadow-lg shadow-brand-500/20">
            <div className="w-full h-full rounded-[14px] bg-dark-800 overflow-hidden">
              <img src={user.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.name}`} alt={user.name} />
            </div>
          </div>
          <div>
            <h3 className="text-white font-bold tracking-tight uppercase text-sm group-hover:text-brand-400 transition-colors">{user.name}</h3>
            <p className="text-xs text-dark-500 font-bold uppercase tracking-widest">{time}</p>
          </div>
        </div>
        <button className="text-dark-500 hover:text-white transition-colors">
          <MoreHorizontal size={20} />
        </button>
      </div>

      <p className="text-dark-200 mb-6 text-base leading-relaxed">
        {content}
      </p>

      {image && (
        <div className="relative rounded-2xl overflow-hidden border border-white/5 mb-6 aspect-video group-hover:border-brand-500/30 transition-all duration-500">
           <img src={image} alt="Post Highlight" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
           {highlights && (
             <div className="absolute top-4 right-4 px-3 py-1 bg-brand-500 rounded-full flex items-center gap-2 shadow-lg">
                <PlayCircle size={14} className="text-white fill-current" />
                <span className="text-[10px] font-black uppercase tracking-widest text-white">Watch Highlight</span>
             </div>
           )}
        </div>
      )}

      <div className="flex items-center gap-8 pt-6 border-t border-white/5">
        <button className="flex items-center gap-2 text-dark-400 hover:text-brand-500 transition-all group/btn">
          <Heart size={18} className="group-hover/btn:fill-brand-500 transition-all" />
          <span className="text-xs font-black uppercase tracking-widest">{likes}</span>
        </button>
        <button className="flex items-center gap-2 text-dark-400 hover:text-white transition-all">
          <MessageCircle size={18} />
          <span className="text-xs font-black uppercase tracking-widest">{comments}</span>
        </button>
        <button className="flex items-center gap-2 text-dark-400 hover:text-white ml-auto transition-all">
          <Share2 size={18} />
        </button>
      </div>
    </div>
  </motion.div>
);

export const Feed = () => {
  const posts = [
    {
      user: { name: 'Sarah Watkins', avatar: null },
      time: '2 hours ago',
      content: "Just finished a killer session at the Nike Training Camp. 40yd dash improved by 0.2s! Hard work pays off. 🏈💨",
      image: "https://images.unsplash.com/photo-1541252260730-0412e3e2108e?auto=format&fit=crop&q=80&w=1200",
      likes: '1.2K',
      comments: '84',
      highlights: true
    },
    {
      user: { name: 'Coach Miller', avatar: null },
      time: '5 hours ago',
      content: "Looking for a dynamic wide receiver for the 2026 class. Show us what you've got in the next regional combine! 🎯",
      likes: '450',
      comments: '12',
      highlights: false
    }
  ];

  return (
    <div className="max-w-4xl mx-auto py-8">
      {/* Header Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        <div className="glass-premium p-6 rounded-3xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <Zap size={60} className="text-brand-500" />
          </div>
          <p className="text-xs font-black uppercase tracking-widest text-brand-400 mb-2">Training Streak</p>
          <h4 className="text-3xl font-black text-white">12 DAYS</h4>
        </div>
        <div className="glass-premium p-6 rounded-3xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <Trophy size={60} className="text-accent" />
          </div>
          <p className="text-xs font-black uppercase tracking-widest text-accent mb-2">Platform Rank</p>
          <h4 className="text-3xl font-black text-white">TOP 5%</h4>
        </div>
        <div className="glass-premium p-6 rounded-3xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <Calendar size={60} className="text-blue-500" />
          </div>
          <p className="text-xs font-black uppercase tracking-widest text-blue-400 mb-2">Next Event</p>
          <h4 className="text-3xl font-black text-white">IN 3 DAYS</h4>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-12">
        {/* Main Feed */}
        <div className="flex-1">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-black uppercase tracking-tighter text-white">The Grid</h2>
            <div className="flex gap-4">
              <button className="text-[10px] font-black uppercase tracking-widest px-4 py-2 bg-brand-500 text-white rounded-full">Recent</button>
              <button className="text-[10px] font-black uppercase tracking-widest px-4 py-2 text-dark-400 hover:text-white transition-colors">Trending</button>
            </div>
          </div>

          {posts.map((post, idx) => (
            <PostCard key={idx} {...post} />
          ))}
        </div>

        {/* Right Sidebar */}
        <aside className="w-full lg:w-80 space-y-8">
          <div className="glass-card p-6">
            <h3 className="text-sm font-black uppercase tracking-widest text-white mb-6 flex items-center gap-2">
              <Award size={16} className="text-brand-500" />
              Recommended Drills
            </h3>
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex gap-4 group cursor-pointer">
                  <div className="w-16 h-16 rounded-xl bg-dark-900 border border-white/5 overflow-hidden flex-shrink-0 group-hover:border-brand-500/50 transition-colors">
                    {/* Placeholder image */}
                    <div className="w-full h-full bg-gradient-to-br from-brand-500/20 to-accent/20 flex items-center justify-center">
                      <PlayCircle size={20} className="text-brand-400" />
                    </div>
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white uppercase group-hover:text-brand-400 transition-colors">Agility Ladder Level {i}</h4>
                    <p className="text-[10px] text-dark-500 font-bold uppercase mt-1">15 mins • Advanced</p>
                  </div>
                </div>
              ))}
            </div>
            <button className="w-full mt-6 py-3 border border-white/10 rounded-xl text-[10px] font-black uppercase tracking-widest text-dark-300 hover:text-white hover:bg-white/5 transition-all">
              View All Academy
            </button>
          </div>

          <div className="glass-card p-6 bg-brand-500/5 border-brand-500/20">
             <h3 className="text-sm font-black uppercase tracking-widest text-brand-400 mb-4 italic">NIL Compliance</h3>
             <p className="text-xs text-dark-300 leading-relaxed font-medium">
               Make sure your profile information is up to date to remain eligible for upcoming scholarship matches.
             </p>
             <button className="mt-4 text-[10px] font-black uppercase tracking-widest text-brand-400 hover:text-brand-300">
                Check Status →
             </button>
          </div>
        </aside>
      </div>
    </div>
  );
};
