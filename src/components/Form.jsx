import React, { useState, useEffect } from 'react';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { collection, addDoc } from 'firebase/firestore';
import { auth, storage, db } from '../firebase/firebase';
import { onAuthStateChanged } from 'firebase/auth';

export default function Form() {
  const [selectedOption, setSelectedOption] = useState('youtube');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [link, setLink] = useState('');
  const [tag, setTag] = useState('game'); // ✅ Tag state
  const [video, setVideo] = useState(null);
  const [progress, setProgress] = useState(0);
  const [videoURL, setVideoURL] = useState('');
  const [downloadLink, setDownloadLink] = useState('');
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setIsAuthReady(true);
    });
    return () => unsubscribe();
  }, []);

  const handleVideoChange = (e) => {
    if (e.target.files[0]) {
      setVideo(e.target.files[0]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!isAuthReady || !user) {
      alert("Please log in to submit.");
      return;
    }

    if (selectedOption === 'youtube') {
      await addDoc(collection(db, 'videos'), {
        title,
        description,
        url: link,
        type: 'youtube',
        downloadLink,
        tag,         // ✅ Save tag to Firestore
        uid: user.uid,
      });

      resetForm();
      alert('YouTube link saved successfully!');
    } else if (selectedOption === 'upload' && video) {
      const storageRef = ref(storage, `videos/${video.name}`);
      const uploadTask = uploadBytesResumable(storageRef, video);

      uploadTask.on(
        'state_changed',
        (snapshot) => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          setProgress(progress);
        },
        (error) => {
          console.error('Upload failed:', error);
          alert('Upload failed: ' + error.message);
        },
        async () => {
          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
          await addDoc(collection(db, 'videos'), {
            title,
            description,
            url: downloadURL,
            type: 'video',
            downloadLink,
            tag,        // ✅ Save tag to Firestore
            uid: user.uid,
          });

          resetForm();
          setVideoURL(downloadURL);
          alert('Video uploaded successfully!');
        }
      );
    }
  };

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setLink('');
    setDownloadLink('');
    setVideo(null);
    setProgress(0);
    setTag('game'); // reset tag too
  };

  if (!isAuthReady) {
    return <p className="text-center mt-10">🔒 Checking login status...</p>;
  }

  if (!user) {
    return <p className="text-center mt-10 text-red-600">🚫 You must be logged in to access the form.</p>;
  }

  return (
    <form className="max-w-lg mx-auto shadow-lg bg-cyan-200 rounded-3xl p-10 space-y-6" onSubmit={handleSubmit}>
      <h1 className="text-black text-2xl font-bold text-center">Upload Video or Submit YouTube Link</h1>

      <label className="block">
        <span className="block text-lg font-medium">Title</span>
        <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} required className="w-full mt-2 p-2 border rounded-lg" />
      </label>

      <label className="block">
        <span className="block text-lg font-medium">Description</span>
        <textarea value={description} onChange={(e) => setDescription(e.target.value)} required className="w-full mt-2 p-2 border rounded-lg" />
      </label>

      <label className="block">
        <span className="block text-lg font-medium">Download Link</span>
        <textarea value={downloadLink} onChange={(e) => setDownloadLink(e.target.value)} required className="w-full mt-2 p-2 border rounded-lg" />
      </label>

      <label className="block">
        <span className="block text-lg font-medium">Category Tag</span>
        <select value={tag} onChange={(e) => setTag(e.target.value)} className="w-full mt-2 p-2 border rounded-lg">
          <option value="game">Game</option>
          <option value="web">Web</option>
          <option value="software">Software</option>
        </select>
      </label>

      <div className="flex space-x-4">
        <label className="inline-flex items-center">
          <input type="radio" name="uploadType" value="youtube" checked={selectedOption === 'youtube'} onChange={() => setSelectedOption('youtube')} className="form-radio" />
          <span className="ml-2 text-lg">YouTube Link</span>
        </label>
        <label className="inline-flex items-center">
          <input type="radio" name="uploadType" value="upload" checked={selectedOption === 'upload'} onChange={() => setSelectedOption('upload')} className="form-radio" />
          <span className="ml-2 text-lg">Video Upload</span>
        </label>
      </div>

      {selectedOption === 'youtube' && (
        <label className="block">
          <span className="block text-lg font-medium">YouTube Link</span>
          <input type="text" value={link} onChange={(e) => setLink(e.target.value)} required className="w-full mt-2 p-2 border rounded-lg" />
        </label>
      )}

      {selectedOption === 'upload' && (
        <div>
          <label className="block">
            <span className="block text-lg font-medium">Upload Video</span>
            <input type="file" onChange={handleVideoChange} accept="video/*" required className="w-full mt-2 p-2" />
          </label>
          <progress value={progress} max="100" className="w-full mt-2"></progress>
          {videoURL && (
            <div className="mt-4">
              <h3>Uploaded Video Preview:</h3>
              <video src={videoURL} controls width="100%" />
            </div>
          )}
        </div>
      )}

      <button type="submit" className="w-full bg-cyan-500 text-white p-3 rounded-lg hover:bg-cyan-600">
        Submit
      </button>

      <button onClick={() => auth.signOut()}>Logout</button>
    </form>
  );
}
