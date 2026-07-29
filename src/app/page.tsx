"use client";

import React, { useState, useEffect, useRef } from "react";
import { supabase, isSupabaseConfigured } from "@/lib/supabaseClient";

// 1. Premium SVG Logo for Xabarnoma
const XabarnomaLogo = () => (
  <svg width="36" height="36" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="24" height="24" rx="6" fill="#161f30" stroke="#2d3d5a" strokeWidth="1.5" />
    <path d="M7 9L12 13L17 9" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M5 17V8C5 6.89543 5.89543 6 7 6H17C18.1046 6 19 6.89543 19 8V14C19 15.1046 18.1046 16 17 16H8.82843C8.29799 16 7.78929 16.2107 7.41421 16.5858L5.70711 18.2929C5.39301 18.607 4.875 18.3849 4.875 17.9393V17Z" stroke="#f8fafc" strokeWidth="2" strokeLinejoin="round" />
    <circle cx="18" cy="6" r="2.5" fill="#10b981" stroke="#161f30" strokeWidth="1.5" />
  </svg>
);

const ReplyIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 10h10a8 8 0 0 1 8 8v2M3 10l6 6M3 10l6-6"/>
  </svg>
);

const PaperclipIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" />
  </svg>
);

const CloseIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

const EditIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 20h9" />
    <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
  </svg>
);

const CopyIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
  </svg>
);

const CheckIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

const TrashIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6" />
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    <line x1="10" y1="11" x2="10" y2="17" />
    <line x1="14" y1="11" x2="14" y2="17" />
  </svg>
);

const BanIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <line x1="4.93" y1="4.93" x2="19.07" y2="19.07" />
  </svg>
);

interface Message {
  id: string;
  sender_name: string;
  avatar: string;
  text: string;
  created_at: string;
  reply_to_id?: string;
  reply_to_text?: string;
  reply_to_sender?: string;
  file_url?: string;
  file_type?: string;
  file_name?: string;
  is_edited?: boolean;
}

const avatarOptions = ["👨‍💻", "👩‍💻", "🦊", "🐼", "🤖", "👻", "🐱", "🦖"];

const renderTextWithLinks = (text: string) => {
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  const parts = text.split(urlRegex);
  return parts.map((part, index) => {
    if (part.match(urlRegex)) {
      return (
        <a key={index} href={part} target="_blank" rel="noopener noreferrer" className="message-link">
          {part}
        </a>
      );
    }
    return part;
  });
};

const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
  });
};

const getReplyToTextValue = (m: Message) => {
  if (m.text) return m.text;
  if (m.file_type?.startsWith("image/")) return "🖼️ Rasm";
  if (m.file_name) return `📎 ${m.file_name}`;
  if (m.file_url) return "📎 Fayl";
  return null;
};

const isAdminUser = (name: string) => {
  if (!name) return false;
  const normalized = name.trim().toLowerCase();
  return normalized === "hayrulloh" || normalized === "xayrulloh abdusamadov";
};

