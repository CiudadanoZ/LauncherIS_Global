// Conexión con el backend de UNIVERSO (Firebase).
// Reutiliza el mismo proyecto y modelo de datos que la red social web:
//   users / messages (chat directo) / notifications / handles.
// La config de Firebase es pública (la seguridad va por reglas de Firestore).
import { initializeApp } from 'firebase/app';
import {
  getAuth, signInWithEmailAndPassword, onAuthStateChanged, signOut,
  setPersistence, browserLocalPersistence,
} from 'firebase/auth';
import {
  getFirestore, collection, query, where, orderBy, onSnapshot,
  addDoc, getDocs, doc, getDoc, updateDoc,
} from 'firebase/firestore';

const firebaseConfig = {
  apiKey: 'AIzaSyCUfioQuLPJpByrDn8cJIVpyIk80M2FfXI',
  authDomain: 'universo-260ce.firebaseapp.com',
  projectId: 'universo-260ce',
  storageBucket: 'universo-260ce.firebasestorage.app',
  messagingSenderId: '123164621968',
  appId: '1:123164621968:web:72ffa4e9dbe4d70e19ec15',
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

// Mantener la sesión iniciada entre reinicios del launcher.
setPersistence(auth, browserLocalPersistence).catch(() => {});

const chatKey = (h1, h2) => [h1, h2].sort().join('_');

export const Universo = {
  onAuth(callback) {
    return onAuthStateChanged(auth, callback);
  },

  async login(email, password) {
    return signInWithEmailAndPassword(auth, email, password);
  },

  async logout() {
    return signOut(auth);
  },

  async getMyProfile() {
    const user = auth.currentUser;
    if (!user) return null;
    const snap = await getDoc(doc(db, 'users', user.uid));
    return snap.exists() ? { uid: user.uid, ...snap.data() } : null;
  },

  // Aliados = usuarios a los que sigo (following).
  async getAllies(uid) {
    const snap = await getDoc(doc(db, 'users', uid));
    if (!snap.exists()) return [];
    const following = snap.data().following || [];
    const out = [];
    for (const fUid of following) {
      const u = await getDoc(doc(db, 'users', fUid));
      if (u.exists()) out.push({ uid: u.id, ...u.data() });
    }
    return out;
  },

  async searchUsers(term) {
    const t = String(term || '').trim().toLowerCase();
    if (!t) return [];
    const snap = await getDocs(collection(db, 'users'));
    return snap.docs
      .map(d => ({ uid: d.id, ...d.data() }))
      .filter(u => u.uid !== auth.currentUser?.uid)
      .filter(u => (u.handle || '').toLowerCase().includes(t) || (u.name || '').toLowerCase().includes(t))
      .slice(0, 20);
  },

  // Chats recientes: último mensaje con cada interlocutor.
  onRecentChats(myHandle, callback) {
    const user = auth.currentUser;
    if (!user) return () => {};
    const q = query(collection(db, 'messages'), where('participants', 'array-contains', user.uid));
    return onSnapshot(q, async (snapshot) => {
      const map = new Map();
      snapshot.docs.forEach(d => {
        const data = d.data();
        const other = data.sender === myHandle ? data.recipient : data.sender;
        const prev = map.get(other);
        if (!prev || data.timestamp > prev.timestamp) {
          map.set(other, { handle: other, text: data.text, timestamp: data.timestamp });
        }
      });
      const chats = Array.from(map.values()).sort((a, b) => b.timestamp - a.timestamp);
      // Rellenar nombre/avatar del interlocutor
      for (const c of chats) {
        const us = await getDocs(query(collection(db, 'users'), where('handle', '==', c.handle)));
        if (!us.empty) { c.name = us.docs[0].data().name; c.avatar = us.docs[0].data().avatar; }
      }
      callback(chats);
    }, (err) => console.error('onRecentChats', err));
  },

  // Mensajes de una conversación concreta (en tiempo real).
  onMessages(myHandle, targetHandle, callback) {
    const user = auth.currentUser;
    if (!user) return () => {};
    const key = chatKey(myHandle, targetHandle);
    const q = query(collection(db, 'messages'), where('participants', 'array-contains', user.uid));
    return onSnapshot(q, (snapshot) => {
      const msgs = snapshot.docs
        .map(d => ({ id: d.id, ...d.data() }))
        .filter(m => m.chatKey === key)
        .sort((a, b) => a.timestamp - b.timestamp);
      callback(msgs);
    }, (err) => console.error('onMessages', err));
  },

  // Notificaciones (proclamas) dirigidas a mí.
  onNotifications(callback) {
    const user = auth.currentUser;
    if (!user) return () => {};
    const q = query(collection(db, 'notifications'), where('recipientUid', '==', user.uid));
    return onSnapshot(q, (snapshot) => {
      const notifs = snapshot.docs
        .map(d => ({ id: d.id, ...d.data() }))
        .sort((a, b) => b.timestamp - a.timestamp);
      callback(notifs);
    }, (err) => console.error('onNotifications', err));
  },

  async markNotificationsRead() {
    const user = auth.currentUser;
    if (!user) return;
    const snap = await getDocs(query(
      collection(db, 'notifications'),
      where('recipientUid', '==', user.uid),
      where('read', '==', false),
    ));
    await Promise.all(snap.docs.map(d => updateDoc(doc(db, 'notifications', d.id), { read: true })));
  },

  async sendMessage(myHandle, targetHandle, text) {
    const user = auth.currentUser;
    if (!user) throw new Error('No hay sesión');
    const us = await getDocs(query(collection(db, 'users'), where('handle', '==', targetHandle)));
    if (us.empty) throw new Error('No existe ese usuario.');
    const recipientUid = us.docs[0].id;
    await addDoc(collection(db, 'messages'), {
      chatKey: chatKey(myHandle, targetHandle),
      participants: [user.uid, recipientUid],
      senderUid: user.uid,
      recipientUid,
      sender: myHandle,
      recipient: targetHandle,
      text,
      timestamp: Date.now(),
      attachment: null,
    });
  },
};
