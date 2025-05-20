import React, { useState, useEffect } from 'react';
import { collection, getDocs, deleteDoc, doc } from 'firebase/firestore';
import { db } from './firebase/firebase';
import { translateText } from './Localization/deepl';

const VideoData = () => {
  const [videos, setVideos] = useState([]);
  const [language, setLanguage] = useState('EN');
  const [selectedTag, setSelectedTag] = useState('all');
  const [loadingVideos, setLoadingVideos] = useState({});

  useEffect(() => {
    const fetchVideos = async () => {
      const videoCollection = collection(db, 'videos');
      const videoSnapshot = await getDocs(videoCollection);
      const videoList = videoSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        translatedTitle: '',
        translatedDescription: '',
        translatedDownloadLink: ''
      }));
      setVideos(videoList);
    };

    fetchVideos();
  }, []);

  const handleLanguageChange = async (e) => {
    const selectedLanguage = e.target.value;
    setLanguage(selectedLanguage);

    const loadingState = videos.reduce((acc, video) => {
      acc[video.id] = true;
      return acc;
    }, {});
    setLoadingVideos(loadingState);

    const updatedVideos = await Promise.all(videos.map(async (video) => {
      const translatedTitle = await translateText(video.title, selectedLanguage);
      const translatedDescription = await translateText(video.description, selectedLanguage);
      const translatedDownloadLink = await translateText(video.downloadLink, selectedLanguage);
      return {
        ...video,
        translatedTitle,
        translatedDescription,
        translatedDownloadLink
      };
    }));
    setVideos(updatedVideos);
    setLoadingVideos({});
  };

  const handleTagChange = (e) => {
    setSelectedTag(e.target.value);
  };

  const handleDelete = async (videoId) => {
    try {
      await deleteDoc(doc(db, 'videos', videoId));
      setVideos(videos.filter(video => video.id !== videoId));
      alert('Video deleted successfully!');
    } catch (error) {
      console.error('Error deleting video:', error);
      alert('Failed to delete the video');
    }
  };

  const filteredVideos = videos.filter(video => selectedTag === 'all' || video.tag === selectedTag);

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6 text-orange-500">My Project Videos</h1>

      {/* Language Selector */}
     <div className="mb-4 flex flex-col md:flex-row md:items-end md:space-x-6 justify-center">
  {/* Language Selector */}
  <div className="flex-3">
    <label htmlFor="language" className="block text-lg font-medium text-orange-500">
      Select Language:
    </label>
    <select
      id="language"
      value={language}
      onChange={handleLanguageChange}
      className="mt-2 p-2 border rounded-lg w-full"
    >
      <option value="EN">English</option>
      <option value="DE">German</option>
      <option value="IT">Italian</option>
      <option value="JA">Japanese</option>
      <option value="KO">Korean</option>
    </select>
  </div>

  {/* Tag Filter */}
  <div className="flex-3 mt-4 md:mt-0 ">
    <label htmlFor="tag" className="block text-lg font-medium text-orange-500">
      Filter by Tag:
    </label>
    <select
      id="tag"
      value={selectedTag}
      onChange={handleTagChange}
      className="mt-2 p-2 border rounded-lg w-full"
    >
      <option value="all">All</option>
      <option value="game">Game</option>
      <option value="software">Software</option>
      <option value="web">Web</option>
    </select>
  </div>
</div>


      {/* Video Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
        {filteredVideos.map((video) => (
          <div key={video.id} className="bg-orange-200 p-4 rounded-lg shadow-md overflow-hidden">
            <h2 className="text-lg text-black font-semibold mb-2">
              {loadingVideos[video.id] ? 'Translating...' : video.translatedTitle || video.title}
            </h2>
            <p className="text-sm text-black italic mb-1">Tag: {video.tag}</p>
            <p className="text-sm text-black mb-4">
              {loadingVideos[video.id] ? 'Translating...' : video.translatedDescription || video.description}
            </p>

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
              Download Here -{' '}
              <a
                href={loadingVideos[video.id] ? '#' : video.translatedDownloadLink || video.downloadLink}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-500 hover:underline break-words"
              >
                {loadingVideos[video.id] ? 'Translating...' : video.translatedDownloadLink || video.downloadLink}
              </a>
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default VideoData;
