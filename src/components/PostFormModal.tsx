import React, { useState, useRef, ChangeEvent, FormEvent } from 'react';
import { Post } from '../types';
import { addPost } from '../utils/storage';
import { X, Image, Plus, HelpCircle, Laptop, GraduationCap } from 'lucide-react';

interface PostFormModalProps {
  onClose: () => void;
  onPostCreated: (post: Post) => void;
  userId: string;
  darkMode: boolean;
}

export default function PostFormModal({ onClose, onPostCreated, userId, darkMode }: PostFormModalProps) {
  const [type, setType] = useState<'project' | 'idea'>('project');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [tagInput, setTagInput] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []) as File[];
    if (!files.length) return;

    if (images.length + files.length > 5) {
      setError('You can upload a maximum of 5 images per post.');
      return;
    }

    setError('');
    
    files.forEach(file => {
      if (file.size > 5 * 1024 * 1024) {
        setError(`Image "${file.name}" exceeds the 5MB size limit.`);
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        setImages(prev => [...prev, reader.result as string]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setError('');

    if (!title.trim() || !description.trim()) {
      setError('Title and Description are required.');
      return;
    }

    if (title.length > 100) {
      setError('Title must be 100 characters or less.');
      return;
    }

    if (description.length > 1000) {
      setError('Description must be 1000 characters or less.');
      return;
    }

    setLoading(true);

    // Parse comma-separated tags or spaces
    const tags = tagInput
      .split(',')
      .map(t => t.trim().toLowerCase())
      .filter(t => t.length > 0);

    // If empty tags, suggest generic
    if (tags.length === 0) {
      tags.push(type === 'project' ? 'cit-project' : 'cit-idea');
    }

    setTimeout(() => {
      const newPost: Post = {
        id: 'post_' + Date.now(),
        type,
        title: title.trim(),
        description: description.trim(),
        images: images,
        tags: tags,
        createdAt: new Date().toLocaleDateString('en-US', { 
          year: 'numeric', 
          month: 'short', 
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        }),
        authorId: userId,
        likesCount: 0,
        likedBy: []
      };

      addPost(newPost);
      setLoading(false);
      onPostCreated(newPost);
      onClose();
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/65 backdrop-blur-xs">
      <div 
        id="post-form-modal"
        className={`w-full max-w-2xl rounded-2xl border ${darkMode ? 'bg-cit-dark-500 border-gray-800 text-white' : 'bg-gray-150 border-gray-250 text-gray-950'} shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-150 dark:border-gray-800 bg-cit-blue-500 text-white">
          <div className="flex items-center gap-2">
            <GraduationCap className="w-5 h-5 text-cit-red-500" />
            <h2 className="font-display font-bold text-lg">Share Academic Content</h2>
          </div>
          <button 
            id="close-post-modal-btn"
            onClick={onClose} 
            className="p-1 rounded-full hover:bg-white/10 text-white/80 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
          
          {error && (
            <div id="post-form-error" className="p-3.5 rounded-lg bg-red-100/10 border border-red-500/20 text-red-500 text-xs font-semibold">
              {error}
            </div>
          )}

          {/* Selector Type */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">Category Selection</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                id="post-type-project"
                onClick={() => setType('project')}
                className={`p-3.5 rounded-xl border flex flex-col items-center justify-center gap-1.5 transition text-xs font-bold ${
                  type === 'project' 
                    ? 'border-cit-blue-500 bg-cit-blue-50/50 dark:bg-cit-blue-500/10 text-cit-blue-500 dark:text-cit-blue-300 ring-2 ring-cit-blue-500/20' 
                    : 'border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/30'
                }`}
              >
                <Laptop className="w-5 h-5" />
                <span>Project / Implementation</span>
              </button>
              
              <button
                type="button"
                id="post-type-idea"
                onClick={() => setType('idea')}
                className={`p-3.5 rounded-xl border flex flex-col items-center justify-center gap-1.5 transition text-xs font-bold ${
                  type === 'idea' 
                    ? 'border-cit-red-500 bg-cit-red-100/10 text-cit-red-500 ring-2 ring-cit-red-500/20' 
                    : 'border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/30'
                }`}
              >
                <HelpCircle className="w-5 h-5" />
                <span>Idea / Collaboration</span>
              </button>
            </div>
          </div>

          {/* Title with Character count */}
          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-400">Post Title</label>
              <span className={`text-[10px] ${title.length > 100 ? 'text-red-500' : 'text-gray-400'}`}>
                {title.length}/100 characters
              </span>
            </div>
            <input
              type="text"
              id="post-title-input"
              value={title}
              onChange={(e) => setTitle(e.target.value.substring(0, 110))}
              placeholder={type === 'project' ? "e.g., Campus Parking Navigation Android System" : "e.g., AI Study Buddy Platform Idea"}
              className={`w-full px-4 py-2.5 rounded-xl border text-sm font-medium focus:ring-2 focus:outline-none ${
                type === 'project' ? 'focus:ring-cit-blue-500' : 'focus:ring-cit-red-500'
              } ${darkMode ? 'bg-cit-dark-600 border-gray-800 text-white' : 'bg-gray-50 border-gray-200 text-gray-900'}`}
              required
            />
          </div>

          {/* Description with Character count */}
          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-400">Description</label>
              <span className={`text-[10px] ${description.length > 1000 ? 'text-red-500' : 'text-gray-400'}`}>
                {description.length}/1000 characters
              </span>
            </div>
            <textarea
              id="post-desc-input"
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value.substring(0, 1100))}
              placeholder={type === 'project' ? "Outline modules, languages, framework stack, research goals..." : "Draft your collaborative goals, skills you are looking for, implementation timeline..."}
              className={`w-full px-4 py-2.5 rounded-xl border text-sm scrollbar focus:ring-2 focus:outline-none ${
                type === 'project' ? 'focus:ring-cit-blue-500' : 'focus:ring-cit-red-500'
              } ${darkMode ? 'bg-cit-dark-600 border-gray-800 text-white' : 'bg-gray-50 border-gray-200 text-gray-900'}`}
              required
            ></textarea>
          </div>

          {/* Tag Chips Input */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-1.5">Tags / Specialties</label>
            <input
              type="text"
              id="post-tags-input"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              placeholder="React, Python, Machine Learning, Business Strategy (Separated by commas)"
              className={`w-full px-4 py-2.5 rounded-xl border text-xs focus:ring-2 focus:outline-none ${
                type === 'project' ? 'focus:ring-cit-blue-500' : 'focus:ring-cit-red-500'
              } ${darkMode ? 'bg-cit-dark-600 border-gray-800 text-white' : 'bg-gray-50 border-gray-200 text-gray-900'}`}
            />
          </div>

          {/* Multi-Image Upload */}
          <div>
            <div className="flex justify-between items-center mb-1.5">
              <span className="text-xs font-bold uppercase tracking-wider text-gray-400 flex items-center">
                <Image className="w-4 h-4 mr-1 text-cit-blue-400" /> Upload Images (Max 5, 5MB each)
              </span>
              <span className="text-[10px] text-gray-400">{images.length}/5 uploaded</span>
            </div>

            <div className="flex flex-wrap gap-2.5 p-3 rounded-xl border border-dashed border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-cit-dark-600">
              
              {/* Custom Selector Thumbnail */}
              {images.length < 5 && (
                <button
                  type="button"
                  id="add-image-post-btn"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-16 h-16 rounded-lg border border-dashed border-gray-300 dark:border-gray-700 hover:border-cit-red-500 dark:hover:border-cit-blue-400 flex flex-col items-center justify-center text-gray-400 hover:text-gray-600 transition"
                >
                  <Plus className="w-5 h-5 shrink-0" />
                  <span className="text-[8px] font-semibold uppercase mt-1">Add Image</span>
                </button>
              )}

              {/* Uploaded Previews */}
              {images.map((img, i) => (
                <div key={i} className="relative w-16 h-16 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-800 group">
                  <img src={img} alt="post preview" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => removeImage(i)}
                    className="absolute top-0.5 right-0.5 bg-black/50 hover:bg-black/80 rounded-full p-0.5 text-white transition opacity-0 group-hover:opacity-100"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}

              {images.length === 0 && (
                <div className="py-4 text-center w-full flex items-center justify-center text-xs text-gray-400">
                  No visual assets uploaded. You can include illustrations or layout screenshots!
                </div>
              )}
            </div>
            <input
              type="file"
              ref={fileInputRef}
              accept="image/*"
              multiple
              onChange={handleImageUpload}
              className="hidden"
            />
          </div>

          {/* Action buttons */}
          <div className="flex gap-3 justify-end pt-4 border-t border-gray-150 dark:border-gray-800">
            <button
              type="button"
              id="cancel-post-btn"
              onClick={onClose}
              disabled={loading}
              className={`px-5 py-2.5 rounded-lg text-xs font-bold border ${darkMode ? 'border-gray-800 hover:bg-gray-800 text-gray-300' : 'border-gray-200 hover:bg-gray-50 text-gray-600'} transition`}
            >
              Cancel
            </button>
            <button
              type="submit"
              id="submit-post-btn"
              disabled={loading}
              className={`px-7 py-2.5 rounded-lg text-xs font-bold text-white shadow-md hover:opacity-90 transition flex items-center justify-center ${
                type === 'project' ? 'bg-cit-blue-500' : 'bg-cit-red-500'
              }`}
            >
              {loading ? (
                <>
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-1.5"></span>
                  Uploading Project...
                </>
              ) : (
                'Publish Post'
              )}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}
