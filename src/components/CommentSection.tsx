"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession, signIn } from "next-auth/react";
import Image from "next/image";

interface Comment {
  id: number;
  repo_id: number;
  user_id: number;
  parent_id: number | null;
  body: string;
  created_at: string;
  username: string;
  user_avatar: string;
}

function getTimeAgo(dateStr: string): string {
  const date = new Date(dateStr + "Z");
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return "just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 30) return `${diffDays}d ago`;
  return `${Math.floor(diffDays / 30)}mo ago`;
}

export function CommentSection({ repoId }: { repoId: number }) {
  const { data: session, status } = useSession();
  const ext = session as Record<string, unknown> | null;
  const [comments, setComments] = useState<Comment[]>([]);
  const [body, setBody] = useState("");
  const [replyTo, setReplyTo] = useState<number | null>(null);
  const [replyBody, setReplyBody] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const fetchComments = useCallback(async () => {
    try {
      const res = await fetch(`/api/repos/${repoId}/comments`);
      const data = await res.json();
      setComments(data.comments || []);
    } catch { /* ignore */ }
  }, [repoId]);

  useEffect(() => {
    fetchComments();
  }, [fetchComments]);

  async function handleSubmit(parentId?: number) {
    const text = parentId ? replyBody : body;
    if (!text.trim()) return;
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch(`/api/repos/${repoId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body: text.trim(), parentId }),
      });
      if (res.ok) {
        if (parentId) {
          setReplyBody("");
          setReplyTo(null);
        } else {
          setBody("");
        }
        await fetchComments();
      } else {
        const data = await res.json();
        setError(data.error || "Failed to post comment");
      }
    } catch {
      setError("Network error");
    }
    setSubmitting(false);
  }

  async function handleDelete(commentId: number) {
    if (!confirm("Delete this comment?")) return;
    try {
      await fetch(`/api/repos/${repoId}/comments/${commentId}`, { method: "DELETE" });
      await fetchComments();
    } catch { /* ignore */ }
  }

  const topLevel = comments.filter((c) => !c.parent_id);
  const getReplies = (parentId: number) => comments.filter((c) => c.parent_id === parentId);

  return (
    <div className="mt-6">
      <h2 className="text-lg font-bold mb-4">
        Comments {comments.length > 0 && <span style={{ color: "var(--text-muted)" }}>({comments.length})</span>}
      </h2>

      {/* Comment form */}
      {status === "authenticated" ? (
        <div className="mb-4">
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Write a comment..."
            maxLength={1000}
            rows={3}
            className="w-full px-3 py-2 rounded-lg border text-sm outline-none resize-none"
            style={{ background: "var(--bg-card)", borderColor: "var(--border)", color: "var(--text)" }}
          />
          <div className="flex items-center justify-between mt-2">
            <span className="text-xs" style={{ color: "var(--text-muted)" }}>{body.length}/1000</span>
            <button
              onClick={() => handleSubmit()}
              disabled={submitting || !body.trim()}
              className="px-4 py-1.5 rounded-lg text-sm font-medium cursor-pointer disabled:opacity-50"
              style={{ background: "var(--accent)", color: "#fff", border: "none" }}
            >
              {submitting ? "Posting..." : "Comment"}
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => signIn("github")}
          className="mb-4 px-4 py-2 rounded-lg text-sm font-medium cursor-pointer"
          style={{ background: "var(--accent)", color: "#fff", border: "none" }}
        >
          Sign in to comment
        </button>
      )}

      {error && (
        <div className="mb-3 text-sm" style={{ color: "var(--red)" }}>{error}</div>
      )}

      {/* Comments list */}
      {topLevel.length === 0 ? (
        <p className="text-sm" style={{ color: "var(--text-muted)" }}>No comments yet. Be the first!</p>
      ) : (
        <div className="space-y-3">
          {topLevel.map((comment) => (
            <div key={comment.id}>
              <CommentCard
                comment={comment}
                currentUserId={(ext?.userId as number) || 0}
                onDelete={handleDelete}
                onReply={() => setReplyTo(replyTo === comment.id ? null : comment.id)}
              />
              {/* Replies */}
              {getReplies(comment.id).map((reply) => (
                <div key={reply.id} className="ml-8 mt-2">
                  <CommentCard
                    comment={reply}
                    currentUserId={(ext?.userId as number) || 0}
                    onDelete={handleDelete}
                  />
                </div>
              ))}
              {/* Reply form */}
              {replyTo === comment.id && status === "authenticated" && (
                <div className="ml-8 mt-2">
                  <textarea
                    value={replyBody}
                    onChange={(e) => setReplyBody(e.target.value)}
                    placeholder="Write a reply..."
                    maxLength={1000}
                    rows={2}
                    className="w-full px-3 py-2 rounded-lg border text-sm outline-none resize-none"
                    style={{ background: "var(--bg-card)", borderColor: "var(--border)", color: "var(--text)" }}
                  />
                  <div className="flex gap-2 mt-1">
                    <button
                      onClick={() => handleSubmit(comment.id)}
                      disabled={submitting || !replyBody.trim()}
                      className="px-3 py-1 rounded-lg text-xs font-medium cursor-pointer disabled:opacity-50"
                      style={{ background: "var(--accent)", color: "#fff", border: "none" }}
                    >
                      Reply
                    </button>
                    <button
                      onClick={() => { setReplyTo(null); setReplyBody(""); }}
                      className="px-3 py-1 rounded-lg text-xs cursor-pointer"
                      style={{ background: "transparent", color: "var(--text-muted)", border: "1px solid var(--border)" }}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function CommentCard({
  comment,
  currentUserId,
  onDelete,
  onReply,
}: {
  comment: Comment;
  currentUserId: number;
  onDelete: (id: number) => void;
  onReply?: () => void;
}) {
  return (
    <div
      className="rounded-lg border p-3"
      style={{ background: "var(--bg-card)", borderColor: "var(--border)" }}
    >
      <div className="flex items-center gap-2 mb-1">
        {comment.user_avatar && (
          <Image src={comment.user_avatar} alt="" width={20} height={20} className="rounded-full" />
        )}
        <span className="text-sm font-medium">{comment.username}</span>
        <span className="text-xs" style={{ color: "var(--text-muted)" }}>{getTimeAgo(comment.created_at)}</span>
      </div>
      <p className="text-sm whitespace-pre-wrap" style={{ color: "var(--text)" }}>{comment.body}</p>
      <div className="flex gap-3 mt-2">
        {onReply && (
          <button
            onClick={onReply}
            className="text-xs cursor-pointer"
            style={{ background: "none", border: "none", color: "var(--text-muted)" }}
          >
            Reply
          </button>
        )}
        {comment.user_id === currentUserId && (
          <button
            onClick={() => onDelete(comment.id)}
            className="text-xs cursor-pointer"
            style={{ background: "none", border: "none", color: "var(--red)" }}
          >
            Delete
          </button>
        )}
      </div>
    </div>
  );
}
