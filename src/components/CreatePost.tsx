'use client';

import { useState } from 'react';
import {
  Image, Video, Mic, Link as LinkIcon, Code2, Send,
  X, Globe, Bot, Users, Lock, ChevronDown, Sparkles,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { POST_VISIBILITY } from '@/types';

interface CreatePostProps {
  onPostCreated?: () => void;
}

export default function CreatePost({ onPostCreated }: CreatePostProps) {
  const [content, setContent] = useState('');
  const [mediaType, setMediaType] = useState<string | null>(null);
  const [mediaUrls, setMediaUrls] = useState<string[]>([]);
  const [mediaInput, setMediaInput] = useState('');
  const [linkUrl, setLinkUrl] = useState('');
  const [visibility, setVisibility] = useState('public');
  const [showVisibility, setShowVisibility] = useState(false);
  const [loading, setLoading] = useState(false);

  const visibilityIcons: Record<string, typeof Globe> = {
    'public': Globe,
    'bots-only': Bot,
    'humans-only': Users,
    'followers': Lock,
  };

  const VisIcon = visibilityIcons[visibility] || Globe;

  const addMedia = () => {
    if (mediaInput.trim()) {
      setMediaUrls([...mediaUrls, mediaInput.trim()]);
      setMediaInput('');
    }
  };

  const removeMedia = (index: number) => {
    setMediaUrls(mediaUrls.filter((_, i) => i !== index));
    if (mediaUrls.length <= 1) setMediaType(null);
  };

  const handleSubmit = async () => {
    if (!content.trim() && mediaUrls.length === 0) {
      toast.error('Please add some content');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: content.trim(),
          mediaType: mediaType || (mediaUrls.length > 0 ? 'mixed' : 'text'),
          mediaUrls: mediaUrls.length > 0 ? mediaUrls : undefined,
          linkUrl: linkUrl || undefined,
          visibility,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error || 'Failed to create post');
      } else {
        toast.success('Post published!');
        setContent('');
        setMediaType(null);
        setMediaUrls([]);
        setLinkUrl('');
        setVisibility('public');
        onPostCreated?.();
      }
    } catch {
      toast.error('Failed to create post');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="glass-card p-5">
      {/* Text Area */}
      <div className="mb-4">
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="What's on your mind? Share with the NEXUS..."
          className="textarea-field min-h-[100px] bg-transparent border-0 focus:ring-0 px-0 text-[15px]"
          maxLength={5000}
        />
      </div>

      {/* Media Preview */}
      {mediaUrls.length > 0 && (
        <div className="mb-4 space-y-2">
          {mediaUrls.map((url, i) => (
            <div key={i} className="flex items-center gap-2 p-2 bg-dark-800/50 rounded-lg border border-dark-700/30">
              <div className="w-8 h-8 rounded bg-nexus-500/10 flex items-center justify-center">
                {mediaType === 'image' ? <Image className="w-4 h-4 text-nexus-400" /> :
                 mediaType === 'video' ? <Video className="w-4 h-4 text-nexus-400" /> :
                 mediaType === 'audio' ? <Mic className="w-4 h-4 text-nexus-400" /> :
                 <LinkIcon className="w-4 h-4 text-nexus-400" />}
              </div>
              <span className="text-sm text-dark-300 truncate flex-1">{url}</span>
              <button
                onClick={() => removeMedia(i)}
                className="p-1 text-dark-500 hover:text-red-400 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Media Input */}
      {mediaType && (
        <div className="mb-4 flex gap-2">
          <input
            type="text"
            value={mediaInput}
            onChange={(e) => setMediaInput(e.target.value)}
            placeholder={`Enter ${mediaType} URL...`}
            className="input-field text-sm"
            onKeyDown={(e) => e.key === 'Enter' && addMedia()}
          />
          <button onClick={addMedia} className="btn-secondary !px-4 !py-2 text-sm">
            Add
          </button>
        </div>
      )}

      {/* Link Preview Input */}
      {mediaType === 'link' && (
        <div className="mb-4">
          <input
            type="url"
            value={linkUrl}
            onChange={(e) => setLinkUrl(e.target.value)}
            placeholder="Paste a link URL..."
            className="input-field text-sm"
          />
        </div>
      )}

      {/* Actions Bar */}
      <div className="flex items-center justify-between pt-3 border-t border-dark-700/30">
        <div className="flex items-center gap-1">
          {/* Media type buttons */}
          {[
            { type: 'image', icon: Image, label: 'Image' },
            { type: 'video', icon: Video, label: 'Video' },
            { type: 'audio', icon: Mic, label: 'Audio' },
            { type: 'link', icon: LinkIcon, label: 'Link' },
            { type: 'code', icon: Code2, label: 'Code' },
          ].map((media) => (
            <button
              key={media.type}
              onClick={() => setMediaType(mediaType === media.type ? null : media.type)}
              className={`p-2 rounded-lg transition-all ${
                mediaType === media.type
                  ? 'text-nexus-400 bg-nexus-500/10'
                  : 'text-dark-500 hover:text-dark-300 hover:bg-dark-800/50'
              }`}
              title={media.label}
            >
              <media.icon className="w-5 h-5" />
            </button>
          ))}

          {/* Visibility selector */}
          <div className="relative ml-2">
            <button
              onClick={() => setShowVisibility(!showVisibility)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-dark-400 hover:text-dark-300 hover:bg-dark-800/50 rounded-lg transition-all text-sm"
            >
              <VisIcon className="w-4 h-4" />
              <span className="hidden sm:inline">{POST_VISIBILITY.find(v => v.value === visibility)?.label}</span>
              <ChevronDown className="w-3 h-3" />
            </button>

            {showVisibility && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowVisibility(false)} />
                <div className="absolute bottom-full left-0 mb-2 w-48 glass-card p-2 z-50 animate-scale-in">
                  {POST_VISIBILITY.map((v) => (
                    <button
                      key={v.value}
                      onClick={() => {
                        setVisibility(v.value);
                        setShowVisibility(false);
                      }}
                      className={`flex items-center gap-2 w-full px-3 py-2 text-sm rounded-lg transition-all ${
                        visibility === v.value
                          ? 'text-nexus-400 bg-nexus-500/10'
                          : 'text-dark-300 hover:bg-dark-800/50'
                      }`}
                    >
                      <span>{v.icon}</span>
                      {v.label}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Character count & Submit */}
        <div className="flex items-center gap-3">
          <span className={`text-xs ${content.length > 4500 ? 'text-red-400' : 'text-dark-500'}`}>
            {content.length}/5000
          </span>
          <button
            onClick={handleSubmit}
            disabled={loading || (!content.trim() && mediaUrls.length === 0)}
            className="btn-primary !px-5 !py-2 text-sm group"
          >
            {loading ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <span className="flex items-center gap-2">
                <Send className="w-4 h-4" />
                Post
              </span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
