import React, { useState, useEffect } from 'react';
import { 
  Search, Book, Download, ExternalLink, Info, Database, Clock, Filter, List, 
  Image as ImageIcon, ArrowLeft, Eye, Bookmark, BookmarkCheck, X, 
  User, Calendar, Hash, Globe, BookOpen, Layers, Tag, Activity
} from 'lucide-react';

// Open Library Search Result Type
interface OpenLibraryDoc {
  key: string;
  title: string;
  author_name?: string[];
  first_publish_year?: number;
  cover_i?: number;
  isbn?: string[];
  publisher?: string[];
  language?: string[];
  subject?: string[];
  ia?: string[];
  [key: string]: any;
}

interface WorkDetails {
  key: string;
  title: string;
  description?: string | { value: string };
  subjects?: string[];
  covers?: number[];
  authors?: { author: { key: string }, type: { key: string } }[];
  [key: string]: any;
}

const SEARCH_FIELDS = [
  { id: 'q', label: 'General' },
  { id: 'title', label: 'Title' },
  { id: 'author', label: 'Author' },
  { id: 'isbn', label: 'ISBN' },
  { id: 'subject', label: 'Subject' },
];

export default function App() {
  const [view, setView] = useState<'home' | 'search' | 'details' | 'reader' | 'library'>('home');
  const [query, setQuery] = useState('');
  const [searchField, setSearchField] = useState('q');
  const [results, setResults] = useState<OpenLibraryDoc[]>([]);
  const [trending, setTrending] = useState<OpenLibraryDoc[]>([]);
  const [numFound, setNumFound] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [selectedWork, setSelectedWork] = useState<WorkDetails | null>(null);
  const [selectedDoc, setSelectedDoc] = useState<OpenLibraryDoc | null>(null);
  const [readerId, setReaderId] = useState<string | null>(null);
  const [myLibrary, setMyLibrary] = useState<OpenLibraryDoc[]>([]);

  const [localPage, setLocalPage] = useState(1);
  const itemsPerPage = 6;

  // Load library from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('open_lib_explorer_library');
    if (saved) {
      try {
        setMyLibrary(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to parse library", e);
      }
    }
    fetchTrending();
  }, []);

  // Save library to localStorage
  useEffect(() => {
    localStorage.setItem('open_lib_explorer_library', JSON.stringify(myLibrary));
  }, [myLibrary]);

  const fetchTrending = async () => {
    setLoading(true);
    setLocalPage(1);
    try {
      const response = await fetch('/api/trending');
      const data = await response.json();
      setTrending(data.works || []);
    } catch (err) {
      console.error("Failed to fetch trending:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (e?: React.FormEvent, newPage: number = 1, customQuery?: string, customField?: string) => {
    if (e) e.preventDefault();
    
    const activeQuery = customQuery ?? query;
    const activeField = customField ?? searchField;
    
    if (!activeQuery.trim()) return;

    setLoading(true);
    setError(null);
    setPage(newPage);
    setLocalPage(1);
    setView('search');
    
    try {
      const params = new URLSearchParams();
      params.set(activeField, activeQuery);
      params.set('page', newPage.toString());
      params.set('limit', '60');
      
      const response = await fetch(`/api/search?${params.toString()}`);
      if (!response.ok) throw new Error('Search failed');
      
      const data = await response.json();
      setResults(data.docs || []);
      setNumFound(data.numFound || 0);
    } catch (err) {
      setError('System Error: Failed to connect to Open Library database.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = async (doc: OpenLibraryDoc) => {
    setLoading(true);
    setError(null);
    setSelectedDoc(doc);
    const workId = doc.key.split('/').pop();
    
    try {
      const response = await fetch(`/api/works/${workId}`);
      if (!response.ok) throw new Error('Failed to fetch details');
      const data = await response.json();
      setSelectedWork(data);
      setView('details');
      window.scrollTo(0, 0);
    } catch (err) {
      setError('Failed to load book details.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const toggleLibrary = (doc: OpenLibraryDoc) => {
    const exists = myLibrary.find(item => item.key === doc.key);
    if (exists) {
      setMyLibrary(myLibrary.filter(item => item.key !== doc.key));
    } else {
      setMyLibrary([...myLibrary, doc]);
    }
  };

  const isInLibrary = (key: string) => myLibrary.some(item => item.key === key);

  const openReader = (iaId: string) => {
    setReaderId(iaId);
    setView('reader');
  };

  const Sidebar = () => (
    <aside className="md:col-span-1 space-y-6 sticky top-[100px] h-fit">
      <section>
        <h2 className="text-lg font-bold border-b border-black mb-2 flex items-center gap-2">
          <Bookmark size={14} /> MY LIBRARY
        </h2>
        <div className="space-y-1">
          {myLibrary.length === 0 ? (
            <p className="opacity-50">No books saved yet.</p>
          ) : (
            <div className="max-h-64 overflow-y-auto p-1 space-y-1 bg-gray-50/50">
              {myLibrary.slice(0, 4).map(book => (
                <div key={book.key} className="flex items-center gap-2 border-b border-black/10 pb-1 last:border-0 group">
                  <div className="w-6 h-8 border border-black flex-shrink-0 bg-white overflow-hidden">
                    {book.cover_i ? (
                      <img 
                        src={`https://covers.openlibrary.org/b/id/${book.cover_i}-S.jpg`} 
                        className="w-full h-full object-contain"
                        alt=""
                      />
                    ) : (
                      <Book size={10} className="m-auto opacity-30" />
                    )}
                  </div>
                  <span 
                    className="flex-grow truncate cursor-pointer hover:text-blue-700"
                    onClick={() => handleViewDetails(book)}
                  >
                    {book.title}
                  </span>
                  <button onClick={() => toggleLibrary(book)} className="text-red-600 opacity-0 group-hover:opacity-100 transition-opacity">[X]</button>
                </div>
              ))}
            </div>
          )}
          <button 
            onClick={() => setView('library')}
            className="w-full border border-black p-1 mt-2 hover:bg-black hover:text-white flex items-center justify-center gap-2"
          >
            <Layers size={12} /> VIEW FULL LIBRARY
          </button>
        </div>
      </section>

      <section>
        <h2 className="text-lg font-bold border-b border-black mb-2 flex items-center gap-2">
          <Filter size={14} /> POPULAR SUBJECTS
        </h2>
        <div className="flex flex-wrap gap-1">
          {['History', 'Science', 'Fiction', 'Art', 'Biography', 'Music'].map(s => (
            <button 
              key={s}
              onClick={() => { setQuery(s); setSearchField('subject'); handleSearch(undefined, 1, s, 'subject'); }}
              className="border border-black p-1 hover:bg-black hover:text-white flex items-center gap-1"
            >
              <Tag size={10} /> {s}
            </button>
          ))}
        </div>
      </section>

      {view === 'details' && selectedDoc?.ia?.[0] && (
        <section>
          <h2 className="text-lg font-bold border-b border-black mb-2 flex items-center gap-2">
            <BookOpen size={14} /> READING OPTIONS
          </h2>
          <button 
            onClick={() => openReader(selectedDoc.ia![0])}
            className="w-full border border-black p-2 bg-black text-white hover:bg-white hover:text-black transition-colors flex items-center justify-center gap-2"
          >
            <Activity size={14} /> LAUNCH DIGITAL READER
          </button>
        </section>
      )}

      <section className="p-2 border border-dotted border-black">
          <h3 className="text-sm font-bold mb-1 flex items-center gap-1">
            <Info size={12} /> SYSTEM STATUS
          </h3>
        <p>
          API: {loading ? 'BUSY' : 'READY'}<br />
          FOUND: {numFound}<br />
          LIB_SIZE: {myLibrary.length}<br />
          SOURCE: OPEN_LIBRARY
        </p>
      </section>
    </aside>
  );

  const renderResult = (doc: OpenLibraryDoc) => {
    const coverUrl = doc.cover_i 
      ? `https://covers.openlibrary.org/b/id/${doc.cover_i}-M.jpg`
      : null;

    return (
      <article key={doc.key} className="p-4 flex flex-col md:flex-row gap-4 border-b border-black/10 last:border-0 hover:bg-gray-50/50 transition-colors">
        <div 
          className="flex-shrink-0 w-24 h-32 border border-black flex items-center justify-center bg-gray-50 overflow-hidden cursor-pointer group relative"
          onClick={() => handleViewDetails(doc)}
        >
          {coverUrl ? (
            <img 
              src={coverUrl} 
              alt={doc.title} 
              className="w-full h-full object-contain group-hover:scale-105 transition-transform"
              referrerPolicy="no-referrer"
            />
          ) : (
            <Book size={32} strokeWidth={1} />
          )}
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
            <span className="bg-white text-black px-2 py-1 border border-black">VIEW</span>
          </div>
        </div>
        
        <div className="flex-grow">
          <h3 
            className="text-base font-bold cursor-pointer flex items-center gap-2"
            onClick={() => handleViewDetails(doc)}
          >
            <Book size={16} className="opacity-50" /> {doc.title}
          </h3>
          {doc.author_name && (
            <p className="flex items-center gap-1">
              <User size={12} className="opacity-50" /> by <span>{doc.author_name.join(', ')}</span>
            </p>
          )}
          
          <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1">
            {doc.first_publish_year && (
              <div className="flex items-center gap-1"><Calendar size={12} className="opacity-50" /> <span className="opacity-50">FIRST_PUBLISHED:</span> {doc.first_publish_year}</div>
            )}
            {doc.isbn && doc.isbn.length > 0 && (
              <div className="flex items-center gap-1"><Hash size={12} className="opacity-50" /> <span className="opacity-50">ISBN:</span> {doc.isbn[0]}</div>
            )}
            {doc.language && (
              <div className="flex items-center gap-1"><Globe size={12} className="opacity-50" /> <span className="opacity-50">LANG:</span> {doc.language.slice(0, 3).join(', ')}</div>
            )}
          </div>

          {doc.subject && (
            <div className="mt-2 flex flex-wrap gap-1">
              {doc.subject.slice(0, 3).map((s, i) => (
                <button 
                  key={i} 
                  onClick={(e) => { e.stopPropagation(); setQuery(s); setSearchField('subject'); handleSearch(undefined, 1, s, 'subject'); }}
                  className="border border-black px-1 hover:bg-black hover:text-white flex items-center gap-1"
                >
                  <Tag size={8} /> {s}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="flex flex-row md:flex-col gap-2 justify-end">
          <button 
            onClick={() => toggleLibrary(doc)}
            className={`border border-black p-1 px-2 flex items-center gap-1 transition-colors ${isInLibrary(doc.key) ? 'bg-black text-white' : 'hover:bg-black hover:text-white'}`}
          >
            {isInLibrary(doc.key) ? <BookmarkCheck size={12} /> : <Bookmark size={12} />}
            {isInLibrary(doc.key) ? 'SAVED' : 'SAVE'}
          </button>
          <button 
            onClick={() => handleViewDetails(doc)}
            className="border border-black p-1 px-2 flex items-center gap-1 hover:bg-black hover:text-white transition-colors"
          >
            <Eye size={12} /> DETAILS
          </button>
        </div>
      </article>
    );
  };

  const renderDetails = () => {
    if (!selectedWork || !selectedDoc) return null;

    const coverId = selectedWork.covers?.[0] || selectedDoc.cover_i;
    const coverUrl = coverId ? `https://covers.openlibrary.org/b/id/${coverId}-L.jpg` : null;
    const description = typeof selectedWork.description === 'string' 
      ? selectedWork.description 
      : selectedWork.description?.value || 'No description available.';

    const iaId = selectedDoc.ia?.[0];

    return (
      <div className="space-y-6">
        <button 
          onClick={() => setView(results.length > 0 ? 'search' : 'home')}
          className="p-1 px-4 flex items-center gap-2 hover:underline"
        >
          <ArrowLeft size={14} /> [back]
        </button>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="md:col-span-3 space-y-6">
            <div>
              <h2 className="text-2xl font-bold flex items-center gap-3">
                <Book size={28} className="opacity-30" /> {selectedWork.title}
              </h2>
              {selectedDoc.author_name && (
                <p className="mt-1 flex items-center gap-2">
                  <User size={18} className="opacity-30" /> by {selectedDoc.author_name.join(', ')}
                </p>
              )}
            </div>

            <div className="p-0 bg-white whitespace-pre-wrap leading-relaxed">
              <h3 className="text-sm font-bold border-b border-black mb-2 flex items-center gap-2"><Info size={14} /> Description</h3>
              <div className="text-gray-800">{description}</div>
            </div>

            {selectedWork.subjects && (
              <div>
                <h3 className="text-sm font-bold border-b border-black mb-2 flex items-center gap-2"><Tag size={14} /> Subjects</h3>
                <div className="flex flex-wrap gap-1">
                  {selectedWork.subjects.map((s, i) => (
                    <button 
                      key={i} 
                      onClick={() => { setQuery(s); setSearchField('subject'); handleSearch(undefined, 1, s, 'subject'); }}
                      className="border border-black px-2 py-0.5 hover:bg-black hover:text-white flex items-center gap-1"
                    >
                      <Tag size={8} /> {s}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="md:col-span-1 sticky top-[100px] h-fit">
            <div 
              className={`border border-black p-2 bg-gray-50 ${iaId ? 'cursor-pointer group relative' : ''}`}
              onClick={() => iaId && openReader(iaId)}
            >
              {coverUrl ? (
                <img 
                  src={coverUrl} 
                  alt={selectedWork.title} 
                  className="w-full border border-black group-hover:opacity-80 transition-opacity object-contain"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="aspect-[2/3] flex items-center justify-center border border-black">
                  <Book size={64} strokeWidth={1} />
                </div>
              )}
              {iaId && (
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <span className="bg-black text-white px-4 py-2 border border-white flex items-center gap-2"><BookOpen size={14} /> CLICK TO READ</span>
                </div>
              )}
            </div>
            
            <div className="mt-4 space-y-2">
              <div className="border-b border-black pb-1 flex items-center gap-2"><Database size={14} /> METADATA</div>
              <div className="flex items-center gap-1"><Hash size={10} className="opacity-50" /> ID: {selectedWork.key}</div>
              <div className="flex items-center gap-1"><Calendar size={10} className="opacity-50" /> YEAR: {selectedDoc.first_publish_year || 'N/A'}</div>
              <div className="flex items-center gap-1"><Globe size={10} className="opacity-50" /> PUB: {selectedDoc.publisher?.join(', ') || 'N/A'}</div>
              {selectedDoc.isbn && <div className="flex items-center gap-1"><Hash size={10} className="opacity-50" /> ISBN: {selectedDoc.isbn[0]}</div>}
              {selectedDoc.language && <div className="flex items-center gap-1"><Globe size={10} className="opacity-50" /> LANG: {selectedDoc.language.join(', ')}</div>}
              <button 
                onClick={() => toggleLibrary(selectedDoc)}
                className={`w-full border border-black p-2 mt-4 transition-colors flex items-center justify-center gap-2 ${isInLibrary(selectedDoc.key) ? 'bg-black text-white' : 'hover:bg-black hover:text-white'}`}
              >
                {isInLibrary(selectedDoc.key) ? <BookmarkCheck size={14} /> : <Bookmark size={14} />}
                {isInLibrary(selectedDoc.key) ? 'REMOVE FROM LIBRARY' : 'ADD TO MY LIBRARY'}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderReader = () => (
    <div className="fixed inset-0 z-[100] bg-black flex flex-col">
      <div className="p-2 flex justify-between items-center border-b border-white/20 text-white">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-2"><Activity size={14} /> READER_MODE</span>
          <span className="opacity-50">IA_ID: {readerId}</span>
        </div>
        <button 
          onClick={() => setView('details')}
          className="border border-white p-1 px-4 hover:bg-white hover:text-black flex items-center gap-2"
        >
          <X size={14} /> EXIT_READER
        </button>
      </div>
      <div className="flex-grow bg-neutral-900">
        <iframe 
          src={`https://archive.org/embed/${readerId}?ui=full`} 
          width="100%" 
          height="100%" 
          frameBorder="0" 
          webkitallowfullscreen="true" 
          mozallowfullscreen="true" 
          allowFullScreen
        ></iframe>
      </div>
    </div>
  );

  const renderLibrary = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center border-b border-black pb-2">
        <h2 className="text-xl font-bold flex items-center gap-3">
          <Bookmark size={24} /> MY LIBRARY ({myLibrary.length})
        </h2>
        <button 
          onClick={() => setView('home')}
          className="border border-black p-1 px-4 hover:bg-black hover:text-white flex items-center gap-2"
        >
          <ArrowLeft size={14} /> [BACK_TO_HOME]
        </button>
      </div>

      {myLibrary.length === 0 ? (
        <div className="py-20 text-center border border-dashed border-black">
          <p>Your library is empty.</p>
          <p className="mt-2">"A room without books is like a body without a soul."</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {myLibrary.map(renderResult)}
        </div>
      )}
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header - Sticky */}
      <header className="p-4 border-b border-black sticky top-0 z-50 bg-white shadow-sm">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="cursor-pointer" onClick={() => setView('home')}>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Database size={24} /> OPEN LIBRARY EXPLORER
            </h1>
            <p className="opacity-70">Decentralized Knowledge Access Protocol</p>
          </div>
          
          <form onSubmit={(e) => handleSearch(e)} className="flex flex-col md:flex-row gap-4 w-full md:w-auto">
            <div className="relative">
              <select 
                value={searchField}
                onChange={(e) => setSearchField(e.target.value)}
                className="border-b border-black p-1 bg-transparent appearance-none pr-6 focus:outline-none"
              >
                {SEARCH_FIELDS.map(f => (
                  <option key={f.id} value={f.id}>{f.label}</option>
                ))}
              </select>
              <div className="absolute right-1 top-1/2 -translate-y-1/2 pointer-events-none">
                <Filter size={10} />
              </div>
            </div>
            <div className="relative flex-grow md:w-64">
              <input 
                type="text" 
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search query..."
                className="border-b border-black p-1 w-full pl-7 bg-transparent focus:outline-none"
                disabled={loading}
              />
              <div className="absolute left-2 top-1/2 -translate-y-1/2 opacity-30">
                <Search size={14} />
              </div>
            </div>
            <button 
              type="submit" 
              className="p-1 px-4 cursor-pointer hover:underline disabled:opacity-50 flex items-center gap-2 transition-colors"
              disabled={loading}
            >
              {loading ? <Activity size={14} className="animate-spin" /> : <Search size={14} />}
              {loading ? '[BUSY...]' : '[QUERY]'}
            </button>
          </form>
        </div>
      </header>

      <main className="flex-grow p-4 max-w-6xl mx-auto w-full">
        {error && (
          <div className="mb-4 p-2 border border-black bg-gray-100 flex items-center gap-2">
            <X size={14} className="text-red-600" /> ERROR: {error}
          </div>
        )}

        {view === 'reader' ? (
          renderReader()
        ) : view === 'library' ? (
          renderLibrary()
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <Sidebar />
            <div className="md:col-span-3">
              {view === 'details' ? (
                renderDetails()
              ) : (
                <section>
                  <div className="flex justify-between items-end mb-4 border-b border-black pb-1">
                    <h2 className="text-lg font-bold uppercase flex items-center gap-2">
                      {loading ? <Activity size={16} className="animate-spin" /> : <Layers size={16} />}
                      {loading ? 'Fetching...' : view === 'home' ? 'Trending Books' : `Results (${numFound})`}
                    </h2>
                  </div>

                  {loading ? (
                    <div className="py-20 text-center border border-dashed border-black">
                      <p className="flex items-center justify-center gap-2"><Activity size={16} className="animate-spin" /> EXECUTING_SEARCH_QUERY...</p>
                      <div className="mt-4 flex justify-center gap-1">
                        <div className="w-2 h-2 bg-black animate-bounce" style={{ animationDelay: '0ms' }}></div>
                        <div className="w-2 h-2 bg-black animate-bounce" style={{ animationDelay: '150ms' }}></div>
                        <div className="w-2 h-2 bg-black animate-bounce" style={{ animationDelay: '300ms' }}></div>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {(view === 'home' ? trending : results)
                        .slice((localPage - 1) * itemsPerPage, localPage * itemsPerPage)
                        .map(renderResult)}
                      
                      {/* Local Pagination */}
                      {(view === 'home' ? trending : results).length > itemsPerPage && (
                        <div className="mt-8 flex flex-wrap justify-center gap-2 border-t border-black pt-4">
                          {Array.from({ length: Math.ceil((view === 'home' ? trending : results).length / itemsPerPage) }).map((_, i) => (
                            <button
                              key={i}
                              onClick={() => { setLocalPage(i + 1); window.scrollTo(0, 0); }}
                              className={`px-2 py-1 border border-black hover:bg-black hover:text-white transition-colors ${localPage === i + 1 ? 'bg-black text-white' : ''}`}
                            >
                              {i + 1}
                            </button>
                          ))}
                        </div>
                      )}

                      {view === 'home' && trending.length === 0 && (
                        <div className="py-20 text-center border border-dashed border-black">
                          <p className="flex items-center justify-center gap-2"><Activity size={16} className="animate-spin" /> Loading trending books...</p>
                        </div>
                      )}
                      {view === 'search' && results.length === 0 && (
                        <div className="py-20 text-center border border-dashed border-black">
                          <p>No results found for "{query}".</p>
                        </div>
                      )}
                    </div>
                  )}
                </section>
              )}
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="p-4 border-t border-black mt-8">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-2"><Database size={12} /> OPEN_LIBRARY_EXPLORER_V2.3.0</div>
          <div className="flex gap-4">
            <a href="https://openlibrary.org" target="_blank" rel="noopener noreferrer" className="underline flex items-center gap-1"><ExternalLink size={10} /> OPENLIBRARY.ORG</a>
            <a href="#" className="underline flex items-center gap-1"><Activity size={10} /> STATUS</a>
          </div>
          <div>{new Date().toISOString().split('T')[0]}</div>
        </div>
      </footer>
    </div>
  );
}
