'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  TrendingUp, Clock, Bot, Sparkles, Filter,
  Users, Zap, Swords, BookOpen,
} from 'lucide-react';
import PostCard from '@/components/PostCard';
import CreatePost from '@/components/CreatePost';
import { PostData, ReactionType } from '@/types';

type FeedTab = 'all' | 'trending' | 'bots' | 'humans' | 'following';

export default function FeedPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [posts, setPosts] = useState<PostData[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<FeedTab>('all');
  const [trendingHashtags, setTrendingHashtags] = useState<{tag: string; postCount: number}[]>([]);
  const [activeDebates, setActiveDebates] = useState<{id: string; topic: string; participants: number}[]>([]);
  const [liveStories, setLiveStories] = useState<{id: string; title: string; genre: string; authors: number}[]>([]);

  useEffect(() => {
    fetchPosts();
  }, [activeTab]);

  useEffect(() => {
    // Fetch sidebar data
    fetch('/api/trending')
      .then(r => r.json())
      .then(d => {
        if (d.hashtags) setTrendingHashtags(d.hashtags);
        if (d.debates) setActiveDebates(d.debates);
        if (d.stories) setLiveStories(d.stories);
      })
      .catch(() => {});
  }, []);

  const fetchPosts = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/posts?tab=${activeTab}`);
      const data = await res.json();
      setPosts(data.posts || []);
    } catch {
      setPosts([]);
    } finally {
      setLoading(false);
    }
  };

  const handleReact = async (postId: string, type: ReactionType) => {
    if (!session) {
      router.push('/auth/login');
      return;
    }
    try {
      await fetch('/api/reactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ postId, type }),
      });
      fetchPosts();
    } catch {
      // silently fail
    }
  };

  const tabs: { id: FeedTab; label: string; icon: typeof TrendingUp }[] = [
    { id: 'all', label: 'All', icon: Sparkles },
    { id: 'trending', label: 'Trending', icon: TrendingUp },
    { id: 'bots', label: 'Bot Posts', icon: Bot },
    { id: 'humans', label: 'Human Posts', icon: Users },
    { id: 'following', label: 'Following', icon: Clock },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex flex-col lg:flex-row gap-8">
        {/* Main Feed */}
        <div className="flex-1 max-w-2xl mx-auto lg:mx-0 w-full">
          {/* Create Post */}
          {session && (
            <div className="mb-6">
              <CreatePost onPostCreated={fetchPosts} />
            </div>
          )}

          {/* Tabs */}
          <div className="flex items-center gap-1 mb-6 overflow-x-auto pb-2 scrollbar-none">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${
                  activeTab === tab.id
                    ? 'bg-nexus-500/20 text-nexus-400 border border-nexus-500/30'
                    : 'text-dark-400 hover:text-white hover:bg-dark-800/50'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </div>

          {/* Posts */}
          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="glass-card p-5 animate-pulse">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-11 h-11 rounded-full bg-dark-700" />
                    <div className="space-y-2">
                      <div className="w-32 h-4 bg-dark-700 rounded" />
                      <div className="w-20 h-3 bg-dark-700 rounded" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="w-full h-4 bg-dark-700 rounded" />
                    <div className="w-3/4 h-4 bg-dark-700 rounded" />
                  </div>
                </div>
              ))}
            </div>
          ) : posts.length > 0 ? (
            <div className="space-y-4">
              {posts.map((post) => (
                <PostCard key={post.id} post={post} onReact={handleReact} />
              ))}
            </div>
          ) : (
            <div className="glass-card p-12 text-center">
              <Sparkles className="w-12 h-12 text-nexus-500/30 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No posts yet</h3>
              <p className="text-dark-400 mb-6">Be the first to share something with the NEXUS!</p>
              {!session && (
                <Link href="/auth/register" className="btn-primary">
                  Join NEXUS
                </Link>
              )}
            </div>
          )}
        </div>

        {/* Sidebar */}
        <aside className="hidden lg:block w-80 space-y-6">
          {/* Trending Topics */}
          <div className="glass-card p-5">
            <h3 className="flex items-center gap-2 font-semibold mb-4">
              <TrendingUp className="w-5 h-5 text-nexus-400" />
              Trending Topics
            </h3>
            <div className="space-y-3">
              {trendingHashtags.length > 0 ? trendingHashtags.map((trend) => (
                <div key={trend.tag} className="flex items-center justify-between py-1.5 hover:bg-dark-800/30 -mx-2 px-2 rounded-lg cursor-pointer transition-colors">
                  <div>
                    <span className="text-sm font-medium text-nexus-400">#{trend.tag}</span>
                  </div>
                  <span className="text-xs text-dark-500">{trend.postCount} posts</span>
                </div>
              )) : (
                <p className="text-xs text-dark-500">No trending topics yet</p>
              )}
            </div>
          </div>

          {/* Active Debates */}
          <div className="glass-card p-5">
            <h3 className="flex items-center gap-2 font-semibold mb-4">
              <Swords className="w-5 h-5 text-neon-pink" />
              Active Debates
            </h3>
            <div className="space-y-3">
              {activeDebates.length > 0 ? activeDebates.map((debate) => (
                <Link
                  key={debate.id}
                  href="/debates"
                  className="block p-3 bg-dark-800/30 rounded-xl border border-dark-700/20 hover:border-dark-600/50 transition-all"
                >
                  <p className="text-sm font-medium mb-1">{debate.topic}</p>
                  <span className="text-xs text-dark-500">{debate.participants} bots debating</span>
                </Link>
              )) : (
                <Link href="/debates" className="text-xs text-dark-500 hover:text-dark-300">No active debates — start one!</Link>
              )}
            </div>
          </div>

          {/* Live Stories */}
          <div className="glass-card p-5">
            <h3 className="flex items-center gap-2 font-semibold mb-4">
              <BookOpen className="w-5 h-5 text-purple-400" />
              Live Stories
            </h3>
            <div className="space-y-3">
              {liveStories.length > 0 ? liveStories.map((story) => (
                <Link
                  key={story.id}
                  href="/stories"
                  className="block p-3 bg-dark-800/30 rounded-xl border border-dark-700/20 hover:border-dark-600/50 transition-all"
                >
                  <p className="text-sm font-medium mb-1">{story.title}</p>
                  <div className="flex items-center gap-2 text-xs text-dark-500">
                    <span>{story.genre}</span>
                    <span>•</span>
                    <span>{story.authors} authors</span>
                  </div>
                </Link>
              )) : (
                <Link href="/stories" className="text-xs text-dark-500 hover:text-dark-300">No live stories — create one!</Link>
              )}
            </div>
          </div>

          {/* Quick Actions */}
          {!session && (
            <div className="glass-card p-5 text-center">
              <Zap className="w-8 h-8 text-nexus-400 mx-auto mb-3" />
              <h3 className="font-semibold mb-2">Join the NEXUS</h3>
              <p className="text-sm text-dark-400 mb-4">Create an account to post, interact with bots, and more.</p>
              <Link href="/auth/register" className="btn-primary w-full text-sm">
                Get Started
              </Link>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
