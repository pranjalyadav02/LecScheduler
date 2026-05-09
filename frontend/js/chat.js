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
    // expose current chat id for delete operations
    window.currentChatId = chatId;
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
 * Render messages in the UI with WhatsApp-style date grouping
 */
function renderMessages(messages, containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    if (messages.length === 0) {
        container.innerHTML = '<div class="empty-chat">No messages yet. Start the conversation!</div>';
        return;
    }

    container.innerHTML = '';
    let lastDateStr = '';

    messages.forEach(msg => {
        const date = msg.timestamp ? msg.timestamp.toDate() : new Date();
        const dateStr = date.toLocaleDateString();
        
        // Date separator logic
        if (dateStr !== lastDateStr) {
            const separator = document.createElement('div');
            separator.className = 'chat-date-separator';
            
            const today = new Date().toLocaleDateString();
            const yesterday = new Date(Date.now() - 86400000).toLocaleDateString();
            
            let displayDate = dateStr;
            if (dateStr === today) displayDate = 'Today';
            else if (dateStr === yesterday) displayDate = 'Yesterday';
            else displayDate = date.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
            
            separator.innerHTML = `<span>${displayDate}</span>`;
            container.appendChild(separator);
            lastDateStr = dateStr;
        }

        const isMe = msg.senderId === (window.auth.currentUser ? window.auth.currentUser.uid : null);
        const msgDiv = document.createElement('div');
        msgDiv.className = `message ${isMe ? 'sent' : 'received'}`;
        
        const timestamp = msg.timestamp ? date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--';
        
        msgDiv.innerHTML = `
            ${!isMe ? `<div class="msg-sender">${msg.senderName}</div>` : ''}
            <div class="msg-text">${escapeHtml(msg.text)}</div>
            <div class="msg-time">${timestamp}</div>
            ${isMe ? `<button class="msg-delete" onclick="deleteChatMessage('${msg.id}')" title="Delete message">🗑️</button>` : ''}
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

/**
 * Delete a chat message if the current user is the sender.
 */
async function deleteChatMessage(messageId) {
    try {
        if (!messageId) return;
        const user = window.auth.currentUser;
        if (!user) return alert('You must be logged in to delete messages.');

        const chatId = window.currentChatId;
        if (!chatId) return;

        const docRef = window.db.collection('chats').doc(chatId).collection('messages').doc(messageId);
        const snap = await docRef.get();
        if (!snap.exists) return alert('Message not found.');
        const data = snap.data();
        if (data.senderId !== user.uid) return alert('You can only delete your own messages.');

        if (!confirm('Delete this message? This action cannot be undone.')) return;

        await docRef.delete();
        if (typeof showStatus === 'function') showStatus('chatStatus', '✓ Message deleted', 'success');
    } catch (err) {
        console.error('Failed to delete message:', err);
        if (typeof showStatus === 'function') showStatus('chatStatus', `Error: ${err.message}`, 'error');
    }
}
