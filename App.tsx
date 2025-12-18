
import React, { useState, useEffect, useMemo } from 'react';
import { 
  LogOut, 
  Image as ImageIcon, 
  FolderPlus, 
  Share2, 
  CheckCircle, 
  Download, 
  Loader2, 
  Copy, 
  Grid, 
  List,
  ExternalLink,
  ChevronLeft
} from 'lucide-react';

import { 
  loginWithGoogle, 
  logoutUser, 
  subscribeToAuthChanges, 
  createAlbumInDb, 
  getAlbums, 
  getAlbumById,
  saveClientSelections,
  getSelectionsForAlbum,
  User 
} from './services/firebase';
import { listDriveFiles, extractFolderId } from './services/drive';
import { ADMIN_EMAILS, isConfigValid } from './constants';
import { Album, DriveFile, Selection, ViewState } from './types';

// --- Sub-Components (Defined here for single-file constraints in standard response, but ideally separate) ---

const LoadingScreen = ({ message }: { message: string }) => (
  <div className="flex flex-col items-center justify-center min-h-screen bg-slate-950 text-slate-300">
    <Loader2 className="w-10 h-10 animate-spin mb-4 text-emerald-500" />
    <p>{message}</p>
  </div>
);

const Button = ({ 
  children, 
  onClick, 
  variant = 'primary', 
  className = '', 
  disabled = false,
  icon: Icon
}: any) => {
  const baseStyle = "flex items-center justify-center px-4 py-2 rounded-lg font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed";
  const variants: any = {
    primary: "bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-900/50",
    secondary: "bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700",
    danger: "bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20"
  };

  return (
    <button 
      onClick={onClick} 
      disabled={disabled} 
      className={`${baseStyle} ${variants[variant]} ${className}`}
    >
      {Icon && <Icon className="w-4 h-4 mr-2" />}
      {children}
    </button>
  );
};

const SetupView = () => (
  <div className="min-h-screen flex items-center justify-center bg-slate-950 p-6">
    <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-xl p-8 shadow-2xl">
      <div className="text-center mb-6">
        <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
          <FolderPlus className="w-8 h-8 text-red-500" />
        </div>
        <h1 className="text-2xl font-bold text-white mb-2">Configuration Missing</h1>
        <p className="text-slate-400 text-sm">
          Please open <code>constants.ts</code> and configure your Firebase keys and Google Drive API key to start using Luom Photo Selector.
        </p>
      </div>
      <div className="space-y-4 text-xs text-slate-500 font-mono bg-slate-950 p-4 rounded-lg border border-slate-800">
        <p>1. GOOGLE_DRIVE_API_KEY</p>
        <p>2. FIREBASE_CONFIG</p>
      </div>
    </div>
  </div>
);

const LoginView = ({ onLogin, isLoggingIn }: { onLogin: () => void, isLoggingIn: boolean }) => (
  <div className="min-h-screen flex items-center justify-center bg-slate-950 p-6 relative overflow-hidden">
    {/* Background decoration */}
    <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 opacity-20 pointer-events-none">
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-emerald-500 rounded-full blur-[128px]"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-600 rounded-full blur-[128px]"></div>
    </div>

    <div className="max-w-md w-full bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-2xl p-8 shadow-2xl z-10">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-white mb-2 tracking-tight">Luom.</h1>
        <p className="text-emerald-500 font-medium">Photo Selector</p>
      </div>
      
      <div className="space-y-6">
        <p className="text-slate-400 text-center text-sm">
          Sign in to view albums, select photos, or manage your gallery.
        </p>
        
        <Button 
          onClick={onLogin} 
          disabled={isLoggingIn} 
          className="w-full h-12 text-lg"
        >
          {isLoggingIn ? <Loader2 className="animate-spin w-5 h-5 mr-2" /> : <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="w-5 h-5 mr-3" />}
          {isLoggingIn ? 'Signing in...' : 'Sign in with Google'}
        </Button>
      </div>
    </div>
  </div>
);

// --- Admin Components ---

