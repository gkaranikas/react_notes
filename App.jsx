import React from "react";
import Sidebar from "./components/Sidebar";
import Editor from "./components/Editor";
import Split from "react-split";
import { nanoid } from "nanoid";
import {
  addDoc,
  deleteDoc,
  doc,
  onSnapshot,
  setDoc,
  updateDoc,
} from "firebase/firestore";
import { db, notesCollection } from "./firebase.js";
export default function App() {
  const [notes, setNotes] = React.useState([]);

  const [currentNoteId, setCurrentNoteId] = React.useState("");

  const [tempNoteText, setTempNoteText] = React.useState("");

  const currentNote =
    notes.find((note) => note.id === currentNoteId) || notes[0];

  const sortedNotes = notes.slice().sort((a, b) => b.updatedAt - a.updatedAt);

  React.useEffect(() => {
    const unsub = onSnapshot(notesCollection, (snapshot) => {
      const notesArr = snapshot.docs.map((item) => ({
        ...item.data(),
        id: item.id,
      }));
      setNotes(notesArr);
    });
    return unsub;
  }, []);

  React.useEffect(() => {
    if (!currentNoteId) {
      setCurrentNoteId(notes[0]?.id);
    }
  }, [notes]);

  React.useEffect(() => {
    setTempNoteText(currentNote?.body || "");
  }, [currentNote]);

  // TODO: if user edits note and then switches notes in the sidebar within 500ms, the edit is lost.  Maybe fix this.
  React.useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (tempNoteText !== currentNote.body) updateNote(tempNoteText);
    }, 500);
    return () => clearTimeout(timeoutId);
  }, [tempNoteText]);

  async function createNewNote() {
    const now = Date.now();
    const newNote = {
      body: "# Type your markdown note's title here",
      createdAt: now,
      updatedAt: now,
    };
    const docRef = await addDoc(notesCollection, newNote);
    setCurrentNoteId(docRef.id);
  }

  async function updateNote(text) {
    await updateDoc(
      doc(notesCollection, currentNoteId),
      { body: text, updatedAt: Date.now() },
      { merge: true }
    );
  }

  function updateTempNoteText(text) {
    setTempNoteText(text);
  }

  async function deleteNote(event, noteId) {
    await deleteDoc(doc(notesCollection, noteId));
  }

  return (
    <main>
      {notes.length > 0 ? (
        <Split sizes={[30, 70]} direction="horizontal" className="split">
          <Sidebar
            notes={sortedNotes}
            currentNote={currentNote}
            setCurrentNoteId={setCurrentNoteId}
            newNote={createNewNote}
            deleteNote={deleteNote}
          />
          {currentNoteId && notes.length > 0 && (
            <Editor
              tempNoteText={tempNoteText}
              updateTempNoteText={updateTempNoteText}
            />
          )}
        </Split>
      ) : (
        <div className="no-notes">
          <h1>You have no notes</h1>
          <button className="first-note" onClick={createNewNote}>
            Create one now
          </button>
        </div>
      )}
    </main>
  );
}
