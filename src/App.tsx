import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { supabase } from './supabaseClient';
import { 
  Heart, 
  Send, 
  PlusCircle, 
  Info, 
  LayoutGrid, 
  Sparkles, 
  Lock, 
  History, 
  Quote, 
  Image as ImageIcon, 
  Smile,
  ChevronRight,
  Search,
  Bell,
  MoreHorizontal,
  Share2
} from 'lucide-react';
import { Confession, Page } from './types';

export default function App() {
  const [currentPage, setCurrentPage] = useState<Page>('home');
  const [confessions, setConfessions] = useState<Confession[]>([]);
  const [newConfession, setNewConfession] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isConfigured, setIsConfigured] = useState(true);

  const fetchConfessions = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('Confession')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      if (data) {
        setConfessions(data.map(item => ({
          id: item.id,
          text: item.message,
          likes: item.like || 0,
          timestamp: new Date(item.created_at || Date.now()).getTime(),
          isLiked: false
        })));
      }
      setIsConfigured(true);
    } catch (error: any) {
      console.error('Error fetching confessions:', error);
      if (error.message?.includes('Supabase URL and Anon Key are missing')) {
        setIsConfigured(false);
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchConfessions();
  }, []);

  const sortedConfessions = useMemo(() => {
    return [...confessions].sort((a, b) => b.timestamp - a.timestamp);
  }, [confessions]);

  const handleLike = async (id: string | number) => {
    const confession = confessions.find(c => c.id === id);
    if (!confession) return;

    const newIsLiked = !confession.isLiked;
    const newLikes = newIsLiked ? confession.likes + 1 : Math.max(0, confession.likes - 1);

    // Optimistic update
    setConfessions(prev => prev.map(c => {
      if (c.id === id) {
        return { ...c, likes: newLikes, isLiked: newIsLiked };
      }
      return c;
    }));

    try {
      const { error } = await supabase
        .from('Confession')
        .update({ like: newLikes })
        .eq('id', id);
      
      if (error) throw error;
    } catch (error) {
      console.error('Error updating like:', error);
      // Rollback on error
      setConfessions(prev => prev.map(c => {
        if (c.id === id) {
          return { ...c, likes: confession.likes, isLiked: confession.isLiked };
        }
        return c;
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newConfession.trim() || newConfession.length > 1000) return;

    setIsSubmitting(true);
    
    try {
      const { data, error } = await supabase
        .from('Confession')
        .insert([{ message: newConfession, like: 0 }])
        .select()
        .single();
      
      if (error) throw error;

      if (data) {
        const confession: Confession = {
          id: data.id,
          text: data.message,
          likes: data.like || 0,
          timestamp: new Date(data.created_at).getTime(),
        };
        
        setConfessions(prev => [confession, ...prev]);
        setNewConfession('');
        setIsSubmitting(false);
        setShowSuccess(true);
        
        setTimeout(() => {
          setShowSuccess(false);
          setCurrentPage('feed');
        }, 2000);
      }
    } catch (error) {
      console.error('Error submitting confession:', error);
      setIsSubmitting(false);
    }
  };

  const formatTime = (timestamp: number) => {
    const diff = Date.now() - timestamp;
    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)} mins ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)} hours ago`;
    return 'Yesterday';
  };

  return (
    <div className="min-h-screen flex flex-col relative overflow-x-hidden">
      {/* Background Blobs */}
      <div className="fixed top-0 left-0 w-full h-full -z-10 pointer-events-none overflow-hidden opacity-30">
        <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] bg-primary/20 blur-[120px] rounded-full"></div>
        <div className="absolute top-[60%] -right-[5%] w-[30%] h-[50%] bg-primary/10 blur-[100px] rounded-full"></div>
      </div>

      {/* Header */}
      <header className="sticky top-0 z-50 bg-background-light/80 backdrop-blur-md border-b border-primary/10 px-6 md:px-20 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div 
            className="flex items-center gap-3 cursor-pointer group"
            onClick={() => setCurrentPage('home')}
          >
            <div className="text-primary group-hover:scale-110 transition-transform">
              <Sparkles className="w-8 h-8" />
            </div>
            <h2 className="text-slate-900 text-xl font-bold tracking-tight">Velvet Secret</h2>
          </div>

          <div className="flex items-center gap-4">
            <nav className="hidden md:flex items-center gap-8 mr-6">
              <button 
                onClick={() => setCurrentPage('home')}
                className={`text-sm font-medium transition-colors hover:text-primary ${currentPage === 'home' ? 'text-primary' : 'text-slate-600'}`}
              >
                Home
              </button>
              <button 
                onClick={() => setCurrentPage('confess')}
                className={`text-sm font-medium transition-colors hover:text-primary ${currentPage === 'confess' ? 'text-primary underline underline-offset-4' : 'text-slate-600'}`}
              >
                Confess
              </button>
              <button 
                onClick={() => setCurrentPage('feed')}
                className={`text-sm font-medium transition-colors hover:text-primary ${currentPage === 'feed' ? 'text-primary' : 'text-slate-600'}`}
              >
                Archive
              </button>
              <button 
                onClick={() => setCurrentPage('about')}
                className={`text-sm font-medium transition-colors hover:text-primary ${currentPage === 'about' ? 'text-primary' : 'text-slate-600'}`}
              >
                About
              </button>
            </nav>
            <button className="flex w-10 h-10 items-center justify-center rounded-full bg-primary/10 text-primary hover:bg-primary/20 transition-all">
              <Heart className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col">
        <AnimatePresence mode="wait">
          {currentPage === 'home' && (
            <motion.div 
              key="home"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="flex-1 flex flex-col items-center justify-center px-6 py-12 md:px-20"
            >
              <div className="max-w-4xl w-full text-center space-y-12">
                <div className="space-y-6">
                  <motion.div
                    initial={{ scale: 0.8 }}
                    animate={{ scale: 1 }}
                    className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 text-primary mb-4"
                  >
                    <Sparkles className="w-8 h-8" />
                  </motion.div>
                  <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-slate-900">
                    Anonymous Love <br />
                    <span className="text-primary italic">Confessions</span>
                  </h1>
                  <p className="text-slate-600 text-lg md:text-xl max-w-2xl mx-auto leading-relaxed">
                    A safe, elegant space to share your deepest feelings, secret crushes, and unspoken words with the world.
                  </p>
                </div>

                <div className="flex flex-wrap items-center justify-center gap-4">
                  <button 
                    onClick={() => setCurrentPage('confess')}
                    className="flex items-center gap-2 px-8 py-4 bg-primary text-white font-bold rounded-2xl shadow-xl shadow-primary/20 hover:bg-primary/90 transition-all hover:-translate-y-1"
                  >
                    <PlusCircle className="w-5 h-5" />
                    Write Confession
                  </button>
                  <button 
                    onClick={() => setCurrentPage('feed')}
                    className="flex items-center gap-2 px-8 py-4 bg-white text-slate-700 font-bold rounded-2xl border border-slate-200 hover:border-primary/30 transition-all hover:-translate-y-1"
                  >
                    <LayoutGrid className="w-5 h-5" />
                    View Confessions
                  </button>
                  <button 
                    onClick={() => setCurrentPage('about')}
                    className="flex items-center gap-2 px-8 py-4 bg-primary/5 text-primary font-bold rounded-2xl hover:bg-primary/10 transition-all hover:-translate-y-1"
                  >
                    <Info className="w-5 h-5" />
                    About Us
                  </button>
                </div>

                {/* Mission Section */}
                <div className="pt-24 space-y-12">
                  <div className="text-left space-y-2">
                    <h2 className="text-3xl font-bold text-slate-900">Our Mission</h2>
                    <p className="text-slate-500">Why we created Velvet Secret.</p>
                  </div>

                  <div className="bg-white rounded-3xl p-8 md:p-12 border border-primary/5 shadow-sm flex flex-col md:flex-row items-center gap-12">
                    <div className="w-full md:w-1/2 aspect-[4/3] rounded-2xl overflow-hidden bg-primary/5 relative group">
                      <img 
                        src="https://picsum.photos/seed/love/800/600" 
                        alt="The Power of Vulnerability" 
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                        referrerPolicy="no-referrer"
                      />
                      <div className="absolute inset-0 bg-primary/10 mix-blend-multiply"></div>
                    </div>
                    <div className="w-full md:w-1/2 text-left space-y-6">
                      <h3 className="text-2xl font-bold text-slate-900">The Power of Vulnerability</h3>
                      <p className="text-slate-600 leading-relaxed">
                        We believe in the power of words. Velvet Secret provides a welcoming and safe harbor for your heart's most private whispers. In a world of fleeting connections, we offer a place for permanent, heartfelt expressions.
                      </p>
                      <button className="flex items-center gap-2 text-primary font-bold group">
                        Read our full story
                        <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Features Grid */}
                <div className="pt-24 space-y-12">
                  <div className="text-center space-y-2">
                    <h2 className="text-4xl font-bold text-slate-900">Designed for your heart</h2>
                    <p className="text-slate-500">Every feature is crafted to ensure your secrets remain beautiful and private.</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {[
                      { icon: <Lock className="w-6 h-6" />, title: 'Complete Anonymity', desc: 'Your identity is never stored or revealed. Speak your truth without hesitation.' },
                      { icon: <Heart className="w-6 h-6" />, title: 'Safe Community', desc: 'A moderated space designed for genuine feelings, free from negativity and hate.' },
                      { icon: <Sparkles className="w-6 h-6" />, title: 'Beautiful Design', desc: 'A minimal aesthetic that honors your words. Every confession is presented like a work of art.' }
                    ].map((feature, i) => (
                      <div key={i} className="bg-white p-8 rounded-3xl border border-primary/5 shadow-sm space-y-4 text-left hover:shadow-md transition-shadow">
                        <div className="w-12 h-12 rounded-2xl bg-primary/5 text-primary flex items-center justify-center">
                          {feature.icon}
                        </div>
                        <h4 className="text-xl font-bold text-slate-900">{feature.title}</h4>
                        <p className="text-slate-500 text-sm leading-relaxed">{feature.desc}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* CTA Section */}
                <div className="pt-24 pb-12">
                  <div className="bg-primary/80 rounded-[40px] p-12 md:p-20 text-center space-y-8 relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.2),transparent)]"></div>
                    <div className="relative z-10 space-y-4">
                      <h2 className="text-4xl md:text-5xl font-bold text-white">Ready to share a secret?</h2>
                      <p className="text-white/80 text-lg">Join thousands of others sharing their love stories.</p>
                    </div>
                    <button 
                      onClick={() => setCurrentPage('confess')}
                      className="relative z-10 px-10 py-4 bg-white text-primary font-bold rounded-2xl shadow-xl hover:scale-105 transition-transform"
                    >
                      Start Writing Now
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {currentPage === 'confess' && (
            <motion.div 
              key="confess"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="flex-1 flex flex-col items-center justify-center px-6 py-12 md:px-20"
            >
              <div className="w-full max-w-2xl flex flex-col gap-8">
                <div className="flex flex-col gap-3 text-center md:text-left">
                  <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-slate-900">
                    Whisper into the <span className="text-primary italic">void</span>
                  </h1>
                  <p className="text-slate-600 text-lg max-w-lg">
                    Your identity is a ghost here. Speak your truth, unburden your soul, and let it drift into our anonymous gallery.
                  </p>
                </div>

                <div className="bg-white border border-primary/10 rounded-3xl shadow-2xl shadow-primary/5 overflow-hidden">
                  <div className="flex flex-col">
                    <div className="flex items-center gap-3 p-6 border-b border-primary/5">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-primary/20 to-primary/40 flex items-center justify-center text-primary">
                        <Sparkles className="w-6 h-6" />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-sm font-bold">Anonymous Soul</span>
                        <span className="text-xs text-slate-500">Writing from the shadows...</span>
                      </div>
                    </div>
                    
                    <form onSubmit={handleSubmit} className="relative">
                      <textarea 
                        className="w-full min-h-[350px] p-8 text-xl bg-transparent border-none focus:ring-0 placeholder:text-slate-300 resize-none text-slate-800"
                        maxLength={1000}
                        placeholder="I've been holding this in for so long..."
                        value={newConfession}
                        onChange={(e) => setNewConfession(e.target.value)}
                        disabled={isSubmitting}
                      />
                      <div className="absolute bottom-6 right-8 text-xs font-mono text-slate-400">
                        {newConfession.length} / 1000
                      </div>
                    </form>

                    <div className="flex items-center justify-between p-6 bg-slate-50/50 rounded-b-3xl border-t border-primary/5">
                      <div className="flex gap-2">
                        <button className="p-3 rounded-xl hover:bg-primary/10 text-slate-400 hover:text-primary transition-colors">
                          <ImageIcon className="w-5 h-5" />
                        </button>
                        <button className="p-3 rounded-xl hover:bg-primary/10 text-slate-400 hover:text-primary transition-colors">
                          <Smile className="w-5 h-5" />
                        </button>
                        <button className="p-3 rounded-xl hover:bg-primary/10 text-slate-400 hover:text-primary transition-colors">
                          <Quote className="w-5 h-5" />
                        </button>
                      </div>
                      <button 
                        onClick={handleSubmit}
                        disabled={!newConfession.trim() || isSubmitting}
                        className="flex items-center gap-2 px-10 py-4 bg-primary hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-2xl shadow-lg shadow-primary/20 transition-all hover:-translate-y-1"
                      >
                        {isSubmitting ? 'Releasing...' : 'Release Secret'}
                        <Send className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Success Message */}
                <AnimatePresence>
                  {showSuccess && (
                    <motion.div 
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      className="p-6 rounded-3xl bg-green-500/5 border border-green-500/20 flex items-start gap-4"
                    >
                      <div className="p-2 rounded-full bg-green-500/20 text-green-600">
                        <Sparkles className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="font-bold text-green-800">Last submission successful</h4>
                        <p className="text-sm text-green-700/80">Your confession has been set free. It will appear in the library shortly after a quick safety check.</p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
                  {[
                    { icon: <Lock className="w-5 h-5" />, title: 'True Anonymity', desc: 'No IP logging. No tracking. No footprints left behind.' },
                    { icon: <Sparkles className="w-5 h-5" />, title: 'AI Moderation', desc: 'Protecting the community while preserving the raw truth.' },
                    { icon: <History className="w-5 h-5" />, title: 'Eternal Archive', desc: 'Once shared, your words join the collective memory.' }
                  ].map((item, i) => (
                    <div key={i} className="flex flex-col gap-2 p-6 rounded-3xl border border-primary/10 bg-white/40">
                      <div className="text-primary">{item.icon}</div>
                      <h3 className="font-bold text-sm">{item.title}</h3>
                      <p className="text-xs text-slate-500 leading-relaxed">{item.desc}</p>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {currentPage === 'feed' && (
            <motion.div 
              key="feed"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="max-w-7xl mx-auto px-6 md:px-20 py-12 w-full"
            >
              <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-12">
                <div>
                  <h2 className="text-4xl font-bold text-slate-900 mb-2">Whispers of the Heart</h2>
                  <p className="text-slate-600">Share your truth, remain a mystery.</p>
                </div>
                <div className="flex flex-wrap items-center gap-4">
                  <div className="relative">
                    <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-primary/60" />
                    <input 
                      type="text" 
                      placeholder="Search secrets..."
                      className="bg-primary/5 border-none focus:ring-2 focus:ring-primary/20 rounded-2xl pl-12 pr-6 py-3 text-sm w-full md:w-64 placeholder:text-primary/40"
                    />
                  </div>
                  <div className="flex bg-primary/10 p-1.5 rounded-2xl">
                    <button className="px-6 py-2 text-sm font-bold bg-white shadow-sm rounded-xl text-primary">Newest</button>
                    <button className="px-6 py-2 text-sm font-medium text-slate-600 hover:text-primary transition-colors">Popular</button>
                  </div>
                  <button 
                    onClick={() => setCurrentPage('confess')}
                    className="flex items-center gap-2 bg-primary text-white px-8 py-3 rounded-2xl font-bold shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all"
                  >
                    <PlusCircle className="w-5 h-5" />
                    Post a Secret
                  </button>
                </div>
              </div>

              <div className="masonry-grid">
                {!isConfigured ? (
                  <div className="col-span-full py-20 text-center bg-amber-50 rounded-3xl border border-amber-200">
                    <Lock className="w-12 h-12 text-amber-400 mx-auto mb-4" />
                    <h3 className="text-amber-900 font-bold text-lg mb-2">Configuration Required</h3>
                    <p className="text-amber-700 max-w-md mx-auto px-6">
                      Please set your Supabase URL and Anon Key in the Secrets panel to enable the confession library.
                    </p>
                  </div>
                ) : isLoading ? (
                  <div className="col-span-full py-20 text-center">
                    <div className="inline-block w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin mb-4"></div>
                    <p className="text-slate-400 font-medium">Listening to the whispers...</p>
                  </div>
                ) : sortedConfessions.length === 0 ? (
                  <div className="col-span-full py-20 text-center bg-white rounded-3xl border border-dashed border-primary/20">
                    <Sparkles className="w-12 h-12 text-primary/20 mx-auto mb-4" />
                    <p className="text-slate-500 font-medium">No secrets shared yet. Be the first?</p>
                    <button 
                      onClick={() => setCurrentPage('confess')}
                      className="mt-4 text-primary font-bold hover:underline"
                    >
                      Write a confession
                    </button>
                  </div>
                ) : (
                  sortedConfessions.map((confession) => (
                  <motion.div 
                    layout
                    key={confession.id}
                    className="masonry-item"
                  >
                    <div className="bg-white border border-primary/5 rounded-3xl p-8 shadow-sm hover:shadow-xl transition-all group">
                      <div className="flex items-center justify-between mb-6">
                        <span className="text-[10px] uppercase tracking-widest font-bold text-primary/60 bg-primary/5 px-3 py-1.5 rounded-full">
                          {formatTime(confession.timestamp)}
                        </span>
                        <button className="text-slate-300 hover:text-primary transition-colors">
                          <MoreHorizontal className="w-5 h-5" />
                        </button>
                      </div>
                      
                      <p className="text-xl leading-relaxed text-slate-800 mb-8 font-medium italic">
                        "{confession.text}"
                      </p>

                      <div className="flex items-center justify-between border-t border-primary/5 pt-6">
                        <div className="flex items-center gap-6">
                          <button 
                            onClick={() => handleLike(confession.id)}
                            className={`flex items-center gap-2 transition-colors group/like ${confession.isLiked ? 'text-primary' : 'text-slate-400 hover:text-primary'}`}
                          >
                            <Heart 
                              className={`w-6 h-6 transition-transform group-active/like:scale-125 ${confession.isLiked ? 'fill-current' : ''}`} 
                            />
                            <span className="text-sm font-bold">
                              {confession.likes >= 1000 ? `${(confession.likes / 1000).toFixed(1)}k` : confession.likes}
                            </span>
                          </button>
                        </div>
                        <button className="text-slate-300 hover:text-primary transition-colors">
                          <Share2 className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                )))}
                {!isLoading && sortedConfessions.length > 0 && (
                  <div className="mt-16 flex justify-center col-span-full">
                    <button 
                      onClick={fetchConfessions}
                      className="px-10 py-4 bg-primary/10 text-primary font-bold rounded-2xl hover:bg-primary hover:text-white transition-all"
                    >
                      Refresh secrets
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {currentPage === 'about' && (
            <motion.div 
              key="about"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="flex-1 flex flex-col items-center justify-center px-6 py-12 md:px-20"
            >
              <div className="max-w-3xl w-full bg-white rounded-[40px] p-8 md:p-20 shadow-2xl shadow-primary/5 border border-primary/5 space-y-12 text-center">
                <div className="space-y-4">
                  <span className="text-primary font-bold tracking-widest uppercase text-xs">Our Story</span>
                  <h1 className="text-4xl md:text-6xl font-extrabold text-slate-900 leading-tight">
                    The Whisper of a <br />
                    <span className="text-primary italic">Thousand Hearts</span>
                  </h1>
                </div>

                <div className="w-full aspect-video rounded-3xl overflow-hidden relative group">
                  <img 
                    src="https://picsum.photos/seed/whisper/1200/800" 
                    alt="About Velvet Secret" 
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-1000"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
                </div>

                <div className="space-y-8 text-slate-600 text-lg leading-relaxed">
                  <p>
                    Velvet Secret was born from a simple observation: the most beautiful words are often those left unspoken. We believe that everyone carries a secret affection, a hidden "I love you," or a memory that glows in the quiet hours of the night.
                  </p>
                  <p>
                    Our platform provides a digital sanctuary where identity fades away, leaving only the purity of the emotion. Here, you are not a name or a profile; you are a voice in a global choir of human connection.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {[
                    { icon: <Lock className="w-6 h-6" />, title: 'Anonymous', desc: 'Your privacy is our priority. Share without fear or judgment.' },
                    { icon: <Heart className="w-6 h-6" />, title: 'Romantic', desc: 'A space dedicated to love, kindness, and genuine affection.' },
                    { icon: <Sparkles className="w-6 h-6" />, title: 'Inspiring', desc: 'Read the stories of others and feel the heartbeat of the world.' }
                  ].map((item, i) => (
                    <div key={i} className="bg-primary/5 p-8 rounded-3xl space-y-4">
                      <div className="text-primary flex justify-center">{item.icon}</div>
                      <h4 className="font-bold text-slate-900">{item.title}</h4>
                      <p className="text-sm text-slate-500 leading-relaxed">{item.desc}</p>
                    </div>
                  ))}
                </div>

                <div className="pt-8 border-t border-primary/10">
                  <p className="italic text-slate-400 mb-8">"In a world that never stops talking, find a moment to whisper."</p>
                  <button 
                    onClick={() => setCurrentPage('confess')}
                    className="px-12 py-4 bg-primary text-white font-bold rounded-2xl shadow-xl shadow-primary/20 hover:scale-105 transition-transform"
                  >
                    Share Your First Secret
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Footer */}
      <footer className="px-6 md:px-20 py-12 border-t border-primary/5 bg-white/50">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-white">
              <Heart className="w-4 h-4 fill-current" />
            </div>
            <span className="font-bold text-slate-900">Velvet Secret</span>
          </div>
          
          <div className="flex flex-wrap justify-center gap-8">
            <button className="text-sm text-slate-500 hover:text-primary transition-colors">Privacy Policy</button>
            <button className="text-sm text-slate-500 hover:text-primary transition-colors">Terms of Service</button>
            <button className="text-sm text-slate-500 hover:text-primary transition-colors">Safety Guidelines</button>
            <button className="text-sm text-slate-500 hover:text-primary transition-colors">Manifesto</button>
          </div>

          <div className="text-sm text-slate-400 italic">
            "Some secrets are better shared in silence."
          </div>
        </div>
        <div className="max-w-7xl mx-auto mt-8 pt-8 border-t border-primary/5 text-center text-xs text-slate-400">
          © 2024 VELVET SECRET STUDIO. ALL RIGHTS RESERVED.
        </div>
      </footer>

      {/* Floating Action Button (Mobile) */}
      <div className="fixed bottom-8 right-8 md:hidden z-50">
        <button 
          onClick={() => setCurrentPage('confess')}
          className="w-16 h-16 bg-primary text-white rounded-full shadow-2xl flex items-center justify-center hover:scale-110 active:scale-95 transition-transform"
        >
          <PlusCircle className="w-8 h-8" />
        </button>
      </div>
    </div>
  );
}