const AdminDashboard = ({ 
  albums, 
  user, 
  onCreateAlbum, 
  onViewAlbum, 
  isCreating 
}: any) => {
  const [folderInput, setFolderInput] = useState("");
  const [albumName, setAlbumName] = useState("");

  const handleCreate = () => {
    if (!folderInput || !albumName) return;
    const folderId = extractFolderId(folderInput);
    if (folderId) {
      onCreateAlbum(albumName, folderId);
      setFolderInput("");
      setAlbumName("");
    } else {
      alert("Invalid Google Drive Link");
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white">Albums</h1>
          <p className="text-slate-400 text-sm">Manage your client galleries</p>
        </div>
      </div>

      {/* Create Album Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 mb-8">
        <h2 className="text-lg font-semibold text-white mb-4 flex items-center">
          <FolderPlus className="w-5 h-5 mr-2 text-emerald-500" />
          New Album
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <input 
            type="text" 
            placeholder="Album Name (e.g. Wedding John & Jane)" 
            className="bg-slate-950 border border-slate-800 text-white px-4 py-2 rounded-lg focus:outline-none focus:border-emerald-500"
            value={albumName}
            onChange={(e) => setAlbumName(e.target.value)}
          />
          <input 
            type="text" 
            placeholder="Google Drive Folder Link or ID" 
            className="bg-slate-950 border border-slate-800 text-white px-4 py-2 rounded-lg focus:outline-none focus:border-emerald-500"
            value={folderInput}
            onChange={(e) => setFolderInput(e.target.value)}
          />
          <Button onClick={handleCreate} disabled={isCreating || !folderInput || !albumName}>
            {isCreating ? <Loader2 className="animate-spin w-4 h-4" /> : 'Create Album'}
          </Button>
        </div>
      </div>

      {/* Album Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {albums.map((album: Album) => (
          <div key={album.id} className="bg-slate-900 border border-slate-800 rounded-xl p-5 hover:border-emerald-500/50 transition-colors group">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="font-bold text-white text-lg truncate pr-2">{album.name}</h3>
                <p className="text-xs text-slate-500">Created {new Date(album.createdAt).toLocaleDateString()}</p>
              </div>
              <div className="bg-slate-800 p-2 rounded-lg">
                <ImageIcon className="w-5 h-5 text-slate-400" />
              </div>
            </div>
            
            <div className="flex gap-2 mt-4">
              <Button variant="secondary" className="flex-1 text-sm" onClick={() => onViewAlbum(album)}>
                View Selections
              </Button>
              <button 
                onClick={() => {
                   // Copy link to clipboard
                   const link = `${window.location.origin}${window.location.pathname}#album/${album.id}`;
                   navigator.clipboard.writeText(link);
                   alert("Copied link: " + link);
                }}
                className="p-2 bg-emerald-500/10 text-emerald-500 rounded-lg hover:bg-emerald-500/20"
                title="Copy Share Link"
              >
                <Share2 className="w-5 h-5" />
              </button>
            </div>
          </div>
        ))}
        {albums.length === 0 && (
          <div className="col-span-full text-center py-12 text-slate-500">
            No albums created yet.
          </div>
        )}
      </div>
    </div>
  );
};

const AdminAlbumDetail = ({ album, onBack }: { album: Album, onBack: () => void }) => {
  const [selections, setSelections] = useState<Selection[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const data = await getSelectionsForAlbum(album.id);
      setSelections(data);
      setLoading(false);
    };
    load();
  }, [album.id]);

  // Group by client
  const grouped = useMemo(() => {
    const groups: Record<string, Selection[]> = {};
    selections.forEach(s => {
      if (!groups[s.clientEmail]) groups[s.clientEmail] = [];
      groups[s.clientEmail].push(s);
    });
    return groups;
  }, [selections]);

  const copyList = (items: Selection[]) => {
    const text = items.map(i => i.fileName).join('\n');
    navigator.clipboard.writeText(text);
    alert(`Copied ${items.length} filenames to clipboard.`);
  };

  if (loading) return <LoadingScreen message="Loading selections..." />;

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <button onClick={onBack} className="flex items-center text-slate-400 hover:text-white mb-6">
        <ChevronLeft className="w-4 h-4 mr-1" /> Back to Dashboard
      </button>

      <div className="flex justify-between items-end mb-8 border-b border-slate-800 pb-6">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">{album.name}</h1>
          <p className="text-slate-400">Total Selections: <span className="text-emerald-400 font-mono">{selections.length}</span></p>
        </div>
        <div className="text-right">
           <a 
             href={`https://drive.google.com/drive/folders/${album.driveFolderId}`} 
             target="_blank" 
             rel="noreferrer"
             className="text-sm text-emerald-500 hover:underline flex items-center justify-end"
           >
             Open Drive Folder <ExternalLink className="w-3 h-3 ml-1" />
           </a>
        </div>
      </div>

      <div className="space-y-6">
        {Object.entries(grouped).map(([email, items]) => {
          const typedItems = items as Selection[];
          return (
          <div key={email} className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
            <div className="p-4 bg-slate-800/50 flex justify-between items-center border-b border-slate-800">
              <div className="flex items-center">
                <div className="w-8 h-8 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center mr-3 font-bold">
                  {email[0].toUpperCase()}
                </div>
                <div>
                  <h3 className="font-semibold text-white">{email}</h3>
                  <p className="text-xs text-slate-500">{typedItems.length} photos selected</p>
                </div>
              </div>
              <Button variant="secondary" size="sm" onClick={() => copyList(typedItems)} icon={Copy}>
                Copy Filenames
              </Button>
            </div>
            <div className="p-4 max-h-60 overflow-y-auto">
              <div className="flex flex-wrap gap-2">
                {typedItems.map(item => (
                  <span key={item.id} className="inline-block px-2 py-1 bg-slate-950 border border-slate-800 rounded text-xs text-slate-400 font-mono">
                    {item.fileName}
                  </span>
                ))}
              </div>
            </div>
          </div>
        )})}

        {Object.keys(grouped).length === 0 && (
          <div className="text-center py-12 text-slate-500 bg-slate-900/50 rounded-xl border border-dashed border-slate-800">
            No selections submitted yet.
          </div>
        )}
      </div>
    </div>
  );
};

// --- Client Component ---

const ClientAlbumView = ({ 
  album, 
  user, 
  onLogout 
}: { album: Album, user: User, onLogout: () => void }) => {
  const [files, setFiles] = useState<DriveFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Selection State
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    const loadFiles = async () => {
      try {
        setLoading(true);
        const driveFiles = await listDriveFiles(album.driveFolderId);
        setFiles(driveFiles);
      } catch (err: any) {
        console.error(err);
        setError("Could not load photos. Ensure the Google Drive folder is set to 'Anyone with the link can view'.");
      } finally {
        setLoading(false);
      }
    };
    loadFiles();
  }, [album.driveFolderId]);

  const toggleSelection = (fileId: string) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(fileId)) {
      newSet.delete(fileId);
    } else {
      newSet.add(fileId);
    }
    setSelectedIds(newSet);
  };

  const handleSubmit = async () => {
    if (selectedIds.size === 0) return;
    if (!confirm(`Confirm sending ${selectedIds.size} selections to the photographer?`)) return;

    setSubmitting(true);
    try {
      const selectedFiles = files.filter(f => selectedIds.has(f.id));
      const payload = selectedFiles.map(f => ({
        albumId: album.id,
        clientUid: user.uid,
        clientEmail: user.email || "unknown",
        fileId: f.id,
        fileName: f.name
      }));

      await saveClientSelections(payload);
      setSubmitted(true);
      // Optional: Clear selection or show success modal
    } catch (err) {
      console.error(err);
      alert("Failed to submit selections. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <LoadingScreen message="Loading photos from Drive..." />;
  if (error) return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center text-slate-300">
      <div className="bg-red-500/10 p-6 rounded-xl border border-red-500/20 max-w-lg">
        <h2 className="text-xl font-bold text-red-500 mb-2">Access Error</h2>
        <p>{error}</p>
        <Button onClick={onLogout} className="mt-6" variant="secondary">Back / Logout</Button>
      </div>
    </div>
  );

  if (submitted) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center">
        <div className="bg-emerald-500/10 p-8 rounded-full mb-6">
          <CheckCircle className="w-16 h-16 text-emerald-500" />
        </div>
        <h1 className="text-3xl font-bold text-white mb-4">Thank You!</h1>
        <p className="text-slate-400 mb-8 max-w-md">
          Your selection of <span className="text-white font-bold">{selectedIds.size}</span> photos has been sent to the photographer.
        </p>
        <Button onClick={() => setSubmitted(false)} variant="secondary">
          Review / Select More
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 pb-24">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-slate-950/80 backdrop-blur-md border-b border-slate-800 px-6 py-4 flex justify-between items-center">
        <div>
           <h1 className="text-lg font-bold text-white max-w-[200px] sm:max-w-md truncate">{album.name}</h1>
           <p className="text-xs text-slate-500">{files.length} photos</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-slate-400 hidden sm:block">{user.email}</span>
          <button onClick={onLogout} className="p-2 hover:bg-slate-800 rounded-full text-slate-400">
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Grid */}
      <main className="p-4 sm:p-6">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {files.map(file => {
            const isSelected = selectedIds.has(file.id);
            return (
              <div 
                key={file.id} 
                className={`relative group aspect-square bg-slate-900 rounded-lg overflow-hidden border-2 transition-all cursor-pointer ${isSelected ? 'border-emerald-500' : 'border-transparent hover:border-slate-700'}`}
                onClick={() => toggleSelection(file.id)}
              >
                {/* Image */}
                <img 
                  src={file.thumbnailLink} 
                  alt={file.name} 
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" 
                  loading="lazy"
                />
                
                {/* Overlay Gradient */}
                <div className={`absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-3 ${isSelected ? 'opacity-100' : ''}`}>
                   <p className="text-xs text-white truncate font-mono mb-1">{file.name}</p>
                   <div className="flex justify-between items-center">
                      <a 
                        href={file.directLink} 
                        target="_blank" 
                        rel="noreferrer" 
                        className="p-1.5 bg-white/10 hover:bg-white/20 rounded-md backdrop-blur-sm text-white"
                        onClick={(e) => e.stopPropagation()}
                        title="Download Original"
                      >
                        <Download className="w-4 h-4" />
                      </a>
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center border ${isSelected ? 'bg-emerald-500 border-emerald-500' : 'border-white/50'}`}>
                        {isSelected && <CheckCircle className="w-4 h-4 text-white" />}
                      </div>
                   </div>
                </div>

                {/* Selected Indicator Top Right */}
                {isSelected && (
                  <div className="absolute top-2 right-2 w-3 h-3 bg-emerald-500 rounded-full shadow-lg shadow-emerald-500/50 animate-pulse"></div>
                )}
              </div>
            );
          })}
        </div>
      </main>

      {/* Sticky Bottom Bar */}
      <div className="fixed bottom-0 left-0 w-full bg-slate-900 border-t border-slate-800 p-4 z-40">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="text-white">
            <span className="font-bold text-emerald-400 text-xl">{selectedIds.size}</span>
            <span className="text-slate-400 text-sm ml-2">selected</span>
          </div>
          <Button 
            onClick={handleSubmit} 
            disabled={selectedIds.size === 0 || submitting}
            className="w-32"
          >
            {submitting ? <Loader2 className="animate-spin w-4 h-4" /> : 'Send Selection'}
          </Button>
        </div>
      </div>
    </div>
  );
};

// --- Main App Component ---

const App = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loadingAuth, setLoadingAuth] = useState(true);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [view, setView] = useState<ViewState>(ViewState.LOGIN);
  const [albums, setAlbums] = useState<Album[]>([]);
  const [currentAlbum, setCurrentAlbum] = useState<Album | null>(null);
  
  // Hash Routing Logic
  useEffect(() => {
    const handleHashChange = async () => {
      const hash = window.location.hash;
      
      if (!isConfigValid()) {
        setView(ViewState.SETUP);
        setLoadingAuth(false);
        return;
      }

      if (hash.startsWith('#album/')) {
        const albumId = hash.split('/')[1];
        if (albumId) {
          try {
            const album = await getAlbumById(albumId);
            if (album) {
              setCurrentAlbum(album);
              setView(ViewState.CLIENT_ALBUM);
            } else {
              alert("Album not found or access denied.");
              window.location.hash = ''; // Reset to root
            }
          } catch (e) {
            console.error("Error loading album", e);
            window.location.hash = ''; // Reset to root on error
          }
        }
      } else if (hash === '#admin') {
         // Explicitly set view to dashboard to avoid fallback render loops
         setView(ViewState.ADMIN_DASHBOARD);
         setCurrentAlbum(null);
      } else {
         // Default (hash is empty or unknown)
         if (user) {
             const lowerEmail = user.email ? user.email.toLowerCase() : "";
             const isAdmin = ADMIN_EMAILS.map(e => e.toLowerCase()).includes(lowerEmail);
             
             if (isAdmin) {
                 // Prevent loop: only set hash if not already there
                 if (window.location.hash !== '#admin') {
                    window.location.hash = '#admin';
                 }
                 // Immediately set view to prevent flickering "Welcome" screen
                 setView(ViewState.ADMIN_DASHBOARD);
             } else {
                 // Regular user at root -> Show Welcome Home
                 setView(ViewState.HOME);
             }
         } else {
             // Not logged in and at root -> Login
             setView(ViewState.LOGIN);
         }
      }
    };

    if (!loadingAuth) {
      handleHashChange();
    }

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, [loadingAuth, user]);

  // Auth Subscription
  useEffect(() => {
    // FIX: Check if config is valid BEFORE trying to subscribe to auth
    if (!isConfigValid()) {
      setLoadingAuth(false);
      return;
    }

    const unsubscribe = subscribeToAuthChanges((u) => {
      setUser(u);
      setLoadingAuth(false);
      setIsLoggingIn(false); // Ensure button loading state is reset
    });
    return () => unsubscribe();
  }, []);

  // Fetch Albums for Admin
  useEffect(() => {
    if (user && view === ViewState.ADMIN_DASHBOARD) {
      getAlbums().then(setAlbums);
    }
  }, [user, view]);

  const handleLogin = async () => {
    setIsLoggingIn(true);
    try {
      await loginWithGoogle();
      // Auth listener handles the rest
    } catch (e) {
      setIsLoggingIn(false);
      alert("Login failed. Please try again.");
    }
  };

  const handleCreateAlbum = async (name: string, driveFolderId: string) => {
    if (!user || !user.email) return;
    try {
      const newId = await createAlbumInDb({
        name,
        driveFolderId,
        createdByUid: user.uid,
        createdByEmail: user.email,
        createdAt: new Date().toISOString()
      });
      // Refresh list
      const updated = await getAlbums();
      setAlbums(updated);
    } catch (e) {
      alert("Error creating album");
    }
  };

  if (view === ViewState.SETUP) {
    return <SetupView />;
  }

  if (loadingAuth) {
    return <LoadingScreen message="Initializing..." />;
  }

  if (!user) {
    // Show login if not authenticated (regardless of hash usually, unless specifically handling public routes later)
    return <LoginView onLogin={handleLogin} isLoggingIn={isLoggingIn} />;
  }

  // Routing Render Logic
  if (view === ViewState.CLIENT_ALBUM && currentAlbum) {
    return <ClientAlbumView album={currentAlbum} user={user} onLogout={logoutUser} />;
  }

  if (view === ViewState.ADMIN_ALBUM_DETAIL && currentAlbum) {
    return <AdminAlbumDetail album={currentAlbum} onBack={() => {
        setCurrentAlbum(null);
        setView(ViewState.ADMIN_DASHBOARD);
        window.location.hash = '#admin';
    }} />;
  }

  // Check Admin Access for Dashboard rendering
  const lowerEmail = user.email ? user.email.toLowerCase() : "";
  const isAdmin = ADMIN_EMAILS.map(e => e.toLowerCase()).includes(lowerEmail);

  if (isAdmin && view === ViewState.ADMIN_DASHBOARD) {
    return (
      <div className="min-h-screen bg-slate-950">
        {/* Admin Nav */}
        <nav className="border-b border-slate-800 bg-slate-900 px-6 py-4 flex justify-between items-center">
           <span className="font-bold text-white tracking-tight">Luom. <span className="text-emerald-500 text-xs uppercase px-2 py-0.5 bg-emerald-500/10 rounded ml-2">Admin</span></span>
           <div className="flex items-center gap-4">
             <span className="text-sm text-slate-400">{user.email}</span>
             <button onClick={logoutUser} className="text-slate-400 hover:text-white"><LogOut className="w-5 h-5"/></button>
           </div>
        </nav>
        <AdminDashboard 
          albums={albums} 
          user={user} 
          onCreateAlbum={handleCreateAlbum}
          onViewAlbum={(album: Album) => {
              setCurrentAlbum(album);
              setView(ViewState.ADMIN_ALBUM_DETAIL);
          }}
        />
      </div>
    );
  }

  // Fallback for non-admins visiting root OR admins who somehow fell through (ViewState.HOME)
  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-center">
        <h1 className="text-2xl text-white font-bold mb-4">Welcome, {user.displayName}</h1>
        <p className="text-slate-400 mb-6">
          {isAdmin 
            ? "Redirecting to dashboard..." 
            : "You don't have any albums assigned currently."
          }
        </p>
        {!isAdmin && (
           <p className="text-sm text-slate-500 mb-8">Please use the specific link provided by your photographer.</p>
        )}
        <Button onClick={logoutUser} variant="secondary">Logout</Button>
    </div>
  );
};

export default App;