export default function Home() {
  const [isMounted, setIsMounted] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [username, setUsername] = useState("");
  const [avatar, setAvatar] = useState("");
  const [tempName, setTempName] = useState("");
  const [tempAvatar, setTempAvatar] = useState(avatarOptions[0]);
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
  
  const [blockedUsers, setBlockedUsers] = useState<string[]>([]);
  const [isSelfBlocked, setIsSelfBlocked] = useState(false);
  
  const [replyingTo, setReplyingTo] = useState<Message | null>(null);
  const [editingMessage, setEditingMessage] = useState<Message | null>(null);
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setIsMounted(true);
    const storedName = sessionStorage.getItem("xabarnoma_username");
    const storedAvatar = sessionStorage.getItem("xabarnoma_avatar");
    if (storedName && storedAvatar) {
      setUsername(storedName);
      setAvatar(storedAvatar);
    }
    
    if (isSupabaseConfigured) {
      // Fetch blocked users list
      const fetchBlockedUsers = async () => {
        const { data } = await supabase.from("blocked_users").select("username");
        if (data) {
          const names = data.map((b: any) => b.username.toLowerCase());
          setBlockedUsers(names);
          if (storedName && names.includes(storedName.trim().toLowerCase())) {
            setIsSelfBlocked(true);
          }
        }
      };
      fetchBlockedUsers();

      // Listen to realtime blocked users
      const channel = supabase
        .channel("blocked-users-changes")
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "blocked_users" },
          (payload) => {
            if (payload.eventType === "INSERT") {
              const newBlocked = (payload.new as any).username;
              setBlockedUsers((prev) => [...prev, newBlocked.toLowerCase()]);
              
              const currentStoredName = sessionStorage.getItem("xabarnoma_username") || username;
              if (currentStoredName && currentStoredName.trim().toLowerCase() === newBlocked.trim().toLowerCase()) {
                setIsSelfBlocked(true);
                alert("Siz admin tomonidan bloklandingiz!");
                sessionStorage.removeItem("xabarnoma_username");
                sessionStorage.removeItem("xabarnoma_avatar");
                setUsername("");
                setAvatar("");
              }
            } else if (payload.eventType === "DELETE") {
              const blockedName = (payload.old as any).username;
              if (blockedName) {
                setBlockedUsers((prev) => prev.filter((name) => name !== blockedName.toLowerCase()));
                const currentStoredName = sessionStorage.getItem("xabarnoma_username") || username;
                if (currentStoredName && currentStoredName.trim().toLowerCase() === blockedName.trim().toLowerCase()) {
                  setIsSelfBlocked(false);
                }
              } else {
                // Re-fetch
                const refetch = async () => {
                  const { data } = await supabase.from("blocked_users").select("username");
                  if (data) {
                    const names = data.map((b: any) => b.username.toLowerCase());
                    setBlockedUsers(names);
                    const currentStoredName = sessionStorage.getItem("xabarnoma_username") || username;
                    if (currentStoredName && !names.includes(currentStoredName.trim().toLowerCase())) {
                      setIsSelfBlocked(false);
                    }
                  }
                };
                refetch();
              }
            }
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }

    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 3500);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!isMounted || !username || !isSupabaseConfigured) return;

    const fetchMessages = async () => {
      const { data, error } = await supabase
        .from("messages")
        .select("*")
        .order("created_at", { ascending: true })
        .limit(100);

      if (error) {
        console.error("Xabarlarni yuklashda xatolik:", error);
      } else if (data) {
        setMessages(data);
      }
    };

    fetchMessages();

    // Listen to ALL events (INSERT, UPDATE, DELETE)
    const channel = supabase
      .channel("schema-db-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "messages" },
        (payload) => {
          if (payload.eventType === "INSERT") {
            const newMsg = payload.new as Message;
            setMessages((prev) => {
              if (prev.some((m) => m.id === newMsg.id)) return prev;
              return [...prev, newMsg];
            });
          } else if (payload.eventType === "UPDATE") {
            const updatedMsg = payload.new as Message;
            setMessages((prev) =>
              prev.map((msg) => (msg.id === updatedMsg.id ? updatedMsg : msg))
            );
          } else if (payload.eventType === "DELETE") {
            setMessages((prev) => prev.filter((msg) => msg.id !== payload.old.id));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [isMounted, username]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleJoinChat = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = tempName.trim();
    if (trimmedName && tempAvatar) {
      if (blockedUsers.includes(trimmedName.toLowerCase())) {
        alert("Siz ushbu chatdan bloklangansiz!");
        setIsSelfBlocked(true);
        return;
      }
      setUsername(trimmedName);
      setAvatar(tempAvatar);
      sessionStorage.setItem("xabarnoma_username", trimmedName);
      sessionStorage.setItem("xabarnoma_avatar", tempAvatar);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      if (!file.type.startsWith("image/")) {
        alert("Faqat rasmlarni yuklash mumkin!");
        if (fileInputRef.current) fileInputRef.current.value = "";
        return;
      }
      setSelectedFile(file);
    }
  };

  const copyToClipboard = (msgId: string, text: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedMessageId(msgId);
    setTimeout(() => {
      setCopiedMessageId(null);
    }, 2000);
  };

  const handleEditClick = (msg: Message) => {
    setEditingMessage(msg);
    setReplyingTo(null); // Clear reply if editing
    setNewMessage(msg.text);
  };

  const handleDeleteMessage = async (msgId: string) => {
    if (!confirm("Haqiqatan ham ushbu xabarni o'chirib tashlamoqchimisiz?")) return;
    
    const { error } = await supabase
      .from("messages")
      .delete()
      .eq("id", msgId);
      
    if (error) {
      console.error("Xabarni o'chirishda xatolik:", error);
      alert("Xabarni o'chirishda xatolik yuz berdi: " + error.message);
    }
  };

  const scrollToMessage = (msgId: string) => {
    const element = document.getElementById(`msg-${msgId}`);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "center" });
      element.classList.add("highlighted-message");
      setTimeout(() => {
        element.classList.remove("highlighted-message");
      }, 2000);
    }
  };

  const handleClearChat = async () => {
    if (!confirm("Haqiqatan ham butun chatni tozalamoqchimisiz? Barcha xabarlar o'chiriladi!")) return;
    
    const { error } = await supabase
      .from("messages")
      .delete()
      .neq("id", "00000000-0000-0000-0000-000000000000");
      
    if (error) {
      console.error("Chatni tozalashda xatolik:", error);
      alert("Chatni tozalashda xatolik yuz berdi: " + error.message);
    } else {
      setMessages([]);
    }
  };

  const handleBlockUser = async (userToBlock: string) => {
    if (!confirm(`Haqiqatan ham "${userToBlock}"ni bloklab, chatdan chiqarib yubormoqchimisiz?`)) return;
    
    const { error } = await supabase
      .from("blocked_users")
      .insert([{ username: userToBlock }]);
      
    if (error) {
      console.error("Bloklashda xatolik:", error);
      alert("Bloklashda xatolik yuz berdi: " + error.message);
    } else {
      await supabase
        .from("messages")
        .delete()
        .eq("sender_name", userToBlock);
      alert(`"${userToBlock}" bloklandi va uning xabarlari tozalandi.`);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((!newMessage.trim() && !selectedFile) || isSending || !isSupabaseConfigured) return;

    setIsSending(true);
    const messageText = newMessage;
    
    // Clear states early for perceived speed
    setNewMessage("");
    
    // Check if we are updating an existing message
    if (editingMessage) {
      const { error } = await supabase
        .from("messages")
        .update({ text: messageText, is_edited: true })
        .eq("id", editingMessage.id);
        
      if (error) {
        console.error("Xabarni tahrirlashda xatolik:", error);
        setNewMessage(messageText); // restore
      } else {
        setEditingMessage(null);
      }
      setIsSending(false);
      return;
    }

    // Otherwise, inserting new message
    let fileUrl = "";
    let fileType = "";
    let fileName = "";

    if (selectedFile) {
      try {
        fileUrl = await fileToBase64(selectedFile);
        fileType = selectedFile.type;
        fileName = selectedFile.name;
      } catch (err) {
        console.error("Faylni Base64 formatiga o'tkazishda xatolik:", err);
        alert("Rasmni o'qishda xatolik yuz berdi.");
        setIsSending(false);
        setNewMessage(messageText);
        return;
      }
    }

    const { error } = await supabase.from("messages").insert([
      {
        sender_name: username,
        avatar: avatar,
        text: messageText,
        reply_to_id: replyingTo?.id || null,
        reply_to_text: replyingTo ? getReplyToTextValue(replyingTo) : null,
        reply_to_sender: replyingTo?.sender_name || null,
        file_url: fileUrl || null,
        file_type: fileType || null,
        file_name: fileName || null,
      },
    ]);

    if (error) {
      console.error("Xabar yuborishda xatolik:", error);
      alert("Xatolik yuz berdi (bazaga yozishda): " + error.message);
      setNewMessage(messageText);
    } else {
      setReplyingTo(null);
      setSelectedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
    
    setIsSending(false);
  };

  const formatTime = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: false });
    } catch {
      return "";
    }
  };

  if (!isMounted || isLoading) {
    return (
      <div className="loading-screen">
        <div className="loading-container">
          <div className="loading-logo-wrapper">
            <XabarnomaLogo />
            <div className="logo-glow-ring"></div>
          </div>
          <h1 className="loading-title">
            Xabarnoma<span className="logo-accent">.</span>
          </h1>
          <p className="loading-subtitle">Xavfsiz va tezkor muloqot tizimi</p>
          <div className="premium-spinner-bar">
            <div className="spinner-progress"></div>
          </div>
        </div>
      </div>
    );
  }

  if (isSelfBlocked) {
    return (
      <div className="modal-overlay">
        <div className="modal-content glass-effect" style={{ borderColor: "#ef4444" }}>
          <div className="modal-logo" style={{ color: "#ef4444" }}>
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <line x1="4.93" y1="4.93" x2="19.07" y2="19.07" />
            </svg>
          </div>
          <h1 className="modal-title" style={{ color: "#ef4444" }}>
            Siz bloklangansiz!
          </h1>
          <p className="modal-subtitle">
            Admin tomonidan chatdan chetlashtirildingiz. Savollar bo'lsa, admin bilan bog'laning.
          </p>
          <a href="https://t.me/HayrullohAdusamadov" target="_blank" rel="noreferrer" className="modal-button" style={{ backgroundColor: "#ef4444", textAlign: "center", textDecoration: "none" }}>
            Admin bilan bog'lanish
          </a>
        </div>
      </div>
    );
  }

  if (!username) {
    return (
      <div className="modal-overlay">
        <div className="modal-content glass-effect">
          <div className="modal-logo">
            <XabarnomaLogo />
          </div>
          <h1 className="modal-title">
            Xabarnoma<span className="logo-accent">.</span>
          </h1>
          <p className="modal-subtitle">
            Haqiqiy vaqtdagi chat tizimiga xush kelibsiz. Davom etish uchun ismingizni kiriting.
          </p>

          <form onSubmit={handleJoinChat} className="modal-form">
            <div className="modal-input-group">
              <label className="modal-label">O'zingizga logotip (avatar) tanlang</label>
              <div className="avatar-selector">
                {avatarOptions.map((opt) => (
                  <button
                    key={opt}
                    type="button"
                    className={`avatar-option ${tempAvatar === opt ? "selected" : ""}`}
                    onClick={() => setTempAvatar(opt)}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>
            
            <div className="modal-input-group">
              <label htmlFor="nickname" className="modal-label">
                Sizning ismingiz
              </label>
              <input
                id="nickname"
                type="text"
                placeholder="Masalan: Jamshid"
                value={tempName}
                onChange={(e) => setTempName(e.target.value)}
                className="modal-input"
                autoComplete="off"
                required
                autoFocus
              />
            </div>
            <button type="submit" className="modal-button">
              Chatga qo&apos;shilish
            </button>
          </form>
          
          <div className="modal-footer-attribution">
            <p>Yaratuvchi: <strong>Xayrulloh Abdusamadov</strong></p>
            <p>Telegram kanal: <a href="https://t.me/HayrullohAdusamadov" target="_blank" rel="noreferrer">@HayrullohAdusamadov</a></p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="app-container">
      <header className="app-header glass-effect">
        <div className="logo-container">
          <XabarnomaLogo />
          <h1 className="logo-text">
            Xabarnoma<span className="logo-accent">.</span>
          </h1>
        </div>
        <div className="header-actions-group" style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          {isAdminUser(username) && (
            <button className="clear-chat-btn" onClick={handleClearChat} title="Chatni tozalash">
              🧹 Tozalash
            </button>
          )}
          <div className="user-status">
            <div className="user-avatar-small">{avatar}</div>
            <span>{username}</span>
            {isAdminUser(username) && <span className="admin-badge" style={{ marginLeft: "8px" }}>👑 ADMIN</span>}
          </div>
        </div>
      </header>

      <div className="chat-window glass-effect-subtle">
        {!isSupabaseConfigured && (
          <div style={{ padding: "20px" }}>
            <div className="config-banner">
              <strong>Diqqat!</strong> Supabase ulanishi sozlanmagan.
            </div>
          </div>
        )}

        <div className="messages-container">
          {messages.length === 0 ? (
            <div className="messages-empty-state">
              <XabarnomaLogo />
              <h3>Hozircha xabarlar yo&apos;q</h3>
              <p>Birinchi bo&apos;lib xabar yuboring!</p>
            </div>
          ) : (
            messages.map((msg) => {
              const isOutgoing = msg.sender_name === username;
              const isMsgAdmin = isAdminUser(msg.sender_name);
              const repliedMessage = msg.reply_to_id ? messages.find((m) => m.id === msg.reply_to_id) : null;
              return (
                <div key={msg.id} id={`msg-${msg.id}`} className={`message-wrapper ${isOutgoing ? "outgoing" : "incoming"} ${isMsgAdmin ? "admin-message" : ""}`}>
                  {!isOutgoing && (
                    <div className="message-sender">
                      <span className="msg-avatar">{msg.avatar || "👤"}</span>
                      <span>{msg.sender_name}</span>
                      {isMsgAdmin && <span className="admin-badge">👑 ADMIN</span>}
                    </div>
                  )}
                  
                  <div className="message-bubble-container">
                    <div className="message-bubble">
                      
                      {/* Render Quoted Reply */}
                      {(msg.reply_to_id || msg.reply_to_text) && (
                        <div 
                          className="quoted-reply" 
                          onClick={() => msg.reply_to_id && scrollToMessage(msg.reply_to_id)}
                          style={{ cursor: msg.reply_to_id ? "pointer" : "default" }}
                        >
                          <span className="quoted-sender">{msg.reply_to_sender}</span>
                          <div className="quoted-content-flex">
                            {repliedMessage?.file_url && repliedMessage.file_type?.startsWith("image/") && (
                              <img src={repliedMessage.file_url} alt="replied preview" className="quoted-reply-image" />
                            )}
                            <span className="quoted-text">
                              {repliedMessage ? getReplyToTextValue(repliedMessage) : msg.reply_to_text}
                            </span>
                          </div>
                        </div>
                      )}

                      {/* Render Attachments */}
                      {msg.file_url && (
                        <div className="message-attachment">
                          {msg.file_type?.startsWith("image/") ? (
                            <img src={msg.file_url} alt="Birma rasm" className="attachment-image" />
                          ) : msg.file_type?.startsWith("audio/") ? (
                            <audio controls src={msg.file_url} className="attachment-audio" />
                          ) : (
                            <a href={msg.file_url} target="_blank" rel="noreferrer" className="attachment-file-btn">
                              📎 {msg.file_name}
                            </a>
                          )}
                        </div>
                      )}

                      {msg.text && <p className="message-text-content">{renderTextWithLinks(msg.text)}</p>}
                    </div>
                    
                    <div className="message-meta-row">
                      <span className="message-time">
                        {formatTime(msg.created_at)}
                        {msg.is_edited && <span className="edited-tag"> (tahrirlangan)</span>}
                      </span>
                      
                      <div className="action-buttons">
                        {msg.text && (
                          <button className="action-btn" onClick={() => copyToClipboard(msg.id, msg.text)} title="Nusxalash">
                            {copiedMessageId === msg.id ? <CheckIcon /> : <CopyIcon />}
                          </button>
                        )}
                        <button className="action-btn" onClick={() => setReplyingTo(msg)} title="Javob berish">
                          <ReplyIcon />
                        </button>
                        {isOutgoing && (
                          <button className="action-btn" onClick={() => handleEditClick(msg)} title="Tahrirlash">
                            <EditIcon />
                          </button>
                        )}
                        {(isOutgoing || isAdminUser(username)) && (
                          <button className="action-btn delete-btn" onClick={() => handleDeleteMessage(msg.id)} title="O'chirish">
                            <TrashIcon />
                          </button>
                        )}
                        {isAdminUser(username) && !isOutgoing && (
                          <button className="action-btn delete-btn" onClick={() => handleBlockUser(msg.sender_name)} title="Bloklash">
                            <BanIcon />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area with Contexts */}
        <div className="input-area-container">
          
          {editingMessage && (
            <div className="replying-context editing-context">
              <div className="replying-info">
                <EditIcon />
                <span className="replying-name">Xabarni tahrirlash</span>
              </div>
              <button className="close-reply-btn" onClick={() => { setEditingMessage(null); setNewMessage(""); }} type="button">
                <CloseIcon />
              </button>
            </div>
          )}

          {replyingTo && !editingMessage && (
            <div className="replying-context">
              <div className="replying-info">
                <ReplyIcon />
                <div className="replying-content-wrapper">
                  <span className="replying-name">Javob qaytarilmoqda: {replyingTo.sender_name}</span>
                  <div className="replying-content-flex">
                    {replyingTo.file_url && replyingTo.file_type?.startsWith("image/") && (
                      <img src={replyingTo.file_url} alt="reply preview" className="replying-image-preview" />
                    )}
                    <span className="replying-text">{getReplyToTextValue(replyingTo) || ""}</span>
                  </div>
                </div>
              </div>
              <button className="close-reply-btn" onClick={() => setReplyingTo(null)} type="button">
                <CloseIcon />
              </button>
            </div>
          )}

          {selectedFile && !editingMessage && (
            <div className="file-preview-context">
              <PaperclipIcon />
              <span className="file-preview-name">{selectedFile.name}</span>
              <button className="close-reply-btn" onClick={() => { setSelectedFile(null); if(fileInputRef.current) fileInputRef.current.value = ""; }} type="button">
                <CloseIcon />
              </button>
            </div>
          )}

          <form onSubmit={handleSendMessage} className="input-bar">
            {!editingMessage && (
              <>
                <button type="button" className="attach-btn" onClick={() => fileInputRef.current?.click()} disabled={isSending}>
                  <PaperclipIcon />
                </button>
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleFileChange} 
                  accept="image/*"
                  style={{ display: "none" }} 
                />
              </>
            )}

            <input
              type="text"
              placeholder={isSupabaseConfigured ? (editingMessage ? "Tahrirlash..." : "Xabaringizni yozing...") : "Ulanish kutilmoqda..."}
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              disabled={!isSupabaseConfigured || isSending}
              className="chat-input"
              autoFocus={!!editingMessage}
            />
            
            <button
              type="submit"
              disabled={!isSupabaseConfigured || (!newMessage.trim() && !selectedFile) || isSending}
              className="send-button"
            >
              {isSending ? "..." : (editingMessage ? "Saqlash" : "Yuborish")}
            </button>
          </form>
        </div>
      </div>
      <footer className="app-footer">
        <span>Yaratuvchi: <strong>Xayrulloh Abdusamadov</strong></span>
        <span className="footer-separator">•</span>
        <span>Telegram kanal: <a href="https://t.me/HayrullohAdusamadov" target="_blank" rel="noreferrer">@HayrullohAdusamadov</a></span>
      </footer>
    </div>
  );
}
