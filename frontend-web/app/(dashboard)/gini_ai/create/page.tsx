"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, UploadCloud, X } from "lucide-react";
import styles from '../roleplay.module.css';
import { StorageService } from '@/lib/storage';

const GINI_API_URL = process.env.NEXT_PUBLIC_GINI_API_URL ?? 'http://localhost:3004/api/gini_ai';
const TOKEN_KEY = 'ginivibe_auth_token';

const authHeaders = (json = false): Record<string, string> => {
  const headers: Record<string, string> = {};
  if (json) headers['Content-Type'] = 'application/json';
  const token = StorageService.getItem(TOKEN_KEY);
  if (token) headers['Authorization'] = `Bearer ${token}`;
  return headers;
};

export default function NewCharacter() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get('edit');
  const isEdit = !!editId;
  const [loadingChar, setLoadingChar] = useState(isEdit);
  const [formData, setFormData] = useState({
    name: "",
    avatar: "",
    description: "",
    greeting: "",
    personality: "",
    scenario: "",
    visibility: "private"
  });
  
  const [uploading, setUploading] = useState(false);
  const [tags, setTags] = useState<string[]>([]);
  const [gender, setGender] = useState("");
  const [avatarMode, setAvatarMode] = useState<"upload" | "select">("select");
  const [showAvatarModal, setShowAvatarModal] = useState(false);

  // Landing-style white card for this section only.
  useEffect(() => {
    const card = document.querySelector('.app-container');
    card?.classList.add('gv-gini-white');
    return () => card?.classList.remove('gv-gini-white');
  }, []);

  // Edit mode: load the creator's character into the form.
  useEffect(() => {
    if (!editId) return;
    (async () => {
      try {
        const res = await fetch(`${GINI_API_URL}/characters/${editId}`, {
          headers: authHeaders(),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          alert(data.error || 'Could not load character for editing');
          router.push('/gini_ai');
          return;
        }
        setFormData({
          name: data.name || '',
          avatar: data.avatarUrl || '',
          description: data.description || '',
          greeting: data.greeting || '',
          personality: data.personality || '',
          scenario: data.scenario || '',
          visibility: data.visibility || 'private',
        });
        const tagList = (data.tags || '').split(',').map((t: string) => t.trim()).filter(Boolean);
        setGender(data.gender || '');
        setTags(tagList.filter((t: string) => t !== data.gender));
      } catch (err) {
        alert(err instanceof Error ? err.message : 'Could not load character');
        router.push('/gini_ai');
      } finally {
        setLoadingChar(false);
      }
    })();
  }, [editId, router]);
  
  const AVATARS = Array.from({ length: 18 }, (_, i) => i)
    .map(i => `/avatars/image_${i.toString().padStart(3, '0')}.png`);

  const AVAILABLE_TAGS = [
    "Male POV", "Female POV", 
    "fantasy", "mythical", "romantic", "comedy", "submissive", "game", 
    "sci-fi", "RPG", "hero", "supernatural", "roommate", "villain", 
    "monster", "married", "married partner", "saddistic", "mythological", 
    "servant", "cheating", "NTR", "slave", "friends", "school"
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.description || !formData.greeting) {
      alert("Please fill all required fields");
      return;
    }
    if (!gender) {
      alert("Please select a Gender for the character.");
      return;
    }

    const finalTags = [...tags, gender];
    const hasPov = tags.includes("Male POV") || tags.includes("Female POV");
    if (!hasPov) {
      alert("You must select at least one POV tag (Male POV or Female POV).");
      return;
    }

    if (!formData.avatar) return alert("Please select a character avatar.");
    
    try {
      const url = isEdit ? `${GINI_API_URL}/characters/${editId}` : `${GINI_API_URL}/characters`;
      const res = await fetch(url, {
        method: isEdit ? "PUT" : "POST",
        headers: authHeaders(true),
        body: JSON.stringify({
          ...formData,
          tags: finalTags.join(","),
          gender,
          avatarUrl: formData.avatar
        }),
      });
      if (res.ok) {
        router.push("/gini_ai");
      } else {
        const data = await res.json().catch(() => ({}));
        if (res.status === 401) {
          alert("Please login to create a character.");
        } else if (data.code === 'BOT_LIMIT') {
          alert(data.error || "Bot limit reached.");
        } else {
          alert(data.error || "Failed to save character");
        }
      }
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleChange = (e: any) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    alert("Avatar upload is not yet implemented in GiniVibe. Please select from the gallery.");
    setAvatarMode("select");
  };

  return (
    <div className={styles.pageShell}>
      <div className={`${styles.content} ${styles.pageScroll}`} style={{ maxWidth: '48rem', zIndex: 10 }}>
        
        <div className={styles.topBar}>
          <Link href="/gini_ai" className={styles.backLink}>
            <ArrowLeft style={{ marginRight: '0.5rem', width: '1rem', height: '1rem' }} />
            Back to Explore
          </Link>
        </div>
        
        <div className={styles.formCard}>
          <h1 className={styles.title} style={{ marginBottom: '2rem', fontSize: '1.875rem' }}>{isEdit ? 'Edit Character' : 'Create Character'}</h1>

          {loadingChar ? (
            <p className={styles.loadingText}>Loading character...</p>
          ) : (
          <form onSubmit={handleSubmit} className={styles.formSpaceY}>
            <div className={styles.formGrid}>
              <div>
                <label className={styles.label}>Character Name</label>
                <input required name="name" value={formData.name} onChange={handleChange} className={styles.input} placeholder="e.g. Albert Einstein" />
              </div>
              <div>
                <label className={styles.label}>Avatar Image (Required)</label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div className={styles.radioGroup}>
                    <label className={`${styles.radioLabel} ${avatarMode === 'upload' ? styles.radioLabelActive : ''}`}>
                      <input type="radio" name="avatarMode" value="upload" checked={avatarMode === 'upload'} onChange={() => setAvatarMode("upload")} style={{ display: 'none' }} />
                      <span className={styles.radioText}>Upload</span>
                    </label>
                    <label className={`${styles.radioLabel} ${avatarMode === 'select' ? styles.radioLabelActive : ''}`}>
                      <input type="radio" name="avatarMode" value="select" checked={avatarMode === 'select'} onChange={() => setAvatarMode("select")} style={{ display: 'none' }} />
                      <span className={styles.radioText}>Select Avatar</span>
                    </label>
                  </div>
                  
                  {avatarMode === 'upload' ? (
                    <div className={styles.avatarUploadArea}>
                      <div className={styles.avatarBox}>
                        <UploadCloud className={styles.avatarIcon} />
                        <input type="file" accept="image/*" onChange={handleFileUpload} disabled={uploading} style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer', width: '100%', height: '100%' }} />
                      </div>
                      <div className={styles.helpText}>
                        Upload not yet supported. Use Gallery.
                      </div>
                    </div>
                  ) : (
                    <div className={styles.avatarUploadArea}>
                      <div className={styles.avatarBox}>
                        {formData.avatar ? (
                          <img src={formData.avatar} alt="Selected Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                          <span style={{ fontSize: '0.75rem', color: 'var(--color-success)', fontWeight: 500 }}>None</span>
                        )}
                      </div>
                      <button type="button" onClick={() => setShowAvatarModal(true)} className={styles.filterBtn}>
                        Browse Gallery
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div>
              <label className={styles.label}>Short Description</label>
              <input required maxLength={100} name="description" value={formData.description} onChange={handleChange} className={styles.input} placeholder="A brilliant theoretical physicist..." />
              <p className={styles.helpText}>Maximum 100 characters. Used only for display.</p>
            </div>

            <div>
              <label className={styles.label}>Greeting Message</label>
              <textarea required maxLength={2000} name="greeting" rows={2} value={formData.greeting} onChange={handleChange} className={styles.input} style={{ resize: 'vertical' }} placeholder="Hello! Shall we discuss the nature of the universe?" />
              <p className={styles.helpText}>Maximum 2000 characters. You can use {'{{char}}'} and {'{{user}}'} here.</p>
            </div>

            <div>
              <label className={styles.label}>Gender (Required)</label>
              <div className={styles.radioGroup}>
                <label className={`${styles.radioLabel} ${gender === 'Male' ? styles.radioLabelActive : ''}`}>
                  <input type="radio" name="gender" value="Male" checked={gender === 'Male'} onChange={(e) => setGender(e.target.value)} style={{ display: 'none' }} />
                  <span className={styles.radioText}>Male</span>
                </label>
                <label className={`${styles.radioLabel} ${gender === 'Female' ? styles.radioLabelActive : ''}`}>
                  <input type="radio" name="gender" value="Female" checked={gender === 'Female'} onChange={(e) => setGender(e.target.value)} style={{ display: 'none' }} />
                  <span className={styles.radioText}>Female</span>
                </label>
              </div>
            </div>

            <div className={styles.formSpaceY}>
              <div>
                <label className={styles.label}>Tags (Select Multiple)</label>
                <div className={styles.tagsList} style={{ marginBottom: '0.5rem' }}>
                  {AVAILABLE_TAGS.map(tag => {
                    const isSelected = tags.includes(tag);
                    const isMandatoryType = ["Male POV", "Female POV"].includes(tag);
                    return (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => setTags(prev => isSelected ? prev.filter(t => t !== tag) : [...prev, tag])}
                        className={`${styles.tagBtn} ${isSelected ? styles.tagBtnActive : ''}`}
                        style={isMandatoryType ? { fontWeight: 'bold', boxShadow: '0 1px 2px 0 rgba(0,0,0,0.05)' } : {}}
                      >
                        {tag}
                      </button>
                    );
                  })}
                </div>
                <p className={styles.helpText}>Required: At least one POV tag (Male POV/Female POV).</p>
              </div>
              
              <div>
                <label className={styles.label}>Personality (Optional)</label>
                <textarea maxLength={4000} rows={5} name="personality" value={formData.personality} onChange={handleChange} className={styles.input} style={{ resize: 'vertical' }} placeholder="Describe the character's personality, traits, and background." />
                <p className={styles.helpText}>Maximum 4000 characters. Use {'{{char}}'} for the character's name and {'{{user}}'} for the user's name.</p>
              </div>
              
              <div>
                <label className={styles.label}>Scenario (Optional)</label>
                <textarea maxLength={4000} rows={3} name="scenario" value={formData.scenario} onChange={handleChange} className={styles.input} style={{ resize: 'vertical' }} placeholder="Working at the patent office in 1905" />
                <p className={styles.helpText}>Maximum 4000 characters. Use {'{{char}}'} and {'{{user}}'} if needed.</p>
              </div>
              
              <div>
                <label className={styles.label}>Visibility</label>
                <select name="visibility" value={formData.visibility} onChange={handleChange} className={styles.selectInput} style={{ width: '100%' }}>
                  <option value="private">Private (Only you can see this)</option>
                  <option value="global">Global (Available to everyone)</option>
                </select>
                <p className={styles.helpText}>Free plan: 3 bots, last 5 chats, 8k memory. Premium: 10 bots, last 25 chats, 32k memory.</p>
              </div>
            </div>

            <div className={styles.submitFooter}>
              <button type="submit" disabled={uploading} className={styles.primaryBtn}>
                {isEdit ? 'Save Changes' : 'Create Character'}
              </button>
            </div>
          </form>
          )}
        </div>
      </div>
      
      {/* Avatar Selection Modal */}
      {showAvatarModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <div className={styles.modalHeader}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--color-text-primary)' }}>Choose an Avatar</h3>
              <button type="button" onClick={() => setShowAvatarModal(false)} style={{ padding: '0.5rem', color: 'var(--color-accent)', cursor: 'pointer', background: 'none', border: 'none' }}>
                <X size={20} />
              </button>
            </div>
            <div className={styles.modalBody}>
              <div className={styles.avatarGrid}>
                {AVATARS.map((src, i) => (
                  <div 
                    key={src} 
                    onClick={() => {
                      setFormData({ ...formData, avatar: src });
                      setShowAvatarModal(false);
                    }}
                    className={`${styles.avatarItem} ${formData.avatar === src ? styles.avatarItemActive : ''}`}
                  >
                    <img src={src} alt={`Avatar ${i}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} loading="lazy" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
