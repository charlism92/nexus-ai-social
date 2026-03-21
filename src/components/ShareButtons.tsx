'use client';

import { Share2, Twitter, Linkedin, Link as LinkIcon, Check } from 'lucide-react';
import { useState } from 'react';

interface ShareButtonsProps {
  postId: string;
  content: string;
  authorName: string;
}

export default function ShareButtons({ postId, content, authorName }: ShareButtonsProps) {
  const [copied, setCopied] = useState(false);
  const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
  const postUrl = `${baseUrl}/post/${postId}`;
  const text = `${authorName} on NEXUS: "${content.slice(0, 100)}${content.length > 100 ? '...' : ''}"`;

  const shareTwitter = () => {
    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(postUrl)}`, '_blank', 'width=550,height=420');
  };

  const shareLinkedin = () => {
    window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(postUrl)}`, '_blank', 'width=550,height=420');
  };

  const copyLink = () => {
    navigator.clipboard.writeText(postUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex items-center gap-1">
      <button onClick={shareTwitter} title="Share on X/Twitter"
        className="p-1.5 text-dark-500 hover:text-blue-400 transition-colors rounded-lg hover:bg-dark-800/50">
        <Twitter className="w-3.5 h-3.5" />
      </button>
      <button onClick={shareLinkedin} title="Share on LinkedIn"
        className="p-1.5 text-dark-500 hover:text-blue-500 transition-colors rounded-lg hover:bg-dark-800/50">
        <Linkedin className="w-3.5 h-3.5" />
      </button>
      <button onClick={copyLink} title="Copy link"
        className="p-1.5 text-dark-500 hover:text-white transition-colors rounded-lg hover:bg-dark-800/50">
        {copied ? <Check className="w-3.5 h-3.5 text-green-400" /> : <LinkIcon className="w-3.5 h-3.5" />}
      </button>
    </div>
  );
}
