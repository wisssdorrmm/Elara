import { supabase } from '@/lib/supabase';
import type { ServiceResult } from './authService';
import type { Database } from '@/types/database';

type CoupleInvite = Database['public']['Tables']['couple_invites']['Row'];
type Relationship = Database['public']['Tables']['relationships']['Row'];
type RelationshipUpdate = Database['public']['Tables']['relationships']['Update'];

const INVITE_EXPIRY_DAYS = 7;
const CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // no ambiguous 0/O/1/I

function generateInviteCode(length = 8): string {
  let code = '';
  for (let i = 0; i < length; i++) {
    code += CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)];
  }
  return code;
}

export const coupleService = {
  /** Creates a new pending invite for the current user. Retries once on the rare code collision. */
  async createInvite(inviterId: string): Promise<ServiceResult<CoupleInvite>> {
    const expiresAt = new Date(Date.now() + INVITE_EXPIRY_DAYS * 24 * 60 * 60 * 1000).toISOString();

    for (let attempt = 0; attempt < 2; attempt++) {
      const { data, error } = await supabase
        .from('couple_invites')
        .insert({ inviter_id: inviterId, invite_code: generateInviteCode(), expires_at: expiresAt })
        .select()
        .single();

      if (!error) return { data, error: null };
      // 23505 = unique_violation (invite_code collision) - vanishingly rare, but retry once.
      if (error.code !== '23505' || attempt === 1) return { data: null, error: error.message };
    }

    return { data: null, error: 'Could not generate a unique invite code. Please try again.' };
  },

  async getMyPendingInvite(inviterId: string): Promise<ServiceResult<CoupleInvite>> {
    const { data, error } = await supabase
      .from('couple_invites')
      .select('*')
      .eq('inviter_id', inviterId)
      .eq('status', 'pending')
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    if (error) return { data: null, error: error.message };
    return { data, error: null };
  },

  async revokeInvite(inviteId: string): Promise<ServiceResult> {
    const { error } = await supabase.from('couple_invites').update({ status: 'revoked' }).eq('id', inviteId);
    return { data: null, error: error?.message ?? null };
  },

  /** Accepts an invite via the secure RPC function - never reads other users' invites directly. */
  async acceptInvite(code: string): Promise<ServiceResult<Relationship>> {
    const { data, error } = await supabase.rpc('accept_couple_invite', { p_invite_code: code.trim().toUpperCase() });
    if (error) return { data: null, error: error.message };
    return { data, error: null };
  },

  async getMyRelationship(userId: string): Promise<ServiceResult<Relationship>> {
    const { data, error } = await supabase
      .from('relationships')
      .select('*')
      .eq('status', 'active')
      .or(`user_a_id.eq.${userId},user_b_id.eq.${userId}`)
      .maybeSingle();
    if (error) return { data: null, error: error.message };
    return { data, error: null };
  },

  async updateRelationship(id: string, updates: RelationshipUpdate): Promise<ServiceResult<Relationship>> {
    const { data, error } = await supabase.from('relationships').update(updates).eq('id', id).select().single();
    if (error) return { data: null, error: error.message };
    return { data, error: null };
  },

  async endRelationship(id: string): Promise<ServiceResult<Relationship>> {
    const { data, error } = await supabase
      .from('relationships')
      .update({ status: 'ended', ended_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();
    if (error) return { data: null, error: error.message };
    return { data, error: null };
  },
};
