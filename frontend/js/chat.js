/**
 * LecScheduler Shared Chat Core
 * Handles real-time messaging for Semesters/Sections
 */

let activeChatListener = null;

/**
 * Initialize chat for a specific semester and section
 */
async function initChat(semesterId, section, containerId) {
    const chatContainer = document.getElementById(containerId);
    if (!chatContainer) return;

    // Clear previous listener if any
    if (activeChatListener) activeChatListener();

    const chatId = `${semesterId}_${section}`;
    console.log(`💬 Joining Chat: ${chatId}`);

    // Listen for real-time updates
    activeChatListener = window.db.collection('chats').doc(chatId)
        .collection('messages')
        .orderBy('timestamp', 'asc')
        .limitToLast(50)
        .onSnapshot(snapshot => {
            const messages = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            renderMessages(messages, containerId);
        }, error => {
            console.error('Chat error:', error);
        });
}

/**
 * Send a message to the group
 */
async function sendMessage(semesterId, section, text, senderId, senderName) {
    if (!text.trim()) return;

    const chatId = `${semesterId}_${section}`;
    await window.db.collection('chats').doc(chatId).collection('messages').add({
        senderId,
        senderName,
        text: text.trim(),
        timestamp: firebase.firestore.FieldValue.serverTimestamp()
    });
}

/**
 * Render messages in the UI
 */
function renderMessages(messages, containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    if (messages.length === 0) {
        container.innerHTML = '<div class="empty-chat">No messages yet. Start the conversation!</div>';
        return;
    }

    container.innerHTML = '';
    messages.forEach(msg => {
        const isMe = msg.senderId === (window.auth.currentUser ? window.auth.currentUser.uid : null);
        const msgDiv = document.createElement('div');
        msgDiv.className = `message ${isMe ? 'sent' : 'received'}`;
        
        const timestamp = msg.timestamp ? new Date(msg.timestamp.toDate()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--';
        
        msgDiv.innerHTML = `
            ${!isMe ? `<div class="msg-sender">${msg.senderName}</div>` : ''}
            <div class="msg-text">${escapeHtml(msg.text)}</div>
            <div class="msg-time">${timestamp}</div>
        `;
        container.appendChild(msgDiv);
    });

    // Auto-scroll to bottom
    container.scrollTop = container.scrollHeight;
}

/**
 * Utility to escape HTML and prevent XSS
 */
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}
