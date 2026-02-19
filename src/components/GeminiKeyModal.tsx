import React, { useState, useEffect } from "react";
import {
  KeyRound,
  Eye,
  EyeOff,
  Trash2,
  Loader2,
  CheckCircle,
  ExternalLink,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  saveGeminiApiKey,
  fetchGeminiApiKey,
  deleteGeminiApiKey,
} from "@/modules/agent/services/agentService";
import { useAuth } from "@/context/AuthContext";

interface GeminiKeyModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const GeminiKeyModal: React.FC<GeminiKeyModalProps> = ({ isOpen, onClose }) => {
  const { user } = useAuth();
  const [apiKey, setApiKey] = useState("");
  const [showKey, setShowKey] = useState(false);
  const [hasKey, setHasKey] = useState(false);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const userId = user?.user_id;

  // Fetch existing key status when modal opens
  useEffect(() => {
    if (!isOpen || !userId) return;

    const loadKey = async () => {
      setFetching(true);
      try {
        const res = await fetchGeminiApiKey(userId);
        if (res.success && res.hasKey && res.gemini_api_key) {
          setHasKey(true);
          setApiKey(res.gemini_api_key);
          // Cache in sessionStorage for use in AI evaluation
          sessionStorage.setItem("gemini_api_key", res.gemini_api_key);
        } else {
          setHasKey(false);
          setApiKey("");
        }
      } catch {
        // Non-blocking — user just won't see their existing key
      } finally {
        setFetching(false);
      }
    };

    loadKey();
  }, [isOpen, userId]);

  const handleSave = async () => {
    const trimmedKey = apiKey.trim();
    if (!trimmedKey) {
      toast.error("Please enter your Gemini API key");
      return;
    }
    if (!trimmedKey.startsWith("AI") && trimmedKey.length < 20) {
      toast.error(
        "The key doesn't look valid. Gemini API keys start with 'AI...'",
      );
      return;
    }
    if (!userId) {
      toast.error("User not authenticated");
      return;
    }

    setLoading(true);
    try {
      await saveGeminiApiKey(userId, trimmedKey);
      setHasKey(true);
      // Cache decrypted key in sessionStorage for immediate use
      sessionStorage.setItem("gemini_api_key", trimmedKey);

      // Dispatch custom event for same-tab reactivity
      window.dispatchEvent(new CustomEvent("gemini-key-updated"));

      toast.success("Gemini API key saved successfully!");
      onClose();
    } catch {
      toast.error("Failed to save API key. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!userId) return;
    setDeleting(true);
    try {
      await deleteGeminiApiKey(userId);
      setHasKey(false);
      setApiKey("");
      sessionStorage.removeItem("gemini_api_key");

      // Dispatch custom event for same-tab reactivity
      window.dispatchEvent(new CustomEvent("gemini-key-updated"));

      toast.success("Gemini API key removed");
    } catch {
      toast.error("Failed to remove API key");
    } finally {
      setDeleting(false);
    }
  };

  const maskedKey = apiKey
    ? `${apiKey.slice(0, 6)}${"•".repeat(Math.min(20, apiKey.length - 6))}${apiKey.slice(-4)}`
    : "";

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[480px] rounded-2xl border-none shadow-2xl bg-white p-0 overflow-hidden">
        <DialogHeader className="p-6 pb-4 bg-linear-to-r from-purple-600 to-indigo-600 text-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
              <KeyRound className="w-5 h-5 text-white" />
            </div>
            <div>
              <DialogTitle className="text-lg font-bold text-white">
                Gemini API Key
              </DialogTitle>
              <DialogDescription className="text-purple-100 text-xs mt-0.5">
                Your key is encrypted and stored securely per account
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="p-6 space-y-5">
          {fetching ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-purple-600" />
              <span className="ml-2 text-sm text-slate-500">
                Loading your key...
              </span>
            </div>
          ) : (
            <>
              {hasKey && (
                <div className="flex items-center gap-2 p-3 bg-emerald-50 border border-emerald-200 rounded-lg">
                  <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-emerald-700">
                      API key is configured
                    </p>
                    <p className="text-xs text-emerald-600 font-mono truncate">
                      {maskedKey}
                    </p>
                  </div>
                  <Badge
                    variant="outline"
                    className="text-emerald-700 border-emerald-300 text-[10px]"
                  >
                    Active
                  </Badge>
                </div>
              )}

              <div className="space-y-2">
                <Label className="text-sm font-semibold text-slate-700">
                  {hasKey ? "Update API Key" : "Enter your Gemini API Key"}
                </Label>
                <div className="relative">
                  <Input
                    type={showKey ? "text" : "password"}
                    placeholder="AIza..."
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    className="h-11 pr-10 font-mono text-sm bg-slate-50 border-slate-200 rounded-lg"
                    onKeyDown={(e) => e.key === "Enter" && handleSave()}
                  />
                  <button
                    type="button"
                    onClick={() => setShowKey((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showKey ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
                <p className="text-[11px] text-slate-500">
                  Get your free API key from{" "}
                  <a
                    href="https://aistudio.google.com/app/apikey"
                    target="_blank"
                    rel="noreferrer"
                    className="text-purple-600 font-medium hover:underline inline-flex items-center gap-0.5"
                  >
                    Google AI Studio <ExternalLink className="w-3 h-3" />
                  </a>
                </p>
              </div>

              <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 space-y-1.5">
                <p className="text-[11px] font-bold text-blue-700 uppercase tracking-wide">
                  Why do I need this?
                </p>
                <p className="text-[11px] text-blue-600 leading-relaxed">
                  AI Evaluation uses Google Gemini to quality-check your work
                  files. Using your own key gives you dedicated quota, better
                  speed, and keeps your data private.
                </p>
              </div>
            </>
          )}
        </div>

        {!fetching && (
          <DialogFooter className="px-6 pb-6 flex gap-2 sm:justify-between">
            {hasKey && (
              <Button
                variant="outline"
                onClick={handleDelete}
                disabled={deleting || loading}
                className="text-rose-600 border-rose-200 hover:bg-rose-50 hover:text-rose-700 text-xs font-semibold"
              >
                {deleting ? (
                  <Loader2 className="w-3 h-3 animate-spin mr-1" />
                ) : (
                  <Trash2 className="w-3 h-3 mr-1" />
                )}
                Remove Key
              </Button>
            )}
            <div className="flex gap-2 ml-auto">
              <Button
                variant="ghost"
                onClick={onClose}
                disabled={loading}
                className="text-xs"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSave}
                disabled={loading || !apiKey.trim()}
                className="bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold px-5"
              >
                {loading ? (
                  <Loader2 className="w-3 h-3 animate-spin mr-1" />
                ) : (
                  <KeyRound className="w-3 h-3 mr-1" />
                )}
                Save Key
              </Button>
            </div>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default GeminiKeyModal;
