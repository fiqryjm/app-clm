'use client'

import { useState, useEffect } from 'react'
import { Plus, Trash2, Upload, FileIcon, Download, Loader2 } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import type { AttachedDocument } from '@/types/database'

const DOCUMENT_TYPES = ['BODY OF CONTRACT', 'EXHIBIT', 'BOND', 'OTHER']

const TYPE_COLORS: Record<string, { bg: string; color: string }> = {
  'BODY OF CONTRACT': { bg: 'hsl(239 84% 67% / 0.15)', color: 'hsl(239 84% 75%)' },
  'EXHIBIT': { bg: 'hsl(199 89% 48% / 0.15)', color: 'hsl(199 89% 60%)' },
  'BOND': { bg: 'hsl(38 92% 50% / 0.15)', color: 'hsl(38 92% 60%)' },
  'OTHER': { bg: 'hsl(215 20% 55% / 0.15)', color: 'hsl(215 20% 65%)' },
}

export function DocumentsTab({ contractId }: { contractId: string }) {
  const [docs, setDocs] = useState<AttachedDocument[]>([])
  const [loading, setLoading] = useState(true)
  const [uploadingId, setUploadingId] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      setLoading(true)
      const { data } = await supabase
        .from('attached_documents')
        .select('*')
        .eq('contract_id', contractId)
        .order('created_at', { ascending: true })

      const mapped = ((data as AttachedDocument[]) ?? []).map((d: AttachedDocument, i: number) => ({
        ...d,
        item_no: d.item_no ?? i + 1,
      }))
      setDocs(mapped)
      setLoading(false)
    }
    load()
  }, [contractId])

  const addDocRow = async () => {
    const nextNo = (docs.at(-1)?.item_no ?? 0) + 1
    const { data } = await supabase
      .from('attached_documents')
      .insert({
        contract_id: contractId,
        item_no: nextNo,
        document_type: 'OTHER',
        description: null,
        file_name: null,
        file_url: null,
      })
      .select()
      .single()
    if (data) setDocs([...docs, data])
  }

  const updateDocField = async (id: string, field: string, value: string | null) => {
    setDocs(docs.map((d) => (d.id === id ? { ...d, [field]: value } : d)))
    await supabase.from('attached_documents').update({ [field]: value }).eq('id', id)
  }

  const handleFileUpload = async (docId: string, file: File) => {
    try {
      setUploadingId(docId)
      const fileExt = file.name.split('.').pop()
      const filePath = `${contractId}/${docId}_${Date.now()}.${fileExt}`

      const { error: uploadError } = await supabase.storage
        .from('contract-documents')
        .upload(filePath, file, { upsert: true })

      if (uploadError) {
        console.error('Storage upload error:', uploadError)
        alert(`Upload error: ${uploadError.message}. Did you create the 'contract-documents' bucket in Supabase?`)
        setUploadingId(null)
        return
      }

      const { data: urlData } = supabase.storage
        .from('contract-documents')
        .getPublicUrl(filePath)

      const fileUrl = urlData.publicUrl

      await supabase
        .from('attached_documents')
        .update({
          file_name: file.name,
          file_url: fileUrl,
        })
        .eq('id', docId)

      setDocs(
        docs.map((d) =>
          d.id === docId ? { ...d, file_name: file.name, file_url: fileUrl } : d
        )
      )
    } catch (err: unknown) {
      console.error('File upload failed:', err)
      alert('Upload failed. Please check network or Supabase bucket config.')
    } finally {
      setUploadingId(null)
    }
  }

  const deleteDoc = async (id: string) => {
    await supabase.from('attached_documents').delete().eq('id', id)
    setDocs(docs.filter((d) => d.id !== id))
  }

  const uploadedCount = docs.filter((d) => d.file_url).length

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 size={28} className="animate-spin" style={{ color: 'hsl(var(--primary))' }} />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Category stats */}
      <div className="grid grid-cols-4 gap-4">
        {DOCUMENT_TYPES.map((type) => {
          const count = docs.filter((d) => d.document_type === type).length
          const uploaded = docs.filter((d) => d.document_type === type && d.file_url).length
          const col = TYPE_COLORS[type]
          return (
            <div key={type} className="card p-4">
              <span
                className="text-xs font-medium px-2 py-0.5 rounded mb-2 inline-block"
                style={{ background: col.bg, color: col.color }}
              >
                {type}
              </span>
              <div className="text-xl font-bold" style={{ color: col.color }}>
                {uploaded}/{count}
              </div>
              <div className="text-xs" style={{ color: 'hsl(var(--foreground-muted))' }}>
                uploaded
              </div>
            </div>
          )
        })}
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <div
          className="flex items-center justify-between px-5 py-4 border-b"
          style={{ borderColor: 'hsl(var(--border))' }}
        >
          <div>
            <h3 className="font-semibold text-sm" style={{ color: 'hsl(var(--foreground))' }}>
              Contract Repository
            </h3>
            <p className="text-xs mt-0.5" style={{ color: 'hsl(var(--foreground-muted))' }}>
              {uploadedCount} of {docs.length} documents uploaded
            </p>
          </div>
          <button onClick={addDocRow} className="btn-secondary py-1.5 text-xs">
            <Plus size={13} />
            Add Row
          </button>
        </div>

        {docs.length === 0 ? (
          <div className="text-center py-12 text-sm" style={{ color: 'hsl(var(--foreground-muted))' }}>
            No documents listed yet. Click "Add Row" to start uploading documents.
          </div>
        ) : (
          <div className="divide-y" style={{ borderColor: 'hsl(var(--border) / 0.5)' }}>
            {docs.map((doc) => {
              const isUploading = uploadingId === doc.id
              return (
                <div key={doc.id} className="flex items-center gap-3 px-5 py-3.5">
                  <span
                    className="w-6 text-xs text-center font-medium flex-shrink-0"
                    style={{ color: 'hsl(var(--foreground-muted))' }}
                  >
                    {doc.item_no}
                  </span>

                  {/* Fixed width dropdown */}
                  <div className="w-52 flex-shrink-0">
                    <select
                      value={doc.document_type || 'OTHER'}
                      onChange={(e) => updateDocField(doc.id, 'document_type', e.target.value)}
                      className="input-base py-1.5 text-xs w-full cursor-pointer"
                    >
                      {DOCUMENT_TYPES.map((t) => (
                        <option key={t} value={t}>
                          {t}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Flexible description input */}
                  <div className="flex-1 min-w-0">
                    <input
                      type="text"
                      value={doc.description || ''}
                      onChange={(e) => updateDocField(doc.id, 'description', e.target.value || null)}
                      className="input-base py-1.5 text-xs w-full"
                      placeholder="Document description (e.g. Technical Spec Exhibit 1)..."
                    />
                  </div>

                  {/* Upload / Download area */}
                  <div className="w-64 flex-shrink-0">
                    {isUploading ? (
                      <div
                        className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs"
                        style={{
                          background: 'hsl(var(--primary) / 0.1)',
                          color: 'hsl(var(--primary))',
                        }}
                      >
                        <Loader2 size={13} className="animate-spin" />
                        Uploading...
                      </div>
                    ) : doc.file_url ? (
                      <div
                        className="flex items-center justify-between gap-2 px-3 py-1.5 rounded-lg text-xs"
                        style={{
                          background: 'hsl(var(--success) / 0.1)',
                          border: '1px solid hsl(var(--success) / 0.3)',
                        }}
                      >
                        <div className="flex items-center gap-2 min-w-0 flex-1">
                          <FileIcon size={13} className="flex-shrink-0" style={{ color: 'hsl(var(--success))' }} />
                          <span className="truncate" style={{ color: 'hsl(var(--success))' }}>
                            {doc.file_name || 'Attached File'}
                          </span>
                        </div>
                        <a
                          href={doc.file_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1 rounded hover:bg-emerald-500/20 transition-colors flex-shrink-0"
                          style={{ color: 'hsl(var(--success))' }}
                          title="Download File"
                        >
                          <Download size={13} />
                        </a>
                      </div>
                    ) : (
                      <label
                        className="flex items-center justify-center gap-2 px-3 py-1.5 rounded-lg cursor-pointer transition-colors hover:bg-white/[0.05]"
                        style={{
                          background: 'hsl(var(--surface-3))',
                          border: '1px dashed hsl(var(--border))',
                          color: 'hsl(var(--foreground-muted))',
                        }}
                      >
                        <Upload size={13} />
                        <span className="text-xs">Choose & Upload File</span>
                        <input
                          type="file"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0]
                            if (file) handleFileUpload(doc.id, file)
                          }}
                        />
                      </label>
                    )}
                  </div>

                  {/* Delete button */}
                  <button
                    onClick={() => deleteDoc(doc.id)}
                    className="p-1.5 rounded hover:bg-red-500/10 transition-colors flex-shrink-0"
                    style={{ color: 'hsl(var(--foreground-muted))' }}
                    title="Delete row"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
