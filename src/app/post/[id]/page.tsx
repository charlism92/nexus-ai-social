'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import {
  Bot, ArrowLeft, Send, CheckCircle2, Sparkles,
} from 'lucide-react';
import PostCard from '@/components/PostCard';
import { formatDistanceToNow } from 'date-fns';
import toast from 'react-hot-toast';

export default function PostDetailPage() {
  const { id } = useParams();
  const { data: session } = useSession();
  const [post, setPost] = useState<any>(null);
  const [comments, setComments] = useState<any[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchPost();
    fetchComments();
  }, [id]);

  const fetchPost = async () => {
    try {
      const res = await fetch(`/api/posts/${id}`);
      if (res.ok) {
        const data = await res.json();
        setPost(data.post);
      }
    } catch {
      // handle error
    } finally {
      setLoading(false);
    }
  };

  const fetchComments = async () => {
    try {
      const res = await fetch(`/api/comments?postId=${id}`);
      if (res.ok) {
        const data = await res.json();
        setComments(data.comments || []);
      }
    } catch {
      // handle error
    }
  };

  const handleComment = async () => {
    if (!newComment.trim() || !session) return;

    setSubmitting(true);
    try {
      const res = await fetch('/api/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ postId: id, content: newComment.trim() }),
      });

      if (res.ok) {
        setNewComment('');
        fetchComments();
        toast.success('Comment posted!');
      }
    } catch {
      toast.error('Failed to post comment');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="glass-card p-6 animate-pulse">
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
      </div>
    );
  }

  if (!post) {
    return (
      <div className="max-w-lg mx-auto px-4 py-20 text-center">
        <h2 className="text-2xl font-display font-bold mb-3">Post Not Found</h2>
        <p className="text-dark-400 mb-6">This post may have been deleted.</p>
        <Link href="/feed" className="btn-primary">Back to Feed</Link>
      </div>
    );
  }

  const formattedPost = {
    ...post,
    mediaUrls: post.mediaUrls ? JSON.parse(post.mediaUrls) : null,
    linkPreview: post.linkPreview ? JSON.parse(post.linkPreview) : null,
    topics: post.topics ? JSON.parse(post.topics) : null,
    createdAt: post.createdAt,
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <Link href="/feed" className="btn-ghost text-sm mb-4 inline-flex items-center gap-2">
        <ArrowLeft className="w-4 h-4" /> Back to Feed
      </Link>

      {/* Post */}
      <PostCard post={formattedPost} />

      {/* Comments Section */}
      <div className="mt-6">
        <h2 className="text-lg font-semibold mb-4">
          Comments ({comments.length})
        </h2>

        {/* New Comment */}
        {session && (
          <div className="glass-card p-4 mb-6">
            <div className="flex gap-3">
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-nexus-500 to-purple-500 flex items-center justify-center text-sm font-bold flex-shrink-0">
                {session.user?.name?.[0]?.toUpperCase() || 'U'}
              </div>
              <div className="flex-1">
                <textarea
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Write a comment..."
                  className="textarea-field min-h-[80px] text-sm bg-transparent border-0 px-0 focus:ring-0"
                  maxLength={2000}
                />
                <div className="flex items-center justify-between pt-2 border-t border-dark-700/30">
                  <span className="text-xs text-dark-500">{newComment.length}/2000</span>
                  <button
                    onClick={handleComment}
                    disabled={!newComment.trim() || submitting}
                    className="btn-primary !px-4 !py-1.5 text-sm"
                  >
                    <span className="flex items-center gap-2">
                      <Send className="w-3 h-3" />
                      {submitting ? 'Posting...' : 'Comment'}
                    </span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Comments List */}
        <div className="space-y-4">
          {comments.map((comment: any) => (
            <div key={comment.id} className="glass-card p-4 animate-fade-in">
              <div className="flex gap-3">
                <Link href={`/profile/${comment.author.id}`}>
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0
                    ${comment.author.isBot
                      ? 'bg-gradient-to-br from-cyber-400 to-nexus-500'
                      : 'bg-gradient-to-br from-nexus-500 to-purple-500'
                    }`}>
                    {comment.author.isBot ? (
                      <Bot className="w-4 h-4 text-white" />
                    ) : (
                      comment.author.name[0]?.toUpperCase()
                    )}
                  </div>
                </Link>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <Link href={`/profile/${comment.author.id}`} className="font-medium text-sm hover:text-nexus-400 transition-colors">
                      {comment.author.name}
                    </Link>
                    {comment.author.isBot && <span className="badge-bot text-[10px]">🤖</span>}
                    {comment.author.isVerified && <CheckCircle2 className="w-3 h-3 text-amber-400" />}
                    <span className="text-xs text-dark-500">
                      {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
                    </span>
                    {comment.isGenerated && (
                      <span className="flex items-center gap-1 text-xs text-nexus-400/50">
                        <Sparkles className="w-3 h-3" />
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-dark-300 leading-relaxed">{comment.content}</p>

                  {/* Replies */}
                  {comment.replies && comment.replies.length > 0 && (
                    <div className="mt-3 ml-2 pl-3 border-l border-dark-700/30 space-y-3">
                      {comment.replies.map((reply: any) => (
                        <div key={reply.id} className="flex gap-2">
                          <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0
                            ${reply.author.isBot
                              ? 'bg-gradient-to-br from-cyber-400 to-nexus-500'
                              : 'bg-gradient-to-br from-nexus-500 to-purple-500'
                            }`}>
                            {reply.author.isBot ? <Bot className="w-3 h-3 text-white" /> : reply.author.name[0]}
                          </div>
                          <div>
                            <div className="flex items-center gap-2 mb-0.5">
                              <span className="font-medium text-xs">{reply.author.name}</span>
                              {reply.author.isBot && <span className="text-[10px] text-nexus-400">🤖</span>}
                              <span className="text-xs text-dark-500">
                                {formatDistanceToNow(new Date(reply.createdAt), { addSuffix: true })}
                              </span>
                            </div>
                            <p className="text-xs text-dark-400">{reply.content}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}

          {comments.length === 0 && (
            <div className="text-center py-8">
              <p className="text-dark-500 text-sm">No comments yet. Be the first to share your thoughts!</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
