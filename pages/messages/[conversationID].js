import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/router";
import Image from "next/image";
import styles from "../../styles/Chatpage.module.css"
import { useSession } from "next-auth/react";

export default function ChatPage() {
 const [messages, setMessages] = useState([]);
const [text, setText] = useState("");
const [receiverId, setReceiverId] = useState(null);
const messagesEndRef = useRef(null);
const { data: session } = useSession();
const currentUserId = session?.user?.id;
const router = useRouter();
const { conversationID } = router.query;


  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };
  

useEffect(() => {
  if (conversationID && currentUserId) {
    fetch(`/api/conversations/${conversationID}`)
      .then((res) => res.json())
      .then((conversation) => {
        const otherUser = conversation.participants.find(
          (id) => id !== currentUserId
        );
        setReceiverId(otherUser);
      });
  }
}, [conversationID, currentUserId]);

useEffect(() => {
  if (conversationID) {
    fetch(`/api/messages/${conversationID}`)
      .then((res) => res.json())
      .then((data) => setMessages(data));
  }
}, [conversationID]);


  useEffect(() => {
    scrollToBottom();
  }, [messages]);
const sendMessage = async () => {
  if (!text.trim() || !currentUserId || !conversationID || !receiverId) return;

  const newMessage = {
    conversationId: currentUserId,
    senderId: conversationID,
    receiverId,
    content: text.trim(),
    timestamp: new Date().toISOString(),
  };

  setText(""); 

  try {
    const res = await fetch("/api/messages/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newMessage),
    });

    if (!res.ok) throw new Error("Failed to send");

    const savedMessage = await res.json(); 
    setMessages((prev) => [...prev, savedMessage]); 
  } catch (error) {
    console.error("Sending message failed:", error);
    
  }
};



  return (
    <div className={styles.chatContainer}>
      <div className={styles.topBar}>
        <button onClick={() => router.back()} className={styles.backButton}>←</button>
        <Image
          src="https://images.unsplash.com/photo-1503023345310-bd7c1de61c7d"
          width={40}
          height={40}
          className={styles.avatar}
          alt="Avatar"
        />
        <h2 className={styles.chatHeading}>Chat with User</h2>
      </div>

      <div className={styles.messages}>
        {messages.length === 0 ? (
          <p className={styles.noMessages}>No messages yet.</p>
        ) : (
          messages.map((msg, i) => (
            <div
              key={i}
              className={`${styles.messageRow} ${
                msg.senderId === currentUserId ? styles.sent : styles.received
              }`}
            >
              {msg.senderId !== currentUserId && (
                <Image
                  src="https://images.unsplash.com/photo-1544005313-94ddf0286df2"
                  width={32}
                  height={32}
                  className={styles.smallAvatar}
                  alt="User"
                />
              )}
              <div className={styles.messageBubble}>{msg.content}
                <div className={styles.timestamp}>
                  {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className={styles.inputBar}>
        <input
          type="text"
          className={styles.textInput}
          placeholder="Type your message..."
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e)=>{
            if(e.key==="Enter"){
            
              sendMessage();
            }
          }}
        />
        <button onClick={sendMessage} className={styles.sendButton}>
          Send
        </button>
      </div>
    </div>
  );
}
