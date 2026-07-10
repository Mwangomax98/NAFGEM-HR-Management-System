import { useState, useEffect } from 'react';
import { supabase } from "@/lib/api";
import { toast } from 'sonner';

export interface DraftSection {
  personalParticulars?: any;
  familyParticulars?: any;
  educationQualification?: any;
  nextOfKin?: any;
  declaration?: any;
}

export interface EmployeeDraft {
  id: string;
  user_id: string;
  created_by: string | null;
  sections: any; // Using any to match Supabase Json type
  is_complete: boolean;
  created_at: string;
  updated_at: string;
}

export function useEmployeeDraft(userId?: string) {
  const [draft, setDraft] = useState<EmployeeDraft | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Load existing draft
  useEffect(() => {
    if (!userId) return;
    
    const loadDraft = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('employee_profile_drafts')
          .select('*')
          .eq('user_id', userId)
          .maybeSingle();

        if (error) throw error;
        setDraft(data as EmployeeDraft);
      } catch (error) {
        console.error('Error loading draft:', error);
      } finally {
        setLoading(false);
      }
    };

    loadDraft();
  }, [userId]);

  // Save a specific section
  const saveSection = async (sectionName: keyof DraftSection, sectionData: any) => {
    if (!userId) {
      toast.error('User ID is required to save draft');
      return false;
    }

    setSaving(true);
    try {
      const updatedSections = {
        ...(draft?.sections || {}),
        [sectionName]: sectionData
      };

      if (draft) {
        // Update existing draft
        const { error } = await supabase
          .from('employee_profile_drafts')
          .update({ 
            sections: updatedSections,
            updated_at: new Date().toISOString()
          })
          .eq('id', draft.id);

        if (error) throw error;

        setDraft(prev => prev ? {
          ...prev,
          sections: updatedSections,
          updated_at: new Date().toISOString()
        } : null);
      } else {
        // Create new draft
        const { data, error } = await supabase
          .from('employee_profile_drafts')
          .insert({
            user_id: userId,
            sections: updatedSections,
            is_complete: false
          })
          .select()
          .single();

        if (error) throw error;
        setDraft(data as EmployeeDraft);
      }

      toast.success(`${sectionName} section saved successfully`);
      return true;
    } catch (error) {
      console.error('Error saving section:', error);
      toast.error('Failed to save section');
      return false;
    } finally {
      setSaving(false);
    }
  };

  // Mark draft as complete and delete it
  const completeDraft = async () => {
    if (!draft) return;

    try {
      const { error } = await supabase
        .from('employee_profile_drafts')
        .delete()
        .eq('id', draft.id);

      if (error) throw error;
      setDraft(null);
    } catch (error) {
      console.error('Error completing draft:', error);
    }
  };

  // Get section data
  const getSectionData = (sectionName: keyof DraftSection) => {
    return draft?.sections?.[sectionName] || null;
  };

  // Check if section has been saved
  const isSectionSaved = (sectionName: keyof DraftSection) => {
    return !!draft?.sections?.[sectionName];
  };

  return {
    draft,
    loading,
    saving,
    saveSection,
    completeDraft,
    getSectionData,
    isSectionSaved
  };
}