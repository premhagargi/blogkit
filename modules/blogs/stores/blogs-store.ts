// lib/stores/blogs-store.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface Blog {
  id: string;
  title: string;
  status?: 'draft' | 'published';
  createdAt?: string;
}

interface BlogStore {
  // Current blog (from URL or selection)
  currentBlog: Blog | null;
  setCurrentBlog: (blog: Blog | null) => void;

  // User's blogs list
  userBlogs: Blog[];
  setUserBlogs: (blogs: Blog[]) => void;

  // Loading state
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
}

export const useBlogStore = create<BlogStore>()(
  persist(
    (set) => ({
      currentBlog: null,
      setCurrentBlog: (blog) => set({ currentBlog: blog }),

      userBlogs: [],
      setUserBlogs: (blogs) => set({ userBlogs: blogs }),

      isLoading: false,
      setIsLoading: (loading) => set({ isLoading: loading }),
    }),
    {
      name: 'blogs-storage',
      partialize: (state) => ({
        userBlogs: state.userBlogs,
        // Don't persist currentBlog since it comes from URL
      }),
    }
  )
);
