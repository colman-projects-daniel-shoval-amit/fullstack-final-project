import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { topicService } from '@/services/topicService';
import type { Topic } from '@/services/topicService';
import { userService } from '@/services/userService';
import { useUser } from '@/context/UserContext';

export function OnboardingPage() {
  const [topics, setTopics] = useState<Topic[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [isSaving, setIsSaving] = useState(false);
  const { setProfile } = useUser();
  const navigate = useNavigate();

  useEffect(() => {
    topicService.getTopics().then(setTopics);
  }, []);

  function toggle(id: string) {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  async function handleContinue() {
    setIsSaving(true);
    try {
      const updated = await userService.updateInterests([...selected]);
      setProfile(updated);
      navigate('/');
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-muted/40 p-6">
      <div className="max-w-xl w-full">
        <h1 className="text-3xl font-bold mb-2">What are you into?</h1>
        <p className="text-muted-foreground mb-8 text-sm">
          Pick topics to personalise your feed. You can change these later.
        </p>
        <div className="flex flex-wrap gap-3 mb-10">
          {topics.map(topic => (
            <button
              key={topic._id}
              type="button"
              onClick={() => toggle(topic._id)}
              className={`px-4 py-2 rounded-full text-sm border transition-colors ${
                selected.has(topic._id)
                  ? 'bg-foreground text-background border-foreground'
                  : 'bg-background text-foreground border-border hover:bg-muted'
              }`}
            >
              {topic.name}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-4">
          <Button onClick={handleContinue} disabled={isSaving || selected.size === 0}>
            {isSaving && <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" />}
            {isSaving ? 'Saving…' : 'Continue'}
          </Button>
          <Button variant="ghost" onClick={() => navigate('/')}>
            Skip for now
          </Button>
        </div>
      </div>
    </div>
  );
}
