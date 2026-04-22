import { useState, useEffect, useRef } from 'react';
import { Loader2, Check, KeyRound, BookOpen, Camera } from 'lucide-react';
import { PageLayout } from '@/components/PageLayout';
import { Button } from '@/components/ui/button';
import { useUser } from '@/context/UserContext';
import { userService } from '@/services/userService';
import { topicService } from '@/services/topicService';
import type { Topic } from '@/services/topicService';

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3000';

export function ProfilePage() {
  const { profile, setProfile } = useUser();

  const [allTopics, setAllTopics] = useState<Topic[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [isSavingInterests, setIsSavingInterests] = useState(false);
  const [interestsSaved, setInterestsSaved] = useState(false);

  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSavingPassword, setIsSavingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [passwordSaved, setPasswordSaved] = useState(false);

  useEffect(() => {
    topicService.getTopics().then(setAllTopics);
  }, []);

  useEffect(() => {
    if (profile) {
      setSelected(new Set(profile.interests.map(i => i._id)));
    }
  }, [profile]);

  function toggleTopic(id: string) {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
    setInterestsSaved(false);
  }

  async function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploadingAvatar(true);
    try {
      const updated = await userService.uploadAvatar(file);
      setProfile(updated);
    } finally {
      setIsUploadingAvatar(false);
      e.target.value = '';
    }
  }

  async function handleSaveInterests() {
    setIsSavingInterests(true);
    try {
      const updated = await userService.updateInterests([...selected]);
      setProfile(updated);
      setInterestsSaved(true);
    } finally {
      setIsSavingInterests(false);
    }
  }

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault();
    setPasswordError('');
    setPasswordSaved(false);
    if (newPassword !== confirmPassword) {
      setPasswordError('New passwords do not match');
      return;
    }
    if (newPassword.length < 6) {
      setPasswordError('New password must be at least 6 characters');
      return;
    }
    setIsSavingPassword(true);
    try {
      await userService.changePassword(currentPassword, newPassword);
      setPasswordSaved(true);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      const msg = err?.response?.data?.error ?? 'Failed to update password';
      setPasswordError(msg);
    } finally {
      setIsSavingPassword(false);
    }
  }

  const email = profile?.email ?? '';
  const initial = email ? email[0].toUpperCase() : '?';

  return (
    <PageLayout>
      <main className="max-w-2xl mx-auto px-6 py-12 space-y-10">

        <div className="flex items-center gap-5">
          <button
            type="button"
            onClick={() => avatarInputRef.current?.click()}
            className="relative w-16 h-16 rounded-full shrink-0 group focus:outline-none"
            title="Change profile picture"
          >
            {profile?.avatar ? (
              <img
                src={`${API_BASE}${profile.avatar}`}
                alt="Profile"
                className="w-16 h-16 rounded-full object-cover"
              />
            ) : (
              <div className="w-16 h-16 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-2xl font-bold select-none">
                {initial}
              </div>
            )}
            <div className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              {isUploadingAvatar
                ? <Loader2 className="w-5 h-5 text-white animate-spin" />
                : <Camera className="w-5 h-5 text-white" />
              }
            </div>
          </button>
          <input
            ref={avatarInputRef}
            type="file"
            accept="image/jpeg,image/png,image/gif,image/webp"
            className="hidden"
            onChange={handleAvatarChange}
          />
          <div>
            <h1 className="text-2xl font-bold">{email}</h1>
            <div className="flex gap-4 mt-1 text-sm text-muted-foreground">
              <span><strong className="text-foreground">{profile?.following.length ?? 0}</strong> following</span>
              <span><strong className="text-foreground">{profile?.followers.length ?? 0}</strong> followers</span>
            </div>
          </div>
        </div>

        <section>
          <div className="flex items-center gap-2 mb-4">
            <BookOpen className="w-4 h-4 text-muted-foreground" />
            <h2 className="font-semibold text-base">Topics</h2>
          </div>
          {allTopics.length === 0 ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="w-3.5 h-3.5 animate-spin" /> Loading topics…
            </div>
          ) : (
            <div className="flex flex-wrap gap-2 mb-4">
              {allTopics.map(topic => (
                <button
                  key={topic._id}
                  type="button"
                  onClick={() => toggleTopic(topic._id)}
                  className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${
                    selected.has(topic._id)
                      ? 'bg-foreground text-background border-foreground'
                      : 'bg-background text-foreground border-border hover:bg-muted'
                  }`}
                >
                  {topic.name}
                </button>
              ))}
            </div>
          )}
          <Button onClick={handleSaveInterests} disabled={isSavingInterests} size="sm">
            {isSavingInterests
              ? <><Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />Saving…</>
              : interestsSaved
                ? <><Check className="w-3.5 h-3.5 mr-1.5" />Saved</>
                : 'Save topics'
            }
          </Button>
        </section>

        <section>
          <div className="flex items-center gap-2 mb-4">
            <KeyRound className="w-4 h-4 text-muted-foreground" />
            <h2 className="font-semibold text-base">Change password</h2>
          </div>
          <form onSubmit={handleChangePassword} className="space-y-3 max-w-sm">
            <div className="space-y-1">
              <label className="text-sm text-muted-foreground">Current password</label>
              <input
                type="password"
                value={currentPassword}
                onChange={e => setCurrentPassword(e.target.value)}
                required
                className="w-full border rounded-md px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm text-muted-foreground">New password</label>
              <input
                type="password"
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                required
                className="w-full border rounded-md px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm text-muted-foreground">Confirm new password</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                required
                className="w-full border rounded-md px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            {passwordError && <p className="text-sm text-destructive">{passwordError}</p>}
            {passwordSaved && <p className="text-sm text-green-600">Password updated successfully.</p>}
            <Button type="submit" disabled={isSavingPassword} size="sm">
              {isSavingPassword
                ? <><Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />Saving…</>
                : 'Update password'
              }
            </Button>
          </form>
        </section>

      </main>
    </PageLayout>
  );
}
