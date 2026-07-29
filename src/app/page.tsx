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

export default function Home() {
  const [isMounted, setIsMounted] = useState(false);
  const [username, setUsername] = useState("");
  const [avatar, setAvatar] = useState("");
  const [tempName, setTempName] = useState("");
  const [tempAvatar, setTempAvatar] = useState(avatarOptions[0]);
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
  
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

    // Listen to ALL events (INSERT, UPDATE)
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
      setUsername(trimmedName);
      setAvatar(tempAvatar);
      sessionStorage.setItem("xabarnoma_username", trimmedName);
      sessionStorage.setItem("xabarnoma_avatar", tempAvatar);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setSelectedFile(e.target.files[0]);
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
      const uniqueName = `${Date.now()}_${selectedFile.name.replace(/\s+/g, '_')}`;
      const { data, error } = await supabase.storage
        .from("chat_uploads")
        .upload(uniqueName, selectedFile);
        
      if (error) {
        console.error("Fayl yuklashda xatolik:", error);
        alert("Fayl yuklashda xatolik yuz berdi.");
        setIsSending(false);
        setNewMessage(messageText);
        return;
      }

      if (data) {
        const { data: publicUrlData } = supabase.storage
          .from("chat_uploads")
          .getPublicUrl(uniqueName);
        fileUrl = publicUrlData.publicUrl;
        fileType = selectedFile.type;
        fileName = selectedFile.name;
      }
    }

    const { error } = await supabase.from("messages").insert([
      {
        sender_name: username,
        avatar: avatar,
        text: messageText,
        reply_to_id: replyingTo?.id || null,
        reply_to_text: replyingTo?.text || null,
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

  if (!isMounted) return null;

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
        <div className="user-status">
          <div className="user-avatar-small">{avatar}</div>
          <span>{username}</span>
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
              return (
                <div key={msg.id} className={`message-wrapper ${isOutgoing ? "outgoing" : "incoming"}`}>
                  {!isOutgoing && (
                    <div className="message-sender">
                      <span className="msg-avatar">{msg.avatar || "👤"}</span>
                      <span>{msg.sender_name}</span>
                    </div>
                  )}
                  
                  <div className="message-bubble-container">
                    <div className="message-bubble">
                      
                      {/* Render Quoted Reply */}
                      {msg.reply_to_text && (
                        <div className="quoted-reply">
                          <span className="quoted-sender">{msg.reply_to_sender}</span>
                          <span className="quoted-text">{msg.reply_to_text}</span>
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

                      {msg.text && <p className="message-text-content">{msg.text}</p>}
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
                <span className="replying-name">Javob qaytarilmoqda: {replyingTo.sender_name}</span>
                <span className="replying-text">{replyingTo.text || (replyingTo.file_name ? `📎 ${replyingTo.file_name}` : "")}</span>
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
    </div>
  );
}
