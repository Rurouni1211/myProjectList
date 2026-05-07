import React, { useEffect, useState } from "react";
import {
  collection,
  getDocs,
  deleteDoc,
  doc,
  updateDoc,
  serverTimestamp,
} from "firebase/firestore";
import {
  ref,
  getDownloadURL,
  deleteObject,
  uploadBytesResumable,
} from "firebase/storage";
import { onAuthStateChanged } from "firebase/auth";
import { auth, db, storage } from "./firebase/firebase";

export default function AdminVideoManage() {
  const [user, setUser] = useState(null);
  const [isAuthReady, setIsAuthReady] = useState(false);

  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);

  const [editingId, setEditingId] = useState(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editDownloadLink, setEditDownloadLink] = useState("");
  const [editTag, setEditTag] = useState("game");
  const [editUrl, setEditUrl] = useState("");
  const [editType, setEditType] = useState("youtube");
  const [editFile, setEditFile] = useState(null);
  const [editProgress, setEditProgress] = useState(0);

  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setIsAuthReady(true);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!isAuthReady || !user) return;

    fetchVideos();
  }, [isAuthReady, user]);

  const extractStoragePathFromUrl = (url) => {
    try {
      const match = url?.match(/\/o\/([^?]+)/);
      if (!match) return null;
      return decodeURIComponent(match[1]);
    } catch (error) {
      console.error("Failed to extract storage path:", error);
      return null;
    }
  };

  const refreshVideoUrlIfNeeded = async (video) => {
    try {
      if (video.type !== "video" || !video.url) {
        return video;
      }

      const storagePath =
        video.storagePath || extractStoragePathFromUrl(video.url);

      if (!storagePath) {
        return video;
      }

      const freshUrl = await getDownloadURL(ref(storage, storagePath));

      return {
        ...video,
        url: freshUrl,
        storagePath,
      };
    } catch (error) {
      console.error("Failed to refresh video URL:", error);
      return video;
    }
  };

  const fetchVideos = async () => {
    try {
      setLoading(true);

      const snapshot = await getDocs(collection(db, "videos"));

      const rawVideos = snapshot.docs.map((docSnap) => ({
        id: docSnap.id,
        ...docSnap.data(),
      }));

      const refreshedVideos = await Promise.all(
        rawVideos.map((video) => refreshVideoUrlIfNeeded(video)),
      );

      setVideos(refreshedVideos);
    } catch (error) {
      console.error("Failed to fetch videos:", error);
      alert("Failed to fetch videos.");
    } finally {
      setLoading(false);
    }
  };

  const startEdit = (video) => {
    setEditingId(video.id);
    setEditTitle(video.title || "");
    setEditDescription(video.description || "");
    setEditDownloadLink(video.downloadLink || "");
    setEditTag(video.tag || "game");
    setEditUrl(video.url || "");
    setEditType(video.type || "youtube");
    setEditFile(null);
    setEditProgress(0);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditTitle("");
    setEditDescription("");
    setEditDownloadLink("");
    setEditTag("game");
    setEditUrl("");
    setEditType("youtube");
    setEditFile(null);
    setEditProgress(0);
  };

  const handleUpdate = async (video) => {
    if (!editingId) return;

    if (!editTitle.trim()) {
      alert("Title is required.");
      return;
    }

    if (!editDescription.trim()) {
      alert("Description is required.");
      return;
    }

    if (!editDownloadLink.trim()) {
      alert("Download link is required.");
      return;
    }

    if (editType === "youtube" && !editUrl.trim()) {
      alert("YouTube URL is required.");
      return;
    }

    try {
      setSaving(true);

      let updatedUrl = editUrl.trim();
      let updatedStoragePath = video.storagePath || "";

      if (editType === "video" && editFile) {
        const oldStoragePath =
          video.storagePath || extractStoragePathFromUrl(video.url);

        if (oldStoragePath) {
          try {
            await deleteObject(ref(storage, oldStoragePath));
          } catch (error) {
            console.warn("Old video file could not be deleted:", error);
          }
        }

        const newStoragePath = `videos/${Date.now()}-${editFile.name}`;
        const storageRef = ref(storage, newStoragePath);
        const uploadTask = uploadBytesResumable(storageRef, editFile);

        updatedUrl = await new Promise((resolve, reject) => {
          uploadTask.on(
            "state_changed",
            (snapshot) => {
              const progress =
                (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
              setEditProgress(progress);
            },
            reject,
            async () => {
              const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
              resolve(downloadURL);
            },
          );
        });

        updatedStoragePath = newStoragePath;
      }

      const updatedData = {
        title: editTitle.trim(),
        description: editDescription.trim(),
        downloadLink: editDownloadLink.trim(),
        tag: editTag,
        type: editType,
        url: updatedUrl,
        storagePath: editType === "video" ? updatedStoragePath : "",
        updatedAt: serverTimestamp(),
      };

      await updateDoc(doc(db, "videos", video.id), updatedData);

      setVideos((prev) =>
        prev.map((item) =>
          item.id === video.id
            ? {
                ...item,
                ...updatedData,
              }
            : item,
        ),
      );

      cancelEdit();
      alert("Video updated successfully!");
    } catch (error) {
      console.error("Failed to update video:", error);
      alert("Failed to update video: " + error.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (video) => {
    const confirmDelete = window.confirm(
      `Are you sure you want to delete "${video.title}"?`,
    );

    if (!confirmDelete) return;

    try {
      setDeletingId(video.id);

      if (video.type === "video") {
        const storagePath =
          video.storagePath || extractStoragePathFromUrl(video.url);

        if (storagePath) {
          try {
            await deleteObject(ref(storage, storagePath));
          } catch (error) {
            console.warn("Storage file could not be deleted:", error);
          }
        }
      }

      await deleteDoc(doc(db, "videos", video.id));

      setVideos((prev) => prev.filter((item) => item.id !== video.id));

      alert("Video deleted successfully!");
    } catch (error) {
      console.error("Failed to delete video:", error);
      alert("Failed to delete video: " + error.message);
    } finally {
      setDeletingId(null);
    }
  };

  if (!isAuthReady) {
    return <p className="text-center mt-10">Checking admin login...</p>;
  }

  if (!user) {
    return (
      <p className="text-center mt-10 text-red-600">
        You must be logged in to manage videos.
      </p>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-orange-500">
            Admin Video Manager
          </h1>
          <p className="text-gray-600 mt-1">
            Edit, update, and delete uploaded videos here. Users should not see
            this page.
          </p>
        </div>

        <button
          type="button"
          onClick={fetchVideos}
          className="bg-orange-500 text-white px-5 py-2 rounded-lg hover:bg-orange-600"
        >
          Refresh
        </button>
      </div>

      {loading ? (
        <p className="text-center text-orange-500 font-bold">
          Loading videos...
        </p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {videos.map((video) => {
            const isEditing = editingId === video.id;

            return (
              <div
                key={video.id}
                className="rounded-xl bg-orange-100 p-5 shadow-md"
              >
                {isEditing ? (
                  <div className="space-y-4">
                    <h2 className="text-xl font-bold text-black">
                      Editing: {video.title}
                    </h2>

                    <label className="block">
                      <span className="block text-sm font-bold text-black">
                        Title
                      </span>
                      <input
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        className="mt-1 w-full rounded-lg border p-2 text-black"
                      />
                    </label>

                    <label className="block">
                      <span className="block text-sm font-bold text-black">
                        Description
                      </span>
                      <textarea
                        value={editDescription}
                        onChange={(e) => setEditDescription(e.target.value)}
                        className="mt-1 w-full rounded-lg border p-2 text-black"
                      />
                    </label>

                    <label className="block">
                      <span className="block text-sm font-bold text-black">
                        Download Link
                      </span>
                      <textarea
                        value={editDownloadLink}
                        onChange={(e) => setEditDownloadLink(e.target.value)}
                        className="mt-1 w-full rounded-lg border p-2 text-black"
                      />
                    </label>

                    <label className="block">
                      <span className="block text-sm font-bold text-black">
                        Category Tag
                      </span>
                      <select
                        value={editTag}
                        onChange={(e) => setEditTag(e.target.value)}
                        className="mt-1 w-full rounded-lg border p-2 text-black"
                      >
                        <option value="game">Game</option>
                        <option value="web">Web</option>
                        <option value="software">Software</option>
                      </select>
                    </label>

                    <label className="block">
                      <span className="block text-sm font-bold text-black">
                        Type
                      </span>
                      <select
                        value={editType}
                        onChange={(e) => {
                          setEditType(e.target.value);
                          setEditFile(null);
                          setEditProgress(0);
                        }}
                        className="mt-1 w-full rounded-lg border p-2 text-black"
                      >
                        <option value="youtube">YouTube</option>
                        <option value="video">Uploaded Video</option>
                      </select>
                    </label>

                    {editType === "youtube" ? (
                      <label className="block">
                        <span className="block text-sm font-bold text-black">
                          YouTube URL
                        </span>
                        <input
                          value={editUrl}
                          onChange={(e) => setEditUrl(e.target.value)}
                          className="mt-1 w-full rounded-lg border p-2 text-black"
                        />
                      </label>
                    ) : (
                      <label className="block">
                        <span className="block text-sm font-bold text-black">
                          Replace Video File
                        </span>
                        <input
                          type="file"
                          accept="video/*"
                          onChange={(e) => {
                            if (e.target.files[0]) {
                              setEditFile(e.target.files[0]);
                            }
                          }}
                          className="mt-1 w-full rounded-lg border p-2 text-black"
                        />

                        <progress
                          value={editProgress}
                          max="100"
                          className="mt-2 w-full"
                        />

                        <p className="text-sm text-black">
                          Upload Progress: {Math.round(editProgress)}%
                        </p>
                      </label>
                    )}

                    <div className="flex gap-3">
                      <button
                        type="button"
                        onClick={() => handleUpdate(video)}
                        disabled={saving}
                        className="flex-1 rounded-lg bg-green-600 p-3 text-white hover:bg-green-700 disabled:opacity-60"
                      >
                        {saving ? "Updating..." : "Update"}
                      </button>

                      <button
                        type="button"
                        onClick={cancelEdit}
                        disabled={saving}
                        className="flex-1 rounded-lg bg-gray-600 p-3 text-white hover:bg-gray-700 disabled:opacity-60"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <h2 className="text-xl font-bold text-black">
                      {video.title}
                    </h2>

                    <p className="mt-1 text-sm text-black">
                      <strong>Tag:</strong> {video.tag}
                    </p>

                    <p className="mt-1 text-sm text-black">
                      <strong>Type:</strong> {video.type}
                    </p>

                    <p className="mt-3 text-sm text-black">
                      {video.description}
                    </p>

                    <div className="mt-4">
                      {video.type === "video" ? (
                        <video
                          controls
                          className="w-full rounded-lg bg-black"
                          preload="metadata"
                        >
                          <source src={video.url} type="video/mp4" />
                          Your browser does not support the video tag.
                        </video>
                      ) : (
                        <iframe
                          width="100%"
                          height="260"
                          src={(video.url || "").replace("watch?v=", "embed/")}
                          title={video.title}
                          frameBorder="0"
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen
                          className="rounded-lg"
                        />
                      )}
                    </div>

                    <p className="mt-4 text-sm text-black break-words">
                      <strong>Download:</strong>{" "}
                      <a
                        href={video.downloadLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 underline"
                      >
                        {video.downloadLink}
                      </a>
                    </p>

                    <div className="mt-5 flex gap-3">
                      <button
                        type="button"
                        onClick={() => startEdit(video)}
                        className="flex-1 rounded-lg bg-blue-500 p-3 text-white hover:bg-blue-600"
                      >
                        Edit
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDelete(video)}
                        disabled={deletingId === video.id}
                        className="flex-1 rounded-lg bg-red-500 p-3 text-white hover:bg-red-600 disabled:opacity-60"
                      >
                        {deletingId === video.id ? "Deleting..." : "Delete"}
                      </button>
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>
      )}

      {!loading && videos.length === 0 && (
        <p className="text-center text-orange-500 font-bold">
          No videos found.
        </p>
      )}
    </div>
  );
}
