import { supabase, isSupabaseConfigured } from '../lib/supabase'

// ============ PROFILES ============

/**
 * @param {string} userId
 * @returns {Promise<{id: string, name: string, email: string, avatar_url: string} | null>}
 */
export const getUserProfile = async (userId) => {
  if (!isSupabaseConfigured()) return null

  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single()

  if (error && error.code !== 'PGRST116') throw error
  return data
}

/**
 * @param {string} userId
 * @param {{ name?: string, avatar_url?: string }} updates
 */
export const updateUserProfile = async (userId, updates) => {
  if (!isSupabaseConfigured()) return null

  const { data, error } = await supabase
    .from('profiles')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', userId)
    .select()
    .single()

  if (error) throw error
  return data
}

// ============ ARTWORKS ============

/**
 * Load all public artworks, ordered by sort_order then created_at.
 * @returns {Promise<Array>}
 */
export const getArtworks = async () => {
  if (!isSupabaseConfigured()) return []

  const { data, error } = await supabase
    .from('artworks')
    .select('*')
    .eq('is_public', true)
    .order('sort_order', { ascending: true, nullsFirst: false })
    .order('created_at', { ascending: false })

  if (error) throw error
  return data || []
}

/**
 * Get artworks owned by a specific user.
 * @param {string} userId
 * @returns {Promise<Array>}
 */
export const getUserArtworks = async (userId) => {
  if (!isSupabaseConfigured()) return []

  const { data, error } = await supabase
    .from('artworks')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data || []
}

/**
 * Insert a new artwork.
 * @param {{ title: string, artist: string, description?: string, category?: string, image_url: string, series_name?: string, user_id: string }} artworkData
 */
export const createArtwork = async (artworkData) => {
  if (!isSupabaseConfigured()) return null

  const { data, error } = await supabase
    .from('artworks')
    .insert(artworkData)
    .select()
    .single()

  if (error) throw error
  return data
}

/**
 * Update an existing artwork.
 * @param {string} artworkId
 * @param {Partial<{title: string, description: string, category: string, is_public: boolean, sort_order: number}>} updates
 */
export const updateArtwork = async (artworkId, updates) => {
  if (!isSupabaseConfigured()) return null

  const { data, error } = await supabase
    .from('artworks')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', artworkId)
    .select()
    .single()

  if (error) throw error
  return data
}

/**
 * Delete an artwork by ID.
 * @param {string} artworkId
 * @param {string} userId - Enforces ownership (RLS also enforces this server-side)
 */
export const deleteArtwork = async (artworkId, userId) => {
  if (!isSupabaseConfigured()) return null

  const { error } = await supabase
    .from('artworks')
    .delete()
    .eq('id', artworkId)
    .eq('user_id', userId)

  if (error) throw error
  return true
}

/**
 * Bulk update sort_order for drag-and-drop reordering (admin only).
 * @param {Array<{id: string, sort_order: number}>} orderedItems
 */
export const updateArtworkSortOrder = async (orderedItems) => {
  if (!isSupabaseConfigured()) return

  const updates = orderedItems.map(({ id, sort_order }) =>
    supabase.from('artworks').update({ sort_order }).eq('id', id)
  )
  await Promise.all(updates)
}
