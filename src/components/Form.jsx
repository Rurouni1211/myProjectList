// components/Form.js
import React, { useState } from 'react';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { collection, addDoc } from 'firebase/firestore';
import { storage, db } from '../firebase/firebase';  // Import Firestore and Storage

export default function Form() {
  const [selectedOption, setSelectedOption] = useState('youtube'); // Default to YouTube
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [link, setLink] = useState('');  // For YouTube Link
  const [video, setVideo] = useState(null);  // For Video Upload
  const [progress, setProgress] = useState(0);
  const [videoURL, setVideoURL] = useState('');
  const [downloadLink, setDownloadLink] = useState('')

  const handleVideoChange = (e) => {
    if (e.target.files[0]) {
      setVideo(e.target.files[0]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (selectedOption === 'youtube') {
      // Save YouTube link to Firestore
      await addDoc(collection(db, 'videos'), {
        title: title,
        description: description,
        url: link,  // Store YouTube link
        type: 'youtube',
        downloadLink: downloadLink
      });

      setTitle('');
      setDescription('');
      setLink('');
      setDownloadLink('')
      alert('YouTube link saved successfully!');
    } else if (selectedOption === 'upload' && video) {
      // Upload video to Firebase Storage
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
        },
        async () => {
          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);

          // Save video URL to Firestore
          await addDoc(collection(db, 'videos'), {
            title: title,
            description: description,
            url: downloadURL,  // Store video download URL
            type: 'video',
            downloadLink: downloadLink
          });

          setTitle('');
          setDescription('');
          setVideo(null);
          setProgress(0);
          setVideoURL(downloadURL);
          setDownloadLink('')
          alert('Video uploaded successfully!');
        }
      );
    }
  };

  return (
    <form className="max-w-lg mx-auto shadow-lg bg-cyan-200 rounded-3xl p-10 space-y-6" onSubmit={handleSubmit}>
      <h1 className="text-black text-2xl font-bold text-center">Upload Video or Submit YouTube Link</h1>

      <label className="block">
        <span className="block text-lg font-medium">Title</span>
        <input
          type="text"
          placeholder="Video Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          className="w-full mt-2 p-2 border rounded-lg focus:outline-none focus:ring focus:ring-cyan-400"
        />
      </label>

      <label className="block">
        <span className="block text-lg font-medium">Description</span>
        <textarea
          placeholder="Video Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          required
          className="w-full mt-2 p-2 border rounded-lg focus:outline-none focus:ring focus:ring-cyan-400"
        />
      </label>

      <label className='block'>
      <span className="block text-lg font-medium">Download Link</span>
        <textarea
          placeholder="DownLoad Link"
          value={downloadLink}
          onChange={(e) => setDownloadLink(e.target.value)}
          required
          className="w-full mt-2 p-2 border rounded-lg focus:outline-none focus:ring focus:ring-cyan-400"
        />
        </label>

      {/* Radio buttons for selecting YouTube Link or Video Upload */}
      <div className="flex items-center space-x-4">
        <label className="inline-flex items-center">
          <input
            type="radio"
            name="uploadType"
            value="youtube"
            checked={selectedOption === 'youtube'}
            onChange={() => setSelectedOption('youtube')}
            className="form-radio text-cyan-500"
          />
          <span className="ml-2 text-lg">YouTube Link</span>
        </label>
        <label className="inline-flex items-center">
          <input
            type="radio"
            name="uploadType"
            value="upload"
            checked={selectedOption === 'upload'}
            onChange={() => setSelectedOption('upload')}
            className="form-radio text-cyan-500"
          />
          <span className="ml-2 text-lg">Video Upload</span>
        </label>
      </div>

      {/* Conditional rendering based on the selected option */}
      {selectedOption === 'youtube' && (
        <label className="block">
          <span className="block text-lg font-medium">YouTube Link</span>
          <input
            type="text"
            placeholder="Enter YouTube Link"
            value={link}
            onChange={(e) => setLink(e.target.value)}
            required
            className="w-full mt-2 p-2 border rounded-lg focus:outline-none focus:ring focus:ring-cyan-400"
          />
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

      <button
        type="submit"
        className="w-full bg-cyan-500 text-white p-3 rounded-lg hover:bg-cyan-600 transition"
      >
        Submit
      </button>
    </form>
  );
}
