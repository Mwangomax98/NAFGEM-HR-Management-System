import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export function useEmployeeValidation() {
  const [validating, setValidating] = useState(false);
  const { toast } = useToast();

  const validateEmployeeData = async (employeeData: any, selectedUserId: string, currentEmployeeId?: string): Promise<ValidationResult> => {
    setValidating(true);
    const errors: string[] = [];
    const warnings: string[] = [];

    try {
      // Check if user exists and is available
      if (selectedUserId) {
        // Check if user already has an employee profile
        let query = supabase
          .from('employee_profiles')
          .select('id, name_full')
          .eq('user_id', selectedUserId);
        
        // Exclude current employee when updating
        if (currentEmployeeId) {
          query = query.neq('id', currentEmployeeId);
        }
        
        const { data: existingProfile, error: profileCheckError } = await query.maybeSingle();

        if (profileCheckError && !profileCheckError.message.includes('No rows found')) {
          warnings.push('Could not verify if user already has a profile');
        } else if (existingProfile) {
          errors.push(`User already has an employee profile: ${existingProfile.name_full}`);
        }

        // Check if user account exists
        const { data: userExists, error: userCheckError } = await supabase
          .from('profiles')
          .select('id, email, full_name')
          .eq('id', selectedUserId)
          .maybeSingle();

        if (userCheckError || !userExists) {
          errors.push('Selected user account does not exist or is not accessible');
        }
      }

      // Check if employee ID is unique
      if (employeeData.employment?.employeeId) {
        let query = supabase
          .from('employee_profiles')
          .select('id, name_full')
          .eq('employee_id', employeeData.employment.employeeId);
        
        // Exclude current employee when updating
        if (currentEmployeeId) {
          query = query.neq('id', currentEmployeeId);
        }
        
        const { data: existingEmployee, error: idCheckError } = await query.maybeSingle();

        if (idCheckError && !idCheckError.message.includes('No rows found')) {
          warnings.push('Could not verify employee ID uniqueness');
        } else if (existingEmployee) {
          errors.push(`Employee ID ${employeeData.employment.employeeId} is already in use by ${existingEmployee.name_full}`);
        }
      }

      // Check if national ID is unique
      if (employeeData.personal?.nationalId) {
        let query = supabase
          .from('employee_profiles')
          .select('id, name_full')
          .eq('national_id', employeeData.personal.nationalId);
        
        // Exclude current employee when updating
        if (currentEmployeeId) {
          query = query.neq('id', currentEmployeeId);
        }
        
        const { data: existingNationalId, error: nationalIdError } = await query.maybeSingle();

        if (nationalIdError && !nationalIdError.message.includes('No rows found')) {
          warnings.push('Could not verify national ID uniqueness');
        } else if (existingNationalId) {
          errors.push(`National ID ${employeeData.personal.nationalId} is already registered to ${existingNationalId.name_full}`);
        }
      }

      // Validate required next of kin
      if (!employeeData.nextOfKin?.some((nok: any) => nok.primary)) {
        errors.push('At least one next of kin must be marked as primary');
      }

      // Validate spouse information for married status
      if ((employeeData.personal?.maritalStatus || '').toLowerCase() === 'married' && !employeeData.personal?.spouseName) {
        errors.push('Spouse name is required for married employees');
      }

      // Validate project assignments
      if (!employeeData.employment?.projects?.length) {
        warnings.push('No project assignments specified - employee may need to be assigned to projects later');
      }

      // Check permissions
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: userRole } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', user.id)
          .maybeSingle();

        if (!userRole || !['hr', 'admin'].includes(userRole.role)) {
          errors.push('You do not have permission to create employee profiles');
        }
      } else {
        errors.push('You must be logged in to create employee profiles');
      }

    } catch (error) {
      console.error('Validation error:', error);
      errors.push('An error occurred during validation');
    } finally {
      setValidating(false);
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  };

  const showValidationResults = (result: ValidationResult) => {
    if (result.warnings.length > 0) {
      result.warnings.forEach(warning => {
        toast({
          title: "Warning",
          description: warning,
          variant: "default",
        });
      });
    }

    if (result.errors.length > 0) {
      result.errors.forEach(error => {
        toast({
          title: "Validation Error",
          description: error,
          variant: "destructive",
        });
      });
    }
  };

  return {
    validateEmployeeData,
    showValidationResults,
    validating
  };
}