import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  Code,
  Search,
  Plus,
  ChevronDown,
  ChevronRight,
  Edit3,
  Trash2,
  MoreVertical,
  RefreshCw,
  Filter,
  Maximize2,
  Minimize2,
  X,
  BookOpen,
  Check,
  Loader2,
} from 'lucide-react';
import { supabase } from './supabaseClient';

export type VocabItem = {
  id: string;
  wordGroup: string;
  meaningGroup: string;
  noun: string;
  adj: string;
  verb: string;
  adv: string;
  antonyms: string;
  collocations: string;
  tags: string[];
};

const ALL_AVAILABLE_TAGS = ['Core', 'P1', 'P2', 'Reading', 'Writing', 'Tech', 'Culture', 'Academic'];

export default function App() {
  const [vocabData, setVocabData] = useState<VocabItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({});
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<VocabItem | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Form states for Modal
  const [formGroup, setFormGroup] = useState('');
  const [formMeaning, setFormMeaning] = useState('');
  const [formNoun, setFormNoun] = useState('');
  const [formAdj, setFormAdj] = useState('');
  const [formVerb, setFormVerb] = useState('');
  const [formAdv, setFormAdv] = useState('');
  const [formAntonyms, setFormAntonyms] = useState('');
  const [formCollocations, setFormCollocations] = useState('');
  const [formTags, setFormTags] = useState<string[]>([]);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const searchInputRef = useRef<HTMLInputElement>(null);

  const fetchVocab = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('vocab_items')
        .select('*')
        .order('word_group', { ascending: true });

      if (error) {
        console.error('Error fetching vocab:', error);
      } else if (data) {
        // Map database fields to application state interface
        const mappedData: VocabItem[] = data.map((item) => ({
          id: item.id,
          wordGroup: item.word_group,
          meaningGroup: item.meaning_group,
          noun: item.noun || '',
          adj: item.adj || '',
          verb: item.verb || '',
          adv: item.adv || '',
          antonyms: item.antonyms || '',
          collocations: item.collocations || '',
          tags: item.tags || [],
        }));
        setVocabData(mappedData);
      }
    } catch (err) {
      console.error('Unexpected error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVocab();
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
      if (
        e.key.toLowerCase() === 'n' &&
        !['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement).tagName) &&
        !isModalOpen
      ) {
        e.preventDefault();
        handleOpenAddModal();
      }
      if (e.key === 'Escape') {
        setIsModalOpen(false);
        setActiveMenuId(null);
      }
    };

    const handleClickOutside = () => setActiveMenuId(null);

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('click', handleClickOutside);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('click', handleClickOutside);
    };
  }, [isModalOpen]);

  const handleOpenAddModal = () => {
    setEditingItem(null);
    setFormGroup('');
    setFormMeaning('');
    setFormNoun('');
    setFormAdj('');
    setFormVerb('');
    setFormAdv('');
    setFormAntonyms('');
    setFormCollocations('');
    setFormTags(['P1']);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (item: VocabItem) => {
    setEditingItem(item);
    setFormGroup(item.wordGroup);
    setFormMeaning(item.meaningGroup);
    setFormNoun(item.noun);
    setFormAdj(item.adj);
    setFormVerb(item.verb);
    setFormAdv(item.adv);
    setFormAntonyms(item.antonyms);
    setFormCollocations(item.collocations);
    setFormTags(item.tags);
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formGroup.trim() || !formMeaning.trim()) return;

    setIsSaving(true);
    const dbPayload = {
      word_group: formGroup,
      meaning_group: formMeaning,
      noun: formNoun,
      adj: formAdj,
      verb: formVerb,
      adv: formAdv,
      antonyms: formAntonyms,
      collocations: formCollocations,
      tags: formTags,
    };

    if (editingItem) {
      const { error } = await supabase
        .from('vocab_items')
        .update(dbPayload)
        .eq('id', editingItem.id);

      if (error) {
        console.error('Error updating item:', error);
      } else {
        await fetchVocab();
        setIsModalOpen(false);
      }
    } else {
      const { error } = await supabase
        .from('vocab_items')
        .insert([dbPayload]);

      if (error) {
        console.error('Error inserting item:', error);
      } else {
        await fetchVocab();
        setIsModalOpen(false);
      }
    }
    setIsSaving(false);
  };

  const confirmDelete = async () => {
    if (!deletingId) return;

    const { error } = await supabase
      .from('vocab_items')
      .delete()
      .eq('id', deletingId);

    if (error) {
      console.error('Error deleting item:', error);
      alert('刪除失敗：' + error.message);
    } else {
      setVocabData((prev) => prev.filter((item) => item.id !== deletingId));
    }

    setDeletingId(null); // 關閉 Modal
  };

  const filteredData = useMemo(() => {
    return vocabData.filter((item) => {
      const query = searchQuery.toLowerCase();
      const matchesSearch =
        query === '' ||
        item.wordGroup.toLowerCase().includes(query) ||
        item.meaningGroup.toLowerCase().includes(query) ||
        item.noun.toLowerCase().includes(query) ||
        item.adj.toLowerCase().includes(query) ||
        item.verb.toLowerCase().includes(query) ||
        item.adv.toLowerCase().includes(query) ||
        item.antonyms.toLowerCase().includes(query) ||
        item.collocations.toLowerCase().includes(query);

      const matchesTags =
        selectedTags.length === 0 ||
        selectedTags.every((tag) => item.tags.includes(tag));

      return matchesSearch && matchesTags;
    });
  }, [vocabData, searchQuery, selectedTags]);

  const groupedData = useMemo(() => {
    return filteredData.reduce<Record<string, VocabItem[]>>((acc, item) => {
      if (!acc[item.wordGroup]) acc[item.wordGroup] = [];
      acc[item.wordGroup].push(item);
      return acc;
    }, {});
  }, [filteredData]);

  const uniqueGroups = useMemo(() => {
    return Array.from(new Set(vocabData.map((item) => item.wordGroup)));
  }, [vocabData]);

  const toggleGroup = (groupName: string) => {
    setCollapsedGroups((prev) => ({
      ...prev,
      [groupName]: !prev[groupName],
    }));
  };

  const expandAll = () => setCollapsedGroups({});
  const collapseAll = () => {
    const allCollapsed: Record<string, boolean> = {};
    Object.keys(groupedData).forEach((key) => (allCollapsed[key] = true));
    setCollapsedGroups(allCollapsed);
  };

  const renderFormattedCollocations = (text: string) => {
    if (!text) return <span className="text-gray-600">—</span>;
    return text.split('\n').map((line, idx) => {
      const parts = line.split(/(\*\*.*?\*\*)/g);
      return (
        <div key={idx} className="font-mono text-sm text-gray-300 leading-relaxed">
          {parts.map((part, pIdx) => {
            if (part.startsWith('**') && part.endsWith('**')) {
              return (
                <span key={pIdx} className="font-bold text-blue-400">
                  {part.slice(2, -2)}
                </span>
              );
            }
            return part;
          })}
        </div>
      );
    });
  };

  return (
    <div className="min-h-screen bg-[#0F1012] text-[#E1E4E8] font-sans antialiased selection:bg-blue-500 selection:text-white">
      {/* Header Bar */}
      <header className="sticky top-0 z-40 bg-[#141517] border-b border-[#222429] px-4 py-3">
        <div className="max-w-[1800px] 7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">

          {/* Brand Title */}
          <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-start">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-[#1E2024] rounded-md border border-[#2C2E33] flex items-center justify-center text-blue-400">
                <Code className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-sm font-semibold tracking-tight text-gray-100">VocabNotebook</h1>
                  <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    Supabase Active
                  </span>
                </div>
                <p className="text-[11px] font-mono text-gray-500">Cloud Lexicon Dashboard</p>
              </div>
            </div>

            {/* Quick Stats Pill */}
            <div className="flex items-center gap-2 bg-[#18191C] px-2.5 py-1 rounded-md border border-[#26282E] text-sm">
              <span className="text-gray-400 font-mono text-[11px]">
                <strong className="text-gray-200">{uniqueGroups.length}</strong> Groups
              </span>
              <span className="text-gray-600">•</span>
              <span className="text-blue-400 font-mono text-[11px]">
                <strong className="text-gray-200">{vocabData.length}</strong> Words
              </span>
            </div>
          </div>

          {/* Search & Action Controls */}
          <div className="flex items-center gap-3 w-full md:w-auto">
            <div className="relative flex-1 md:w-72">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search terms, collocations... (⌘K)"
                className="w-full bg-[#18191C] border border-[#26282E] focus:border-blue-500 focus:outline-none rounded-md pl-8 pr-8 py-1.5 text-sm text-gray-200 placeholder-gray-500 transition-colors"
              />
              <kbd className="absolute right-2 top-1/2 -translate-y-1/2 text-[9px] font-mono px-1 py-0.5 bg-[#222429] border border-[#2C2E33] rounded text-gray-400 pointer-events-none">
                ⌘K
              </kbd>
            </div>

            <button
              onClick={handleOpenAddModal}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-md text-sm font-medium transition-colors shrink-0 shadow-sm cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Word</span>
              <kbd className="ml-1 text-[9px] font-mono px-1 py-0.2 bg-blue-700/50 rounded text-blue-200">
                N
              </kbd>
            </button>
          </div>

        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-[1800px] mx-auto px-4 py-6">

        {/* Controls Bar */}
        <div className="bg-[#141517] border border-[#222429] rounded-lg p-3 mb-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-3">

          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
            <div className="flex items-center gap-1.5 text-sm text-gray-400 mr-2">
              <Filter className="w-3.5 h-3.5 text-gray-500" />
              <span>Tags:</span>
            </div>

            {ALL_AVAILABLE_TAGS.map((tag) => {
              const isSelected = selectedTags.includes(tag);
              return (
                <button
                  key={tag}
                  onClick={() =>
                    setSelectedTags((prev) =>
                      isSelected ? prev.filter((t) => t !== tag) : [...prev, tag]
                    )
                  }
                  className={`px-2 py-0.5 rounded text-[11px] font-mono transition-all border cursor-pointer ${isSelected
                    ? 'bg-blue-600/20 border-blue-500/40 text-blue-300'
                    : 'bg-[#18191C] border-[#26282E] text-gray-400 hover:text-gray-200 hover:border-gray-700'
                    }`}
                >
                  #{tag}
                </button>
              );
            })}

            {selectedTags.length > 0 && (
              <button
                onClick={() => setSelectedTags([])}
                className="text-[11px] text-gray-500 hover:text-gray-300 underline underline-offset-2 ml-1 cursor-pointer"
              >
                Clear
              </button>
            )}
          </div>

          <div className="flex items-center gap-1 self-end md:self-auto">
            <button
              onClick={expandAll}
              title="Expand All Groups"
              className="p-1.5 bg-[#18191C] border border-[#26282E] hover:bg-[#222429] rounded text-gray-400 hover:text-gray-200 transition-colors cursor-pointer"
            >
              <Maximize2 className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={collapseAll}
              title="Collapse All Groups"
              className="p-1.5 bg-[#18191C] border border-[#26282E] hover:bg-[#222429] rounded text-gray-400 hover:text-gray-200 transition-colors cursor-pointer"
            >
              <Minimize2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Vocab Data Table */}
        <div className="bg-[#141517] border border-[#222429] rounded-lg overflow-hidden shadow-2xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#1A1C1F] border-b border-[#222429] text-[11px] font-mono tracking-wider uppercase">
                  <th className="py-2.5 px-4 text-gray-400 w-[14%]">Meaning Group</th>
                  <th className="py-2.5 px-3 text-blue-400 w-[11%]">Noun</th>
                  <th className="py-2.5 px-3 text-amber-400 w-[11%]">Verb</th>
                  <th className="py-2.5 px-3 text-teal-400 w-[11%]">Adj</th>
                  <th className="py-2.5 px-3 text-purple-400 w-[11%]">Adv</th>
                  <th className="py-2.5 px-4 text-red-400 w-[11%]">Antonyms</th>
                  <th className="py-2.5 px-4 text-gray-400 w-[25%]">Collocations & Usage</th>
                  <th className="py-2.5 px-4 text-gray-400 w-[3%] text-right">Tags / Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#222429]">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-gray-400 text-sm">
                      <div className="flex items-center justify-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
                        <span>Loading entries from Supabase...</span>
                      </div>
                    </td>
                  </tr>
                ) : Object.keys(groupedData).length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-gray-500 text-sm">
                      No matching vocabulary found. Try adding new words or adjusting filters.
                    </td>
                  </tr>
                ) : (
                  Object.entries(groupedData).map(([groupName, items]) => {
                    const isCollapsed = collapsedGroups[groupName];

                    return (
                      <React.Fragment key={groupName}>
                        <tr className="bg-[#181A1D] hover:bg-[#1C1E22] transition-colors border-y border-[#26282E]">
                          <td colSpan={7} className="py-2 px-3">
                            <button
                              onClick={() => toggleGroup(groupName)}
                              className="flex items-center gap-2 w-full text-left cursor-pointer"
                            >
                              <div className="text-gray-400">
                                {isCollapsed ? (
                                  <ChevronRight className="w-4 h-4" />
                                ) : (
                                  <ChevronDown className="w-4 h-4" />
                                )}
                              </div>
                              <span className="font-mono text-sm font-bold text-gray-200">
                                ▶ {groupName}
                              </span>
                              <span className="px-1.5 py-0.2 text-[10px] font-mono bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded">
                                {items.length}
                              </span>
                            </button>
                          </td>
                        </tr>

                        {!isCollapsed &&
                          items.map((row) => (
                            <tr
                              key={row.id}
                              className="hover:bg-[#181A1C] transition-colors group border-b border-[#222429]/60"
                            >
                              <td className="py-3 px-4 text-sm font-medium text-gray-200 align-top whitespace-pre-line">
                                {row.meaningGroup}
                              </td>

                              <td className="py-3 px-3 text-sm font-mono text-blue-400 align-top whitespace-pre-line">
                                {row.noun || <span className="text-gray-600">—</span>}
                              </td>

                              <td className="py-3 px-3 text-sm font-mono text-amber-400 align-top whitespace-pre-line">
                                {row.verb || <span className="text-gray-600">—</span>}
                              </td>

                              <td className="py-3 px-3 text-sm font-mono text-teal-400 align-top whitespace-pre-line">
                                {row.adj || <span className="text-gray-600">—</span>}
                              </td>

                              <td className="py-3 px-3 text-sm font-mono text-purple-400 align-top whitespace-pre-line">
                                {row.adv || <span className="text-gray-600">—</span>}
                              </td>

                              <td className="py-3 px-3 text-sm font-mono text-red-400 align-top whitespace-pre-line">
                                {row.antonyms || <span className="text-gray-600">—</span>}
                              </td>

                              <td className="py-3 px-4 align-top">
                                {renderFormattedCollocations(row.collocations)}
                              </td>

                              <td className="py-3 px-4 align-top text-right">
                                <div className="flex items-center justify-end gap-2 relative">
                                  <div className="flex flex-wrap justify-end gap-1">
                                    {row.tags.map((tag) => (
                                      <span
                                        key={tag}
                                        className="px-1.5 py-0.5 text-[10px] font-mono bg-[#1E2024] border border-[#2C2E33] text-gray-400 rounded"
                                      >
                                        {tag}
                                      </span>
                                    ))}
                                  </div>

                                  <div className="relative">
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setActiveMenuId(activeMenuId === row.id ? null : row.id);
                                      }}
                                      className="p-1 rounded hover:bg-[#26282E] text-gray-400 hover:text-gray-200 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                                    >
                                      <MoreVertical className="w-3.5 h-3.5" />
                                    </button>

                                    {activeMenuId === row.id && (
                                      <div
                                        onClick={(e) => e.stopPropagation()}
                                        className="absolute right-0 top-6 w-28 bg-[#18191C] border border-[#26282E] rounded-md shadow-xl py-1 z-50 text-left"
                                      >
                                        <button
                                          onClick={() => {
                                            setActiveMenuId(null);
                                            handleOpenEditModal(row);
                                          }}
                                          className="w-full px-3 py-1.5 text-sm text-gray-300 hover:bg-[#222429] flex items-center gap-2 cursor-pointer"
                                        >
                                          <Edit3 className="w-3.5 h-3.5 text-gray-400" />
                                          <span>Edit</span>
                                        </button>
                                        <button
                                          onClick={() => {
                                            setActiveMenuId(null);
                                            setDeletingId(row.id);
                                          }}
                                          className="w-full px-3 py-1.5 text-sm text-red-400 hover:bg-[#222429] flex items-center gap-2 cursor-pointer"
                                        >
                                          <Trash2 className="w-3.5 h-3.5" />
                                          <span>Delete</span>
                                        </button>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </td>
                            </tr>
                          ))}
                      </React.Fragment>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

      </main>

      {/* Add / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-[#141517] border border-[#26282E] w-full max-w-3xl rounded-lg shadow-2xl overflow-hidden">

            <div className="flex items-center justify-between px-5 py-3.5 border-b border-[#222429] bg-[#18191C]">
              <div className="flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-blue-400" />
                <h3 className="text-sm font-semibold text-gray-200">
                  {editingItem ? 'Edit Vocabulary Entry' : 'Add Vocabulary Entry'}
                </h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-gray-500 hover:text-gray-300 p-1 rounded hover:bg-[#222429] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-5 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-mono text-gray-400 mb-1">
                    Word Group *
                  </label>
                  <input
                    type="text"
                    required
                    list="group-options"
                    value={formGroup}
                    onChange={(e) => setFormGroup(e.target.value)}
                    placeholder="e.g., Mystery & Ambiguity"
                    className="w-full bg-[#18191C] border border-[#26282E] focus:border-blue-500 focus:outline-none rounded px-3 py-1.5 text-sm text-gray-200"
                  />
                  <datalist id="group-options">
                    {uniqueGroups.map((g) => (
                      <option key={g} value={g} />
                    ))}
                  </datalist>
                </div>

                <div>
                  <label className="block text-[11px] font-mono text-gray-400 mb-1">
                    Meaning Group (Definition) *
                  </label>
                  <textarea
                    required
                    value={formMeaning}
                    onChange={(e) => setFormMeaning(e.target.value)}
                    placeholder="e.g., 難解之謎 / 未知事物"
                    className="w-full bg-[#18191C] border border-[#26282E] focus:border-blue-500 focus:outline-none rounded px-3 py-1.5 text-sm text-gray-200"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-mono text-gray-400 mb-1.5">
                  Parts of Speech (POS)
                </label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  <div>
                    <span className="block text-[10px] font-mono text-blue-400 mb-0.5">Noun</span>
                    <textarea
                      rows={3}
                      value={formNoun}
                      onChange={(e) => setFormNoun(e.target.value)}
                      placeholder="mystery"
                      className="w-full bg-[#18191C] border border-[#26282E] focus:border-blue-500 focus:outline-none rounded px-2.5 py-1 text-sm text-blue-400 font-mono"
                    />
                  </div>
                  <div>
                    <span className="block text-[10px] font-mono text-amber-400 mb-0.5">Verb</span>
                    <input
                      type="text"
                      value={formVerb}
                      onChange={(e) => setFormVerb(e.target.value)}
                      placeholder="mystify"
                      className="w-full bg-[#18191C] border border-[#26282E] focus:border-amber-500 focus:outline-none rounded px-2.5 py-1 text-sm text-amber-400 font-mono"
                    />
                  </div>
                  <div>
                    <span className="block text-[10px] font-mono text-teal-400 mb-0.5">Adjective</span>
                    <textarea
                      rows={3}
                      value={formAdj}
                      onChange={(e) => setFormAdj(e.target.value)}
                      placeholder="mysterious"
                      className="w-full bg-[#18191C] border border-[#26282E] focus:border-teal-500 focus:outline-none rounded px-2.5 py-1 text-sm text-teal-400 font-mono"
                    />
                  </div>

                  <div>
                    <span className="block text-[10px] font-mono text-purple-400 mb-0.5">Adverb</span>
                    <input
                      type="text"
                      value={formAdv}
                      onChange={(e) => setFormAdv(e.target.value)}
                      placeholder="mysteriously"
                      className="w-full bg-[#18191C] border border-[#26282E] focus:border-purple-500 focus:outline-none rounded px-2.5 py-1 text-sm text-purple-400 font-mono"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-red-400 mb-1">Antonyms</label>
                <textarea
                  rows={2}
                  placeholder="e.g. clear, explicit"
                  value={formAntonyms}
                  onChange={(e) => setFormAntonyms(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-md px-3 py-1.5 text-sm text-zinc-100 focus:outline-none focus:border-red-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-mono text-gray-400 mb-1">
                  Collocations & Usage (Use <code className="text-blue-400">**text**</code> for bold)
                </label>
                <textarea
                  rows={3}
                  value={formCollocations}
                  onChange={(e) => setFormCollocations(e.target.value)}
                  placeholder="• solve a **mystery**&#10;• wrapped in **secrecy**"
                  className="w-full bg-[#18191C] border border-[#26282E] focus:border-blue-500 focus:outline-none rounded p-2.5 text-sm text-gray-200 font-mono"
                />
              </div>

              <div>
                <label className="block text-[11px] font-mono text-gray-400 mb-1">
                  Tags
                </label>
                <div className="flex flex-wrap gap-1.5 p-2 bg-[#18191C] border border-[#26282E] rounded max-h-24 overflow-y-auto">
                  {ALL_AVAILABLE_TAGS.map((tag) => {
                    const isChecked = formTags.includes(tag);
                    return (
                      <button
                        type="button"
                        key={tag}
                        onClick={() =>
                          setFormTags((prev) =>
                            isChecked ? prev.filter((t) => t !== tag) : [...prev, tag]
                          )
                        }
                        className={`px-2 py-0.5 rounded text-[10px] font-mono flex items-center gap-1 border transition-colors cursor-pointer ${isChecked
                          ? 'bg-blue-600/30 border-blue-500 text-blue-300'
                          : 'bg-[#1E2024] border-[#2C2E33] text-gray-400 hover:text-gray-200'
                          }`}
                      >
                        {isChecked && <Check className="w-2.5 h-2.5" />}
                        #{tag}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#222429]">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-3 py-1.5 rounded border border-[#26282E] text-sm text-gray-400 hover:text-gray-200 hover:bg-[#18191C] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-4 py-1.5 rounded bg-blue-600 hover:bg-blue-500 disabled:bg-blue-800 text-white text-sm font-medium cursor-pointer flex items-center gap-1.5"
                >
                  {isSaving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>{editingItem ? 'Save Changes' : 'Create Entry'}</span>
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="mt-12 border-t border-[#222429] bg-[#141517] py-3 px-4 text-sm">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 text-gray-500">
          <div className="flex items-center gap-2">
            <RefreshCw className="w-3 h-3 text-emerald-500 animate-spin" style={{ animationDuration: '6s' }} />
            <span>Supabase Cloud Connected</span>
          </div>

          <div className="flex items-center gap-3 font-mono text-[11px]">
            <span>
              Shortcuts: <kbd className="px-1 py-0.5 bg-[#1E2024] border border-[#2C2E33] rounded">⌘ K</kbd> Search
            </span>
            <span>
              <kbd className="px-1 py-0.5 bg-[#1E2024] border border-[#2C2E33] rounded">N</kbd> Add Word
            </span>
          </div>
        </div>
      </footer>

      {deletingId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-[#141517] border border-[#26282E] p-6 rounded-lg max-w-sm w-full space-y-4 shadow-2xl">
            <h3 className="text-sm font-semibold text-gray-200">Delete Vocabulary Entry?</h3>
            <p className="text-xs text-gray-400">This action cannot be undone. Are you sure you want to proceed?</p>
            <div className="flex justify-end space-x-3 pt-2">
              <button
                onClick={() => setDeletingId(null)}
                className="px-3 py-1.5 text-xs text-gray-400 hover:text-gray-200 transition"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="px-3 py-1.5 text-xs bg-rose-600 hover:bg-rose-500 text-white rounded transition shadow"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}