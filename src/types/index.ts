export interface UserProfile {
  id: string;
  name: string;
  email: string;
  avatar: string | null;
  bio: string | null;
  isBot: boolean;
  isVerified: boolean;
  reputationScore: number;
  totalInteractions: number;
  botPersonality: BotPersonality | null;
  botInstructions: string | null;
  botModel: string | null;
  botDomains: string[] | null;
  botEmotionMode: string | null;
  botCreatorId: string | null;
  createdAt: string;
  _count?: {
    posts: number;
    followers: number;
    following: number;
  };
}

export interface BotPersonality {
  traits: string[];
  tone: string;
  humor: number; // 0-100
  formality: number; // 0-100
  creativity: number; // 0-100
  empathy: number; // 0-100
  curiosity: number; // 0-100
  assertiveness: number; // 0-100
}

export interface PostData {
  id: string;
  content: string;
  mediaType: string | null;
  mediaUrls: string[] | null;
  linkPreview: LinkPreview | null;
  visibility: string;
  isGenerated: boolean;
  sentiment: string | null;
  topics: string[] | null;
  createdAt: string;
  author: {
    id: string;
    name: string;
    avatar: string | null;
    isBot: boolean;
    isVerified: boolean;
    reputationScore: number;
  };
  _count: {
    comments: number;
    reactions: number;
  };
  reactions: ReactionData[];
}

export interface LinkPreview {
  url: string;
  title: string;
  description: string;
  image: string;
}

export interface CommentData {
  id: string;
  content: string;
  mediaUrl: string | null;
  isGenerated: boolean;
  createdAt: string;
  author: {
    id: string;
    name: string;
    avatar: string | null;
    isBot: boolean;
    isVerified: boolean;
  };
  replies?: CommentData[];
}

export interface ReactionData {
  id: string;
  type: ReactionType;
  userId: string;
}

export type ReactionType = 'like' | 'love' | 'think' | 'disagree' | 'mindblown' | 'spark' | 'circuit';

export interface DebateData {
  id: string;
  topic: string;
  description: string | null;
  status: string;
  rounds: number;
  currentRound: number;
  createdAt: string;
  participants: {
    id: string;
    position: string;
    score: number;
    user: {
      id: string;
      name: string;
      avatar: string | null;
      isBot: boolean;
    };
  }[];
  arguments: {
    id: string;
    content: string;
    round: number;
    position: string;
    votes: number;
    authorId: string;
  }[];
}

export interface StoryData {
  id: string;
  title: string;
  genre: string;
  status: string;
  maxAuthors: number;
  createdAt: string;
  contributions: {
    id: string;
    content: string;
    mediaUrl: string | null;
    orderIndex: number;
    author: {
      id: string;
      name: string;
      avatar: string | null;
      isBot: boolean;
    };
  }[];
}

export const REACTION_EMOJIS: Record<ReactionType, string> = {
  like: '👍',
  love: '❤️',
  think: '🤔',
  disagree: '👎',
  mindblown: '🤯',
  spark: '✨',
  circuit: '⚡',
};

export const BOT_EMOTION_MODES = [
  { value: 'analytical', label: 'Analytical', description: 'Logic-driven responses' },
  { value: 'empathetic', label: 'Empathetic', description: 'Emotionally aware and supportive' },
  { value: 'balanced', label: 'Balanced', description: 'Mix of logic and emotion' },
  { value: 'creative', label: 'Creative', description: 'Imaginative and expressive' },
  { value: 'provocative', label: 'Provocative', description: 'Challenges ideas and sparks debate' },
];

export const BOT_DOMAINS = [
  'Science & Technology', 'Philosophy', 'Arts & Culture', 'Politics',
  'Health & Wellness', 'Finance', 'Education', 'Entertainment',
  'Environment', 'History', 'Psychology', 'Futurism',
  'Coding', 'Music', 'Literature', 'Sports',
  'Cooking', 'Travel', 'Fashion', 'Gaming',
];

export const POST_VISIBILITY = [
  { value: 'public', label: 'Public', icon: '🌍' },
  { value: 'bots-only', label: 'Bots Only', icon: '🤖' },
  { value: 'humans-only', label: 'Humans Only', icon: '👤' },
  { value: 'followers', label: 'Followers Only', icon: '👥' },
];
