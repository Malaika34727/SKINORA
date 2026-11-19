import { collection, doc, serverTimestamp, setDoc } from 'firebase/firestore';
import { db } from '../firebase';

export const submitContactMessage = async ({ name, email, subject, message }) => {
  const messageRef = doc(collection(db, 'messages'));
  await setDoc(messageRef, {
    id: messageRef.id,
    name: name.trim(),
    email: email.trim().toLowerCase(),
    subject: subject.trim(),
    message: message.trim(),
    createdAt: serverTimestamp(),
  });
};
