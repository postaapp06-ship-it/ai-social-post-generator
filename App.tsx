
import React, { useState, useCallback } from 'react';
import { Platform, GeneratedPost } from './types';
import { PLATFORM_CONFIGS } from './constants';
import { generatePostForPlatform } from './services/geminiService';
import PlatformCard from './components/PlatformCard';

const App: React.FC = () => {
  const [basePost, setBasePost] = useState<string>('');
  const [selectedPlatforms, setSelectedPlatforms] = useState<Set<Platform>>(new Set());
  const [generatedPosts, setGeneratedPosts] = useState<Map<Platform, GeneratedPost>>(new Map());
  const [isGenerating, setIsGenerating] = useState<boolean>(false);

  const handlePlatformToggle = useCallback((platform: Platform) => {
    setSelectedPlatforms(prev => {
      const newSet = new Set(prev);
      if (newSet.has(platform)) {
        newSet.delete(platform);
      } else {
        newSet.add(platform);
      }
      return newSet;
    });
  }, []);

  const handleGeneratePosts = async () => {
    if (selectedPlatforms.size === 0 || !basePost.trim()) {
      alert("Please write a post and select at least one platform.");
      return;
    }

    setIsGenerating(true);
    
    const initialPosts = new Map<Platform, GeneratedPost>();
    selectedPlatforms.forEach(platform => {
      initialPosts.set(platform, { platform, content: '', status: 'loading' });
    });
    setGeneratedPosts(initialPosts);

    const generationPromises = Array.from(selectedPlatforms).map(platform =>
      generatePostForPlatform(platform, basePost)
        .then(content => ({ platform, content, status: 'success' as const, error: null }))
        .catch(err => ({ platform, content: err.message, status: 'error' as const, error: err }))
    );

    const results = await Promise.all(generationPromises);

    setGeneratedPosts(prev => {
      const newPosts = new Map(prev);
      results.forEach(result => {
        newPosts.set(result.platform, {
          platform: result.platform,
          content: result.content,
          status: result.status,
        });
      });
      return newPosts;
    });

    setIsGenerating(false);
  };
  
  const orderedGeneratedPosts = Array.from(generatedPosts.values());

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 font-sans p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        <header className="text-center mb-10">
          <h1 className="text-4xl sm:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-sky-500">
            AI Social Post Generator
          </h1>
          <p className="mt-2 text-slate-400 max-w-2xl mx-auto">
            Craft one post, and let AI tailor it for all your social platforms instantly.
          </p>
        </header>

        <main className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Input Section */}
          <div className="flex flex-col gap-6 p-6 bg-slate-800/50 rounded-lg shadow-2xl">
            <div>
              <label htmlFor="basePost" className="block text-lg font-semibold mb-2 text-slate-300">
                1. Write Your Base Post
              </label>
              <textarea
                id="basePost"
                value={basePost}
                onChange={(e) => setBasePost(e.target.value)}
                placeholder="What's on your mind? Announcing a new feature, sharing an article, or a personal update..."
                className="w-full h-48 p-3 bg-slate-900 border border-slate-700 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors placeholder-slate-500"
              />
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-3 text-slate-300">2. Select Platforms</h3>
              <div className="space-y-3">
                {PLATFORM_CONFIGS.map(config => (
                  <div key={config.id}>
                    <label className="flex items-center p-3 bg-slate-900 border border-slate-700 rounded-md cursor-pointer hover:bg-slate-800 transition-colors">
                      <input
                        type="checkbox"
                        checked={selectedPlatforms.has(config.id)}
                        onChange={() => handlePlatformToggle(config.id)}
                        className="h-5 w-5 rounded bg-slate-700 border-slate-600 text-purple-500 focus:ring-purple-500"
                      />
                      <span className="ml-4 text-slate-300">{config.icon}</span>
                      <span className="ml-3 font-medium">{config.name}</span>
                    </label>
                  </div>
                ))}
              </div>
            </div>
            <button
              onClick={handleGeneratePosts}
              disabled={isGenerating || selectedPlatforms.size === 0 || !basePost.trim()}
              className="w-full py-3 px-6 bg-gradient-to-r from-purple-600 to-sky-600 text-white font-bold rounded-lg shadow-lg hover:from-purple-700 hover:to-sky-700 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isGenerating ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Generating...
                </>
              ) : (
                '✨ Generate Posts'
              )}
            </button>
          </div>

          {/* Output Section */}
          <div className="flex flex-col gap-6">
            {orderedGeneratedPosts.length > 0 ? (
              orderedGeneratedPosts.map(post => <PlatformCard key={post.platform} post={post} />)
            ) : (
              <div className="flex items-center justify-center h-full bg-slate-800/50 rounded-lg p-8 border-2 border-dashed border-slate-700">
                <p className="text-slate-400 text-center">Your generated posts will appear here.</p>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default App;
