// Operations for citizen profile data: read, update, verify NIK.
// Separate from authService — auth is about login, this is about citizen profile data.

import { supabase } from './supabase'

export async function getCitizenProfile(userId) {
  // TODO: implement
}

export async function updateCitizenProfile(userId, data) {
  // TODO: implement
  // data: { full_name, address, phone, profile_photo_url }
}

export async function getAllCitizens() {
  // TODO: implement
  // Used by admin to browse registered citizens
}

export async function getCitizenByNik(nik) {
  // TODO: implement
}
