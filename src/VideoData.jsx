import React, { useState, useEffect } from 'react';
import { collection, getDocs, deleteDoc, doc } from 'firebase/firestore';
import { db } from './firebase/firebase';  // Import Firestore instance
import { translateText } from './Localization/deepl';  // Import translation utility
import { Navigate } from 'react-router-dom';

const VideoData = () => {
  const [videos, setVideos] = useState([]);
  const [language, setLanguage] = useState('EN'); // Default language is English
  const [loadingVideos, setLoadingVideos] = useState({});  // Track loading per video

  // Fetch videos from Firestore when the component mounts
  useEffect(() => {
    const fetchVideos = async () => {
      const videoCollection = collection(db, 'videos');
      const videoSnapshot = await getDocs(videoCollection);
      const videoList = videoSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        translatedTitle: '',  // Store translated titles
        translatedDescription: ''  // Store translated descriptions
      }));
      setVideos(videoList);
    };

    fetchVideos();
  }, []);

  // Translate video title and description for all videos when language is changed
  const handleLanguageChange = async (e) => {
    const selectedLanguage = e.target.value;
    setLanguage(selectedLanguage);

    // Set loading state for all videos
    const loadingState = videos.reduce((acc, video) => {
      acc[video.id] = true;
      return acc;
    }, {});
    setLoadingVideos(loadingState);

    // Auto-translate all videos
    const updatedVideos = await Promise.all(videos.map(async (video) => {
      const translatedTitle = await translateText(video.title, selectedLanguage);
      const translatedDescription = await translateText(video.description, selectedLanguage);
      const translateDownloadLink = await translateDownloadLink(video.downloadLink, selectedLanguage); 
      return {
        ...video,
        translatedTitle,
        translatedDescription, 
        translateDownloadLink
      };
    }));
    setVideos(updatedVideos);
    
    // Turn off loading for all videos
    setLoadingVideos({});
  };

  // Delete video from Firestore
  const handleDelete = async (videoId) => {
    try {
      await deleteDoc(doc(db, 'videos', videoId));  // Delete the video from Firestore
      setVideos(videos.filter(video => video.id !== videoId));  // Update the state to remove the deleted video
      alert('Video deleted successfully!');
    } catch (error) {
      console.error('Error deleting video:', error);
      alert('Failed to delete the video');
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">My Project Videos</h1>

      {/* Language Selector */}
      <div className="mb-4">
        <label htmlFor="language" className="block text-lg font-medium">
          Select Language:
        </label>
        <select
          id="language"
          value={language}
          onChange={handleLanguageChange}  // Auto-translate on language change
          className="mt-2 p-2 border rounded-lg"
        >
          <option value="EN">English</option>
          <option value="DE">German</option>
          <option value="IT">Italian</option>
          <option value="JA">Japanese</option>
          <option value="KO">Korean</option>
          {/* Add other languages supported by DeepL */}
        </select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
        {videos.map((video) => (
          <div key={video.id} className="bg-orange-200 p-4 rounded-lg shadow-md overflow-hidden">
            <h2 className="text-lg text-black font-semibold mb-2">
              {loadingVideos[video.id] ? 'Translating...' : video.translatedTitle || video.title}
            </h2>
            <p className="text-sm text-black mb-4">
              {loadingVideos[video.id] ? 'Translating...' : video.translatedDescription || video.description}
            </p>

            {/* If video.type is 'video', show the video player, otherwise show the YouTube link */}
            {video.type === 'video' ? (
              <video src={video.url} controls width="100%" className="rounded-lg" />
            ) : (
              <iframe
                width="100%"
                height="315"
                src={video.url.replace('watch?v=', 'embed/')}
                title={video.title}
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            )}

              <p className="text-sm text-black mb-4">
               Download Here - 
               <a 
    href={loadingVideos[video.id] ? '#' : video.translateDownloadLink || video.downloadLink}
    target="_blank"
    rel="noopener noreferrer"
    className="text-blue-500 hover:underline break-words whitespace-normal overflow-hidden text-ellipsis inline-block max-w-full"
  >
              {loadingVideos[video.id] ? 'Translating...' : video.downloadLink}
            </a>
            </p>

            {/* Delete Button */}
            {/* <button
              onClick={() => handleDelete(video.id)}
              className="mt-4 bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
            >
              Delete
            </button> */}
          </div>
        ))}
      </div>
    </div>
  );
};

export default VideoData;
